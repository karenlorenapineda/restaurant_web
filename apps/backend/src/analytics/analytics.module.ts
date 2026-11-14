import { Module } from "@nestjs/common";

import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import { AnalyticsGateway } from "./realtime/analytics.gateway";
import { AnalyticsRealtimeService } from "./realtime/analytics-realtime.service";

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsRealtimeService, AnalyticsGateway],
})
export class AnalyticsModule {}
