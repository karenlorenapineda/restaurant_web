import { Type } from "class-transformer";
import { IsDateString, IsInt, IsOptional, Min } from "class-validator";

/**
 * Common date-range + restaurant filter shared by every analytics endpoint.
 * `from`/`to` are inclusive ISO-8601 dates. When omitted, the service
 * defaults to the last 30 days (see AnalyticsService.resolveDateRange).
 */
export class AnalyticsQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  restaurantId?: number;
}
