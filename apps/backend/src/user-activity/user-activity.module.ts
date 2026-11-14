import { Module } from "@nestjs/common";

import { AnalyticsService } from "../analytics/analytics.service";
import { UserActivityController } from "./user-activity.controller";
import { UserActivityService } from "./user-activity.service";

/**
 * AnalyticsService is provided here only for its date-range validation, so the
 * existing AnalyticsModule does not need to change.
 */
@Module({
  controllers: [UserActivityController],
  providers: [UserActivityService, AnalyticsService],
})
export class UserActivityModule {}
