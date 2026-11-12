import { BadRequestException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

import { SALE_ORDER_FILTER } from "../analytics/analytics.constants";
import { AnalyticsService } from "../analytics/analytics.service";
import { PrismaService } from "../database/prisma.service";
import { TimeSeriesQueryDto } from "./dto/time-series-query.dto";
import { TopUsersQueryDto } from "./dto/top-users-query.dto";
import { UserActivityExportQueryDto } from "./dto/user-activity-export-query.dto";
import {
  DORMANT_AFTER_DAYS,
  UserActivityService,
} from "./user-activity.service";

function makePrisma() {
  return {
    user: { count: jest.fn().mockResolvedValue(0) },
    chatMessage: {
      count: jest.fn().mockResolvedValue(0),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    friendship: { count: jest.fn().mockResolvedValue(0) },
    order: {
      count: jest.fn().mockResolvedValue(0),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    $queryRaw: jest.fn().mockResolvedValue([]),
  };
}

function makeService(prisma = makePrisma()) {
  return {
    prisma,
    service: new UserActivityService(
      prisma as unknown as PrismaService,
      new AnalyticsService(prisma as unknown as PrismaService),
    ),
  };
}

const sqlOf = (prisma: ReturnType<typeof makePrisma>, call = 0) =>
  prisma.$queryRaw.mock.calls[call]?.[0] as Prisma.Sql;

describe("UserActivityService", () => {
  describe("summary", () => {
    it("maps every counter and counts distinct chatters and employees", async () => {
      const { service, prisma } = makeService();
      prisma.user.count.mockImplementation(async ({ where }) => {
        if (where.isActive) return where.OR ? 7 : 40; // dormant : active
        if (where.emailVerified) return 35;
        if (where.lastLogin === null) return 6;
        if (where.lastLogin) return 12;
        return where.createdAt.gte ? 9 : 50; // new : total
      });
      prisma.chatMessage.count.mockImplementation(async ({ where }) =>
        where.isRead === false ? 14 : 80,
      );
      prisma.chatMessage.groupBy.mockResolvedValue([
        { senderId: 1 },
        { senderId: 2 },
        { senderId: 3 },
      ]);
      prisma.friendship.count.mockImplementation(async ({ where }) =>
        where.status ? 4 : 10,
      );
      prisma.order.count.mockResolvedValue(33);
      prisma.order.groupBy.mockResolvedValue([
        { employeeId: 1 },
        { employeeId: 2 },
      ]);

      const summary = await service.getSummary({
        from: "2026-08-01",
        to: "2026-08-31",
      });

      expect(summary).toMatchObject({
        totalUsers: 50,
        activeUsers: 40,
        verifiedUsers: 35,
        newUsers: 9,
        usersWithLastLoginInRange: 12,
        neverLoggedIn: 6,
        dormantUsers: 7,
        chatMessages: 80,
        unreadChatMessages: 14,
        activeChatters: 3,
        newFriendships: 10,
        approvedFriendships: 4,
        ordersHandled: 33,
        activeEmployees: 2,
      });
      expect(summary.range).toEqual({
        from: "2026-08-01T00:00:00.000Z",
        to: "2026-08-31T23:59:59.999Z",
      });
    });

    it("uses the half-open window and counts only users created before the end", async () => {
      const { service, prisma } = makeService();
      await service.getSummary({ from: "2026-08-01", to: "2026-08-31" });

      const where = prisma.chatMessage.count.mock.calls[0][0].where;
      expect(where.sentAt).toEqual({
        gte: new Date("2026-08-01T00:00:00.000Z"),
        lt: new Date("2026-09-01T00:00:00.000Z"),
      });
      expect(prisma.user.count.mock.calls[0][0].where.createdAt).toEqual({
        lt: new Date("2026-09-01T00:00:00.000Z"),
      });
    });

    it("calls a user dormant after 30 days without login, relative to the end of the range", async () => {
      const { service, prisma } = makeService();
      await service.getSummary({ from: "2026-08-01", to: "2026-08-31" });

      const dormantWhere = prisma.user.count.mock.calls
        .map((c) => c[0].where)
        .find((w) => w.OR);
      const limit = dormantWhere.OR[1].lastLogin.lt as Date;

      expect(DORMANT_AFTER_DAYS).toBe(30);
      expect(limit.toISOString()).toBe("2026-08-02T00:00:00.000Z"); // 1 Sep - 30 d
      expect(dormantWhere.isActive).toBe(true);
    });

    it("counts handled orders as sales only: cancelled ones are excluded", async () => {
      const { service, prisma } = makeService();
      await service.getSummary({ restaurantId: 4 });

      const where = prisma.order.count.mock.calls[0][0].where;
      expect(where.status).toEqual(SALE_ORDER_FILTER.status);
      expect(where.employeeId).toEqual({ not: null });
      expect(where.restaurantId).toBe(4);
    });

    it("rejects impossible dates and from > to with a 400", async () => {
      const { service } = makeService();

      await expect(
        service.getSummary({ to: "2026-02-30" }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.getSummary({ from: "2026-09-01", to: "2026-08-01" }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("raw SQL reports", () => {
    it.each(["day", "week", "month"] as const)(
      "signups-over-time groups by %s with the half-open window",
      async (groupBy) => {
        const { service, prisma } = makeService();
        prisma.$queryRaw.mockResolvedValue([
          { period: new Date("2026-08-01T00:00:00Z"), new_users: 3n },
        ]);

        const rows = await service.getSignupsOverTime({ groupBy });
        const sql = sqlOf(prisma);

        expect(rows).toEqual([
          { period: "2026-08-01T00:00:00.000Z", newUsers: 3 },
        ]);
        expect(sql.values).toContain(groupBy);
        expect(sql.text).toContain("u.created_at >=");
        expect(sql.text).toContain("u.created_at <");
        expect(sql.text).not.toContain("BETWEEN");
      },
    );

    it("chat-activity-over-time returns messages and distinct senders as numbers", async () => {
      const { service, prisma } = makeService();
      prisma.$queryRaw.mockResolvedValue([
        {
          period: new Date("2026-08-02T00:00:00Z"),
          messages: 12n,
          active_senders: 4n,
        },
      ]);

      expect(await service.getChatActivityOverTime({})).toEqual([
        { period: "2026-08-02T00:00:00.000Z", messages: 12, activeSenders: 4 },
      ]);
      expect(sqlOf(prisma).text).toContain("COUNT(DISTINCT m.sender_id)");
    });

    it("users-by-role counts accounts that exist at the end of the range", async () => {
      const { service, prisma } = makeService();
      prisma.$queryRaw.mockResolvedValue([
        { role: "waiter", users: 8n, active_users: 7n },
      ]);

      expect(await service.getUsersByRole({ to: "2026-08-31" })).toEqual([
        { role: "waiter", users: 8, activeUsers: 7 },
      ]);
      expect(sqlOf(prisma).text).toContain("u.created_at <");
      expect(sqlOf(prisma).values).toContainEqual(
        new Date("2026-09-01T00:00:00.000Z"),
      );
    });

    it("top users by messages never reads the message content", async () => {
      const { service, prisma } = makeService();
      await service.getTopActiveUsers({ metric: "messages", limit: 5 });
      const sql = sqlOf(prisma);

      expect(sql.text).not.toMatch(/m\.message\b/);
      expect(sql.text).toContain("chat_messages");
      expect(sql.values).toContain(5);
    });

    it("top users by orders applies the sale filter (cancelled excluded) and the restaurant", async () => {
      const { service, prisma } = makeService();
      await service.getTopActiveUsers({ metric: "orders", restaurantId: 3 });
      const sql = sqlOf(prisma);

      expect(sql.text).toContain("o.status::text NOT IN");
      expect(sql.text).toContain("o.restaurant_id =");
      expect(sql.values).toEqual(expect.arrayContaining(["cancelled", 3]));
    });

    it("shows the employee's name, or a masked e-mail when there is none", async () => {
      const { service, prisma } = makeService();
      prisma.$queryRaw.mockResolvedValue([
        {
          user_id: 1,
          email: "ana@x.com",
          first_name: "Ana",
          last_name: "Ruiz",
          value: 9n,
        },
        {
          user_id: 2,
          email: "pedro.gomez@x.com",
          first_name: null,
          last_name: null,
          value: 4n,
        },
      ]);

      const rows = await service.getTopActiveUsers({});

      expect(rows.map((r) => r.name)).toEqual(["Ana Ruiz", "pe***@x.com"]);
      expect(JSON.stringify(rows)).not.toContain("pedro.gomez");
      expect(rows[0]).toMatchObject({ value: 9, revenue: null });
    });
  });

  describe("insights", () => {
    it("compares with the previous period of the same length and finds the peak weekday/hour", async () => {
      const { service, prisma } = makeService();
      prisma.user.count.mockImplementation(async ({ where }) =>
        where.createdAt?.gte?.toISOString() === "2026-08-01T00:00:00.000Z"
          ? 20 // new users in the range
          : where.createdAt?.lt?.toISOString() === "2026-08-01T00:00:00.000Z"
            ? 10 // previous period (31 days before)
            : 0,
      );
      prisma.$queryRaw.mockResolvedValue([
        { dow: 5, hour: 18, messages: 30n },
        { dow: 5, hour: 20, messages: 10n },
        { dow: 2, hour: 18, messages: 25n },
      ]);

      const { insights } = await service.getInsights({
        from: "2026-08-01",
        to: "2026-08-31",
      });

      const signups = insights.find((i) => i.key === "signups_trend");
      const peak = insights.find((i) => i.key === "peak_chat_time");

      expect(signups?.data).toMatchObject({
        current: 20,
        previous: 10,
        changePercent: 100,
      });
      // Friday: 30 + 10 = 40 beats Tuesday: 25; hour 18: 30 + 25 = 55 beats hour 20: 10
      expect(peak?.data).toEqual({ weekday: "Friday", hourUtc: 18 });
    });

    it("the previous window ends exactly where the current one starts", async () => {
      const { service, prisma } = makeService();
      await service.getInsights({ from: "2026-08-01", to: "2026-08-31" });

      const previous = prisma.user.count.mock.calls
        .map((c) => c[0].where.createdAt)
        .find(
          (c) => c?.gte && c.lt?.toISOString() === "2026-08-01T00:00:00.000Z",
        );

      expect(previous.gte.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    });
  });

  describe("exports", () => {
    it("neutralises names that Excel would run as formulas", async () => {
      const { service, prisma } = makeService();
      prisma.$queryRaw.mockResolvedValue([
        {
          user_id: 1,
          email: "x@y.com",
          first_name: "=1+1",
          last_name: "",
          value: 3n,
        },
      ]);

      const { content } = await service.exportCsv({
        report: "top-active-users",
      } as UserActivityExportQueryDto);

      expect(content).toContain("'=1+1");
    });

    it.each([
      "summary",
      "signups-over-time",
      "chat-activity-over-time",
      "users-by-role",
      "top-active-users",
      "insights",
    ] as const)("%s exports to CSV and to a real PDF", async (report) => {
      const { service } = makeService();
      const query = { report } as UserActivityExportQueryDto;

      const csv = await service.exportCsv(query);
      const pdf = await service.exportPdf(query);

      expect(csv.filename).toMatch(/^user-activity-.*\.csv$/);
      expect(csv.content.length).toBeGreaterThan(0);
      expect(pdf.filename).toMatch(/^user-activity-.*\.pdf$/);
      expect(pdf.buffer.subarray(0, 5).toString()).toBe("%PDF-");
    });
  });

  describe("query validation", () => {
    const errorsFor = async (cls: new () => object, plain: object) =>
      (await validate(plainToInstance(cls, plain))).map((e) => e.property);

    it("rejects 2026-02-30, an unknown groupBy and a limit out of range", async () => {
      expect(
        await errorsFor(TimeSeriesQueryDto, { to: "2026-02-30" }),
      ).toContain("to");
      expect(
        await errorsFor(TimeSeriesQueryDto, { groupBy: "year" }),
      ).toContain("groupBy");
      expect(await errorsFor(TopUsersQueryDto, { limit: "0" })).toContain(
        "limit",
      );
      expect(await errorsFor(TopUsersQueryDto, { limit: "51" })).toContain(
        "limit",
      );
      expect(await errorsFor(TopUsersQueryDto, { metric: "salary" })).toContain(
        "metric",
      );
    });

    it("accepts valid filters and requires the report on export", async () => {
      expect(
        await errorsFor(TopUsersQueryDto, {
          limit: "10",
          metric: "orders",
          restaurantId: "2",
        }),
      ).toEqual([]);
      expect(await errorsFor(UserActivityExportQueryDto, {})).toContain(
        "report",
      );
      expect(
        await errorsFor(UserActivityExportQueryDto, { report: "insights" }),
      ).toEqual([]);
    });
  });
});
