import { Logger } from "@nestjs/common";
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

import {
  AddItemDto,
  CreateSharedOrderDto,
  JoinSharedOrderDto,
  RemoveLineDto,
  SetNotesDto,
  SetQuantityDto,
} from "./dto/shared-orders.dto";
import { SharedOrderError, SharedOrdersService } from "./shared-orders.service";
import type { Ack, SharedOrderView } from "./shared-orders.types";

/** Each socket may send this many events per window. */
export const RATE_LIMIT_EVENTS = 40;
export const RATE_LIMIT_WINDOW_MS = 10_000;

const roomOf = (code: string) => `shared-order:${code}`;

/**
 * Shared table orders over socket.io, namespace `/shared-orders`
 * (client: `io("/shared-orders")`). Every event answers with an ack:
 * `{ status: "ok", ... }` or `{ status: "error", message }`.
 *
 *   "create"       { name, tableId }            -> { view, participantId, token }
 *   "join"         { code, name, token? }       -> { view, participantId, token }
 *   "add-item"     { itemId, quantity, notes? }
 *   "set-quantity" { lineId, quantity }
 *   "set-notes"    { lineId, notes }
 *   "remove-item"  { lineId }
 *   "submit"                                    -> { orderId }
 *   "leave"
 *
 *   server -> room "session:update"  the whole shared order (see `version`)
 *   server -> room "session:closed"  { reason }  the session no longer exists
 *
 * CORS: `*` by default, like the chat gateway. Set SHARED_ORDERS_CORS_ORIGIN
 * to the frontend origin to restrict it.
 */
@WebSocketGateway({
  namespace: "shared-orders",
  cors: { origin: process.env.SHARED_ORDERS_CORS_ORIGIN ?? "*" },
})
export class SharedOrdersGateway implements OnGatewayInit, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Namespace;

  private readonly logger = new Logger(SharedOrdersGateway.name);
  private readonly recentEvents = new Map<string, number[]>();

  constructor(private readonly orders: SharedOrdersService) {}

  afterInit(): void {
    this.orders.setListeners(
      (code: string, view: SharedOrderView) => {
        this.server.to(roomOf(code)).emit("session:update", view);
      },
      (code: string, reason: string) => {
        this.server.to(roomOf(code)).emit("session:closed", { reason });
        this.server.in(roomOf(code)).socketsLeave(roomOf(code));
      },
    );
  }

  handleDisconnect(client: Socket): void {
    this.recentEvents.delete(client.id);
    this.orders.disconnect(client.id);
  }

  @SubscribeMessage("create")
  create(@MessageBody() body: unknown, @ConnectedSocket() client: Socket) {
    return this.run(client, async () => {
      const dto = await this.parse(CreateSharedOrderDto, body);
      const previous = this.orders.codeOf(client.id);
      const result = await this.orders.create(client.id, dto);
      return this.enter(client, previous, result);
    });
  }

  @SubscribeMessage("join")
  join(@MessageBody() body: unknown, @ConnectedSocket() client: Socket) {
    return this.run(client, async () => {
      const dto = await this.parse(JoinSharedOrderDto, body);
      const previous = this.orders.codeOf(client.id);
      const result = this.orders.join(client.id, dto);
      return this.enter(client, previous, result);
    });
  }

  @SubscribeMessage("add-item")
  addItem(@MessageBody() body: unknown, @ConnectedSocket() client: Socket) {
    return this.run(client, async () => {
      await this.orders.addItem(client.id, await this.parse(AddItemDto, body));
      return {};
    });
  }

  @SubscribeMessage("set-quantity")
  setQuantity(@MessageBody() body: unknown, @ConnectedSocket() client: Socket) {
    return this.run(client, async () => {
      this.orders.setQuantity(
        client.id,
        await this.parse(SetQuantityDto, body),
      );
      return {};
    });
  }

  @SubscribeMessage("set-notes")
  setNotes(@MessageBody() body: unknown, @ConnectedSocket() client: Socket) {
    return this.run(client, async () => {
      this.orders.setNotes(client.id, await this.parse(SetNotesDto, body));
      return {};
    });
  }

  @SubscribeMessage("remove-item")
  removeItem(@MessageBody() body: unknown, @ConnectedSocket() client: Socket) {
    return this.run(client, async () => {
      this.orders.removeLine(client.id, await this.parse(RemoveLineDto, body));
      return {};
    });
  }

  @SubscribeMessage("submit")
  submit(@ConnectedSocket() client: Socket) {
    return this.run(client, async () => ({
      orderId: await this.orders.submit(client.id),
    }));
  }

  @SubscribeMessage("leave")
  leave(@ConnectedSocket() client: Socket) {
    return this.run(client, async () => {
      const code = this.orders.codeOf(client.id);
      this.orders.leave(client.id);
      if (code) await client.leave(roomOf(code));
      return {};
    });
  }

  // --------------------------------------------------------------- helpers

  /** Puts the socket in the room and answers with the state it will receive updates for. */
  private async enter(
    client: Socket,
    previous: string | null,
    result: { participantId: string; token: string; view: SharedOrderView },
  ) {
    const code = result.view.code;
    if (previous && previous !== code) await client.leave(roomOf(previous));
    await client.join(roomOf(code));

    if (client.disconnected) {
      this.orders.disconnect(client.id);
      throw new SharedOrderError("Socket disconnected");
    }
    // Read the state only now that the socket is in the room: nothing can be
    // missed between this answer and the updates that follow it.
    const view = this.orders.getView(code);
    if (!view) throw new SharedOrderError("Shared order not found");
    return { view, participantId: result.participantId, token: result.token };
  }

  private async parse<T extends object>(
    type: new () => T,
    body: unknown,
  ): Promise<T> {
    const dto = plainToInstance(type, body ?? {});
    const errors = await validate(dto, {
      forbidNonWhitelisted: true,
      whitelist: true,
    });
    if (errors.length > 0) {
      throw new SharedOrderError(
        errors.flatMap((e) => Object.values(e.constraints ?? {})).join("; "),
      );
    }
    return dto;
  }

  private allow(clientId: string): boolean {
    const now = Date.now();
    const recent = (this.recentEvents.get(clientId) ?? []).filter(
      (time) => now - time < RATE_LIMIT_WINDOW_MS,
    );
    if (recent.length >= RATE_LIMIT_EVENTS) {
      this.recentEvents.set(clientId, recent);
      return false;
    }
    recent.push(now);
    this.recentEvents.set(clientId, recent);
    return true;
  }

  private async run<T extends object>(
    client: Socket,
    action: () => Promise<T>,
  ): Promise<Ack<T>> {
    if (!this.allow(client.id)) {
      return { status: "error", message: "Too many requests, slow down" };
    }
    try {
      return { status: "ok", ...(await action()) };
    } catch (error) {
      if (error instanceof SharedOrderError) {
        return { status: "error", message: error.message };
      }
      this.logger.error(error instanceof Error ? error.stack : String(error));
      return { status: "error", message: "Unexpected error" };
    }
  }
}
