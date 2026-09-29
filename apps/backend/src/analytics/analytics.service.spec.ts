import { AnalyticsService } from "./analytics.service";
import { PrismaService } from "../database/prisma.service";

describe("AnalyticsService", () => {
  it("computes the summary KPIs from the order/order-detail aggregates", async () => {
    const prisma = {
      order: {
        aggregate: jest.fn().mockResolvedValue({
          _sum: { total: 250.5 },
          _count: { _all: 10 },
        }),
      },
      orderDetail: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { quantity: 42 } }),
      },
    } as unknown as PrismaService;

    const service = new AnalyticsService(prisma);
    const summary = await service.getSummary({});

    expect(summary.totalRevenue).toBe(250.5);
    expect(summary.totalOrders).toBe(10);
    expect(summary.totalItemsSold).toBe(42);
    expect(summary.averageTicket).toBeCloseTo(25.05);
  });

  it("returns 0 average ticket when there are no orders in range", async () => {
    const prisma = {
      order: {
        aggregate: jest.fn().mockResolvedValue({
          _sum: { total: null },
          _count: { _all: 0 },
        }),
      },
      orderDetail: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { quantity: null } }),
      },
    } as unknown as PrismaService;

    const service = new AnalyticsService(prisma);
    const summary = await service.getSummary({});

    expect(summary.totalRevenue).toBe(0);
    expect(summary.averageTicket).toBe(0);
  });

  it("defaults the date range to the last 30 days when no filters are given", () => {
    const service = new AnalyticsService({} as PrismaService);
    const { from, to } = service.resolveDateRange({});
    const diffDays = (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000);

    expect(diffDays).toBeCloseTo(30, 0);
  });

  it("respects an explicit from/to range", () => {
    const service = new AnalyticsService({} as PrismaService);
    const { from, to } = service.resolveDateRange({
      from: "2026-01-01",
      to: "2026-01-31",
    });

    expect(from.toISOString().slice(0, 10)).toBe("2026-01-01");
    expect(to.toISOString().slice(0, 10)).toBe("2026-01-31");
  });
});
