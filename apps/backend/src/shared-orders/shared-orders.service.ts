import {
  HttpException,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { OrderType } from "@prisma/client";
import { randomBytes, randomInt } from "node:crypto";

import { PrismaService } from "../database/prisma.service";
import { OrdersService } from "../orders/orders.service";
import {
  AddItemDto,
  CreateSharedOrderDto,
  JoinSharedOrderDto,
  MAX_QUANTITY,
  RemoveLineDto,
  SetNotesDto,
  SetQuantityDto,
} from "./dto/shared-orders.dto";
import type {
  JoinResult,
  SharedOrderLine,
  SharedOrderStatus,
  SharedOrderView,
} from "./shared-orders.types";

export const MAX_SESSIONS = 200;
export const MAX_PARTICIPANTS = 12;
export const MAX_LINES = 50;
/** A session nobody touched for this long is removed. */
export const IDLE_TTL_MS = 4 * 60 * 60 * 1000;
/** A session with nobody connected is removed after this long. */
export const OFFLINE_TTL_MS = 30 * 60 * 1000;
/** A session already sent to the kitchen stays visible for this long. */
export const SUBMITTED_TTL_MS = 10 * 60 * 1000;
export const SWEEP_INTERVAL_MS = 60 * 1000;

/** No ambiguous characters (0/O, 1/I/L), so a code can be read out loud. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

/** An error whose message is safe to show to the client. */
export class SharedOrderError extends Error {}

interface Participant {
  id: string;
  name: string;
  token: string;
  socketId: string | null;
}

interface Session {
  code: string;
  tableId: number;
  status: SharedOrderStatus;
  version: number;
  participants: Map<string, Participant>;
  lines: SharedOrderLine[];
  orderId: number | null;
  nextLineId: number;
  nextParticipantId: number;
  lastActivity: number;
}

type ViewListener = (code: string, view: SharedOrderView) => void;
type ClosedListener = (code: string, reason: string) => void;

/**
 * Shared table orders, kept in memory (nothing is stored in the database
 * until the order is sent). Every change goes through this class, which runs
 * on a single thread, so two diners editing at once cannot corrupt a session:
 * the server decides the order of changes and sends everyone the same result.
 */
@Injectable()
export class SharedOrdersService implements OnModuleInit, OnModuleDestroy {
  private readonly sessions = new Map<string, Session>();
  private readonly bySocket = new Map<
    string,
    { code: string; participantId: string }
  >();
  private onView: ViewListener = () => undefined;
  private onClosed: ClosedListener = () => undefined;
  private timer: NodeJS.Timeout | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => this.sweep(), SWEEP_INTERVAL_MS);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  setListeners(onView: ViewListener, onClosed: ClosedListener): void {
    this.onView = onView;
    this.onClosed = onClosed;
  }

  get activeSessions(): number {
    return this.sessions.size;
  }

  get trackedSockets(): number {
    return this.bySocket.size;
  }

  // ---------------------------------------------------------------- joining

  async create(
    socketId: string,
    dto: CreateSharedOrderDto,
  ): Promise<JoinResult> {
    this.assertCapacity();
    const table = await this.prisma.table.findUnique({
      where: { id: dto.tableId },
      select: { id: true },
    });
    if (!table) throw new SharedOrderError("Table not found");
    // The lookup was asynchronous: other people may have filled the server.
    this.assertCapacity();

    this.detach(socketId);
    const session: Session = {
      code: this.newCode(),
      tableId: dto.tableId,
      status: "open",
      version: 1,
      participants: new Map(),
      lines: [],
      orderId: null,
      nextLineId: 1,
      nextParticipantId: 1,
      lastActivity: Date.now(),
    };
    this.sessions.set(session.code, session);
    const participant = this.addParticipant(session, dto.name, socketId);
    return this.joinResult(session, participant);
  }

  join(socketId: string, dto: JoinSharedOrderDto): JoinResult {
    const session = this.sessions.get(dto.code);
    if (!session) throw new SharedOrderError("Shared order not found");

    const returning = dto.token
      ? [...session.participants.values()].find((p) => p.token === dto.token)
      : undefined;

    if (returning) {
      if (returning.socketId && returning.socketId !== socketId) {
        this.bySocket.delete(returning.socketId);
      }
      this.detach(socketId, { code: session.code, id: returning.id });
      returning.socketId = socketId;
      this.bySocket.set(socketId, {
        code: session.code,
        participantId: returning.id,
      });
      this.commit(session);
      return this.joinResult(session, returning);
    }

    if (session.status !== "open") {
      throw new SharedOrderError("This order has already been sent");
    }
    if (session.participants.size >= MAX_PARTICIPANTS) {
      throw new SharedOrderError("This table is full");
    }
    this.detach(socketId);
    const participant = this.addParticipant(session, dto.name, socketId);
    this.commit(session);
    return this.joinResult(session, participant);
  }

  /** The socket closed: the person stays in the list, shown as offline. */
  disconnect(socketId: string): void {
    this.detach(socketId);
  }

  /** The person left on purpose: they are removed from the list. */
  leave(socketId: string): void {
    const bound = this.bySocket.get(socketId);
    if (!bound) return;
    const session = this.sessions.get(bound.code);
    this.bySocket.delete(socketId);
    if (!session) return;
    session.participants.delete(bound.participantId);
    this.commit(session);
  }

  // --------------------------------------------------------------- editing

  async addItem(socketId: string, dto: AddItemDto): Promise<void> {
    const { session } = this.actor(socketId);
    this.assertOpen(session);

    const item = await this.prisma.menuItem.findFirst({
      where: { id: dto.itemId, isAvailable: true },
      select: { id: true, name: true, price: true },
    });
    if (!item) throw new SharedOrderError("Dish not available");

    // The lookup was asynchronous: the person may have left or the order may
    // have been sent meanwhile.
    const current = this.actor(socketId);
    if (current.session !== session) {
      throw new SharedOrderError("The shared order changed, try again");
    }
    this.assertOpen(session);

    const notes = dto.notes ?? "";
    const existing = session.lines.find(
      (line) =>
        line.itemId === item.id &&
        line.addedBy === current.participant.id &&
        line.notes === notes,
    );
    if (existing) {
      if (existing.quantity + dto.quantity > MAX_QUANTITY) {
        throw new SharedOrderError(`At most ${MAX_QUANTITY} of each dish`);
      }
      existing.quantity += dto.quantity;
    } else {
      if (session.lines.length >= MAX_LINES) {
        throw new SharedOrderError("The order has too many lines");
      }
      session.lines.push({
        id: session.nextLineId++,
        itemId: item.id,
        name: item.name,
        unitPrice: Number(item.price),
        quantity: dto.quantity,
        notes,
        addedBy: current.participant.id,
        addedByName: current.participant.name,
      });
    }
    this.commit(session);
  }

  setQuantity(socketId: string, dto: SetQuantityDto): void {
    const { session } = this.actor(socketId);
    this.assertOpen(session);
    this.line(session, dto.lineId).quantity = dto.quantity;
    this.commit(session);
  }

  setNotes(socketId: string, dto: SetNotesDto): void {
    const { session } = this.actor(socketId);
    this.assertOpen(session);
    this.line(session, dto.lineId).notes = dto.notes;
    this.commit(session);
  }

  removeLine(socketId: string, dto: RemoveLineDto): void {
    const { session } = this.actor(socketId);
    this.assertOpen(session);
    const line = this.line(session, dto.lineId);
    session.lines = session.lines.filter((other) => other !== line);
    this.commit(session);
  }

  /** Sends the shared order to the kitchen as a normal dine-in order. */
  async submit(socketId: string): Promise<number> {
    const { session } = this.actor(socketId);
    this.assertOpen(session);
    if (session.lines.length === 0) {
      throw new SharedOrderError("Add at least one dish first");
    }

    // Lock first, so a second click or another diner cannot send it twice.
    session.status = "submitting";
    this.commit(session);

    try {
      const created = await this.orders.create(
        Number(process.env.SHARED_ORDER_RESTAURANT_ID ?? 1),
        {
          type: OrderType.dine_in,
          tableId: session.tableId,
          items: session.lines.map((line) => ({
            itemId: line.itemId,
            quantity: line.quantity,
            notes: line.notes
              ? `${line.addedByName}: ${line.notes}`
              : line.addedByName,
          })),
        },
      );
      session.status = "submitted";
      session.orderId = created.id;
      this.commit(session);
      return created.id;
    } catch (error) {
      session.status = "open";
      this.commit(session);
      if (error instanceof HttpException) {
        throw new SharedOrderError(error.message);
      }
      throw error;
    }
  }

  // ---------------------------------------------------------------- upkeep

  /** Removes sessions that are finished, abandoned or forgotten. */
  sweep(now: number = Date.now()): number {
    let removed = 0;
    for (const session of [...this.sessions.values()]) {
      const idle = now - session.lastActivity;
      const online = [...session.participants.values()].some(
        (p) => p.socketId !== null,
      );
      const reason =
        session.status === "submitted" && idle > SUBMITTED_TTL_MS
          ? "sent"
          : idle > IDLE_TTL_MS
            ? "expired"
            : !online && idle > OFFLINE_TTL_MS
              ? "abandoned"
              : null;
      if (!reason) continue;

      for (const p of session.participants.values()) {
        if (p.socketId) this.bySocket.delete(p.socketId);
      }
      this.sessions.delete(session.code);
      this.onClosed(session.code, reason);
      removed += 1;
    }
    return removed;
  }

  // --------------------------------------------------------------- helpers

  private assertCapacity(): void {
    if (this.sessions.size >= MAX_SESSIONS) {
      throw new SharedOrderError("Too many shared orders are open right now");
    }
  }

  private newCode(): string {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      let code = "";
      for (let i = 0; i < CODE_LENGTH; i += 1) {
        code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
      }
      if (!this.sessions.has(code)) return code;
    }
    throw new SharedOrderError("Could not create a code, try again");
  }

  private addParticipant(
    session: Session,
    name: string,
    socketId: string,
  ): Participant {
    const participant: Participant = {
      id: `p${session.nextParticipantId++}`,
      name,
      token: randomBytes(16).toString("hex"),
      socketId,
    };
    session.participants.set(participant.id, participant);
    this.bySocket.set(socketId, {
      code: session.code,
      participantId: participant.id,
    });
    return participant;
  }

  /**
   * Unbinds a socket from its current place (it will be marked offline).
   * `keep` is a participant that is about to take the socket over.
   */
  private detach(socketId: string, keep?: { code: string; id: string }): void {
    const bound = this.bySocket.get(socketId);
    if (!bound) return;
    this.bySocket.delete(socketId);
    const session = this.sessions.get(bound.code);
    const participant = session?.participants.get(bound.participantId);
    if (!session || !participant) return;
    if (keep && keep.code === session.code && keep.id === participant.id)
      return;
    if (participant.socketId === socketId) participant.socketId = null;
    this.commit(session);
  }

  private actor(socketId: string): {
    session: Session;
    participant: Participant;
  } {
    const bound = this.bySocket.get(socketId);
    const session = bound && this.sessions.get(bound.code);
    const participant = bound && session?.participants.get(bound.participantId);
    if (!bound || !session || !participant) {
      throw new SharedOrderError("You are not in a shared order");
    }
    return { session, participant };
  }

  private assertOpen(session: Session): void {
    if (session.status === "submitting") {
      throw new SharedOrderError("The order is being sent");
    }
    if (session.status === "submitted") {
      throw new SharedOrderError("This order has already been sent");
    }
  }

  private line(session: Session, lineId: number): SharedOrderLine {
    const line = session.lines.find((candidate) => candidate.id === lineId);
    if (!line)
      throw new SharedOrderError("That dish is no longer in the order");
    return line;
  }

  private commit(session: Session): void {
    session.version += 1;
    session.lastActivity = Date.now();
    this.onView(session.code, this.view(session));
  }

  private joinResult(session: Session, participant: Participant): JoinResult {
    return {
      view: this.view(session),
      participantId: participant.id,
      token: participant.token,
    };
  }

  view(session: Session): SharedOrderView {
    return {
      code: session.code,
      tableId: session.tableId,
      status: session.status,
      version: session.version,
      participants: [...session.participants.values()].map((p) => ({
        id: p.id,
        name: p.name,
        online: p.socketId !== null,
      })),
      lines: session.lines.map((line) => ({ ...line })),
      total: session.lines.reduce(
        (sum, line) => sum + line.unitPrice * line.quantity,
        0,
      ),
      orderId: session.orderId,
    };
  }

  /** The current state of a session, or null. Used by the gateway after joining. */
  getView(code: string): SharedOrderView | null {
    const session = this.sessions.get(code);
    return session ? this.view(session) : null;
  }

  /** The room a socket is bound to, if any. */
  codeOf(socketId: string): string | null {
    return this.bySocket.get(socketId)?.code ?? null;
  }
}
