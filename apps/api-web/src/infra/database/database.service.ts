import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DATABASE_DATA_SOURCE } from './database.constants';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  constructor(
    @Inject(DATABASE_DATA_SOURCE)
    private readonly dataSource: DataSource | null,
  ) {}

  get isEnabled(): boolean {
    return this.dataSource !== null;
  }

  async query<TResult>(
    sql: string,
    parameters: unknown[] = [],
  ): Promise<TResult[]> {
    if (!this.dataSource) {
      throw new Error(
        'Database connection is disabled. Set DATABASE_ENABLED=true to enable it.',
      );
    }

    return this.dataSource.query(sql, parameters) as Promise<TResult[]>;
  }

  async healthCheck(): Promise<'up' | 'disabled'> {
    if (!this.dataSource) {
      return 'disabled';
    }

    await this.dataSource.query('SELECT 1');
    return 'up';
  }

  async transaction<T>(
    callback: (databaseService: DatabaseService) => Promise<T>,
  ): Promise<T> {
    if (!this.dataSource) {
      throw new Error(
        'Database connection is disabled. Set DATABASE_ENABLED=true to enable it.',
      );
    }

    return this.dataSource.transaction(async (entityManager) => {
      const transactionalService = new DatabaseService({
        ...this.dataSource,
        query: (sql: string, parameters?: unknown[]) =>
          entityManager.query(sql, parameters),
      } as DataSource);

      return callback(transactionalService);
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.dataSource?.isInitialized) {
      await this.dataSource.destroy();
    }
  }
}
