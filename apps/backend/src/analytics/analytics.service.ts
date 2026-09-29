import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../database/prisma.service";
import { AnalyticsQueryDto } from "./dto/analytics-query.dto";
import { ExportQueryDto } from "./dto/export-query.dto";
import {
  RevenueGroupBy,
  RevenueOverTimeQueryDto,
} from "./dto/revenue-over-time-query.dto";
import {
  TopItemsMetric,
  TopMenuItemsQueryDto,
} from "./dto/top-menu-items-query.dto";
import { toCsv } from "./lib/csv.util";
import { buildPdfReport } from "./lib/pdf.util";

const DEFAULT_RANGE_DAYS = 30;

export interface DateRange {
  from: Date;
  to: Date;
}

export interface SummaryReport {
  range: { from: string; to: string };
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  totalItemsSold: number;
}

export interface RevenuePoint {
  period: string;
  revenue: number;
  orders: number;
}

export interface OrdersByStatusEntry {
  statusId: number;
  status: string;
  orders: number;
}

export interface TopMenuItemEntry {
  itemId: number;
  name: string;
  quantitySold: number;
  revenue: number;
}

export interface SalesByCategoryEntry {
  categoryId: number;
  category: string;
  revenue: number;
  quantitySold: number;
}

export interface PaymentMethodEntry {
  paymentMethodId: number;
  method: string;
  amount: number;
  payments: number;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Resolves the effective [from, to] window, defaulting to the last 30 days. */
  resolveDateRange(query: AnalyticsQueryDto): DateRange {
    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from
      ? new Date(query.from)
      : new Date(to.getTime() - DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000);

    return { from, to };
  }

  async getSummary(query: AnalyticsQueryDto): Promise<SummaryReport> {
    const range = this.resolveDateRange(query);
    const orderWhere = this.buildOrderWhere(query, range);

    const [orderAggregate, itemAggregate] = await Promise.all([
      this.prisma.order.aggregate({
        where: orderWhere,
        _sum: { total: true },
        _count: { _all: true },
      }),
      this.prisma.orderDetail.aggregate({
        where: { order: orderWhere },
        _sum: { quantity: true },
      }),
    ]);

    const totalRevenue = Number(orderAggregate._sum.total ?? 0);
    const totalOrders = orderAggregate._count._all;

    return {
      range: { from: range.from.toISOString(), to: range.to.toISOString() },
      totalRevenue,
      totalOrders,
      averageTicket: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      totalItemsSold: Number(itemAggregate._sum.quantity ?? 0),
    };
  }

  async getRevenueOverTime(
    query: RevenueOverTimeQueryDto,
  ): Promise<RevenuePoint[]> {
    const range = this.resolveDateRange(query);
    const groupBy: RevenueGroupBy = query.groupBy ?? "day";

    const rows = await this.prisma.$queryRaw<
      { period: Date; revenue: Prisma.Decimal | null; orders: bigint }[]
    >(Prisma.sql`
      SELECT
        date_trunc(${groupBy}, o.order_date) AS period,
        COALESCE(SUM(o.total), 0) AS revenue,
        COUNT(*) AS orders
      FROM orders o
      WHERE o.order_date BETWEEN ${range.from} AND ${range.to}
        ${query.restaurantId ? Prisma.sql`AND o.restaurant_id = ${query.restaurantId}` : Prisma.empty}
      GROUP BY period
      ORDER BY period ASC
    `);

    return rows.map((row) => ({
      period: row.period.toISOString(),
      revenue: Number(row.revenue ?? 0),
      orders: Number(row.orders),
    }));
  }

  async getOrdersByStatus(
    query: AnalyticsQueryDto,
  ): Promise<OrdersByStatusEntry[]> {
    const range = this.resolveDateRange(query);
    const orderWhere = this.buildOrderWhere(query, range);

    const [grouped, statuses] = await Promise.all([
      this.prisma.order.groupBy({
        by: ["statusId"],
        where: orderWhere,
        _count: { _all: true },
      }),
      this.prisma.orderStatus.findMany(),
    ]);

    const statusNames = new Map(statuses.map((s) => [s.id, s.name]));

    return grouped
      .map((entry) => ({
        statusId: entry.statusId,
        status: statusNames.get(entry.statusId) ?? `#${entry.statusId}`,
        orders: entry._count._all,
      }))
      .sort((a, b) => b.orders - a.orders);
  }

