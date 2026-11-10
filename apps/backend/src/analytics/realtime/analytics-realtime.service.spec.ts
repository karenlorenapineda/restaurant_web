import { BadRequestException } from "@nestjs/common";

import { AnalyticsService } from "../analytics.service";
import {
  AnalyticsRealtimeService,
  DEFAULT_INTERVAL_MS,
  MAX_ACTIVE_FILTER_SETS,
  MIN_INTERVAL_MS,
  resolveIntervalMs,
} from "./analytics-realtime.service";

function makeAnalytics() {
  const state = { revenue: 100 };

  const mock = {
    resolveDateRange: jest.fn(),
    getSummary: jest.fn(async () => ({
      range: { from: "a", to: new Date().toISOString() },
      totalRevenue: state.revenue,
      totalOrders: 4,
      averageTicket: state.revenue / 4,
      totalItemsSold: 9,
    })),
    getRevenueOverTime: jest.fn().mockResolvedValue([]),
    getOrdersByStatus: jest.fn().mockResolvedValue([]),
    getTopMenuItems: jest.fn().mockResolvedValue([]),
    getSalesByCategory: jest.fn().mockResolvedValue([]),
    getPaymentMethodsBreakdown: jest.fn().mockResolvedValue([]),
  };

  return { state, mock };
}

function makeService() {
  const { state, mock } = makeAnalytics();
  const service = new AnalyticsRealtimeService(
    mock as unknown as AnalyticsService,
  );
  const emitter = jest.fn();
  service.setEmitter(emitter);

  return { service, mock, state, emitter };
}

describe("resolveIntervalMs", () => {
  it("uses 15 s when missing or invalid", () => {
    expect(resolveIntervalMs(undefined)).toBe(DEFAULT_INTERVAL_MS);
    expect(resolveIntervalMs("abc")).toBe(DEFAULT_INTERVAL_MS);
    expect(resolveIntervalMs("-3")).toBe(DEFAULT_INTERVAL_MS);
    expect(resolveIntervalMs("0")).toBe(DEFAULT_INTERVAL_MS);
  });

  it("never goes below the 5 s minimum", () => {
    expect(resolveIntervalMs("100")).toBe(MIN_INTERVAL_MS);
    expect(resolveIntervalMs("30000")).toBe(30000);
  });
});

