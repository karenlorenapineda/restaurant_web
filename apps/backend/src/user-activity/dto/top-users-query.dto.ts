import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";

import { AnalyticsQueryDto } from "../../analytics/dto/analytics-query.dto";

export type TopUsersMetric = "messages" | "orders";

export const TOP_USERS_METRIC_VALUES: TopUsersMetric[] = ["messages", "orders"];

export class TopUsersQueryDto extends AnalyticsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  /** messages = chat messages sent; orders = orders handled by an employee. */
  @IsOptional()
  @IsIn(TOP_USERS_METRIC_VALUES)
  metric?: TopUsersMetric = "messages";
}