  async getTopMenuItems(
    query: TopMenuItemsQueryDto,
  ): Promise<TopMenuItemEntry[]> {
    const range = this.resolveDateRange(query);
    const limit = query.limit ?? 10;
    const metric: TopItemsMetric = query.metric ?? "revenue";
    const orderColumn = metric === "quantity" ? Prisma.sql`quantity_sold` : Prisma.sql`revenue`;

    const rows = await this.prisma.$queryRaw<
      { item_id: number; name: string; quantity_sold: bigint; revenue: Prisma.Decimal | null }[]
    >(Prisma.sql`
      SELECT
        mi.item_id,
        mi.name,
        COALESCE(SUM(od.quantity), 0) AS quantity_sold,
        COALESCE(SUM(od.quantity * od.unit_price), 0) AS revenue
      FROM order_details od
      JOIN orders o ON o.order_id = od.order_id
      JOIN menu_items mi ON mi.item_id = od.item_id
      WHERE o.order_date BETWEEN ${range.from} AND ${range.to}
        ${query.restaurantId ? Prisma.sql`AND o.restaurant_id = ${query.restaurantId}` : Prisma.empty}
      GROUP BY mi.item_id, mi.name
      ORDER BY ${orderColumn} DESC
      LIMIT ${limit}
    `);

    return rows.map((row) => ({
      itemId: row.item_id,
      name: row.name,
      quantitySold: Number(row.quantity_sold),
      revenue: Number(row.revenue ?? 0),
    }));
  }

  async getSalesByCategory(
    query: AnalyticsQueryDto,
  ): Promise<SalesByCategoryEntry[]> {
    const range = this.resolveDateRange(query);

    const rows = await this.prisma.$queryRaw<
      { category_id: number; name: string; revenue: Prisma.Decimal | null; quantity_sold: bigint }[]
    >(Prisma.sql`
      SELECT
        mc.category_id,
        mc.name,
        COALESCE(SUM(od.quantity * od.unit_price), 0) AS revenue,
        COALESCE(SUM(od.quantity), 0) AS quantity_sold
      FROM order_details od
      JOIN orders o ON o.order_id = od.order_id
      JOIN menu_items mi ON mi.item_id = od.item_id
      JOIN menu_categories mc ON mc.category_id = mi.category_id
      WHERE o.order_date BETWEEN ${range.from} AND ${range.to}
        ${query.restaurantId ? Prisma.sql`AND o.restaurant_id = ${query.restaurantId}` : Prisma.empty}
      GROUP BY mc.category_id, mc.name
      ORDER BY revenue DESC
    `);

    return rows.map((row) => ({
      categoryId: row.category_id,
      category: row.name,
      revenue: Number(row.revenue ?? 0),
      quantitySold: Number(row.quantity_sold),
    }));
  }

