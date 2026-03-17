import { Module } from '@nestjs/common';
import { QUERY_REPOSITORY } from '../interfaces/query-repository.interface';
import { QueryPostgresRepository } from '../repositories/query-postgres.repository';

@Module({
  providers: [
    QueryPostgresRepository,
    {
      provide: QUERY_REPOSITORY,
      useExisting: QueryPostgresRepository,
    },
  ],
  exports: [QueryPostgresRepository, QUERY_REPOSITORY],
})
export class ChatInfrastructureModule {}
