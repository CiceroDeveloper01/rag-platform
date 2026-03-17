import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { AppCacheService } from '../../../common/cache/services/app-cache.service';
import { DOCUMENTS_REPOSITORY } from '../../documents/interfaces/documents-repository.interface';
import type { DocumentsRepositoryInterface } from '../../documents/interfaces/documents-repository.interface';
import { SOURCE_REPOSITORY } from '../../ingestion/interfaces/source-repository.interface';
import type { SourceRepositoryInterface } from '../../ingestion/interfaces/source-repository.interface';
import { CompleteDocumentIngestionDto } from './complete-document-ingestion.dto';
import { FailDocumentIngestionDto } from './fail-document-ingestion.dto';

@Injectable()
export class InternalIngestionService {
  constructor(
    @Inject(DOCUMENTS_REPOSITORY)
    private readonly documentsRepository: DocumentsRepositoryInterface,
    @Inject(SOURCE_REPOSITORY)
    private readonly sourceRepository: SourceRepositoryInterface,
    private readonly appCacheService: AppCacheService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(InternalIngestionService.name);
  }

  async complete(dto: CompleteDocumentIngestionDto) {
    const documents = await this.documentsRepository.createMany(
      dto.chunks.map((chunk, index) => ({
        tenantId: dto.tenantId,
        sourceId: dto.sourceId,
        content: chunk.content,
        embedding: chunk.embedding,
        metadata: {
          filename: dto.filename,
          mimeType: dto.mimeType,
          sourceId: dto.sourceId,
          chunkIndex: index,
          totalChunks: dto.chunks.length,
          ...(chunk.metadata ?? {}),
        },
      })),
    );

    await this.sourceRepository.update(dto.sourceId, {
      ingestionStatus: 'COMPLETED',
      ingestionFailureReason: null,
    });
    await Promise.all([
      this.appCacheService.invalidateByPrefix('rag:retrieval'),
      this.appCacheService.invalidateByPrefix('rag:context'),
    ]);

    this.logger.info(
      {
        sourceId: dto.sourceId,
        tenantId: dto.tenantId,
        chunksPersisted: documents.length,
      },
      'Completed async document ingestion persistence',
    );

    return {
      success: true as const,
      sourceId: dto.sourceId,
      chunksPersisted: documents.length,
    };
  }

  async fail(dto: FailDocumentIngestionDto) {
    await this.sourceRepository.update(dto.sourceId, {
      ingestionStatus: 'FAILED',
      ingestionFailureReason: dto.reason ?? 'document_ingestion_failed',
    });

    this.logger.warn(
      {
        sourceId: dto.sourceId,
        reason: dto.reason ?? 'document_ingestion_failed',
      },
      'Marked document ingestion as failed',
    );

    return {
      success: true as const,
      sourceId: dto.sourceId,
      status: 'FAILED' as const,
    };
  }
}