  async getPaymentMethodsBreakdown(
    query: AnalyticsQueryDto,
  ): Promise<PaymentMethodEntry[]> {
    const range = this.resolveDateRange(query);

    const [grouped, methods] = await Promise.all([
      this.prisma.payment.groupBy({
        by: ["paymentMethodId"],
        where: {
          paymentDate: { gte: range.from, lte: range.to },
          ...(query.restaurantId
            ? { order: { restaurantId: query.restaurantId } }
            : {}),
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.paymentMethod.findMany(),
    ]);

    const methodNames = new Map(methods.map((m) => [m.id, m.name]));

    return grouped
      .map((entry) => ({
        paymentMethodId: entry.paymentMethodId,
        method: methodNames.get(entry.paymentMethodId) ?? `#${entry.paymentMethodId}`,
        amount: Number(entry._sum.amount ?? 0),
        payments: entry._count._all,
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  async exportCsv(query: ExportQueryDto): Promise<{ filename: string; content: string }> {
    switch (query.report) {
      case "summary": {
        const summary = await this.getSummary(query);
        const content = toCsv(
          [
            { metric: "Total revenue", value: summary.totalRevenue },
            { metric: "Total orders", value: summary.totalOrders },
            { metric: "Average ticket", value: summary.averageTicket.toFixed(2) },
            { metric: "Total items sold", value: summary.totalItemsSold },
          ],
          [
            { key: "metric", header: "Metric" },
            { key: "value", header: "Value" },
          ],
        );
        return { filename: "analytics-summary.csv", content };
      }
      case "revenue-over-time": {
        const rows = await this.getRevenueOverTime(query);
        const content = toCsv(rows, [
          { key: "period", header: "Period" },
          { key: "revenue", header: "Revenue" },
          { key: "orders", header: "Orders" },
        ]);
        return { filename: "analytics-revenue-over-time.csv", content };
      }
      case "orders-by-status": {
        const rows = await this.getOrdersByStatus(query);
        const content = toCsv(rows, [
          { key: "status", header: "Status" },
          { key: "orders", header: "Orders" },
        ]);
        return { filename: "analytics-orders-by-status.csv", content };
      }
      case "top-menu-items": {
        const rows = await this.getTopMenuItems(query);
        const content = toCsv(rows, [
          { key: "name", header: "Menu item" },
          { key: "quantitySold", header: "Quantity sold" },
          { key: "revenue", header: "Revenue" },
        ]);
        return { filename: "analytics-top-menu-items.csv", content };
      }
      case "sales-by-category": {
        const rows = await this.getSalesByCategory(query);
        const content = toCsv(rows, [
          { key: "category", header: "Category" },
          { key: "revenue", header: "Revenue" },
          { key: "quantitySold", header: "Quantity sold" },
        ]);
        return { filename: "analytics-sales-by-category.csv", content };
      }
      case "payment-methods": {
        const rows = await this.getPaymentMethodsBreakdown(query);
        const content = toCsv(rows, [
          { key: "method", header: "Payment method" },
          { key: "amount", header: "Amount" },
          { key: "payments", header: "Payments" },
        ]);
        return { filename: "analytics-payment-methods.csv", content };
      }
    }
  }

  async exportPdf(query: ExportQueryDto): Promise<{ filename: string; buffer: Buffer }> {
    const range = this.resolveDateRange(query);
    const subtitle = `${range.from.toDateString()} — ${range.to.toDateString()}${
      query.restaurantId ? ` · Restaurant #${query.restaurantId}` : ""
    }`;

    switch (query.report) {
      case "summary": {
        const summary = await this.getSummary(query);
        const buffer = await buildPdfReport({
          title: "Analytics summary",
          subtitle,
          kpis: [
            { label: "Revenue", value: summary.totalRevenue.toFixed(2) },
            { label: "Orders", value: String(summary.totalOrders) },
            { label: "Avg. ticket", value: summary.averageTicket.toFixed(2) },
            { label: "Items sold", value: String(summary.totalItemsSold) },
          ],
        });
        return { filename: "analytics-summary.pdf", buffer };
      }
      case "revenue-over-time": {
        const rows = await this.getRevenueOverTime(query);
        const buffer = await buildPdfReport({
          title: "Revenue over time",
          subtitle,
          table: {
            columns: [
              { header: "Period", width: 180 },
              { header: "Revenue", width: 150 },
              { header: "Orders", width: 150 },
            ],
            rows: rows.map((r) => [
              new Date(r.period).toDateString(),
              r.revenue.toFixed(2),
              String(r.orders),
            ]),
          },
        });
        return { filename: "analytics-revenue-over-time.pdf", buffer };
      }
      case "orders-by-status": {
        const rows = await this.getOrdersByStatus(query);
        const buffer = await buildPdfReport({
          title: "Orders by status",
          subtitle,
          table: {
            columns: [
              { header: "Status", width: 250 },
              { header: "Orders", width: 200 },
            ],
            rows: rows.map((r) => [r.status, String(r.orders)]),
          },
        });
        return { filename: "analytics-orders-by-status.pdf", buffer };
      }
      case "top-menu-items": {
        const rows = await this.getTopMenuItems(query);
        const buffer = await buildPdfReport({
          title: "Top menu items",
          subtitle,
          table: {
            columns: [
              { header: "Menu item", width: 220 },
              { header: "Qty sold", width: 120 },
              { header: "Revenue", width: 120 },
            ],
            rows: rows.map((r) => [r.name, String(r.quantitySold), r.revenue.toFixed(2)]),
          },
        });
        return { filename: "analytics-top-menu-items.pdf", buffer };
      }
      case "sales-by-category": {
        const rows = await this.getSalesByCategory(query);
        const buffer = await buildPdfReport({
          title: "Sales by category",
          subtitle,
          table: {
            columns: [
              { header: "Category", width: 220 },
              { header: "Revenue", width: 130 },
              { header: "Qty sold", width: 130 },
            ],
            rows: rows.map((r) => [r.category, r.revenue.toFixed(2), String(r.quantitySold)]),
          },
        });
        return { filename: "analytics-sales-by-category.pdf", buffer };
      }
      case "payment-methods": {
        const rows = await this.getPaymentMethodsBreakdown(query);
        const buffer = await buildPdfReport({
          title: "Payment methods breakdown",
          subtitle,
          table: {
            columns: [
              { header: "Method", width: 200 },
              { header: "Amount", width: 150 },
              { header: "Payments", width: 130 },
            ],
            rows: rows.map((r) => [r.method, r.amount.toFixed(2), String(r.payments)]),
          },
        });
        return { filename: "analytics-payment-methods.pdf", buffer };
      }
    }
  }

  private buildOrderWhere(
    query: AnalyticsQueryDto,
    range: DateRange,
  ): Prisma.OrderWhereInput {
    return {
      orderDate: { gte: range.from, lte: range.to },
      ...(query.restaurantId ? { restaurantId: query.restaurantId } : {}),
    };
  }
}
