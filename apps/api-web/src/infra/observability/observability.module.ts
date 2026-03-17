import { Module } from '@nestjs/common';
import { Registry } from 'prom-client';
import { MetricsController } from './metrics.controller';
import { METRICS_REGISTRY } from './metrics.constants';
import { MetricsService } from './metrics.service';

@Module({
  controllers: [MetricsController],
  providers: [
    {
      provide: METRICS_REGISTRY,
      useFactory: () => new Registry(),
    },
    MetricsService,
  ],
  exports: [MetricsService, METRICS_REGISTRY],
})
export class ObservabilityModule {}
