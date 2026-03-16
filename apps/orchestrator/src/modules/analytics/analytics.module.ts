import { Module } from "@nestjs/common";
import { LoggerModule } from "@rag-platform/observability";
import { AnalyticsPublisherService } from "./analytics.service";

@Module({
  imports: [LoggerModule],
  providers: [AnalyticsPublisherService],
  exports: [AnalyticsPublisherService],
})
export class AnalyticsModule {}
