import { IsIn, IsOptional } from "class-validator";

import { AnalyticsQueryDto } from "./analytics-query.dto";

export type RevenueGroupBy = "day" | "week" | "month";

const GROUP_BY_VALUES: RevenueGroupBy[] = ["day", "week", "month"];

export class RevenueOverTimeQueryDto extends AnalyticsQueryDto {
  @IsOptional()
  @IsIn(GROUP_BY_VALUES)
  groupBy?: RevenueGroupBy = "day";
}
