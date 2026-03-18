import { Global, Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthApplicationModule } from './application/auth-application.module';
import { AuthController } from './controllers/auth.controller';
import { RolesGuard } from './guards/roles.guard';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { AuthInfrastructureModule } from './infrastructure/auth-infrastructure.module';

@Global()
@Module({
  imports: [AuthApplicationModule, AuthInfrastructureModule],
  controllers: [AuthController],
  providers: [SessionAuthGuard, RolesGuard, Reflector],
  exports: [
    AuthApplicationModule,
    AuthInfrastructureModule,
    SessionAuthGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
