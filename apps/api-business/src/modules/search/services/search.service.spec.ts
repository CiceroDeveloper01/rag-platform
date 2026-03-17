import { Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { AppCacheService } from '../../../common/cache/services/app-cache.service';
import { FeatureFlagsService } from '../../../common/feature-flags/feature-flags.service';
import { EMBEDDING_SERVICE } from '../../../infra/ai/embeddings/embedding.interface';
import { SEARCH_REPOSITORY } from '../interfaces/search-repository.interface';
import { SearchService } from './search.service';

describe('SearchService', () => {
  const searchRepository = {
    searchSimilarDocuments: jest.fn(),
  };
  const embeddingService = {
    generateEmbedding: jest.fn(),
  };
  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  };
  const appCacheService = {
    wrap: jest.fn(async (_key: string, factory: () => Promise<unknown>) =>
      factory(),
    ),
  };
  const featureFlagsService = {
    isRetrievalCacheEnabled: jest.fn().mockReturnValue(true),
    recordDisabledHit: jest.fn(),
  };

  let service: SearchService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: SEARCH_REPOSITORY,
          useValue: searchRepository,
        },
        {
          provide: EMBEDDING_SERVICE,
          useValue: embeddingService,
        },
        {
          provide: AppCacheService,
          useValue: appCacheService,
        },
        {
          provide: FeatureFlagsService,
          useValue: featureFlagsService,
        },
        {
          provide: PinoLogger,
          useValue: logger,
        },
      ],
    }).compile();

    service = moduleRef.get(SearchService);
  });

  it('wraps retrieval queries with a dedicated cache key', async () => {
    searchRepository.searchSimilarDocuments.mockResolvedValue([]);

    await service.searchByEmbedding([0.1, 0.2], 5, 'tenant-a');

    expect(appCacheService.wrap).toHaveBeenCalledWith(
      expect.stringMatching(/^rag:retrieval:/),
      expect.any(Function),
      expect.objectContaining({
        ttl: 30,
      }),
    );
  });

  it('falls back to direct retrieval when retrieval cache is disabled', async () => {
    featureFlagsService.isRetrievalCacheEnabled.mockReturnValue(false);
    searchRepository.searchSimilarDocuments.mockResolvedValue([]);

    await service.searchByEmbedding([0.3, 0.4], 3, 'tenant-a');

    expect(appCacheService.wrap).not.toHaveBeenCalled();
    expect(searchRepository.searchSimilarDocuments).toHaveBeenCalledWith({
      tenantId: 'tenant-a',
      embedding: [0.3, 0.4],
      limit: 3,
    });
    expect(featureFlagsService.recordDisabledHit).toHaveBeenCalledWith(
      'retrieval_cache',
      expect.any(Object),
    );
  });
});
