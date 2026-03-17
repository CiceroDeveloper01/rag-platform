import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DATABASE_DATA_SOURCE } from './database.constants';
import { DatabaseService } from './database.service';
import { createDatabaseDataSource } from './typeorm.config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DATABASE_DATA_SOURCE,
      inject: [ConfigService],
      useFactory: createDatabaseDataSource,
    },
    DatabaseService,
  ],
  exports: [DATABASE_DATA_SOURCE, DatabaseService],
})
export class DatabaseModule {}
