import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";

import { AnalyticsQueryDto } from "./analytics-query.dto";
import { RevenueGroupBy } from "./revenue-over-time-query.dto";
import { TopItemsMetric } from "./top-menu-items-query.dto";

export type AnalyticsReport =
  | "summary"
  | "revenue-over-time"
  | "orders-by-status"
  | "top-menu-items"
  | "sales-by-category"
  | "payment-methods";

const REPORT_VALUES: AnalyticsReport[] = [
  "summary",
  "revenue-over-time",
  "orders-by-status",
  "top-menu-items",
  "sales-by-category",
  "payment-methods",
];

const GROUP_BY_VALUES: RevenueGroupBy[] = ["day", "week", "month"];
const METRIC_VALUES: TopItemsMetric[] = ["revenue", "quantity"];

export class ExportQueryDto extends AnalyticsQueryDto {
  @IsIn(REPORT_VALUES)
  report!: AnalyticsReport;

  // Only used when report = "revenue-over-time"
  @IsOptional()
  @IsIn(GROUP_BY_VALUES)
  groupBy?: RevenueGroupBy = "day";

  // Only used when report = "top-menu-items"
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
