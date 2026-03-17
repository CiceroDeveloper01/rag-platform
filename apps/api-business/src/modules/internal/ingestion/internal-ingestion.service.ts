import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { AppCacheService } from '../../../common/cache/services/app-cache.service';
import { DOCUMENTS_REPOSITORY } from '../../documents/interfaces/documents-repository.interface';
import type { DocumentsRepositoryInterface } from '../../documents/interfaces/documents-repository.interface';
import { SOURCE_REPOSITORY } from '../../ingestion/interfaces/source-repository.interface';
import type { SourceRepositoryInterface } from '../../ingestion/interfaces/source-repository.interface';
import { CompleteDocumentIngestionRequest } from './dtos/request/complete-document-ingestion.request';
import { FailDocumentIngestionRequest } from './dtos/request/fail-document-ingestion.request';
import { IngestionService } from '../../ingestion/services/ingestion.service';
import { RequestDocumentIngestionRequest } from './dtos/request/request-document-ingestion.request';
import { StartDocumentIngestionRequest } from './dtos/request/start-document-ingestion.request';
import { UpdateDocumentIngestionStatusRequest } from './dtos/request/update-document-ingestion-status.request';

@Injectable()
export class InternalIngestionService {
  constructor(
    @Inject(DOCUMENTS_REPOSITORY)
    private readonly documentsRepository: DocumentsRepositoryInterface,
    @Inject(SOURCE_REPOSITORY)
    private readonly sourceRepository: SourceRepositoryInterface,
    private readonly appCacheService: AppCacheService,
    private readonly ingestionService: IngestionService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(InternalIngestionService.name);
  }

  async complete(dto: CompleteDocumentIngestionRequest) {
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
      ingestionCurrentStep: null,
      ingestionFailureReason: null,
      completedAt: new Date(),
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

  async fail(dto: FailDocumentIngestionRequest) {
    await this.sourceRepository.update(dto.sourceId, {
      ingestionStatus: 'FAILED',
      ingestionCurrentStep: null,
      ingestionFailureReason: dto.reason ?? 'document_ingestion_failed',
      completedAt: null,
      lastFailureAt: new Date(),
      lastIngestionEventId: dto.eventId ?? null,
      lastIngestionCorrelationId: dto.correlationId ?? null,
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

  async start(dto: StartDocumentIngestionRequest) {
    const source = await this.sourceRepository.findById(dto.sourceId);

    if (!source) {
      return {
        success: false as const,
        shouldProcess: false as const,
        reason: 'source_not_found' as const,
      };
    }

    if (source.ingestionStatus === 'COMPLETED') {
      return {
        success: true as const,
        shouldProcess: false as const,
        status: source.ingestionStatus,
        reason: 'already_completed' as const,
        attemptCount: source.ingestionAttemptCount ?? 0,
      };
    }

    if (
      source.ingestionStatus === 'PROCESSING' &&
      source.lastIngestionEventId === dto.eventId
    ) {
      return {
        success: true as const,
        shouldProcess: false as const,
        status: source.ingestionStatus,
        reason: 'already_processing_same_event' as const,
        attemptCount: source.ingestionAttemptCount ?? 0,
      };
    }

    const nextAttemptCount = (source.ingestionAttemptCount ?? 0) + 1;
    await this.sourceRepository.update(dto.sourceId, {
      ingestionStatus: 'PROCESSING',
      ingestionCurrentStep: 'RECEIVED',
      ingestionFailureReason: null,
      processingStartedAt: new Date(),
      completedAt: null,
      ingestionAttemptCount: nextAttemptCount,
      lastIngestionAttemptAt: new Date(),
      lastIngestionEventId: dto.eventId,
      lastIngestionCorrelationId: dto.correlationId,
    });

    this.logger.info(
      {
        sourceId: dto.sourceId,
        eventId: dto.eventId,
        correlationId: dto.correlationId,
        retryCount: dto.retryCount,
        attemptCount: nextAttemptCount,
      },
      'Document ingestion processing started',
    );

    return {
      success: true as const,
      shouldProcess: true as const,
      status: 'PROCESSING' as const,
      attemptCount: nextAttemptCount,
    };
  }

  async updateStatus(dto: UpdateDocumentIngestionStatusRequest) {
    const nextStatus = await this.sourceRepository.update(dto.sourceId, {
      ingestionStatus: dto.status,
      ingestionCurrentStep: dto.currentStep ?? null,
      ingestionFailureReason:
        dto.status === 'COMPLETED'
          ? null
          : (dto.errorMessage ?? null),
      processingStartedAt:
        dto.status === 'PROCESSING' ? new Date() : undefined,
      completedAt: dto.status === 'COMPLETED' ? new Date() : null,
      lastIngestionEventId: dto.eventId ?? null,
      lastIngestionCorrelationId: dto.correlationId ?? null,
      lastFailureAt:
        dto.status === 'FAILED' || dto.errorMessage ? new Date() : undefined,
    });

    if (!nextStatus) {
      return {
        success: false as const,
        sourceId: dto.sourceId,
      };
    }

    this.logger.info(
      {
        sourceId: dto.sourceId,
        status: dto.status,
        currentStep: dto.currentStep ?? null,
        eventId: dto.eventId ?? null,
        correlationId: dto.correlationId ?? null,
        retryCount: dto.retryCount ?? null,
      },
      'Updated async document ingestion status',
    );

    return {
      success: true as const,
      sourceId: dto.sourceId,
      status: nextStatus.ingestionStatus,
      currentStep: nextStatus.ingestionCurrentStep ?? null,
    };
  }

  async request(dto: RequestDocumentIngestionRequest) {
    return this.ingestionService.requestBufferedIngestion({
      buffer: Buffer.from(dto.fileContentBase64, 'base64'),
      filename: dto.filename,
      mimeType: dto.mimeType,
      tenantId: dto.tenantId,
      sourceChannel: dto.sourceChannel,
      conversationId: dto.conversationId,
      chunkSize: dto.chunkSize,
      chunkOverlap: dto.chunkOverlap,
      metadata: dto.metadata,
    });
  }
}
