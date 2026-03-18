import { Global, Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InternalServiceTokenService } from '../../common/auth/services/internal-service-token.service';
import { UserAccessTokenService } from '../../common/auth/services/user-access-token.service';
import { ObservabilityModule } from '../../infra/observability/observability.module';
import { AuthController } from './controllers/auth.controller';
import { AUTH_REPOSITORY } from './interfaces/auth-repository.interface';
import { AuthPostgresRepository } from './repositories/auth-postgres.repository';
import { RolesGuard } from './guards/roles.guard';
import { ScopesGuard } from './guards/scopes.guard';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { AuthService } from './services/auth.service';

@Global()
@Module({
  imports: [ObservabilityModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserAccessTokenService,
    InternalServiceTokenService,
    AuthPostgresRepository,
    SessionAuthGuard,
    RolesGuard,
    ScopesGuard,
    Reflector,
    {
      provide: AUTH_REPOSITORY,
      useExisting: AuthPostgresRepository,
    },
  ],
  exports: [
    AuthService,
    UserAccessTokenService,
    InternalServiceTokenService,
    SessionAuthGuard,
    RolesGuard,
    ScopesGuard,
    AUTH_REPOSITORY,
  ],
})
export class AuthModule {}
