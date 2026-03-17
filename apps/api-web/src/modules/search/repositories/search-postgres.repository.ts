import { Injectable } from '@nestjs/common';
import { serializeVector } from '../../../common/utils/vector.util';
import { DatabaseService } from '../../../infra/database/database.service';
import {
  SearchDocumentsPayload,
  SearchRepositoryInterface,
} from '../interfaces/search-repository.interface';
import { SearchResult } from '../interfaces/search-result.interface';

interface SearchRow {
  id: number;
  content: string;
  metadata: Record<string, unknown> | null;
  distance: number;
  created_at: Date;
}

@Injectable()
export class SearchPostgresRepository implements SearchRepositoryInterface {
  constructor(private readonly databaseService: DatabaseService) {}

  async searchSimilarDocuments(
    payload: SearchDocumentsPayload,
  ): Promise<SearchResult[]> {
    const rows = await this.databaseService.query<SearchRow>(
      `
        SELECT
          id,
          content,
          metadata,
          created_at,
          CAST(embedding <-> $1::vector AS DOUBLE PRECISION) AS distance
        FROM documents
        WHERE tenant_id = $2
          AND embedding IS NOT NULL
        ORDER BY embedding <-> $1::vector
        LIMIT $3
      `,
      [serializeVector(payload.embedding), payload.tenantId, payload.limit],
    );

    return rows.map((row) => ({
      id: row.id,
      content: row.content,
      metadata: row.metadata,
      distance: Number(row.distance),
      source:
        typeof row.metadata?.source === 'string' ? row.metadata.source : null,
      createdAt: row.created_at.toISOString(),
    }));
  }
}
