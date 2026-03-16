import { Inject, Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REDIS_CACHE_CLIENT } from '../../common/cache/cache.constants';
import { EMAIL_PROVIDER } from '../../common/email/email.constants';
import type { EmailProvider } from '../../common/email/interfaces/email-provider.interface';
import { FILE_STORAGE } from '../../common/storage/storage.constants';
import type { FileStorage } from '../../common/storage/interfaces/file-storage.interface';
import { DatabaseService } from '../../infra/database/database.service';
import { SEARCH_REPOSITORY } from '../search/interfaces/search-repository.interface';
import type { SearchRepositoryInterface } from '../search/interfaces/search-repository.interface';
import type { RedisHealthClient } from './interfaces';

@Injectable()
export class HealthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
    @Optional()
    @Inject(REDIS_CACHE_CLIENT)
    private readonly redisClient?: RedisHealthClient | null,
    @Inject(FILE_STORAGE)
    private readonly fileStorage?: FileStorage,
    @Inject(EMAIL_PROVIDER)
    private readonly emailProvider?: EmailProvider,
    @Inject(SEARCH_REPOSITORY)
    private readonly searchRepository?: SearchRepositoryInterface,
  ) {}

  async check() {
    const readiness = await this.checkReadiness();

    return {
      status: readiness.status,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: this.configService.get<string>('app.version', '0.0.1'),
      database: readiness.checks.database,
      readiness: readiness.checks,
    };
  }

  checkLiveness() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: this.configService.get<string>('app.version', '0.0.1'),
    };
  }

  async checkReadiness() {
    const [database, redis, storage, rag, email] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkStorage(),
      this.checkRag(),
      this.checkEmail(),
    ]);

    const criticalFailures = [
      database === 'down',
      redis.status === 'down',
      storage.status === 'down',
      rag.status === 'down',
    ].some(Boolean);

    return {
      status: criticalFailures ? 'degraded' : 'ok',
      timestamp: new Date().toISOString(),
      checks: {
        database,
        redis: redis.status,
        storage: storage.status,
        rag: rag.status,
        email: email.status,
      },
    };
  }

  async checkDatabase() {
    try {
      return await this.databaseService.healthCheck();
    } catch {
      return 'down';
    }
  }

  async checkRedis() {
    if (!this.redisClient) {
      return {
        status: 'disabled',
      };
    }

    try {
      const response = await this.redisClient.ping();

      return {
        status: response === 'PONG' ? 'up' : 'degraded',
      };
    } catch {
      return {
        status: 'down',
      };
    }
  }

  async checkStorage() {
    if (!this.fileStorage) {
      return {
        status: 'disabled',
        provider: this.configService.get<string>('storage.provider', 'local'),
      };
    }

    const provider = this.configService.get<string>(
      'storage.provider',
      'local',
    );
    const healthKey = `healthchecks/${Date.now()}-storage-check.txt`;

    try {
      await this.fileStorage.upload(Buffer.from('ok', 'utf-8'), healthKey, {
        purpose: 'healthcheck',
      });
      const exists = await this.fileStorage.exists(healthKey);
      await this.fileStorage.delete(healthKey);

      return {
        status: exists ? 'up' : 'degraded',
        provider,
      };
    } catch {
      return {
        status: 'down',
        provider,
      };
    }
  }

  async checkRag() {
    try {
      const documents = await this.searchRepository?.searchSimilarDocuments({
        tenantId: 'default-tenant',
        embedding: new Array<number>(1536).fill(0),
        limit: 1,
      });

      return {
        status: 'up',
        documentsIndexed: documents?.length ?? 0,
        mode: 'retrieval-readiness',
      };
    } catch {
      return {
        status: 'down',
        mode: 'retrieval-readiness',
      };
    }
  }

  async checkEmail() {
    if (!this.emailProvider) {
      return {
        status: 'disabled',
        provider: this.configService.get<string>('email.provider', 'mock'),
      };
    }

    return this.emailProvider.health();
  }
}
