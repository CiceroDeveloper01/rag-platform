import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { DocumentIngestionRequestedEvent } from '@rag-platform/contracts';
import { randomUUID } from 'node:crypto';
import { PinoLogger } from 'nestjs-pino';
import { AppCacheService } from '../../../common/cache/services/app-cache.service';
import { DocumentIngestionPublisherService } from '../../../common/messaging/document-ingestion.publisher';
import { MetricTimer } from '../../../common/observability/decorators/metric-timer.decorator';
import { Trace } from '../../../common/observability/decorators/trace.decorator';
import { FILE_STORAGE } from '../../../common/storage/storage.constants';
import type { FileStorage } from '../../../common/storage/interfaces/file-storage.interface';
import { FileValidationService } from '../../../common/validation/file-validation.service';
import { MetricsService } from '../../../infra/observability/metrics.service';
import { UploadDocumentRequest } from '../dtos/request/upload-document.request';
import { SOURCE_REPOSITORY } from '../interfaces/source-repository.interface';
import type { SourceRepositoryInterface } from '../interfaces/source-repository.interface';

interface QueueBufferedDocumentInput {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  tenantId?: string;
  sourceChannel?: string | null;
  conversationId?: string;
  chunkSize?: number;
  chunkOverlap?: number;
  metadata?: Record<string, string>;
}

@Injectable()
export class IngestionService {
  private static readonly INGESTION_ROUTE = '/ingestion/upload';
  private static readonly INTERNAL_INGESTION_ROUTE = '/ingestion/request';

