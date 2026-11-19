import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { io, Socket } from "socket.io-client";

import { DatabaseModule } from "../database/database.module";
import { PrismaService } from "../database/prisma.service";
import { OrdersService } from "../orders/orders.service";
import { RATE_LIMIT_EVENTS } from "./shared-orders.gateway";
import { SharedOrdersModule } from "./shared-orders.module";
import { SharedOrdersService } from "./shared-orders.service";
import type { SharedOrderView } from "./shared-orders.types";

jest.setTimeout(20_000);

type Reply = Record<string, any> & { status: "ok" | "error"; message?: string };

describe("SharedOrdersGateway over real sockets", () => {
  let app: INestApplication;
  let url: string;
  let service: SharedOrdersService;
  const createOrder = jest.fn(async (..._args: unknown[]) => ({ id: 901 }));
  const clients: Socket[] = [];

  beforeAll(async () => {
    const prisma = {
      table: { findUnique: jest.fn(async () => ({ id: 5 })) },
      menuItem: {
        findFirst: jest.fn(async ({ where }: { where: { id: number } }) =>
          where.id === 1
            ? { id: 1, name: "Paella", price: "12.50" }
            : where.id === 2
              ? { id: 2, name: "Agua", price: "2.00" }
              : null,
        ),
      },
    };
    const moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule, SharedOrdersModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(OrdersService)
      .useValue({ create: createOrder })
      .compile();
    app = moduleRef.createNestApplication();
    await app.listen(0, "127.0.0.1");
    url = `${await app.getUrl()}/shared-orders`;
    service = app.get(SharedOrdersService);
  });

  afterEach(async () => {
    for (const client of clients.splice(0)) client.close();
    await new Promise((resolve) => setTimeout(resolve, 50));
    createOrder.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  async function connect(): Promise<Socket> {
    const client = io(url, { transports: ["websocket"], reconnection: false });
    clients.push(client);
    await new Promise<void>((resolve, reject) => {
      client.on("connect", () => resolve());
      client.on("connect_error", reject);
    });
    return client;
  }

  const call = (client: Socket, event: string, payload?: unknown) =>
    client.timeout(5_000).emitWithAck(event, payload) as Promise<Reply>;

  /** Collects every "session:update" a client receives. */
  function listen(client: Socket): SharedOrderView[] {
    const updates: SharedOrderView[] = [];
    client.on("session:update", (view: SharedOrderView) => updates.push(view));
    return updates;
  }

  async function waitUntil(check: () => boolean, what: string) {
    const deadline = Date.now() + 5_000;
    while (!check()) {
      if (Date.now() > deadline)
        throw new Error(`Timed out waiting for: ${what}`);
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  async function table(name = "Ana") {
    const client = await connect();
    const updates = listen(client);
    const reply = await call(client, "create", { name, tableId: 5 });
    expect(reply.status).toBe("ok");
    return { client, updates, reply, code: reply.view.code as string };
  }

  async function guest(code: string, name: string, token?: string) {
    const client = await connect();
    const updates = listen(client);
    const reply = await call(client, "join", { code, name, token });
    return { client, updates, reply };
  }

  it("lets two people see each other's changes at once", async () => {
    const ana = await table();
    const luis = await guest(ana.code, "Luis");
    expect(luis.reply.status).toBe("ok");

    await call(ana.client, "add-item", { itemId: 1, quantity: 2 });
    await waitUntil(
      () => luis.updates.at(-1)?.lines.length === 1,
      "Luis sees Ana's dish",
    );
    expect(luis.updates.at(-1)?.total).toBe(25);

    await call(luis.client, "set-quantity", { lineId: 1, quantity: 3 });
    await waitUntil(
      () => ana.updates.at(-1)?.lines[0]?.quantity === 3,
      "Ana sees Luis's change",
    );
  });

  it("accepts the code in lower case with spaces and cleans the name", async () => {
    const ana = await table();
    const guestClient = await connect();
    const reply = await call(guestClient, "join", {
      code: `  ${ana.code.toLowerCase()} `,
      name: "  Luis \n  Gil\t",
    });
    expect(reply.status).toBe("ok");
    expect(
      reply.view.participants.map((p: { name: string }) => p.name),
    ).toEqual(["Ana", "Luis Gil"]);
  });

  it("rejects invalid data with a clear message and no crash", async () => {
    const client = await connect();
    const sessionsBefore = service.activeSessions;
    const bad: Array<[string, unknown]> = [
      ["create", { name: "", tableId: 5 }],
      ["create", { name: "x".repeat(31), tableId: 5 }],
      ["create", { name: "Ana", tableId: -1 }],
      ["create", { name: "Ana", tableId: 5, admin: true }],
      ["create", undefined],
      ["join", { code: "abc", name: "Ana" }],
      ["join", { code: "ABC12$", name: "Ana" }],
    ];
    for (const [event, payload] of bad) {
      const reply = await call(client, event, payload);
      expect(reply.status).toBe("error");
    }
    expect(service.activeSessions).toBe(sessionsBefore);
  });

  it("rejects editing before joining and invalid quantities", async () => {
    const stranger = await connect();
    expect(
      (await call(stranger, "add-item", { itemId: 1, quantity: 1 })).message,
    ).toMatch(/not in a shared order/);

    const ana = await table();
    for (const quantity of [0, 21, 1.5, "2", null]) {
      expect(
        (await call(ana.client, "add-item", { itemId: 1, quantity })).status,
      ).toBe("error");
    }
    expect(
      (await call(ana.client, "add-item", { itemId: 1, quantity: 1, price: 0 }))
        .status,
    ).toBe("error");
    expect(
      (await call(ana.client, "add-item", { itemId: 404, quantity: 1 }))
        .message,
    ).toMatch(/not available/);
  });

  it("keeps six people who edit at the same time in perfect sync", async () => {
    const ana = await table();
    const others = await Promise.all(
      ["B", "C", "D", "E", "F"].map((name) => guest(ana.code, name)),
    );
    const everyone = [ana, ...others];

    await Promise.all(
      everyone.flatMap(({ client }, index) =>
        [1, 2].map((itemId) =>
          call(client, "add-item", { itemId, quantity: index + 1 }),
        ),
      ),
    );

    const expected = service.getView(ana.code);
    expect(expected?.lines).toHaveLength(12);
    expect(expected?.total).toBe(
      everyone.reduce(
        (sum, _p, index) => sum + (index + 1) * 12.5 + (index + 1) * 2,
        0,
      ),
    );
    for (const person of everyone) {
      await waitUntil(
        () => person.updates.at(-1)?.version === expected?.version,
        "everyone reaches the last version",
      );
      expect(person.updates.at(-1)).toEqual(expected);
      const versions = person.updates.map((view) => view.version);
      expect(versions).toEqual([...versions].sort((a, b) => a - b));
    }
  });

  it("shows who is online and lets a person come back with their token", async () => {
    const ana = await table();
    const luis = await guest(ana.code, "Luis");
    const luisId = luis.reply.participantId as string;
    await call(luis.client, "add-item", { itemId: 1, quantity: 1 });

    luis.client.close();
    await waitUntil(
      () =>
        ana.updates.at(-1)?.participants.find((p) => p.id === luisId)
          ?.online === false,
      "Luis shown as offline",
    );

    const back = await guest(
      ana.code,
      "otro nombre",
      luis.reply.token as string,
    );
    expect(back.reply.participantId).toBe(luisId);
    await waitUntil(
      () =>
        ana.updates.at(-1)?.participants.find((p) => p.id === luisId)
          ?.online === true,
      "Luis back online",
    );
    expect(ana.updates.at(-1)?.participants).toHaveLength(2);
    expect(
      ana.updates.at(-1)?.participants.find((p) => p.id === luisId)?.name,
    ).toBe("Luis");
    expect(back.reply.view.lines).toHaveLength(1);
  });

  it("sends the order once even if two people press send together", async () => {
    const ana = await table();
    const luis = await guest(ana.code, "Luis");
    await call(ana.client, "add-item", {
      itemId: 1,
      quantity: 1,
      notes: "sin gambas",
    });

    const [a, b] = await Promise.all([
      call(ana.client, "submit"),
      call(luis.client, "submit"),
    ]);

    expect([a.status, b.status].sort()).toEqual(["error", "ok"]);
    expect(createOrder).toHaveBeenCalledTimes(1);
    expect(createOrder).toHaveBeenCalledWith(1, {
      type: "dine_in",
      tableId: 5,
      items: [{ itemId: 1, quantity: 1, notes: "Ana: sin gambas" }],
    });
    await waitUntil(
      () => luis.updates.at(-1)?.status === "submitted",
      "Luis sees it was sent",
    );
    expect(luis.updates.at(-1)?.orderId).toBe(901);
    expect(
      (await call(luis.client, "add-item", { itemId: 2, quantity: 1 })).status,
    ).toBe("error");
  });

  it("stops sending updates to someone who left, and tells the rest", async () => {
    const ana = await table();
    const luis = await guest(ana.code, "Luis");
    expect((await call(luis.client, "leave")).status).toBe("ok");
    await waitUntil(
      () => ana.updates.at(-1)?.participants.length === 1,
      "Ana sees Luis leave",
    );

    const seen = luis.updates.length;
    await call(ana.client, "add-item", { itemId: 2, quantity: 1 });
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(luis.updates.length).toBe(seen);
    expect(service.trackedSockets).toBe(1);
  });

  it("does not mix two tables that share the same participant ids", async () => {
    const ana = await table("Ana");
    const eva = await table("Eva");
    await call(ana.client, "add-item", { itemId: 1, quantity: 1 });
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(eva.updates.some((view) => view.lines.length > 0)).toBe(false);
    expect(service.getView(eva.code)?.lines).toEqual([]);
  });

  it("tells everyone when a session is closed and removes them from the room", async () => {
    const ana = await table();
    const luis = await guest(ana.code, "Luis");
    const closed: unknown[] = [];
    luis.client.on("session:closed", (payload) => closed.push(payload));

    service.sweep(Date.now() + 5 * 60 * 60 * 1000);

    await waitUntil(() => closed.length === 1, "closed notice");
    expect(closed[0]).toEqual({ reason: "expired" });
    expect(service.activeSessions).toBe(0);
    expect(
      (await call(luis.client, "add-item", { itemId: 1, quantity: 1 })).status,
    ).toBe("error");
  });

  it("slows down a client that floods the server, without affecting others", async () => {
    const ana = await table();
    const luis = await guest(ana.code, "Luis");
    const flood = await Promise.all(
      Array.from({ length: RATE_LIMIT_EVENTS + 10 }, () =>
        call(luis.client, "set-quantity", { lineId: 999, quantity: 1 }),
      ),
    );
    expect(
      flood.filter((reply) => reply.message?.includes("Too many requests"))
        .length,
    ).toBeGreaterThanOrEqual(5);
    expect(
      (await call(ana.client, "add-item", { itemId: 1, quantity: 1 })).status,
    ).toBe("ok");
  });

  it("forgets every socket after everybody disconnects", async () => {
    const ana = await table();
    await Promise.all([guest(ana.code, "B"), guest(ana.code, "C")]);
    for (const client of clients.splice(0)) client.close();
    await waitUntil(
      () => service.trackedSockets === 0,
      "all sockets forgotten",
    );
    expect(
      service.getView(ana.code)?.participants.every((p) => !p.online),
    ).toBe(true);
  });
});
