import { Module } from '@nestjs/common';
import { SEARCH_REPOSITORY } from '../interfaces/search-repository.interface';
import { SearchPostgresRepository } from '../repositories/search-postgres.repository';

@Module({
  providers: [
    SearchPostgresRepository,
    {
      provide: SEARCH_REPOSITORY,
      useExisting: SearchPostgresRepository,
    },
  ],
  exports: [SearchPostgresRepository, SEARCH_REPOSITORY],
})
export class SearchInfrastructureModule {}
