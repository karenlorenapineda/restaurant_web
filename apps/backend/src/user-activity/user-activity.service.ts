import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import {
  SALE_ORDER_FILTER,
  SALE_ORDER_SQL,
} from "../analytics/analytics.constants";
import { AnalyticsQueryDto } from "../analytics/dto/analytics-query.dto";
import { toCsv } from "../analytics/lib/csv.util";
import {
  AnalyticsService,
  DateRange,
  inclusiveEnd,
} from "../analytics/analytics.service";
import { buildPdfReport } from "../analytics/lib/pdf.util";
import { PrismaService } from "../database/prisma.service";
import { TimeSeriesQueryDto } from "./dto/time-series-query.dto";
import { TopUsersQueryDto } from "./dto/top-users-query.dto";
import { UserActivityExportQueryDto } from "./dto/user-activity-export-query.dto";
import { Insight, buildInsights, maskEmail } from "./lib/insights.util";

/** A user that has not logged in for this long counts as dormant. */
export const DORMANT_AFTER_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface UserActivitySummary {
  range: { from: string; to: string };
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  newUsers: number;
  /** Users whose LAST login falls in the range (the schema keeps no login history). */
  usersWithLastLoginInRange: number;
  neverLoggedIn: number;
  dormantUsers: number;
  chatMessages: number;
  unreadChatMessages: number;
  activeChatters: number;
  newFriendships: number;
  approvedFriendships: number;
  ordersHandled: number;
  activeEmployees: number;
}

export interface SignupPoint {
  period: string;
  newUsers: number;
}

export interface ChatActivityPoint {
  period: string;
  messages: number;
  activeSenders: number;
}

export interface UsersByRoleEntry {
  role: string;
  users: number;
  activeUsers: number;
}

export interface TopActiveUserEntry {
  userId: number;
  name: string;
  value: number;
  /** Only for metric=orders (sales handled, cancelled orders excluded). */
  revenue: number | null;
}

export interface InsightsReport {
  range: { from: string; to: string };
  insights: Insight[];
}

