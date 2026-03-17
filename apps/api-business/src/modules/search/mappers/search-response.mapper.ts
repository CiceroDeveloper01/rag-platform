import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import type { SearchResult } from '../interfaces/search-result.interface';
import { SearchResponse } from '../dtos/response/search.response';
import { SearchResultResponse } from '../dtos/response/search-result.response';

@Injectable()
export class SearchResponseMapper {
  toResponse(results: SearchResult[]): SearchResponse {
    return plainToInstance(
      SearchResponse,
      {
        results: results.map((result) =>
          {
            const resultSource =
              typeof (result as SearchResult & { source?: string }).source ===
              'string'
                ? (result as SearchResult & { source?: string }).source
                : typeof result.metadata?.source === 'string'
                  ? result.metadata.source
                  : null;

            const resultCreatedAt =
              typeof (result as SearchResult & { createdAt?: string })
                .createdAt === 'string'
                ? (result as SearchResult & { createdAt?: string }).createdAt
                : typeof result.metadata?.createdAt === 'string'
                  ? result.metadata.createdAt
                  : null;

            return plainToInstance(
              SearchResultResponse,
              {
                id: result.id,
                content: result.content,
                metadata: result.metadata,
                distance: result.distance,
                source: resultSource,
                createdAt: resultCreatedAt,
              },
              { excludeExtraneousValues: true },
            );
          },
        ),
      },
      { excludeExtraneousValues: true },
    );
  }
}
