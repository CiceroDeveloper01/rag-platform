import { Module } from '@nestjs/common';
import { TenantContextService } from '../../../common/tenancy/tenant-context.service';
import { SearchInfrastructureModule } from '../infrastructure/search-infrastructure.module';
import { SearchResponseMapper } from '../mappers/search-response.mapper';
import { SearchService } from '../services/search.service';

@Module({
  imports: [SearchInfrastructureModule],
  providers: [SearchService, SearchResponseMapper, TenantContextService],
  exports: [SearchService, SearchResponseMapper, TenantContextService],
})
export class SearchApplicationModule {}