@Injectable()
export class UserActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analytics: AnalyticsService,
  ) {}

  /** Same date rules as the sales analytics (calendar-valid, half-open UTC window). */
  resolveDateRange(query: AnalyticsQueryDto): DateRange {
    return this.analytics.resolveDateRange(query);
  }

  async getSummary(query: AnalyticsQueryDto): Promise<UserActivitySummary> {
    const range = this.resolveDateRange(query);
    const inRange = { gte: range.from, lt: range.endExclusive };
    const createdBeforeEnd = { createdAt: { lt: range.endExclusive } };
    const dormantBefore = new Date(
      range.endExclusive.getTime() - DORMANT_AFTER_DAYS * DAY_MS,
    );
    const orderWhere = this.handledOrdersWhere(query, range);

    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      newUsers,
      usersWithLastLoginInRange,
      neverLoggedIn,
      dormantUsers,
      chatMessages,
      unreadChatMessages,
      chatters,
      newFriendships,
      approvedFriendships,
      ordersHandled,
      employees,
    ] = await Promise.all([
      this.prisma.user.count({ where: createdBeforeEnd }),
      this.prisma.user.count({
        where: { ...createdBeforeEnd, isActive: true },
      }),
      this.prisma.user.count({
        where: { ...createdBeforeEnd, emailVerified: true },
      }),
      this.prisma.user.count({ where: { createdAt: inRange } }),
      this.prisma.user.count({ where: { lastLogin: inRange } }),
      this.prisma.user.count({
        where: { ...createdBeforeEnd, lastLogin: null },
      }),
      this.prisma.user.count({
        where: {
          ...createdBeforeEnd,
          isActive: true,
          OR: [{ lastLogin: null }, { lastLogin: { lt: dormantBefore } }],
        },
      }),
      this.prisma.chatMessage.count({ where: { sentAt: inRange } }),
      this.prisma.chatMessage.count({
        where: { sentAt: inRange, isRead: false },
      }),
      this.prisma.chatMessage.groupBy({
        by: ["senderId"],
        where: { sentAt: inRange },
      }),
      this.prisma.friendship.count({ where: { createdAt: inRange } }),
      this.prisma.friendship.count({
        where: { createdAt: inRange, status: "approved" },
      }),
      this.prisma.order.count({ where: orderWhere }),
      this.prisma.order.groupBy({ by: ["employeeId"], where: orderWhere }),
    ]);

    return {
      range: {
        from: range.from.toISOString(),
        to: inclusiveEnd(range).toISOString(),
      },
      totalUsers,
      activeUsers,
      verifiedUsers,
      newUsers,
      usersWithLastLoginInRange,
      neverLoggedIn,
      dormantUsers,
      chatMessages,
      unreadChatMessages,
      activeChatters: chatters.length,
      newFriendships,
      approvedFriendships,
      ordersHandled,
      activeEmployees: employees.length,
    };
  }

  async getSignupsOverTime(query: TimeSeriesQueryDto): Promise<SignupPoint[]> {
    const range = this.resolveDateRange(query);
    const groupBy = query.groupBy ?? "day";

    const rows = await this.prisma.$queryRaw<
      { period: Date; new_users: bigint }[]
    >(Prisma.sql`
      SELECT date_trunc(${groupBy}, u.created_at) AS period, COUNT(*) AS new_users
      FROM users u
      WHERE u.created_at >= ${range.from} AND u.created_at < ${range.endExclusive}
      GROUP BY period
      ORDER BY period ASC
    `);

    return rows.map((row) => ({
      period: row.period.toISOString(),
      newUsers: Number(row.new_users),
    }));
  }

  async getChatActivityOverTime(
    query: TimeSeriesQueryDto,
  ): Promise<ChatActivityPoint[]> {
    const range = this.resolveDateRange(query);
    const groupBy = query.groupBy ?? "day";

    const rows = await this.prisma.$queryRaw<
      { period: Date; messages: bigint; active_senders: bigint }[]
    >(Prisma.sql`
      SELECT
        date_trunc(${groupBy}, m.sent_at) AS period,
        COUNT(*) AS messages,
        COUNT(DISTINCT m.sender_id) AS active_senders
      FROM chat_messages m
      WHERE m.sent_at >= ${range.from} AND m.sent_at < ${range.endExclusive}
      GROUP BY period
      ORDER BY period ASC
    `);

    return rows.map((row) => ({
      period: row.period.toISOString(),
      messages: Number(row.messages),
      activeSenders: Number(row.active_senders),
    }));
  }

  /** Accounts that exist at the end of the range, by role. */
  async getUsersByRole(query: AnalyticsQueryDto): Promise<UsersByRoleEntry[]> {
    const range = this.resolveDateRange(query);

    const rows = await this.prisma.$queryRaw<
      { role: string; users: bigint; active_users: bigint }[]
    >(Prisma.sql`
      SELECT
        r.role_name AS role,
        COUNT(*) AS users,
        COUNT(*) FILTER (WHERE u.is_active) AS active_users
      FROM users u
      JOIN user_roles r ON r.role_id = u.role_id
      WHERE u.created_at < ${range.endExclusive}
      GROUP BY r.role_name
      ORDER BY users DESC, r.role_name ASC
    `);

    return rows.map((row) => ({
      role: row.role,
      users: Number(row.users),
      activeUsers: Number(row.active_users),
    }));
  }

  async getTopActiveUsers(
    query: TopUsersQueryDto,
  ): Promise<TopActiveUserEntry[]> {
    const range = this.resolveDateRange(query);
    const limit = query.limit ?? 10;
    const metric = query.metric ?? "messages";

    type Row = {
      user_id: number;
      email: string;
      first_name: string | null;
      last_name: string | null;
      value: bigint;
      revenue?: Prisma.Decimal | null;
    };

    const rows =
      metric === "orders"
        ? await this.prisma.$queryRaw<Row[]>(Prisma.sql`
            SELECT
              u.user_id AS user_id, u.email AS email,
              e.first_name AS first_name, e.last_name AS last_name,
              COUNT(*) AS value, COALESCE(SUM(o.total), 0) AS revenue
            FROM orders o
            JOIN employees e ON e.employee_id = o.employee_id
            JOIN users u ON u.user_id = e.user_id
            WHERE o.order_date >= ${range.from} AND o.order_date < ${range.endExclusive}
              AND ${SALE_ORDER_SQL}
              ${query.restaurantId ? Prisma.sql`AND o.restaurant_id = ${query.restaurantId}` : Prisma.empty}
            GROUP BY u.user_id, u.email, e.first_name, e.last_name
            ORDER BY value DESC, u.user_id ASC
            LIMIT ${limit}
          `)
        : await this.prisma.$queryRaw<Row[]>(Prisma.sql`
            SELECT
              u.user_id AS user_id, u.email AS email,
              e.first_name AS first_name, e.last_name AS last_name,
              COUNT(*) AS value
            FROM chat_messages m
            JOIN users u ON u.user_id = m.sender_id
            LEFT JOIN employees e ON e.user_id = u.user_id
            WHERE m.sent_at >= ${range.from} AND m.sent_at < ${range.endExclusive}
              ${query.restaurantId ? Prisma.sql`AND e.restaurant_id = ${query.restaurantId}` : Prisma.empty}
            GROUP BY u.user_id, u.email, e.first_name, e.last_name
            ORDER BY value DESC, u.user_id ASC
            LIMIT ${limit}
          `);

    return rows.map((row) => ({
      userId: row.user_id,
      name: this.displayName(row),
      value: Number(row.value),
      revenue: metric === "orders" ? Number(row.revenue ?? 0) : null,
    }));
  }

  async getInsights(query: AnalyticsQueryDto): Promise<InsightsReport> {
    const range = this.resolveDateRange(query);
    const spanMs = range.endExclusive.getTime() - range.from.getTime();
    const previous = {
      gte: new Date(range.from.getTime() - spanMs),
      lt: range.from,
    };

    const [summary, previousNewUsers, previousChatMessages, peakRows] =
      await Promise.all([
        this.getSummary(query),
        this.prisma.user.count({ where: { createdAt: previous } }),
        this.prisma.chatMessage.count({ where: { sentAt: previous } }),
        this.prisma.$queryRaw<
          { dow: number; hour: number; messages: bigint }[]
        >(Prisma.sql`
          SELECT
            EXTRACT(DOW FROM m.sent_at)::int AS dow,
            EXTRACT(HOUR FROM m.sent_at)::int AS hour,
            COUNT(*) AS messages
          FROM chat_messages m
          WHERE m.sent_at >= ${range.from} AND m.sent_at < ${range.endExclusive}
          GROUP BY 1, 2
        `),
      ]);

    const byWeekday = new Map<number, number>();
    const byHour = new Map<number, number>();
    for (const row of peakRows) {
      const count = Number(row.messages);
      byWeekday.set(row.dow, (byWeekday.get(row.dow) ?? 0) + count);
      byHour.set(row.hour, (byHour.get(row.hour) ?? 0) + count);
    }

    return {
      range: summary.range,
      insights: buildInsights({
        newUsers: summary.newUsers,
        previousNewUsers,
        chatMessages: summary.chatMessages,
        previousChatMessages,
        activeUsers: summary.activeUsers,
        dormantUsers: summary.dormantUsers,
        unreadMessages: summary.unreadChatMessages,
        peakWeekday: this.peakKey(byWeekday),
        peakHour: this.peakKey(byHour),
      }),
    };
  }

  async exportCsv(
    query: UserActivityExportQueryDto,
  ): Promise<{ filename: string; content: string }> {
    switch (query.report) {
      case "summary": {
        const s = await this.getSummary(query);
        const content = toCsv(this.summaryRows(s), [
          { key: "metric", header: "Metric" },
          { key: "value", header: "Value" },
        ]);
        return { filename: "user-activity-summary.csv", content };
      }
      case "signups-over-time": {
        const rows = await this.getSignupsOverTime(query);
        return {
          filename: "user-activity-signups-over-time.csv",
          content: toCsv(rows, [
            { key: "period", header: "Period" },
            { key: "newUsers", header: "New users" },
          ]),
        };
      }
      case "chat-activity-over-time": {
        const rows = await this.getChatActivityOverTime(query);
        return {
          filename: "user-activity-chat-over-time.csv",
          content: toCsv(rows, [
            { key: "period", header: "Period" },
            { key: "messages", header: "Messages" },
            { key: "activeSenders", header: "Active senders" },
          ]),
        };
      }
      case "users-by-role": {
        const rows = await this.getUsersByRole(query);
        return {
          filename: "user-activity-users-by-role.csv",
          content: toCsv(rows, [
            { key: "role", header: "Role" },
            { key: "users", header: "Users" },
            { key: "activeUsers", header: "Active users" },
          ]),
        };
      }
      case "top-active-users": {
        const rows = await this.getTopActiveUsers(query);
        return {
          filename: "user-activity-top-users.csv",
          content: toCsv(rows, [
            { key: "name", header: "User" },
            {
              key: "value",
              header:
                query.metric === "orders" ? "Orders handled" : "Messages sent",
            },
            { key: "revenue", header: "Revenue" },
          ]),
        };
      }
      case "insights": {
        const { insights } = await this.getInsights(query);
        return {
          filename: "user-activity-insights.csv",
          content: toCsv(insights, [
            { key: "key", header: "Insight" },
            { key: "level", header: "Level" },
            { key: "message", header: "Message" },
          ]),
        };
      }
    }
  }

  async exportPdf(
    query: UserActivityExportQueryDto,
  ): Promise<{ filename: string; buffer: Buffer }> {
    const range = this.resolveDateRange(query);
    const subtitle = `${range.from.toISOString().slice(0, 10)} — ${inclusiveEnd(
      range,
    )
      .toISOString()
      .slice(
        0,
        10,
      )}${query.restaurantId ? ` · Restaurant #${query.restaurantId}` : ""}`;
    const day = (iso: string) => iso.slice(0, 10);

    switch (query.report) {
      case "summary": {
        const s = await this.getSummary(query);
        const buffer = await buildPdfReport({
          title: "User activity summary",
          subtitle,
          kpis: [
            { label: "New users", value: String(s.newUsers) },
            { label: "Active users", value: String(s.activeUsers) },
            { label: "Chat messages", value: String(s.chatMessages) },
            { label: "Orders handled", value: String(s.ordersHandled) },
          ],
          table: {
            columns: [
              { header: "Metric", width: 300 },
              { header: "Value", width: 180 },
            ],
            rows: this.summaryRows(s).map((r) => [r.metric, String(r.value)]),
          },
        });
        return { filename: "user-activity-summary.pdf", buffer };
      }
      case "signups-over-time": {
        const rows = await this.getSignupsOverTime(query);
        const buffer = await buildPdfReport({
          title: "New users over time",
          subtitle,
          table: {
            columns: [
              { header: "Period", width: 240 },
              { header: "New users", width: 240 },
            ],
            rows: rows.map((r) => [day(r.period), String(r.newUsers)]),
          },
        });
        return { filename: "user-activity-signups-over-time.pdf", buffer };
      }
      case "chat-activity-over-time": {
        const rows = await this.getChatActivityOverTime(query);
        const buffer = await buildPdfReport({
          title: "Chat activity over time",
          subtitle,
          table: {
            columns: [
              { header: "Period", width: 180 },
              { header: "Messages", width: 150 },
              { header: "Active senders", width: 150 },
            ],
            rows: rows.map((r) => [
              day(r.period),
              String(r.messages),
              String(r.activeSenders),
            ]),
          },
        });
        return { filename: "user-activity-chat-over-time.pdf", buffer };
      }
      case "users-by-role": {
        const rows = await this.getUsersByRole(query);
        const buffer = await buildPdfReport({
          title: "Users by role",
          subtitle,
          table: {
            columns: [
              { header: "Role", width: 220 },
              { header: "Users", width: 130 },
              { header: "Active", width: 130 },
            ],
            rows: rows.map((r) => [
              r.role,
              String(r.users),
              String(r.activeUsers),
            ]),
          },
        });
        return { filename: "user-activity-users-by-role.pdf", buffer };
      }
      case "top-active-users": {
        const rows = await this.getTopActiveUsers(query);
        const buffer = await buildPdfReport({
          title:
            query.metric === "orders"
              ? "Top employees by orders handled"
              : "Top users by messages sent",
          subtitle,
          table: {
            columns: [
              { header: "User", width: 240 },
              {
                header: query.metric === "orders" ? "Orders" : "Messages",
                width: 120,
              },
              { header: "Revenue", width: 120 },
            ],
            rows: rows.map((r) => [
              r.name,
              String(r.value),
              r.revenue === null ? "-" : r.revenue.toFixed(2),
            ]),
          },
        });
        return { filename: "user-activity-top-users.pdf", buffer };
      }
      case "insights": {
        const { insights } = await this.getInsights(query);
        const buffer = await buildPdfReport({
          title: "User activity insights",
          subtitle,
          table: {
            columns: [
              { header: "Level", width: 70 },
              { header: "Insight", width: 410 },
            ],
            rows: insights.map((i) => [i.level, i.message]),
          },
        });
        return { filename: "user-activity-insights.pdf", buffer };
      }
    }
  }

  /** Orders that an employee handled and that count as a sale. */
  private handledOrdersWhere(
    query: AnalyticsQueryDto,
    range: DateRange,
  ): Prisma.OrderWhereInput {
    return {
      ...SALE_ORDER_FILTER,
      employeeId: { not: null },
      orderDate: { gte: range.from, lt: range.endExclusive },
      ...(query.restaurantId ? { restaurantId: query.restaurantId } : {}),
    };
  }

  private summaryRows(s: UserActivitySummary) {
    return [
      { metric: "Total users", value: s.totalUsers },
      { metric: "Active users", value: s.activeUsers },
      { metric: "Verified users", value: s.verifiedUsers },
      { metric: "New users in range", value: s.newUsers },
      {
        metric: "Users whose last login is in range",
        value: s.usersWithLastLoginInRange,
      },
      { metric: "Never logged in", value: s.neverLoggedIn },
      {
        metric: `Dormant users (${DORMANT_AFTER_DAYS}+ days)`,
        value: s.dormantUsers,
      },
      { metric: "Chat messages", value: s.chatMessages },
      { metric: "Unread chat messages", value: s.unreadChatMessages },
      { metric: "Active chatters", value: s.activeChatters },
      { metric: "New friendship requests", value: s.newFriendships },
      { metric: "Approved friendships", value: s.approvedFriendships },
      { metric: "Orders handled", value: s.ordersHandled },
      { metric: "Active employees", value: s.activeEmployees },
    ];
  }

  private displayName(row: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  }): string {
    const full = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim();

    return full.length > 0 ? full : maskEmail(row.email);
  }

  /** Key with the highest count (lowest key on a tie); null when empty. */
  private peakKey(counts: Map<number, number>): number | null {
    let best: number | null = null;
    let bestCount = -1;

    for (const [key, count] of [...counts.entries()].sort(
      (a, b) => a[0] - b[0],
    )) {
      if (count > bestCount) {
        best = key;
        bestCount = count;
      }
    }

    return best;
  }
}
