import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { RAG_RETRIEVAL_TTL } from '../../../common/cache/constants/cache-ttl.constants';
import { CacheKeyHelper } from '../../../common/cache/helpers/cache-key.helper';
import { AppCacheService } from '../../../common/cache/services/app-cache.service';
import { FeatureFlagsService } from '../../../common/feature-flags/feature-flags.service';
import { MetricTimer } from '../../../common/observability/decorators/metric-timer.decorator';
import { Trace } from '../../../common/observability/decorators/trace.decorator';
import { EMBEDDING_SERVICE } from '../../../infra/ai/embeddings/embedding.interface';
import type { EmbeddingServiceInterface } from '../../../infra/ai/embeddings/embedding.interface';
import { SearchRequest } from '../dtos/request/search.request';
import { SearchResult } from '../interfaces/search-result.interface';
import { SEARCH_REPOSITORY } from '../interfaces/search-repository.interface';
import type { SearchRepositoryInterface } from '../interfaces/search-repository.interface';

@Injectable()
export class SearchService {
  constructor(
    @Inject(SEARCH_REPOSITORY)
    private readonly searchRepository: SearchRepositoryInterface,
    @Inject(EMBEDDING_SERVICE)
    private readonly embeddingService: EmbeddingServiceInterface,
    private readonly appCacheService: AppCacheService,
    private readonly featureFlagsService: FeatureFlagsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SearchService.name);
  }

  @Trace('search.service.query')
  @MetricTimer({
    metricName: 'search_service_duration_ms',
    labels: { module: 'search' },
  })
  async search(
    dto: SearchRequest,
    tenantId = 'default-tenant',
  ): Promise<{ results: SearchResult[] }> {
    try {
      const embedding = await this.embeddingService.generateEmbedding(
        dto.query,
      );
      const results = await this.searchByEmbedding(
        embedding,
        dto.top_k ?? dto.limit ?? 5,
        tenantId,
      );

      this.logger.info(
        {
          query: dto.query,
          resultsCount: results.length,
          tenantId,
        },
        'Semantic search executed successfully',
      );

      return { results };
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to execute semantic search');
      throw new ServiceUnavailableException('Semantic search is unavailable');
    }
  }

  async searchByEmbedding(
    embedding: number[],
    limit: number,
    tenantId = 'default-tenant',
  ): Promise<SearchResult[]> {
    if (!this.featureFlagsService.isRetrievalCacheEnabled()) {
      this.featureFlagsService.recordDisabledHit('retrieval_cache', {
        operation: 'search_by_embedding',
      });

      return this.searchRepository.searchSimilarDocuments({
        tenantId,
        embedding,
        limit,
      });
    }

    return this.appCacheService.wrap(
      CacheKeyHelper.build('rag:retrieval', { tenantId, embedding, limit }),
      () =>
        this.searchRepository.searchSimilarDocuments({
          tenantId,
          embedding,
          limit,
        }),
      { ttl: RAG_RETRIEVAL_TTL },
    );
  }
}
