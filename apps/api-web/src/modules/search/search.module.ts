import { Module } from '@nestjs/common';
import { TenantContextService } from '../../common/tenancy/tenant-context.service';
import { SearchController } from './controllers/search.controller';
import { SearchPostgresRepository } from './repositories/search-postgres.repository';
import { SearchService } from './services/search.service';
import { SEARCH_REPOSITORY } from './interfaces/search-repository.interface';

@Module({
  controllers: [SearchController],
  providers: [
    SearchService,
    TenantContextService,
    SearchPostgresRepository,
    {
      provide: SEARCH_REPOSITORY,
      useExisting: SearchPostgresRepository,
    },
  ],
  exports: [SearchService, SEARCH_REPOSITORY],
})
export class SearchModule {}
