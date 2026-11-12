import { Controller, Get, Query, Res } from "@nestjs/common";
import type { Response } from "express";

import { AnalyticsQueryDto } from "../analytics/dto/analytics-query.dto";
import { TimeSeriesQueryDto } from "./dto/time-series-query.dto";
import { TopUsersQueryDto } from "./dto/top-users-query.dto";
import { UserActivityExportQueryDto } from "./dto/user-activity-export-query.dto";
import { UserActivityService } from "./user-activity.service";

@Controller("user-activity")
export class UserActivityController {
  constructor(private readonly service: UserActivityService) {}

  @Get("summary")
  getSummary(@Query() query: AnalyticsQueryDto) {
    return this.service.getSummary(query);
  }

  @Get("signups-over-time")
  getSignupsOverTime(@Query() query: TimeSeriesQueryDto) {
    return this.service.getSignupsOverTime(query);
  }

  @Get("chat-activity-over-time")
  getChatActivityOverTime(@Query() query: TimeSeriesQueryDto) {
    return this.service.getChatActivityOverTime(query);
  }

  @Get("users-by-role")
  getUsersByRole(@Query() query: AnalyticsQueryDto) {
    return this.service.getUsersByRole(query);
  }

  @Get("top-active-users")
  getTopActiveUsers(@Query() query: TopUsersQueryDto) {
    return this.service.getTopActiveUsers(query);
  }

  @Get("insights")
  getInsights(@Query() query: AnalyticsQueryDto) {
    return this.service.getInsights(query);
  }

  @Get("export/csv")
  async exportCsv(
    @Query() query: UserActivityExportQueryDto,
    @Res() res: Response,
  ) {
    const { filename, content } = await this.service.exportCsv(query);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(content);
  }

  @Get("export/pdf")
  async exportPdf(
    @Query() query: UserActivityExportQueryDto,
    @Res() res: Response,
  ) {
    const { filename, buffer } = await this.service.exportPdf(query);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
