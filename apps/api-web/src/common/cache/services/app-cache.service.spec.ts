import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';
import { AppCacheService } from './app-cache.service';

describe('AppCacheService', () => {
  const store = new Map<string, unknown>();
  const cacheManager = {
    get: jest.fn((key: string) => Promise.resolve(store.get(key))),
    set: jest.fn((key: string, value: unknown) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    del: jest.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
  };

  let service: AppCacheService;

  beforeEach(async () => {
    jest.clearAllMocks();
    store.clear();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AppCacheService,
        {
          provide: CACHE_MANAGER,
          useValue: cacheManager,
        },
      ],
    }).compile();

    service = moduleRef.get(AppCacheService);
  });

  it('stores and retrieves cached values', async () => {
    await service.set('dashboard:overview', { totalRequests: 10 }, 1000);

    await expect(
      service.get<{ totalRequests: number }>('dashboard:overview'),
    ).resolves.toEqual({
      totalRequests: 10,
    });
  });

  it('reuses cached values on wrap', async () => {
    const factory = jest.fn().mockResolvedValue({ ok: true });

    await expect(
      service.wrap('dashboard:overview', factory, { ttl: 1000 }),
    ).resolves.toEqual({
      ok: true,
    });
    await expect(
      service.wrap('dashboard:overview', factory, { ttl: 1000 }),
    ).resolves.toEqual({
      ok: true,
    });

    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('invalidates all keys by prefix', async () => {
    await service.set('rag:retrieval:one', { ok: 1 });
    await service.set('rag:retrieval:two', { ok: 2 });
    await service.set('dashboard:overview', { ok: 3 });

    await expect(service.invalidateByPrefix('rag:retrieval')).resolves.toBe(2);
    await expect(service.get('rag:retrieval:one')).resolves.toBeNull();
    await expect(service.get('dashboard:overview')).resolves.toEqual({ ok: 3 });
  });
});
