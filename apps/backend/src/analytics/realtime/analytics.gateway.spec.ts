import { BadRequestException } from "@nestjs/common";
import { Namespace, Socket } from "socket.io";

import { AnalyticsGateway } from "./analytics.gateway";
import { AnalyticsRealtimeService } from "./analytics-realtime.service";

const snapshot = { generatedAt: "now" } as never;

function makeClient(id = "sock-1", rooms: string[] = []) {
  const set = new Set<string>([id, ...rooms]);

  return {
    id,
    rooms: set,
    join: jest.fn(async (room: string) => void set.add(room)),
    leave: jest.fn(async (room: string) => void set.delete(room)),
  } as unknown as Socket & {
    join: jest.Mock;
    leave: jest.Mock;
  };
}

function makeGateway() {
  const realtime = {
    subscribe: jest.fn().mockResolvedValue({
      room: "analytics:abc",
      snapshot,
      requestVersion: 1,
    }),
    unsubscribe: jest.fn(),
    refreshNow: jest.fn().mockResolvedValue(snapshot),
    setEmitter: jest.fn(),
    isCurrentRequest: jest.fn().mockReturnValue(true),
    refreshIntervalMs: 15000,
  };
  const gateway = new AnalyticsGateway(
    realtime as unknown as AnalyticsRealtimeService,
  );

  return { gateway, realtime };
}

describe("AnalyticsGateway", () => {
  it("subscribes, joins the room and returns the first snapshot", async () => {
    const { gateway, realtime } = makeGateway();
    const client = makeClient();

    const ack = await gateway.handleSubscribe(
      { from: "2026-08-01", to: "2026-08-31", restaurantId: "2" },
      client,
    );

    expect(ack).toEqual({
      status: "subscribed",
      room: "analytics:abc",
      refreshIntervalMs: 15000,
      snapshot,
    });
    expect(client.join).toHaveBeenCalledWith("analytics:abc");
    expect(realtime.subscribe).toHaveBeenCalledWith(
      "sock-1",
      expect.objectContaining({ restaurantId: 2 }),
    );
  });

  it("rejects 2026-02-30 and unknown fields without joining anything", async () => {
    const { gateway, realtime } = makeGateway();
    const client = makeClient();

    const badDate = await gateway.handleSubscribe({ to: "2026-02-30" }, client);
    const unknown = await gateway.handleSubscribe({ hack: 1 }, client);

    expect(badDate.status).toBe("error");
    expect(unknown.status).toBe("error");
    expect(client.join).not.toHaveBeenCalled();
    expect(realtime.subscribe).not.toHaveBeenCalled();
  });

  it("returns the service's message when it refuses (e.g. from > to)", async () => {
    const { gateway, realtime } = makeGateway();
    realtime.subscribe.mockRejectedValue(
      new BadRequestException("`from` must be before or equal to `to`"),
    );

    const ack = await gateway.handleSubscribe({}, makeClient());

    expect(ack).toEqual({
      status: "error",
      message: "`from` must be before or equal to `to`",
    });
  });

  it("does not leak internal errors", async () => {
    const { gateway, realtime } = makeGateway();
    realtime.subscribe.mockRejectedValue(new Error("password=secret"));

    const ack = await gateway.handleSubscribe({}, makeClient());

    expect(JSON.stringify(ack)).not.toContain("secret");
  });

  it("leaves the previous analytics room when the filters change", async () => {
    const { gateway } = makeGateway();
    const client = makeClient("sock-1", ["analytics:old"]);

    await gateway.handleSubscribe({}, client);

    expect(client.leave).toHaveBeenCalledWith("analytics:old");
    expect(client.join).toHaveBeenCalledWith("analytics:abc");
  });

  it("unsubscribes on request and on disconnect", async () => {
    const { gateway, realtime } = makeGateway();
    const client = makeClient("sock-1", ["analytics:abc"]);

    expect(await gateway.handleUnsubscribe(client)).toEqual({
      status: "unsubscribed",
    });
    expect(client.leave).toHaveBeenCalledWith("analytics:abc");

    gateway.handleDisconnect(client);
    expect(realtime.unsubscribe).toHaveBeenCalledTimes(2);
  });

  it("refresh answers with the snapshot, or says it is not subscribed", async () => {
    const { gateway, realtime } = makeGateway();

    expect(await gateway.handleRefresh(makeClient())).toEqual({
      status: "ok",
      snapshot,
    });

    realtime.refreshNow.mockResolvedValue(null);
    expect(await gateway.handleRefresh(makeClient())).toEqual({
      status: "not_subscribed",
    });
  });

  it("sends pushed updates only to the room of that dashboard", () => {
    const { gateway, realtime } = makeGateway();
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    gateway.server = { to } as unknown as Namespace;

    gateway.afterInit();
    const emitter = realtime.setEmitter.mock.calls[0]?.[0];
    emitter("analytics:abc", "analytics:update", snapshot);

    expect(to).toHaveBeenCalledWith("analytics:abc");
    expect(emit).toHaveBeenCalledWith("analytics:update", snapshot);
  });
  it("does not join a room when a newer subscribe request superseded it", async () => {
    const { gateway, realtime } = makeGateway();
    const client = makeClient();
    realtime.isCurrentRequest.mockReturnValue(false);

    const ack = await gateway.handleSubscribe({}, client);

    expect(ack).toEqual({
      status: "error",
      message: "Subscription request superseded",
    });
    expect(client.join).not.toHaveBeenCalled();
  });

  it("registers nothing for a socket that is already disconnected", async () => {
    const { gateway, realtime } = makeGateway();
    const client = makeClient();
    Object.defineProperty(client, "disconnected", { value: true });

    const ack = await gateway.handleSubscribe({}, client);

    expect(ack).toEqual({ status: "error", message: "Socket disconnected" });
    expect(realtime.subscribe).not.toHaveBeenCalled();
    expect(client.join).not.toHaveBeenCalled();
  });

  it("releases the subscription when the socket drops while joining the room", async () => {
    const { gateway, realtime } = makeGateway();
    const client = makeClient();
    client.join.mockImplementation(async () => {
      Object.defineProperty(client, "disconnected", { value: true });
    });

    const ack = await gateway.handleSubscribe({}, client);

    expect(ack.status).toBe("error");
    expect(realtime.unsubscribe).toHaveBeenCalledWith("sock-1");
  });

  it("leaves nothing behind after many sockets connect, subscribe and disconnect (real service)", async () => {
    const analytics = {
      resolveDateRange: jest.fn(),
      getSummary: jest.fn().mockResolvedValue({
        range: { from: "a", to: "b" },
        totalRevenue: 1,
        totalOrders: 1,
        averageTicket: 1,
        totalItemsSold: 1,
      }),
      getRevenueOverTime: jest.fn().mockResolvedValue([]),
      getOrdersByStatus: jest.fn().mockResolvedValue([]),
      getTopMenuItems: jest.fn().mockResolvedValue([]),
      getSalesByCategory: jest.fn().mockResolvedValue([]),
      getPaymentMethodsBreakdown: jest.fn().mockResolvedValue([]),
    };
    const real = new AnalyticsRealtimeService(analytics as never);
    const gateway = new AnalyticsGateway(real);

    for (let i = 0; i < 50; i++) {
      const client = makeClient(`sock-${i}`);
      await gateway.handleSubscribe({ restaurantId: String(i % 3) }, client);
      gateway.handleDisconnect(client);
    }

    expect(real.trackedClients).toBe(0);
    expect(real.activeSubscriptions).toBe(0);
    expect(real.isRunning).toBe(false);
    real.onModuleDestroy();
  });
});
