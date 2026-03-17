import {
  BadRequestException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { DocumentIngestionRequestedEvent } from '@rag-platform/contracts';
import { PinoLogger } from 'nestjs-pino';
import { AppCacheService } from '../../../common/cache/services/app-cache.service';
import { DocumentIngestionPublisherService } from '../../../common/messaging/document-ingestion.publisher';
import { MetricTimer } from '../../../common/observability/decorators/metric-timer.decorator';
import { Trace } from '../../../common/observability/decorators/trace.decorator';
import { FILE_STORAGE } from '../../../common/storage/storage.constants';
import type { FileStorage } from '../../../common/storage/interfaces/file-storage.interface';
import { FileValidationService } from '../../../common/validation/file-validation.service';
import { MetricsService } from '../../../infra/observability/metrics.service';
import { SOURCE_REPOSITORY } from '../interfaces/source-repository.interface';
import type { SourceRepositoryInterface } from '../interfaces/source-repository.interface';
import { UploadDocumentDto } from '../dto/upload-document.dto';

@Injectable()
export class IngestionService {
  private static readonly INGESTION_ROUTE = '/ingestion/upload';

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
  async ingestUploadedFile(file: Express.Multer.File, dto: UploadDocumentDto) {
    this.fileValidationService.validateDocumentUpload(file);

    let sourceId: number | null = null;
    let storageKey: string | null = null;
    let storageUrl: string | null = null;

    try {
      const safeFilename = this.fileValidationService.sanitizeFilename(
        file.originalname,
      );
      const parsedMetadata = this.parseMetadata(dto.metadata);

      storageKey = this.buildStorageKey(safeFilename);
      storageUrl = await this.fileStorage.upload(file.buffer, storageKey, {
        contentType: file.mimetype,
        filename: safeFilename,
        ...parsedMetadata,
      });

      const source = await this.sourceRepository.create({
        filename: safeFilename,
        type: file.mimetype,
        storageKey,
        storageUrl,
        ingestionStatus: 'PENDING',
      });
      sourceId = source.id;

      const event: DocumentIngestionRequestedEvent = {
        sourceId: source.id,
        tenantId: parsedMetadata.tenantId?.trim() || 'default-tenant',
        filename: safeFilename,
        mimeType: file.mimetype,
        storageKey,
        storageUrl,
        fileContentBase64: file.buffer.toString('base64'),
        chunkSize: dto.chunkSize,
        chunkOverlap: dto.chunkOverlap,
        metadata: parsedMetadata,
        uploadedAt: source.uploadedAt.toISOString(),
      };

      await this.publisherService.publish(event);
      await Promise.all([
        this.appCacheService.invalidateByPrefix('rag:retrieval'),
        this.appCacheService.invalidateByPrefix('rag:context'),
      ]);

      this.metricsService.recordIngestion(
        IngestionService.INGESTION_ROUTE,
        'success',
      );
      this.logger.info(
        {
          sourceId: source.id,
          filename: source.filename,
          storageKey,
          queue: 'document.ingestion.requested',
        },
        'Document ingestion request accepted and queued',
      );

      return {
        sourceId: source.id,
        filename: source.filename,
        storageKey,
        storageUrl,
        uploadedAt: source.uploadedAt,
        status: source.ingestionStatus,
      };
    } catch (error) {
      if (sourceId !== null) {
        await this.sourceRepository
          .update(sourceId, {
            ingestionStatus: 'FAILED',
            ingestionFailureReason:
              error instanceof Error ? error.message : 'ingestion_publish_failed',
          })
          .catch(() => undefined);
      } else if (storageKey) {
        await this.fileStorage.delete(storageKey).catch(() => undefined);
      }

      this.metricsService.recordIngestion(
        IngestionService.INGESTION_ROUTE,
        'error',
      );
      this.logger.error(
        { err: error, filename: file.originalname, sourceId },
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
}
