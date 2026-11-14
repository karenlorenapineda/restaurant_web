import { createHash } from "node:crypto";

import {
  Injectable,
  Logger,
  OnModuleDestroy,
  ServiceUnavailableException,
} from "@nestjs/common";

import { AnalyticsSubscribeDto } from "../dto/subscribe-query.dto";
import {
  AnalyticsService,
  OrdersByStatusEntry,
  PaymentMethodEntry,
  RevenuePoint,
  SalesByCategoryEntry,
  SummaryReport,
  TopMenuItemEntry,
} from "../analytics.service";

export const DEFAULT_INTERVAL_MS = 15_000;
export const MIN_INTERVAL_MS = 5_000;
export const MAX_ACTIVE_FILTER_SETS = 50;

/** Everything the dashboard draws, in one payload. */
export interface DashboardSnapshot {
  generatedAt: string;
  summary: SummaryReport;
  revenueOverTime: RevenuePoint[];
  ordersByStatus: OrdersByStatusEntry[];
  topMenuItems: TopMenuItemEntry[];
  salesByCategory: SalesByCategoryEntry[];
  paymentMethods: PaymentMethodEntry[];
}

export type RealtimeEmitter = (
  room: string,
  event: string,
  payload: DashboardSnapshot,
) => void;

interface Subscription {
  room: string;
  query: AnalyticsSubscribeDto;
  clients: Set<string>;
  lastHash: string | null;
}

/**
 * Refresh interval from ANALYTICS_REALTIME_INTERVAL_MS. Never below 5 s so a
 * typo cannot hammer the database; falls back to 15 s when missing/invalid.
 */
export function resolveIntervalMs(raw: string | undefined): number {
  const parsed = Number.parseInt(raw ?? "", 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_INTERVAL_MS;
  }

  return Math.max(parsed, MIN_INTERVAL_MS);
}

/**
 * Live updates without touching the Orders module.
 *
 * While at least one client is subscribed, every `intervalMs` the server
 * recomputes the dashboard ONCE per distinct set of filters (clients that
 * ask for the same filters share one query set) and pushes it only if the
 * numbers changed. With nobody subscribed the timer is off and no query runs.
 *
 * `refreshNow()` is the hook for a future "an order changed" event: the
 * Orders module can call it to push immediately instead of waiting for the
 * next tick.
 */
@Injectable()
export class AnalyticsRealtimeService implements OnModuleDestroy {
  private readonly logger = new Logger(AnalyticsRealtimeService.name);
  private readonly subscriptions = new Map<string, Subscription>();
  private readonly roomByClient = new Map<string, string>();
  /**
   * Latest subscribe request of each client that is connected. It makes a stale
   * async subscribe lose against a newer one. The entry is DELETED when the
   * client unsubscribes or disconnects, so the map never grows with sockets
   * that are gone.
   */
  private readonly requestVersionByClient = new Map<string, number>();
  /**
   * Versions come from ONE counter for the whole service, never per client:
   * after an entry is deleted a per-client counter would start again at 1 and a
   * still-running old request could be mistaken for the new one.
   */
  private nextRequestVersion = 0;
  private readonly intervalMs = resolveIntervalMs(
    process.env.ANALYTICS_REALTIME_INTERVAL_MS,
  );
  private emitter: RealtimeEmitter = () => undefined;
  private timer: NodeJS.Timeout | null = null;
  private ticking = false;

  constructor(private readonly analytics: AnalyticsService) {}

  get refreshIntervalMs(): number {
    return this.intervalMs;
  }

  /** Called by the gateway: how to send a payload to a room. */
  setEmitter(emitter: RealtimeEmitter): void {
    this.emitter = emitter;
  }

  /**
   * Registers (or replaces) the subscription of a client and returns the room
   * to join plus a first snapshot. Throws BadRequestException on bad filters.
   */
  async subscribe(
    clientId: string,
    query: AnalyticsSubscribeDto,
  ): Promise<{
    room: string;
    snapshot: DashboardSnapshot;
    requestVersion: number;
  }> {
    // Validate synchronously before reserving a request version or any slot.
    this.analytics.resolveDateRange(query);

    const key = this.keyFor(query);
    const requestVersion = ++this.nextRequestVersion;
    this.requestVersionByClient.set(clientId, requestVersion);

    // Build first. A failed query must never leave a phantom subscription, and
    // a failed filter change must not destroy the client's previous dashboard.
    const snapshot = await this.buildSnapshot(query);

    // A newer subscribe/unsubscribe arrived while the query was in flight.
    // The gateway will discard this response rather than joining its room.
    if (!this.isCurrentRequest(clientId, requestVersion)) {
      return { room: key, snapshot, requestVersion };
    }

    const previousRoom = this.roomByClient.get(clientId);
    const existingTarget = this.subscriptions.get(key);
    const previousSubscription = previousRoom
      ? this.subscriptions.get(previousRoom)
      : undefined;
    const previousRoomWillBeRemoved =
      previousRoom !== undefined &&
      previousRoom !== key &&
      previousSubscription?.clients.size === 1;
    const projectedActiveCount =
      this.subscriptions.size - (previousRoomWillBeRemoved ? 1 : 0);

    if (
      !existingTarget &&
      projectedActiveCount >= MAX_ACTIVE_FILTER_SETS
    ) {
      throw new ServiceUnavailableException(
        "Too many different live dashboards are open right now",
      );
    }

    // Move the client only after the query and capacity check both succeeded.
    if (previousRoom !== key) {
      this.removeClientFromRoom(clientId);
      const target = this.subscriptions.get(key) ?? {
        room: key,
        query,
        clients: new Set<string>(),
        lastHash: null,
      };
      target.clients.add(clientId);
      this.subscriptions.set(key, target);
      this.roomByClient.set(clientId, key);
    }

    // A second client joining an existing filter set may have fetched newer
    // data. Push it to clients already in the shared room as well.
    const targetSubscription = this.subscriptions.get(key);
    if (targetSubscription) {
      const hash = this.hashOf(snapshot);
      if (targetSubscription.lastHash !== hash) {
        targetSubscription.lastHash = hash;
        if (targetSubscription.clients.size > 1) {
          this.emitter(key, "analytics:update", snapshot);
        }
      }
    }

    this.ensureTimer();
    return { room: key, snapshot, requestVersion };
  }

