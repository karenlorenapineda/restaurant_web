import { Controller, Get, Query, Res } from "@nestjs/common";
import type { Response } from "express";

import { AnalyticsService } from "./analytics.service";
import { AnalyticsQueryDto } from "./dto/analytics-query.dto";
import { ExportQueryDto } from "./dto/export-query.dto";
import { RevenueOverTimeQueryDto } from "./dto/revenue-over-time-query.dto";
import { TopMenuItemsQueryDto } from "./dto/top-menu-items-query.dto";

@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("summary")
  getSummary(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getSummary(query);
  }

  @Get("revenue-over-time")
  getRevenueOverTime(@Query() query: RevenueOverTimeQueryDto) {
    return this.analyticsService.getRevenueOverTime(query);
  }

  @Get("orders-by-status")
  getOrdersByStatus(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getOrdersByStatus(query);
  }

  @Get("top-menu-items")
  getTopMenuItems(@Query() query: TopMenuItemsQueryDto) {
    return this.analyticsService.getTopMenuItems(query);
  }

  @Get("sales-by-category")
  getSalesByCategory(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getSalesByCategory(query);
  }

  @Get("payment-methods")
  getPaymentMethodsBreakdown(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getPaymentMethodsBreakdown(query);
  }

  @Get("export/csv")
  async exportCsv(@Query() query: ExportQueryDto, @Res() res: Response) {
    const { filename, content } = await this.analyticsService.exportCsv(query);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(content);
  }

  @Get("export/pdf")
  async exportPdf(@Query() query: ExportQueryDto, @Res() res: Response) {
    const { filename, buffer } = await this.analyticsService.exportPdf(query);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