describe("AnalyticsRealtimeService", () => {
  afterEach(() => jest.useRealTimers());

  it("returns a snapshot with every chart on subscribe", async () => {
    const { service, mock } = makeService();
    const { room, snapshot } = await service.subscribe("c1", {
      restaurantId: 3,
    });

    expect(room).toMatch(/^analytics:[0-9a-f]{16}$/);
    expect(Object.keys(snapshot).sort()).toEqual(
      [
        "generatedAt",
        "ordersByStatus",
        "paymentMethods",
        "revenueOverTime",
        "salesByCategory",
        "summary",
        "topMenuItems",
      ].sort(),
    );
    expect(mock.getSummary).toHaveBeenCalledWith({ restaurantId: 3 });
    service.onModuleDestroy();
  });

  it("rejects impossible filters before storing anything", async () => {
    const { service, mock } = makeService();
    mock.resolveDateRange.mockImplementation(() => {
      throw new BadRequestException("`to` is not a real calendar date");
    });

    await expect(
      service.subscribe("c1", { to: "2026-02-30" }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(service.activeSubscriptions).toBe(0);
    expect(service.isRunning).toBe(false);
  });

  it("runs the timer only while somebody is subscribed", async () => {
    const { service } = makeService();
    expect(service.isRunning).toBe(false);

    await service.subscribe("c1", {});
    expect(service.isRunning).toBe(true);

    service.unsubscribe("c1");
    expect(service.isRunning).toBe(false);
    expect(service.activeSubscriptions).toBe(0);
  });

  it("clients with the same filters share one room and one set of queries", async () => {
    const { service, mock } = makeService();
    const a = await service.subscribe("c1", { restaurantId: 1 });
    const b = await service.subscribe("c2", { restaurantId: 1 });

    expect(a.room).toBe(b.room);
    expect(service.activeSubscriptions).toBe(1);

    mock.getSummary.mockClear();
    await service.tick();
    expect(mock.getSummary).toHaveBeenCalledTimes(1);

    service.unsubscribe("c1");
    expect(service.activeSubscriptions).toBe(1); // c2 still there
    service.unsubscribe("c2");
    expect(service.activeSubscriptions).toBe(0);
  });

  it("different filters get different rooms", async () => {
    const { service } = makeService();
    const a = await service.subscribe("c1", { restaurantId: 1 });
    const b = await service.subscribe("c2", { restaurantId: 2 });

    expect(a.room).not.toBe(b.room);
    service.onModuleDestroy();
  });

  it("pushes an update only when the numbers changed", async () => {
    const { service, state, emitter } = makeService();
    const { room } = await service.subscribe("c1", {});

    await service.tick(); // nothing changed
    expect(emitter).not.toHaveBeenCalled();

    state.revenue = 250; // a new sale
    await service.tick();
    expect(emitter).toHaveBeenCalledTimes(1);
    expect(emitter.mock.calls[0]?.[0]).toBe(room);
    expect(emitter.mock.calls[0]?.[1]).toBe("analytics:update");
    expect(emitter.mock.calls[0]?.[2].summary.totalRevenue).toBe(250);

    await service.tick(); // same data again
    expect(emitter).toHaveBeenCalledTimes(1);
    service.onModuleDestroy();
  });

  it("does not query anything when nobody is subscribed", async () => {
    const { service, mock } = makeService();

    await service.tick();
    expect(mock.getSummary).not.toHaveBeenCalled();
  });

  it("ticks by itself on the interval", async () => {
    jest.useFakeTimers();
    const { service, state, emitter } = makeService();
    await service.subscribe("c1", {});

    state.revenue = 999;
    await jest.advanceTimersByTimeAsync(service.refreshIntervalMs + 10);

    expect(emitter).toHaveBeenCalledTimes(1);
    service.onModuleDestroy();
  });

  it("does not start a new pass while the previous one is still running", async () => {
    const { service, mock } = makeService();
    await service.subscribe("c1", {});

    let release: () => void = () => undefined;
    mock.getSummary.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = () =>
            resolve({
              range: { from: "a", to: "b" },
              totalRevenue: 1,
              totalOrders: 1,
              averageTicket: 1,
              totalItemsSold: 1,
            });
        }),
    );
    mock.getSummary.mockClear();

    const first = service.tick();
    await service.tick(); // returns immediately: a pass is running
    expect(mock.getSummary).toHaveBeenCalledTimes(1);

    release();
    await first;
    service.onModuleDestroy();
  });

  it("a failing refresh does not stop the other subscriptions", async () => {
    const { service, mock, emitter, state } = makeService();
    await service.subscribe("c1", { restaurantId: 1 });
    await service.subscribe("c2", { restaurantId: 2 });

    state.revenue = 777;
    mock.getRevenueOverTime.mockRejectedValueOnce(new Error("db down"));
    await service.tick();

    expect(emitter).toHaveBeenCalledTimes(1); // the second one still went out
    service.onModuleDestroy();
  });

  it("replaces the previous subscription when the same client changes filters", async () => {
    const { service } = makeService();
    await service.subscribe("c1", { restaurantId: 1 });
    await service.subscribe("c1", { restaurantId: 2 });

    expect(service.activeSubscriptions).toBe(1);
    service.onModuleDestroy();
  });

  it("refreshNow recomputes for the client and reports not subscribed otherwise", async () => {
    const { service, state, emitter } = makeService();

    expect(await service.refreshNow("nobody")).toBeNull();

    await service.subscribe("c1", {});
    state.revenue = 5;
    const snapshot = await service.refreshNow("c1");

    expect(snapshot?.summary.totalRevenue).toBe(5);
    expect(emitter).toHaveBeenCalledTimes(1);
    service.onModuleDestroy();
  });

  it("limits how many different dashboards can be open at once", async () => {
    const { service } = makeService();

    for (let i = 1; i <= MAX_ACTIVE_FILTER_SETS; i++) {
      await service.subscribe(`c${i}`, { restaurantId: i });
    }

    await expect(
      service.subscribe("extra", { restaurantId: 9999 }),
    ).rejects.toThrow(/Too many/);
    // ...but joining an existing one is still fine
    await expect(
      service.subscribe("extra", { restaurantId: 1 }),
    ).resolves.toBeDefined();
    service.onModuleDestroy();
  });
  it("does not retain a filter set when its initial snapshot query fails", async () => {
    const { service, mock } = makeService();
    mock.getSummary.mockRejectedValueOnce(new Error("database unavailable"));

    await expect(
      service.subscribe("c1", { restaurantId: 77 }),
    ).rejects.toThrow("database unavailable");

    expect(service.activeSubscriptions).toBe(0);
    expect(service.isRunning).toBe(false);

    // The same filter set can be subscribed once the database recovers.
    mock.getSummary.mockResolvedValueOnce({
      range: { from: "a", to: "b" },
      totalRevenue: 100,
      totalOrders: 4,
      averageTicket: 25,
      totalItemsSold: 9,
    });
    await expect(
      service.subscribe("c2", { restaurantId: 77 }),
    ).resolves.toBeDefined();
    expect(service.activeSubscriptions).toBe(1);
    service.onModuleDestroy();
  });

  it("allows a client to replace its only filter set when the limit is full", async () => {
    const { service } = makeService();
    for (let i = 1; i <= MAX_ACTIVE_FILTER_SETS; i++) {
      await service.subscribe(`c${i}`, { restaurantId: i });
    }

    await expect(
      service.subscribe("c1", { restaurantId: 1001 }),
    ).resolves.toBeDefined();
    expect(service.activeSubscriptions).toBe(MAX_ACTIVE_FILTER_SETS);
    service.onModuleDestroy();
  });

  it("keeps the previous subscription when the replacement query fails", async () => {
    const { service, mock } = makeService();
    const original = await service.subscribe("c1", { restaurantId: 1 });
    mock.getSummary.mockRejectedValueOnce(new Error("database unavailable"));

    await expect(
      service.subscribe("c1", { restaurantId: 2 }),
    ).rejects.toThrow("database unavailable");

    expect(service.activeSubscriptions).toBe(1);
    expect(await service.refreshNow("c1")).toBeDefined();
    expect(original.room).toMatch(/^analytics:/);
    service.onModuleDestroy();
  });

  it("ignores an older subscribe result when a newer filter request finishes first", async () => {
    const { service, mock } = makeService();
    let releaseOld: (() => void) | undefined;
    mock.getSummary.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          releaseOld = () =>
            resolve({
              range: { from: "a", to: "b" },
              totalRevenue: 10,
              totalOrders: 1,
              averageTicket: 10,
              totalItemsSold: 1,
            });
        }),
    );

    const oldRequest = service.subscribe("c1", { restaurantId: 1 });
    const newRequest = await service.subscribe("c1", { restaurantId: 2 });
    releaseOld?.();
    const oldResult = await oldRequest;

    expect(service.isCurrentRequest("c1", oldResult.requestVersion)).toBe(false);
    expect(service.isCurrentRequest("c1", newRequest.requestVersion)).toBe(true);
    expect(service.activeSubscriptions).toBe(1);
    expect(await service.refreshNow("c1")).toBeDefined();
    expect(mock.getSummary).toHaveBeenLastCalledWith({ restaurantId: 2 });
    service.onModuleDestroy();
  });

  it("pushes a refreshed snapshot to existing clients when another joins the same filters", async () => {
    const { service, state, emitter } = makeService();
    const first = await service.subscribe("c1", { restaurantId: 5 });
    state.revenue = 500;
    const second = await service.subscribe("c2", { restaurantId: 5 });

    expect(second.room).toBe(first.room);
    expect(emitter).toHaveBeenCalledWith(
      first.room,
      "analytics:update",
      expect.objectContaining({
        summary: expect.objectContaining({ totalRevenue: 500 }),
      }),
    );
    service.onModuleDestroy();
  });

  it("does not emit a refresh result after the last client unsubscribes mid-query", async () => {
    const { service, mock, emitter } = makeService();
    await service.subscribe("c1", {});
    let release: (() => void) | undefined;
    mock.getSummary.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = () =>
            resolve({
              range: { from: "a", to: "b" },
              totalRevenue: 999,
              totalOrders: 1,
              averageTicket: 999,
              totalItemsSold: 1,
            });
        }),
    );
    const pendingTick = service.tick();
    service.unsubscribe("c1");
    release?.();
    await pendingTick;

    expect(emitter).not.toHaveBeenCalled();
    expect(service.activeSubscriptions).toBe(0);
    service.onModuleDestroy();
  });

  it("invalidates a pending subscribe when the client unsubscribes", async () => {
    const { service, mock } = makeService();
    let release: (() => void) | undefined;
    mock.getSummary.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = () =>
            resolve({
              range: { from: "a", to: "b" },
              totalRevenue: 10,
              totalOrders: 1,
              averageTicket: 10,
              totalItemsSold: 1,
            });
        }),
    );

    const pending = service.subscribe("c1", { restaurantId: 42 });
    service.unsubscribe("c1");
    release?.();
    const result = await pending;

    expect(service.isCurrentRequest("c1", result.requestVersion)).toBe(false);
    expect(service.activeSubscriptions).toBe(0);
    expect(service.isRunning).toBe(false);
    service.onModuleDestroy();
  });

});
