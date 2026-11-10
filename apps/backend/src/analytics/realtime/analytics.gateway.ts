import { HttpException } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Namespace, Socket } from "socket.io";

import { AnalyticsSubscribeDto } from "../dto/subscribe-query.dto";
import {
  AnalyticsRealtimeService,
  DashboardSnapshot,
} from "./analytics-realtime.service";

export type SubscribeAck =
  | {
      status: "subscribed";
      room: string;
      refreshIntervalMs: number;
      snapshot: DashboardSnapshot;
    }
  | { status: "error"; message: string | string[] };

/**
 * Live dashboard over socket.io, namespace `/analytics`
 * (client: `io("<server>/analytics")`).
 *
 *   client -> "subscribe"   { from?, to?, restaurantId?, groupBy?, limit?, metric? }
 *             ack: { status: "subscribed", snapshot, ... } | { status: "error", message }
 *   server -> "analytics:update"   a new snapshot, only when the numbers changed
 *   client -> "refresh"     recompute now (ack: the snapshot)
 *   client -> "unsubscribe"
 *
 * Calling "subscribe" again with other filters replaces the previous one.
 *
 * CORS: `*` by default, like the chat gateway. Set ANALYTICS_CORS_ORIGIN to
 * the frontend origin to restrict it.
 */
@WebSocketGateway({
  namespace: "analytics",
  cors: { origin: process.env.ANALYTICS_CORS_ORIGIN ?? "*" },
})
export class AnalyticsGateway implements OnGatewayInit, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Namespace;

  constructor(private readonly realtime: AnalyticsRealtimeService) {}

  afterInit(): void {
    this.realtime.setEmitter((room, event, payload) => {
      this.server.to(room).emit(event, payload);
    });
  }

  handleDisconnect(client: Socket): void {
    this.realtime.unsubscribe(client.id);
  }

  @SubscribeMessage("subscribe")
  async handleSubscribe(
    @MessageBody() body: unknown,
    @ConnectedSocket() client: Socket,
  ): Promise<SubscribeAck> {
    const dto = plainToInstance(AnalyticsSubscribeDto, body ?? {});
    const errors = await validate(dto, {
      forbidNonWhitelisted: true,
      whitelist: true,
    });

    if (errors.length > 0) {
      return {
        status: "error",
        message: errors.flatMap((e) => Object.values(e.constraints ?? {})),
      };
    }

    try {
      const previous = this.roomOf(client);
      const { room, snapshot } = await this.realtime.subscribe(client.id, dto);

      if (previous && previous !== room) {
        await client.leave(previous);
      }
      await client.join(room);

      return {
        status: "subscribed",
        room,
        refreshIntervalMs: this.realtime.refreshIntervalMs,
        snapshot,
      };
    } catch (error) {
      return {
        status: "error",
        message:
          error instanceof HttpException
            ? error.message
            : "Could not subscribe to the live dashboard",
      };
    }
  }

  @SubscribeMessage("refresh")
  async handleRefresh(
    @ConnectedSocket() client: Socket,
  ): Promise<
    { status: "ok"; snapshot: DashboardSnapshot } | { status: "not_subscribed" }
  > {
    const snapshot = await this.realtime.refreshNow(client.id);

    return snapshot ? { status: "ok", snapshot } : { status: "not_subscribed" };
  }

  @SubscribeMessage("unsubscribe")
  async handleUnsubscribe(
    @ConnectedSocket() client: Socket,
  ): Promise<{ status: "unsubscribed" }> {
    const room = this.roomOf(client);
    this.realtime.unsubscribe(client.id);
    if (room) {
      await client.leave(room);
    }

    return { status: "unsubscribed" };
  }

  /** The analytics room this socket is currently in, if any. */
  private roomOf(client: Socket): string | undefined {
    return [...client.rooms].find((room) => room.startsWith("analytics:"));
  }
}
