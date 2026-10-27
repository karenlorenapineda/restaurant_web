import { BadRequestException } from "@nestjs/common";
import { OrderStatus, Prisma } from "@prisma/client";

import { PrismaService } from "../database/prisma.service";
import { NON_SALE_STATUSES, SALE_ORDER_FILTER } from "./analytics.constants";
import { AnalyticsService, inclusiveEnd } from "./analytics.service";

function makePrisma() {
  return {
    order: {
      aggregate: jest.fn().mockResolvedValue({
        _sum: { total: 250.5 },
        _count: { _all: 10 },
      }),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    orderDetail: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { quantity: 42 } }),
    },
    payment: { groupBy: jest.fn().mockResolvedValue([]) },
    paymentMethod: { findMany: jest.fn().mockResolvedValue([]) },
    $queryRaw: jest.fn().mockResolvedValue([]),
  };
}

function makeService(prisma = makePrisma()) {
  return {
    prisma,
    service: new AnalyticsService(prisma as unknown as PrismaService),
  };
}

describe("AnalyticsService", () => {
  describe("summary KPIs", () => {
    it("computes the KPIs from the order/order-detail aggregates", async () => {
      const { service } = makeService();
      const summary = await service.getSummary({});

      expect(summary.totalRevenue).toBe(250.5);
      expect(summary.totalOrders).toBe(10);
      expect(summary.totalItemsSold).toBe(42);
      expect(summary.averageTicket).toBeCloseTo(25.05);
    });

    it("returns 0 average ticket when there are no orders in range", async () => {
      const prisma = makePrisma();
      prisma.order.aggregate.mockResolvedValue({
        _sum: { total: null },
        _count: { _all: 0 },
      });
      prisma.orderDetail.aggregate.mockResolvedValue({
        _sum: { quantity: null },
      });
      const { service } = makeService(prisma);
      const summary = await service.getSummary({});

      expect(summary.totalRevenue).toBe(0);
      expect(summary.averageTicket).toBe(0);
    });
  });

  describe("date range", () => {
    it("defaults to the last 30 days when no filters are given", () => {
      const { service } = makeService();
      const range = service.resolveDateRange({});
      const days =
        (range.endExclusive.getTime() - range.from.getTime()) /
        (24 * 60 * 60 * 1000);

      expect(days).toBeCloseTo(30, 0);
    });

    it("includes the WHOLE last day when `to` is a plain date", () => {
      const { service } = makeService();
      const range = service.resolveDateRange({
        from: "2026-08-01",
        to: "2026-08-31",
      });

      expect(range.from.toISOString()).toBe("2026-08-01T00:00:00.000Z");
      expect(range.endExclusive.toISOString()).toBe("2026-09-01T00:00:00.000Z");

      // An order at 23:59:59.999 on the 31st is inside [from, endExclusive)…
      const lastMoment = new Date("2026-08-31T23:59:59.999Z");
      expect(lastMoment.getTime()).toBeLessThan(range.endExclusive.getTime());
      // …and midnight of the next day is not.
      const nextDay = new Date("2026-09-01T00:00:00.000Z");
      expect(nextDay.getTime()).not.toBeLessThan(range.endExclusive.getTime());
      expect(inclusiveEnd(range).toISOString()).toBe("2026-08-31T23:59:59.999Z");
    });

    it("keeps the exact instant when `to` includes a time", () => {
      const { service } = makeService();
      const range = service.resolveDateRange({
        from: "2026-08-31T00:00:00Z",
        to: "2026-08-31T12:00:00Z",
      });

      expect(inclusiveEnd(range).toISOString()).toBe("2026-08-31T12:00:00.000Z");
    });

    it("accepts from and to on the same day (one full day)", () => {
      const { service } = makeService();
      const range = service.resolveDateRange({
        from: "2026-08-31",
        to: "2026-08-31",
      });

      expect(range.endExclusive.getTime() - range.from.getTime()).toBe(
        24 * 60 * 60 * 1000,
      );
    });

    it("rejects a `from` that is after `to`", () => {
      const { service } = makeService();

      expect(() =>
        service.resolveDateRange({ from: "2026-09-01", to: "2026-08-31" }),
      ).toThrow(BadRequestException);
    });

    it("rejects dates that do not exist", () => {
      const { service } = makeService();

      expect(() =>
        service.resolveDateRange({ from: "2026-13-45", to: "2026-08-31" }),
      ).toThrow(BadRequestException);
    });

    it("passes the half-open window to the order queries", async () => {
      const { service, prisma } = makeService();
      await service.getSummary({
        from: "2026-08-01",
        to: "2026-08-31",
        restaurantId: 7,
      });

      const where = prisma.order.aggregate.mock.calls[0][0].where;
      expect(where.orderDate).toEqual({
        gte: new Date("2026-08-01T00:00:00.000Z"),
        lt: new Date("2026-09-01T00:00:00.000Z"),
      });
      expect(where.restaurantId).toBe(7);
    });
  });

  describe("cancelled orders are not sales", () => {
    it("excludes them from revenue, order count and items sold", async () => {
      const { service, prisma } = makeService();
      await service.getSummary({});

      const orderWhere = prisma.order.aggregate.mock.calls[0][0].where;
      const detailWhere = prisma.orderDetail.aggregate.mock.calls[0][0].where;

      expect(orderWhere.status).toEqual({ notIn: ["cancelled"] });
      expect(detailWhere.order.status).toEqual({ notIn: ["cancelled"] });
    });

    it("only `cancelled` is a non-sale status of the OrderStatus enum", () => {
      expect(NON_SALE_STATUSES).toEqual([OrderStatus.cancelled]);
      expect(SALE_ORDER_FILTER.status).toEqual({ notIn: ["cancelled"] });
    });

    it("excludes payments that belong to cancelled orders", async () => {
      const { service, prisma } = makeService();
      await service.getPaymentMethodsBreakdown({ restaurantId: 3 });

      const where = prisma.payment.groupBy.mock.calls[0][0].where;
      expect(where.order.status).toEqual({ notIn: ["cancelled"] });
      expect(where.order.restaurantId).toBe(3);
      expect(where.paymentDate.lt).toBeInstanceOf(Date);
    });

    it("keeps cancelled orders in the orders-by-status breakdown", async () => {
      const { service, prisma } = makeService();
      prisma.order.groupBy.mockResolvedValue([
        { status: "completed", _count: { _all: 5 } },
        { status: "cancelled", _count: { _all: 2 } },
      ]);
      const rows = await service.getOrdersByStatus({});

      const args = prisma.order.groupBy.mock.calls[0][0];
      expect(args.by).toEqual(["status"]);
      expect(args.where.status).toBeUndefined();
      expect(rows).toEqual([
        { status: "completed", orders: 5 },
        { status: "cancelled", orders: 2 },
      ]);
    });

    it.each([
      ["revenue over time", (s: AnalyticsService) => s.getRevenueOverTime({})],
      ["top menu items", (s: AnalyticsService) => s.getTopMenuItems({})],
      ["sales by category", (s: AnalyticsService) => s.getSalesByCategory({})],
    ])(
      "applies the sale filter and the half-open window in the SQL of %s",
      async (_name, run) => {
        const { service, prisma } = makeService();
        await run(service);

        const sql = prisma.$queryRaw.mock.calls[0][0] as Prisma.Sql;

        expect(sql.text).toContain("o.status::text NOT IN");
        expect(sql.text).not.toContain("order_statuses");
        expect(sql.text).toContain("o.order_date >=");
        expect(sql.text).toContain("o.order_date <");
        expect(sql.text).not.toContain("BETWEEN");
        expect(sql.values).toEqual(expect.arrayContaining(["cancelled"]));
      },
    );
  });
});
