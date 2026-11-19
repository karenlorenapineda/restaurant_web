import { BadRequestException } from "@nestjs/common";

import type { PrismaService } from "../database/prisma.service";
import type { OrdersService } from "../orders/orders.service";
import {
  IDLE_TTL_MS,
  MAX_LINES,
  MAX_PARTICIPANTS,
  MAX_SESSIONS,
  OFFLINE_TTL_MS,
  SUBMITTED_TTL_MS,
  SharedOrderError,
  SharedOrdersService,
} from "./shared-orders.service";
import type { SharedOrderView } from "./shared-orders.types";

const DISHES: Record<number, { id: number; name: string; price: string }> = {
  1: { id: 1, name: "Paella", price: "12.50" },
  2: { id: 2, name: "Agua", price: "2.00" },
};

function setup() {
  const prisma = {
    table: {
      findUnique: jest.fn(async ({ where }: { where: { id: number } }) =>
        where.id === 5 || where.id === 6 ? { id: where.id } : null,
      ),
    },
    menuItem: {
      findFirst: jest.fn(
        async ({ where }: { where: { id: number } }) =>
          DISHES[where.id] ?? null,
      ),
    },
  };
  const orders = { create: jest.fn(async () => ({ id: 77 })) };
  const service = new SharedOrdersService(
    prisma as unknown as PrismaService,
    orders as unknown as OrdersService,
  );
  const views: SharedOrderView[] = [];
  const closed: Array<[string, string]> = [];
  service.setListeners(
    (_code, view) => views.push(view),
    (code, reason) => closed.push([code, reason]),
  );
  return { service, prisma, orders, views, closed };
}

type Ctx = ReturnType<typeof setup>;

async function table(ctx: Ctx, socket = "s1", name = "Ana") {
  return ctx.service.create(socket, { name, tableId: 5 });
}

const rejects = (
  promise: Promise<unknown> | (() => unknown),
  message: string | RegExp,
) =>
  expect(
    typeof promise === "function" ? (async () => promise())() : promise,
  ).rejects.toThrow(message);

