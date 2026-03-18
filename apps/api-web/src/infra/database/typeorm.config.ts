import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';

export function createDatabaseOptions(
  configService: ConfigService,
): DataSourceOptions {
  return {
    type: 'postgres',
    host: configService.get<string>('database.host', 'localhost'),
    port: configService.get<number>('database.port', 5433),
    username: configService.get<string>('database.username', 'rag'),
    password: configService.get<string>('database.password', 'rag'),
    database: configService.get<string>('database.name', 'ragdb'),
    schema: configService.get<string>('database.schema', 'public'),
    synchronize: configService.get<boolean>('database.synchronize', false),
    logging: configService.get<boolean>('database.logging', false),
    ssl: configService.get<boolean>('database.ssl', false)
      ? { rejectUnauthorized: false }
      : false,
  };
}

export async function createDatabaseDataSource(
  configService: ConfigService,
): Promise<DataSource | null> {
  if (!configService.get<boolean>('database.enabled', false)) {
    return null;
  }

  const dataSource = new DataSource(createDatabaseOptions(configService));

  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  return dataSource;
}
