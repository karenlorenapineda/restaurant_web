import { IsIn, IsOptional } from "class-validator";

import { AnalyticsQueryDto } from "../../analytics/dto/analytics-query.dto";

export type ActivityGroupBy = "day" | "week" | "month";

export const ACTIVITY_GROUP_BY_VALUES: ActivityGroupBy[] = [
  "day",
  "week",
  "month",
];

export class TimeSeriesQueryDto extends AnalyticsQueryDto {
  @IsOptional()
  @IsIn(ACTIVITY_GROUP_BY_VALUES)
  groupBy?: ActivityGroupBy = "day";
}
