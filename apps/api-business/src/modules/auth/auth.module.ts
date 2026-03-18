import { Global, Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InternalServiceAuthGuard } from '../../common/auth/guards/internal-service-auth.guard';
import { ServiceScopesGuard } from '../../common/auth/guards/service-scopes.guard';
import { SessionOrInternalAuthGuard } from '../../common/auth/guards/session-or-internal-auth.guard';
import { InternalServiceAuthService } from '../../common/auth/services/internal-service-auth.service';
import { AuthApplicationModule } from './application/auth-application.module';
import { AuthController } from './controllers/auth.controller';
import { RolesGuard } from './guards/roles.guard';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { AuthInfrastructureModule } from './infrastructure/auth-infrastructure.module';

@Global()
@Module({
  imports: [AuthApplicationModule, AuthInfrastructureModule],
  controllers: [AuthController],
  providers: [
    SessionAuthGuard,
    SessionOrInternalAuthGuard,
    InternalServiceAuthGuard,
    ServiceScopesGuard,
    InternalServiceAuthService,
    RolesGuard,
    Reflector,
  ],
  exports: [
    AuthApplicationModule,
    AuthInfrastructureModule,
    SessionAuthGuard,
    SessionOrInternalAuthGuard,
    InternalServiceAuthGuard,
    ServiceScopesGuard,
    InternalServiceAuthService,
    RolesGuard,
  ],
})
export class AuthModule {}
