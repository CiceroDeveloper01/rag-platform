import { Injectable } from '@nestjs/common';
import { MetricTimer } from '../../../../common/observability/decorators/metric-timer.decorator';
import { Trace } from '../../../../common/observability/decorators/trace.decorator';
import { SearchService } from '../../../search/services/search.service';
import { IRagGateway } from '../../application/interfaces/rag-gateway.interface';
import type {
  RagQueryRequest,
  RagQueryResult,
} from '../../application/interfaces/rag-gateway.interface';

@Injectable()
export class ExistingRagGatewayAdapter implements IRagGateway {
  constructor(private readonly searchService: SearchService) {}

  @Trace('rag.gateway.query')
  @MetricTimer({
    metricName: 'rag_query_duration_ms',
    labels: { module: 'rag', gateway: 'existing' },
  })
  async query(request: RagQueryRequest): Promise<RagQueryResult> {
    const results = await this.searchService.search({
      query: request.question,
      top_k: request.topK,
    });

    return {
      question: request.question,
      contexts: results.results,
    };
  }
}
