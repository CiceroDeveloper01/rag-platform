import { Module } from '@nestjs/common';
import { IngestionApplicationModule } from './application/ingestion-application.module';
import { SourcesController } from './controllers/sources.controller';
import { IngestionController } from './controllers/ingestion.controller';
import { IngestionInfrastructureModule } from './infrastructure/ingestion-infrastructure.module';

@Module({
  imports: [IngestionApplicationModule, IngestionInfrastructureModule],
  controllers: [IngestionController, SourcesController],
  exports: [IngestionApplicationModule, IngestionInfrastructureModule],
})
export class IngestionModule {}