  /** True only while this is the latest subscribe request for the socket. */
  isCurrentRequest(clientId: string, requestVersion: number): boolean {
    return this.requestVersionByClient.get(clientId) === requestVersion;
  }

  /**
   * Called when the client unsubscribes and when its socket disconnects.
   * Deleting the version entry (instead of bumping it) frees the memory AND still
   * invalidates a subscribe whose initial query has not finished: that request
   * no longer finds its version, so it is treated as superseded.
   */
  unsubscribe(clientId: string): void {
    this.requestVersionByClient.delete(clientId);
    this.removeClientFromRoom(clientId);
  }

  private removeClientFromRoom(clientId: string): void {
    const room = this.roomByClient.get(clientId);
    if (!room) {
      return;
    }

    this.roomByClient.delete(clientId);
    const subscription = this.subscriptions.get(room);
    subscription?.clients.delete(clientId);

    if (subscription && subscription.clients.size === 0) {
      this.subscriptions.delete(room);
    }

    if (this.subscriptions.size === 0) {
      this.stopTimer();
    }
  }

  /** Recomputes the client's dashboard now and pushes it if it changed. */
  async refreshNow(clientId: string): Promise<DashboardSnapshot | null> {
    const room = this.roomByClient.get(clientId);
    const subscription = room ? this.subscriptions.get(room) : undefined;

    if (!subscription) {
      return null;
    }

    return this.refreshSubscription(subscription);
  }

  /** One pass over every active subscription. Public so tests can drive it. */
  async tick(): Promise<void> {
    if (this.ticking) {
      return; // the previous pass is still running: do not pile up queries
    }

    this.ticking = true;
    try {
      for (const subscription of [...this.subscriptions.values()]) {
        try {
          await this.refreshSubscription(subscription);
        } catch (error) {
          this.logger.warn(
            `Live refresh failed for ${subscription.room}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }
    } finally {
      this.ticking = false;
    }
  }

  get activeSubscriptions(): number {
    return this.subscriptions.size;
  }

  /** Clients whose request version is being tracked (for tests and monitoring). */
  get trackedClients(): number {
    return this.requestVersionByClient.size;
  }

  get isRunning(): boolean {
    return this.timer !== null;
  }

  onModuleDestroy(): void {
    this.stopTimer();
    this.subscriptions.clear();
    this.roomByClient.clear();
    this.requestVersionByClient.clear();
  }

  private async refreshSubscription(
    subscription: Subscription,
  ): Promise<DashboardSnapshot | null> {
    const snapshot = await this.buildSnapshot(subscription.query);

    // The last client may have unsubscribed while the database query ran.
    if (
      this.subscriptions.get(subscription.room) !== subscription ||
      subscription.clients.size === 0
    ) {
      return null;
    }

    const hash = this.hashOf(snapshot);

    if (hash !== subscription.lastHash) {
      subscription.lastHash = hash;
      this.emitter(subscription.room, "analytics:update", snapshot);
    }

    return snapshot;
  }

  private async buildSnapshot(
    query: AnalyticsSubscribeDto,
  ): Promise<DashboardSnapshot> {
    const [
      summary,
      revenueOverTime,
      ordersByStatus,
      topMenuItems,
      salesByCategory,
      paymentMethods,
    ] = await Promise.all([
      this.analytics.getSummary(query),
      this.analytics.getRevenueOverTime(query),
      this.analytics.getOrdersByStatus(query),
      this.analytics.getTopMenuItems(query),
      this.analytics.getSalesByCategory(query),
      this.analytics.getPaymentMethodsBreakdown(query),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      summary,
      revenueOverTime,
      ordersByStatus,
      topMenuItems,
      salesByCategory,
      paymentMethods,
    };
  }

  /** Same data => same hash. `generatedAt` and the moving `range.to` are ignored. */
  private hashOf(snapshot: DashboardSnapshot): string {
    const { generatedAt: _generatedAt, summary, ...rest } = snapshot;
    const { range: _range, ...summaryValues } = summary;

    return createHash("sha1")
      .update(JSON.stringify({ summary: summaryValues, ...rest }))
      .digest("hex");
  }

  private keyFor(query: AnalyticsSubscribeDto): string {
    const normalised = {
      from: query.from ?? null,
      to: query.to ?? null,
      restaurantId: query.restaurantId ?? null,
      groupBy: query.groupBy ?? "day",
      limit: query.limit ?? 10,
      metric: query.metric ?? "revenue",
    };

    return `analytics:${createHash("sha1")
      .update(JSON.stringify(normalised))
      .digest("hex")
      .slice(0, 16)}`;
  }

  private ensureTimer(): void {
    if (this.timer || this.subscriptions.size === 0) {
      return;
    }

    this.timer = setInterval(() => void this.tick(), this.intervalMs);
    this.timer.unref?.();
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
