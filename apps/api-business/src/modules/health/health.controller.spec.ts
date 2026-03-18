import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { REDIS_CACHE_CLIENT } from '../../common/cache/cache.constants';
import { EMAIL_PROVIDER } from '../../common/email/email.constants';
import { FILE_STORAGE } from '../../common/storage/storage.constants';
import { appConfig } from '../../config/app.config';
import { DatabaseService } from '../../infra/database/database.service';
import { SEARCH_REPOSITORY } from '../search/interfaces/search-repository.interface';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let healthController: HealthController;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [appConfig],
          ignoreEnvFile: true,
        }),
      ],
      controllers: [HealthController],
      providers: [
        HealthService,
        {
          provide: DatabaseService,
          useValue: {
            healthCheck: jest.fn().mockResolvedValue('disabled'),
          },
        },
        {
          provide: REDIS_CACHE_CLIENT,
          useValue: null,
        },
        {
          provide: FILE_STORAGE,
          useValue: {
            upload: jest.fn(),
            exists: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: EMAIL_PROVIDER,
          useValue: {
            health: jest
              .fn()
              .mockResolvedValue({ status: 'up', provider: 'mock' }),
          },
        },
        {
          provide: SEARCH_REPOSITORY,
          useValue: {
            searchSimilarDocuments: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    healthController = moduleRef.get<HealthController>(HealthController);
  });

  it('should return an application health payload', async () => {
    await expect(healthController.check()).resolves.toEqual(
      expect.objectContaining({
        status: 'ok',
        version: expect.any(String),
        database: 'disabled',
      }),
    );
  });

  it('should expose component health checks', async () => {
    expect(healthController.checkLive()).toEqual(
      expect.objectContaining({ status: 'ok' }),
    );
    await expect(healthController.checkReady()).resolves.toEqual(
      expect.objectContaining({ status: 'ok' }),
    );
    await expect(healthController.checkDb()).resolves.toBe('disabled');
    await expect(healthController.checkRedis()).resolves.toEqual(
      expect.objectContaining({ status: 'disabled' }),
    );
    await expect(healthController.checkStorage()).resolves.toEqual(
      expect.objectContaining({ status: 'degraded' }),
    );
    await expect(healthController.checkRag()).resolves.toEqual(
      expect.objectContaining({ status: 'up' }),
    );
    await expect(healthController.checkEmail()).resolves.toEqual(
      expect.objectContaining({ status: 'up', provider: 'mock' }),
    );
  });
});
