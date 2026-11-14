import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";

import { AnalyticsQueryDto } from "./analytics-query.dto";
import { RevenueGroupBy } from "./revenue-over-time-query.dto";
import { TopItemsMetric } from "./top-menu-items-query.dto";

const GROUP_BY_VALUES: RevenueGroupBy[] = ["day", "week", "month"];
const METRIC_VALUES: TopItemsMetric[] = ["revenue", "quantity"];

/**
 * Filters a dashboard client sends when it subscribes to live updates.
 * Same filters as the REST endpoints (from / to / restaurantId), plus the
 * options of the charts that have them.
 */
export class AnalyticsSubscribeDto extends AnalyticsQueryDto {
  /** Granularity of the revenue-over-time line chart. */
  @IsOptional()
  @IsIn(GROUP_BY_VALUES)
  groupBy?: RevenueGroupBy = "day";

  /** How many dishes the top-menu-items chart shows. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @IsOptional()
  @IsIn(METRIC_VALUES)
  metric?: TopItemsMetric = "revenue";
}
