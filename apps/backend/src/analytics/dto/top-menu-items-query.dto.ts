import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";

import { AnalyticsQueryDto } from "./analytics-query.dto";

export type TopItemsMetric = "revenue" | "quantity";

const METRIC_VALUES: TopItemsMetric[] = ["revenue", "quantity"];

export class TopMenuItemsQueryDto extends AnalyticsQueryDto {
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
