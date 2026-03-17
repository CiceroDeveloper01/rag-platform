import { Module } from '@nestjs/common';
import { ObservabilityModule } from '../../../infra/observability/observability.module';
import { AuthInfrastructureModule } from '../infrastructure/auth-infrastructure.module';
import { AuthResponseMapper } from '../mappers/auth-response.mapper';
import { AuthService } from '../services/auth.service';

@Module({
  imports: [ObservabilityModule, AuthInfrastructureModule],
  providers: [AuthService, AuthResponseMapper],
  exports: [AuthService, AuthResponseMapper],
})
export class AuthApplicationModule {}
