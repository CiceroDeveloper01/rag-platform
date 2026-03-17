import { Module } from '@nestjs/common';
import { SOURCE_REPOSITORY } from '../interfaces/source-repository.interface';
import { SourcePostgresRepository } from '../repositories/source-postgres.repository';

@Module({
  providers: [
    SourcePostgresRepository,
    {
      provide: SOURCE_REPOSITORY,
      useClass: SourcePostgresRepository,
    },
  ],
  exports: [SourcePostgresRepository, SOURCE_REPOSITORY],
})
export class IngestionInfrastructureModule {}
