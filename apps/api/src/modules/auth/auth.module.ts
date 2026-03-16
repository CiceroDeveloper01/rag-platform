import { Global, Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ObservabilityModule } from '../../infra/observability/observability.module';
import { AuthController } from './controllers/auth.controller';
import { AUTH_REPOSITORY } from './interfaces/auth-repository.interface';
import { AuthPostgresRepository } from './repositories/auth-postgres.repository';
import { RolesGuard } from './guards/roles.guard';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { AuthService } from './services/auth.service';

@Global()
@Module({
  imports: [ObservabilityModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthPostgresRepository,
    SessionAuthGuard,
    RolesGuard,
    Reflector,
    {
      provide: AUTH_REPOSITORY,
      useExisting: AuthPostgresRepository,
    },
  ],
  exports: [AuthService, SessionAuthGuard, RolesGuard, AUTH_REPOSITORY],
})
export class AuthModule {}