  constructor(
    private readonly fileValidationService: FileValidationService,
    @Inject(SOURCE_REPOSITORY)
    private readonly sourceRepository: SourceRepositoryInterface,
    @Inject(FILE_STORAGE)
    private readonly fileStorage: FileStorage,
    private readonly appCacheService: AppCacheService,
    private readonly metricsService: MetricsService,
    private readonly publisherService: DocumentIngestionPublisherService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IngestionService.name);
  }

  @Trace('ingestion.service.process')
  @MetricTimer({
    metricName: 'ingestion_service_duration_ms',
    labels: { module: 'ingestion' },
  })
  async ingestUploadedFile(file: Express.Multer.File, dto: UploadDocumentRequest) {
    this.fileValidationService.validateDocumentUpload(file);

    const parsedMetadata = this.parseMetadata(dto.metadata);

    return this.queueBufferedDocument(
      {
        buffer: file.buffer,
        filename: file.originalname,
        mimeType: file.mimetype,
        chunkSize: dto.chunkSize,
        chunkOverlap: dto.chunkOverlap,
        tenantId: parsedMetadata.tenantId?.trim() || 'default-tenant',
        sourceChannel: parsedMetadata.sourceChannel?.trim() || 'web',
        conversationId: parsedMetadata.conversationId?.trim() || undefined,
        metadata: parsedMetadata,
      },
      IngestionService.INGESTION_ROUTE,
    );
  }

  @Trace('ingestion.service.request')
  @MetricTimer({
    metricName: 'ingestion_request_duration_ms',
    labels: { module: 'ingestion' },
  })
  async requestBufferedIngestion(input: QueueBufferedDocumentInput) {
    this.validateBufferedDocument(input);

    return this.queueBufferedDocument(
      {
        ...input,
        tenantId: input.tenantId?.trim() || 'default-tenant',
        sourceChannel: input.sourceChannel?.trim() || 'unknown',
        conversationId: input.conversationId?.trim() || undefined,
        metadata: this.fileValidationService.sanitizeMetadata(input.metadata),
      },
      IngestionService.INTERNAL_INGESTION_ROUTE,
    );
  }

  async replayFailedIngestion(sourceId: number) {
    const source = await this.sourceRepository.findById(sourceId);

    if (!source) {
      throw new NotFoundException(`Source ${sourceId} not found`);
    }

    if (source.ingestionStatus !== 'FAILED') {
      throw new ConflictException(
        'Only failed document ingestions can be replayed',
      );
    }

    if (!source.storageKey || !source.storageUrl || !source.type) {
      throw new ConflictException(
        'The failed source does not have enough stored metadata to replay ingestion',
      );
    }

    const fileBuffer = await this.fileStorage.download(source.storageKey);

    await this.sourceRepository.update(sourceId, {
      ingestionStatus: 'PENDING',
      ingestionCurrentStep: null,
      ingestionFailureReason: null,
      processingStartedAt: null,
      completedAt: null,
    });

    try {
      const event = this.buildRequestedEvent({
        sourceId: source.id,
        tenantId: source.tenantId,
        sourceChannel: source.sourceChannel ?? 'unknown',
        filename: source.filename,
        mimeType: source.type,
        storageKey: source.storageKey,
        storageUrl: source.storageUrl,
        buffer: fileBuffer,
        uploadedAt: source.uploadedAt,
      });

      await this.publisherService.publish(event);
      this.metricsService.incrementCustomCounter(
        'documents_ingestion_replayed_total',
      );
      this.logger.warn(
        {
          sourceId: source.id,
          tenantId: source.tenantId,
          sourceChannel: source.sourceChannel ?? null,
          eventId: event.eventId,
          correlationId: event.correlationId,
        },
        'Replayed failed document ingestion event',
      );

      return {
        documentId: source.id,
        status: 'PENDING' as const,
        message: 'Document ingestion replay requested successfully.',
      };
    } catch (error) {
      await this.sourceRepository.update(source.id, {
        ingestionStatus: 'FAILED',
        ingestionCurrentStep: null,
        ingestionFailureReason:
          error instanceof Error ? error.message : 'ingestion_replay_failed',
        lastFailureAt: new Date(),
      });

      throw new ServiceUnavailableException(
        'Document ingestion replay is unavailable',
      );
    }
  }

  private async queueBufferedDocument(
    input: QueueBufferedDocumentInput,
    route: string,
  ) {
    let sourceId: number | null = null;
    let storageKey: string | null = null;

    try {
      const safeFilename = this.fileValidationService.sanitizeFilename(
        input.filename,
      );
      const metadata = this.fileValidationService.sanitizeMetadata(input.metadata);

      storageKey = this.buildStorageKey(safeFilename);
      const storageUrl = await this.fileStorage.upload(input.buffer, storageKey, {
        contentType: input.mimeType,
        filename: safeFilename,
        ...metadata,
      });

      const source = await this.sourceRepository.create({
        tenantId: input.tenantId?.trim() || 'default-tenant',
        filename: safeFilename,
        type: input.mimeType,
        sourceChannel: input.sourceChannel ?? null,
        storageKey,
        storageUrl,
        ingestionStatus: 'PENDING',
      });
      sourceId = source.id;

      const event = this.buildRequestedEvent({
        sourceId: source.id,
        tenantId: input.tenantId?.trim() || 'default-tenant',
        sourceChannel: source.sourceChannel ?? input.sourceChannel ?? 'unknown',
        conversationId: input.conversationId,
        filename: safeFilename,
        mimeType: input.mimeType,
        storageKey,
        storageUrl,
        buffer: input.buffer,
        chunkSize: input.chunkSize,
        chunkOverlap: input.chunkOverlap,
        metadata,
        uploadedAt: source.uploadedAt,
      });

      await this.publisherService.publish(event);
      await Promise.all([
        this.appCacheService.invalidateByPrefix('rag:retrieval'),
        this.appCacheService.invalidateByPrefix('rag:context'),
      ]);

      this.metricsService.recordIngestion(route, 'success');
      this.metricsService.incrementCustomCounter(
        'documents_ingestion_requested_total',
      );
      this.logger.info(
        {
          sourceId: source.id,
          tenantId: event.tenantId,
          filename: source.filename,
          sourceChannel: source.sourceChannel ?? null,
          storageKey,
          eventId: event.eventId,
          correlationId: event.correlationId,
        },
        'Document ingestion request accepted and queued',
      );

      return {
        documentId: source.id,
        sourceId: source.id,
        sourceChannel: source.sourceChannel ?? null,
        filename: source.filename,
        uploadedAt: source.uploadedAt.toISOString(),
        status: source.ingestionStatus,
        message: 'Document upload accepted and queued for asynchronous ingestion.',
      };
    } catch (error) {
      if (sourceId !== null) {
        await this.sourceRepository
          .update(sourceId, {
            ingestionStatus: 'FAILED',
            ingestionCurrentStep: null,
            ingestionFailureReason:
              error instanceof Error ? error.message : 'ingestion_publish_failed',
          })
          .catch(() => undefined);
      } else if (storageKey) {
        await this.fileStorage.delete(storageKey).catch(() => undefined);
      }

      this.metricsService.recordIngestion(route, 'error');
      this.logger.error(
        {
          err: error,
          filename: input.filename,
          sourceId,
          sourceChannel: input.sourceChannel ?? null,
        },
        'Document ingestion request failed before queue handoff',
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new ServiceUnavailableException(
        'Document ingestion is unavailable',
      );
    }
  }

  private validateBufferedDocument(input: QueueBufferedDocumentInput): void {
    this.fileValidationService.validateDocumentUpload({
      originalname: input.filename,
      mimetype: input.mimeType,
      size: input.buffer.length,
    } as Express.Multer.File);
  }

  private buildStorageKey(filename: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${timestamp}-${filename}`;
  }

  private parseMetadata(rawMetadata?: string): Record<string, string> {
    if (!rawMetadata) {
      return {};
    }

    try {
      const parsed = JSON.parse(rawMetadata) as Record<string, unknown>;
      return this.fileValidationService.sanitizeMetadata(parsed);
    } catch {
      throw new BadRequestException('metadata must be a valid JSON object');
    }
  }

  private buildRequestedEvent(input: {
    sourceId: number;
    tenantId: string;
    sourceChannel?: string;
    conversationId?: string;
    filename: string;
    mimeType: string;
    storageKey: string;
    storageUrl: string;
    buffer: Buffer;
    chunkSize?: number;
    chunkOverlap?: number;
    metadata?: Record<string, string>;
    uploadedAt: Date;
  }): DocumentIngestionRequestedEvent {
    const correlationId = randomUUID();

    return {
      eventId: randomUUID(),
      correlationId,
      sourceId: input.sourceId,
      tenantId: input.tenantId,
      sourceChannel: input.sourceChannel,
      conversationId: input.conversationId,
      filename: input.filename,
      mimeType: input.mimeType,
      storageKey: input.storageKey,
      storageUrl: input.storageUrl,
      fileContentBase64: input.buffer.toString('base64'),
      chunkSize: input.chunkSize,
      chunkOverlap: input.chunkOverlap,
      metadata: input.metadata,
      requestedAt: new Date().toISOString(),
      uploadedAt: input.uploadedAt.toISOString(),
    };
  }
}
