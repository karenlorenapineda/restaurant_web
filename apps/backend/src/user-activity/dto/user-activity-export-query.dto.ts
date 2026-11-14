import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";

import { AnalyticsQueryDto } from "../../analytics/dto/analytics-query.dto";
import {
  ACTIVITY_GROUP_BY_VALUES,
  ActivityGroupBy,
} from "./time-series-query.dto";
import { TOP_USERS_METRIC_VALUES, TopUsersMetric } from "./top-users-query.dto";

export type UserActivityReport =
  | "summary"
  | "signups-over-time"
  | "chat-activity-over-time"
  | "users-by-role"
  | "top-active-users"
  | "insights";

export const USER_ACTIVITY_REPORTS: UserActivityReport[] = [
  "summary",
  "signups-over-time",
  "chat-activity-over-time",
  "users-by-role",
  "top-active-users",
  "insights",
];

export class UserActivityExportQueryDto extends AnalyticsQueryDto {
  @IsIn(USER_ACTIVITY_REPORTS)
  report!: UserActivityReport;

  // Only used by the two "over-time" reports
  @IsOptional()
  @IsIn(ACTIVITY_GROUP_BY_VALUES)
  groupBy?: ActivityGroupBy = "day";

  // Only used by "top-active-users"
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @IsOptional()
  @IsIn(TOP_USERS_METRIC_VALUES)
  metric?: TopUsersMetric = "messages";
}