describe("SharedOrdersService", () => {
  describe("creating and joining", () => {
    it("creates a session with a readable code and the creator as first participant", async () => {
      const ctx = setup();
      const { view, participantId, token } = await table(ctx);

      expect(view.code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
      expect(view).toMatchObject({
        tableId: 5,
        status: "open",
        total: 0,
        orderId: null,
      });
      expect(view.participants).toEqual([
        { id: participantId, name: "Ana", online: true },
      ]);
      expect(token).toHaveLength(32);
      expect(ctx.service.activeSessions).toBe(1);
    });

    it("rejects a table that does not exist", async () => {
      const ctx = setup();
      await rejects(
        ctx.service.create("s1", { name: "Ana", tableId: 99 }),
        "Table not found",
      );
      expect(ctx.service.activeSessions).toBe(0);
    });

    it("never shows reconnection tokens to participants", async () => {
      const ctx = setup();
      const { view, token } = await table(ctx);
      const luis = ctx.service.join("s2", { code: view.code, name: "Luis" });
      const all = JSON.stringify([
        ...ctx.views,
        ctx.service.getView(view.code),
      ]);
      expect(all).not.toContain(token);
      expect(all).not.toContain(luis.token);
      expect(all).not.toContain("token");
    });

    it("gives different codes to different sessions", async () => {
      const ctx = setup();
      const codes = new Set<string>();
      for (let i = 0; i < 30; i += 1) {
        codes.add(
          (await ctx.service.create(`s${i}`, { name: "A", tableId: 5 })).view
            .code,
        );
      }
      expect(codes.size).toBe(30);
    });

    it("refuses new sessions when the server is full, even if it filled during the table lookup", async () => {
      const ctx = setup();
      for (let i = 0; i < MAX_SESSIONS; i += 1) {
        await ctx.service.create(`s${i}`, { name: "A", tableId: 5 });
      }
      await rejects(
        ctx.service.create("extra", { name: "B", tableId: 5 }),
        "Too many shared orders",
      );

      const racing = setup();
      for (let i = 0; i < MAX_SESSIONS - 1; i += 1) {
        await racing.service.create(`s${i}`, { name: "A", tableId: 5 });
      }
      const results = await Promise.allSettled([
        racing.service.create("x1", { name: "B", tableId: 5 }),
        racing.service.create("x2", { name: "C", tableId: 5 }),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([
        "fulfilled",
        "rejected",
      ]);
      expect(racing.service.activeSessions).toBe(MAX_SESSIONS);
    });

    it("lets others join by code and tells everyone", async () => {
      const ctx = setup();
      const { view } = await table(ctx);
      const joined = ctx.service.join("s2", { code: view.code, name: "Luis" });

      expect(joined.view.participants.map((p) => p.name)).toEqual([
        "Ana",
        "Luis",
      ]);
      expect(ctx.views.at(-1)?.participants).toHaveLength(2);
    });

    it("rejects an unknown code and a full table", async () => {
      const ctx = setup();
      const { view } = await table(ctx);
      expect(() =>
        ctx.service.join("s2", { code: "ZZZZZZ", name: "Luis" }),
      ).toThrow("not found");

      for (let i = 1; i < MAX_PARTICIPANTS; i += 1) {
        ctx.service.join(`p${i}`, { code: view.code, name: `P${i}` });
      }
      expect(() =>
        ctx.service.join("late", { code: view.code, name: "Late" }),
      ).toThrow("full");
    });

    it("moves a socket out of its previous session when it joins another", async () => {
      const ctx = setup();
      const a = await table(ctx, "s1", "Ana");
      const b = await ctx.service.create("s2", { name: "Luis", tableId: 6 });
      ctx.service.join("s1", { code: b.view.code, name: "Ana" });

      expect(ctx.service.getView(a.view.code)?.participants[0]?.online).toBe(
        false,
      );
      expect(ctx.service.codeOf("s1")).toBe(b.view.code);
    });
  });

  describe("presence and reconnection", () => {
    it("marks a participant offline on disconnect and recovers them with the token", async () => {
      const ctx = setup();
      const ana = await table(ctx);
      ctx.service.join("s2", { code: ana.view.code, name: "Luis" });
      await ctx.service.addItem("s1", { itemId: 1, quantity: 2 });

      ctx.service.disconnect("s1");
      expect(
        ctx.views.at(-1)?.participants.find((p) => p.id === ana.participantId)
          ?.online,
      ).toBe(false);

      const back = ctx.service.join("s9", {
        code: ana.view.code,
        name: "ignored",
        token: ana.token,
      });
      expect(back.participantId).toBe(ana.participantId);
      expect(back.view.participants).toHaveLength(2);
      expect(
        back.view.participants.find((p) => p.id === ana.participantId),
      ).toMatchObject({
        name: "Ana",
        online: true,
      });
      await ctx.service.addItem("s9", { itemId: 1, quantity: 1 });
      expect(ctx.service.getView(ana.view.code)?.lines[0]?.quantity).toBe(3);
    });

    it("cannot reconnect with a token from another session or a wrong token", async () => {
      const ctx = setup();
      const a = await table(ctx, "s1", "Ana");
      const b = await ctx.service.create("s2", { name: "Luis", tableId: 6 });
      ctx.service.join("s3", {
        code: a.view.code,
        name: "Eva",
        token: b.token,
      });
      expect(
        ctx.service.getView(a.view.code)?.participants.map((p) => p.name),
      ).toEqual(["Ana", "Eva"]);
      ctx.service.join("s4", { code: a.view.code, name: "Zoe", token: "nope" });
      expect(ctx.service.getView(a.view.code)?.participants).toHaveLength(3);
    });

    it("a new connection takes over from a stale one without freeing the person twice", async () => {
      const ctx = setup();
      const ana = await table(ctx);
      ctx.service.join("s2", {
        code: ana.view.code,
        name: "Ana",
        token: ana.token,
      });
      ctx.service.disconnect("s1"); // the old socket finally closes

      expect(ctx.service.getView(ana.view.code)?.participants).toEqual([
        { id: ana.participantId, name: "Ana", online: true },
      ]);
      expect(ctx.service.trackedSockets).toBe(1);
    });

    it("the same participant id in two sessions is never confused", async () => {
      const ctx = setup();
      const a = await table(ctx, "s1", "Ana");
      const b = await ctx.service.create("s2", { name: "Luis", tableId: 6 });
      expect(a.participantId).toBe(b.participantId); // both are "p1"
      ctx.service.join("s1", {
        code: b.view.code,
        name: "Ana",
        token: b.token,
      });
      expect(ctx.service.getView(b.view.code)?.participants).toHaveLength(1);
      expect(ctx.service.getView(b.view.code)?.participants[0]?.online).toBe(
        true,
      );
      // ...and the person is no longer shown as connected at the first table.
      expect(ctx.service.getView(a.view.code)?.participants[0]?.online).toBe(
        false,
      );
    });

    it("removes the person on leave and forgets their socket", async () => {
      const ctx = setup();
      const ana = await table(ctx);
      ctx.service.join("s2", { code: ana.view.code, name: "Luis" });
      ctx.service.leave("s2");

      expect(ctx.service.getView(ana.view.code)?.participants).toHaveLength(1);
      expect(ctx.service.trackedSockets).toBe(1);
      expect(() =>
        ctx.service.setQuantity("s2", { lineId: 1, quantity: 1 }),
      ).toThrow("not in a shared order");
    });
  });

  describe("editing together", () => {
    it("takes the price from the database, never from the client", async () => {
      const ctx = setup();
      const { view } = await table(ctx);
      await ctx.service.addItem("s1", {
        itemId: 1,
        quantity: 2,
        price: 0.01,
      } as never);
      const state = ctx.service.getView(view.code);
      expect(state?.lines[0]).toMatchObject({
        name: "Paella",
        unitPrice: 12.5,
        quantity: 2,
      });
      expect(state?.total).toBe(25);
    });

    it("merges the same dish from the same person but keeps different people apart", async () => {
      const ctx = setup();
      const { view } = await table(ctx);
      ctx.service.join("s2", { code: view.code, name: "Luis" });
      await ctx.service.addItem("s1", { itemId: 1, quantity: 1 });
      await ctx.service.addItem("s1", { itemId: 1, quantity: 2 });
      await ctx.service.addItem("s2", { itemId: 1, quantity: 1 });
      await ctx.service.addItem("s1", {
        itemId: 1,
        quantity: 1,
        notes: "sin gambas",
      });

      const lines = ctx.service.getView(view.code)?.lines ?? [];
      expect(lines.map((l) => [l.addedByName, l.quantity, l.notes])).toEqual([
        ["Ana", 3, ""],
        ["Luis", 1, ""],
        ["Ana", 1, "sin gambas"],
      ]);
    });

    it("two people adding at the same moment both end up in the order", async () => {
      const ctx = setup();
      const { view } = await table(ctx);
      ctx.service.join("s2", { code: view.code, name: "Luis" });
      await Promise.all([
        ctx.service.addItem("s1", { itemId: 1, quantity: 1 }),
        ctx.service.addItem("s2", { itemId: 2, quantity: 4 }),
        ctx.service.addItem("s1", { itemId: 2, quantity: 1 }),
      ]);
      const state = ctx.service.getView(view.code);
      expect(state?.lines).toHaveLength(3);
      expect(state?.total).toBe(12.5 + 8 + 2);
      const versions = ctx.views.map((v) => v.version);
      expect(versions).toEqual([...versions].sort((a, b) => a - b));
      expect(new Set(versions).size).toBe(versions.length);
    });

    it("lets anyone change or remove any line", async () => {
      const ctx = setup();
      const { view } = await table(ctx);
      ctx.service.join("s2", { code: view.code, name: "Luis" });
      await ctx.service.addItem("s1", { itemId: 1, quantity: 1 });

      ctx.service.setQuantity("s2", { lineId: 1, quantity: 5 });
      ctx.service.setNotes("s2", { lineId: 1, notes: "poco hecha" });
      expect(ctx.service.getView(view.code)?.lines[0]).toMatchObject({
        quantity: 5,
        notes: "poco hecha",
      });

      ctx.service.removeLine("s2", { lineId: 1 });
      expect(ctx.service.getView(view.code)?.lines).toEqual([]);
      expect(() => ctx.service.removeLine("s1", { lineId: 1 })).toThrow(
        "no longer in the order",
      );
    });

    it("rejects unavailable dishes, too many of a dish and too many lines", async () => {
      const ctx = setup();
      await table(ctx);
      await rejects(
        ctx.service.addItem("s1", { itemId: 404, quantity: 1 }),
        "Dish not available",
      );

      await ctx.service.addItem("s1", { itemId: 1, quantity: 20 });
      await rejects(
        ctx.service.addItem("s1", { itemId: 1, quantity: 1 }),
        "At most 20",
      );

      for (let i = 1; i < MAX_LINES; i += 1) {
        await ctx.service.addItem("s1", {
          itemId: 2,
          quantity: 1,
          notes: `n${i}`,
        });
      }
      await rejects(
        ctx.service.addItem("s1", { itemId: 2, quantity: 1, notes: "extra" }),
        "too many lines",
      );
    });

    it("refuses edits from someone who is not in a session", async () => {
      const ctx = setup();
      await rejects(
        ctx.service.addItem("ghost", { itemId: 1, quantity: 1 }),
        "not in a shared order",
      );
    });

    it("does not add a dish for a person who left while the dish was being looked up", async () => {
      const ctx = setup();
      const { view } = await table(ctx);
      ctx.service.join("s2", { code: view.code, name: "Luis" });
      const pending = ctx.service.addItem("s2", { itemId: 1, quantity: 1 });
      ctx.service.leave("s2");
      await expect(pending).rejects.toThrow("not in a shared order");
      expect(ctx.service.getView(view.code)?.lines).toEqual([]);
    });

    it("does not add a dish to the old table if the person moved to another table meanwhile", async () => {
      const ctx = setup();
      const first = await table(ctx, "s1", "Ana");
      const second = await ctx.service.create("s2", {
        name: "Luis",
        tableId: 6,
      });
      const pending = ctx.service.addItem("s1", { itemId: 1, quantity: 1 });
      ctx.service.join("s1", { code: second.view.code, name: "Ana" });

      await expect(pending).rejects.toThrow("changed, try again");
      expect(ctx.service.getView(first.view.code)?.lines).toEqual([]);
      expect(ctx.service.getView(second.view.code)?.lines).toEqual([]);
    });

    it("does not add a dish to an order that was sent while the dish was being looked up", async () => {
      const ctx = setup();
      const { view } = await table(ctx);
      await ctx.service.addItem("s1", { itemId: 2, quantity: 1 });
      ctx.service.join("s2", { code: view.code, name: "Luis" });
      const pending = ctx.service.addItem("s2", { itemId: 1, quantity: 1 });
      await ctx.service.submit("s1");
      await expect(pending).rejects.toThrow(/being sent|already been sent/);
      expect(ctx.service.getView(view.code)?.lines).toHaveLength(1);
    });

    it("sends an update after every change", async () => {
      const ctx = setup();
      const { view } = await table(ctx);
      const before = ctx.views.length;
      await ctx.service.addItem("s1", { itemId: 1, quantity: 1 });
      ctx.service.setQuantity("s1", { lineId: 1, quantity: 2 });
      ctx.service.setNotes("s1", { lineId: 1, notes: "x" });
      ctx.service.removeLine("s1", { lineId: 1 });
      expect(ctx.views.length - before).toBe(4);
      expect(ctx.views.at(-1)?.code).toBe(view.code);
    });
  });

  describe("sending the order", () => {
    it("creates one dine-in order with who asked for what", async () => {
      const ctx = setup();
      const { view } = await table(ctx);
      ctx.service.join("s2", { code: view.code, name: "Luis" });
      await ctx.service.addItem("s1", {
        itemId: 1,
        quantity: 2,
        notes: "sin gambas",
      });
      await ctx.service.addItem("s2", { itemId: 2, quantity: 1 });

      await expect(ctx.service.submit("s2")).resolves.toBe(77);

      expect(ctx.orders.create).toHaveBeenCalledTimes(1);
      expect(ctx.orders.create).toHaveBeenCalledWith(1, {
        type: "dine_in",
        tableId: 5,
        items: [
          { itemId: 1, quantity: 2, notes: "Ana: sin gambas" },
          { itemId: 2, quantity: 1, notes: "Luis" },
        ],
      });
      expect(ctx.service.getView(view.code)).toMatchObject({
        status: "submitted",
        orderId: 77,
      });
    });

    it("sends only once when two people press send at the same moment", async () => {
      const ctx = setup();
      const { view } = await table(ctx);
      ctx.service.join("s2", { code: view.code, name: "Luis" });
      await ctx.service.addItem("s1", { itemId: 1, quantity: 1 });

      const results = await Promise.allSettled([
        ctx.service.submit("s1"),
        ctx.service.submit("s2"),
      ]);

      expect(results.map((r) => r.status).sort()).toEqual([
        "fulfilled",
        "rejected",
      ]);
      expect(ctx.orders.create).toHaveBeenCalledTimes(1);
    });

    it("locks the order while it is being sent", async () => {
      const ctx = setup();
      const { view } = await table(ctx);
      await ctx.service.addItem("s1", { itemId: 1, quantity: 1 });
      let release: (value: { id: number }) => void = () => undefined;
      ctx.orders.create.mockReturnValueOnce(
        new Promise((resolve) => (release = resolve)),
      );

      const sending = ctx.service.submit("s1");
      expect(ctx.service.getView(view.code)?.status).toBe("submitting");
      await expect(
        ctx.service.addItem("s1", { itemId: 2, quantity: 1 }),
      ).rejects.toThrow("being sent");
      release({ id: 5 });
      await sending;
    });

    it("reopens the order if the kitchen side fails, and allows another try", async () => {
      const ctx = setup();
      const { view } = await table(ctx);
      await ctx.service.addItem("s1", { itemId: 1, quantity: 1 });
      ctx.orders.create.mockRejectedValueOnce(
        new BadRequestException("One or more items are invalid or unavailable"),
      );

      await expect(ctx.service.submit("s1")).rejects.toThrow(
        "invalid or unavailable",
      );
      expect(ctx.service.getView(view.code)?.status).toBe("open");

      await expect(ctx.service.submit("s1")).resolves.toBe(77);
    });

    it("does not leak unexpected errors to the client but still reopens the order", async () => {
      const ctx = setup();
      const { view } = await table(ctx);
      await ctx.service.addItem("s1", { itemId: 1, quantity: 1 });
      ctx.orders.create.mockRejectedValueOnce(
        new Error("connection string postgres://secret"),
      );

      const error = await ctx.service.submit("s1").catch((e: unknown) => e);
      expect(error).not.toBeInstanceOf(SharedOrderError);
      expect(ctx.service.getView(view.code)?.status).toBe("open");
    });

    it("needs at least one dish, and nothing can change after it was sent", async () => {
      const ctx = setup();
      const { view } = await table(ctx);
      await rejects(ctx.service.submit("s1"), "at least one dish");

      await ctx.service.addItem("s1", { itemId: 1, quantity: 1 });
      await ctx.service.submit("s1");
      await rejects(ctx.service.submit("s1"), "already been sent");
      await rejects(
        ctx.service.addItem("s1", { itemId: 1, quantity: 1 }),
        "already been sent",
      );
      expect(() =>
        ctx.service.setQuantity("s1", { lineId: 1, quantity: 3 }),
      ).toThrow("already been sent");
      expect(() =>
        ctx.service.join("s9", { code: view.code, name: "Late" }),
      ).toThrow("already been sent");
    });
  });

  describe("cleaning up", () => {
    it("removes sessions that are idle, abandoned or already sent, and frees their sockets", async () => {
      const ctx = setup();
      const idle = await table(ctx, "s1", "Ana");
      const abandoned = await ctx.service.create("s2", {
        name: "Luis",
        tableId: 6,
      });
      ctx.service.disconnect("s2");
      const sent = await ctx.service.create("s3", { name: "Eva", tableId: 5 });
      await ctx.service.addItem("s3", { itemId: 1, quantity: 1 });
      await ctx.service.submit("s3");
      const fresh = await ctx.service.create("s4", { name: "Zoe", tableId: 5 });
      const start = Date.now();

      expect(ctx.service.sweep(start + 60_000)).toBe(0);
      // Half an hour later: the abandoned one and the already sent one go.
      expect(ctx.service.sweep(start + OFFLINE_TTL_MS + 1_000)).toBe(2);
      expect(ctx.closed.sort()).toEqual(
        [
          [abandoned.view.code, "abandoned"],
          [sent.view.code, "sent"],
        ].sort(),
      );
      // Connected people keep a session alive until it has been idle for hours.
      expect(ctx.service.getView(idle.view.code)).not.toBeNull();
      expect(ctx.service.sweep(start + IDLE_TTL_MS + 1_000)).toBe(2);
      expect(ctx.closed).toContainEqual([idle.view.code, "expired"]);
      expect(ctx.closed).toContainEqual([fresh.view.code, "expired"]);
      expect(ctx.service.activeSessions).toBe(0);
      expect(ctx.service.trackedSockets).toBe(0);
    });

    it("removes a sent order after ten minutes", async () => {
      const ctx = setup();
      const { view } = await table(ctx);
      await ctx.service.addItem("s1", { itemId: 1, quantity: 1 });
      await ctx.service.submit("s1");
      expect(ctx.service.sweep(Date.now() + SUBMITTED_TTL_MS + 1_000)).toBe(1);
      expect(ctx.closed).toEqual([[view.code, "sent"]]);
    });

    it("does not leave sockets behind after many people come and go", async () => {
      const ctx = setup();
      const { view } = await table(ctx);
      for (let i = 0; i < 100; i += 1) {
        ctx.service.join(`g${i}`, { code: view.code, name: "Guest" });
        ctx.service.leave(`g${i}`);
      }
      expect(ctx.service.trackedSockets).toBe(1);
      expect(ctx.service.getView(view.code)?.participants).toHaveLength(1);
    });

    it("stops its timer when the module is destroyed", () => {
      const ctx = setup();
      ctx.service.onModuleInit();
      ctx.service.onModuleDestroy();
      expect(ctx.service.activeSessions).toBe(0);
    });
  });
});
