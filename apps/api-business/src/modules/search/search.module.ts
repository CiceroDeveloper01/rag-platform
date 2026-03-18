import { Module } from '@nestjs/common';
import { SearchApplicationModule } from './application/search-application.module';
import { SearchController } from './controllers/search.controller';
import { SearchInfrastructureModule } from './infrastructure/search-infrastructure.module';

@Module({
  imports: [SearchApplicationModule, SearchInfrastructureModule],
  controllers: [SearchController],
  exports: [SearchApplicationModule, SearchInfrastructureModule],
})
export class SearchModule {}
