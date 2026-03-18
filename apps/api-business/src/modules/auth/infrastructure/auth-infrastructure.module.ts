import { Module } from '@nestjs/common';
import { AUTH_REPOSITORY } from '../interfaces/auth-repository.interface';
import { AuthPostgresRepository } from '../repositories/auth-postgres.repository';

@Module({
  providers: [
    AuthPostgresRepository,
    {
      provide: AUTH_REPOSITORY,
      useExisting: AuthPostgresRepository,
    },
  ],
  exports: [AuthPostgresRepository, AUTH_REPOSITORY],
})
export class AuthInfrastructureModule {}
