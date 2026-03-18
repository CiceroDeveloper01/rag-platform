import { Global, Module } from '@nestjs/common';
import { LoggerConfigModule } from '../logger/logger.module';
import { ObservabilityModule } from '../../infra/observability/observability.module';
import { FeatureFlagsService } from './feature-flags.service';

@Global()
@Module({
  imports: [ObservabilityModule, LoggerConfigModule],
  providers: [FeatureFlagsService],
  exports: [FeatureFlagsService],
})
export class CommonFeatureFlagsModule {}
