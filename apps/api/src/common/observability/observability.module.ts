import { Global, Module, OnModuleInit } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ObservabilityModule } from '../../infra/observability/observability.module';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { MetricsInterceptor } from './interceptors/metrics.interceptor';
import { TracingInterceptor } from './interceptors/tracing.interceptor';
import { ObservabilityAccessor } from './services/observability-accessor.service';
import { ObservabilityService } from './services/observability.service';
import { ObservabilityMetricsService } from './services/metrics.service';
import { TracingService } from './services/tracing.service';

@Global()
@Module({
  imports: [ObservabilityModule],
  providers: [
    TracingService,
    ObservabilityMetricsService,
    ObservabilityService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TracingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
  exports: [TracingService, ObservabilityMetricsService, ObservabilityService],
})
export class CommonObservabilityModule implements OnModuleInit {
  constructor(private readonly observabilityService: ObservabilityService) {}

  onModuleInit(): void {
    ObservabilityAccessor.set(this.observabilityService);
  }
}
