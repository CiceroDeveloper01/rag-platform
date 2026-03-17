import {
  BadRequestException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { extname } from 'node:path';
import { PinoLogger } from 'nestjs-pino';
import { AppCacheService } from '../../../common/cache/services/app-cache.service';
import { MetricTimer } from '../../../common/observability/decorators/metric-timer.decorator';
import { Trace } from '../../../common/observability/decorators/trace.decorator';
import { FILE_STORAGE } from '../../../common/storage/storage.constants';
import type { FileStorage } from '../../../common/storage/interfaces/file-storage.interface';
import { FileValidationService } from '../../../common/validation/file-validation.service';
import { ChunkingService } from '../../../infra/chunking/chunking.service';
import { EMBEDDING_SERVICE } from '../../../infra/ai/embeddings/embedding.interface';
import type { EmbeddingServiceInterface } from '../../../infra/ai/embeddings/embedding.interface';
import { DocxParserService } from '../../../infra/parsing/docx-parser.service';
import { PdfParserService } from '../../../infra/parsing/pdf-parser.service';
import { TextParserService } from '../../../infra/parsing/text-parser.service';
import { DOCUMENTS_REPOSITORY } from '../../documents/interfaces/documents-repository.interface';
import type {
  CreateDocumentPayload,
  DocumentsRepositoryInterface,
} from '../../documents/interfaces/documents-repository.interface';
import { SOURCE_REPOSITORY } from '../interfaces/source-repository.interface';
import type { SourceRepositoryInterface } from '../interfaces/source-repository.interface';
import { UploadDocumentDto } from '../dto/upload-document.dto';
import { MetricsService } from '../../../infra/observability/metrics.service';

@Injectable()
export class IngestionService {
  private static readonly INGESTION_ROUTE = '/ingestion/upload';
  private static readonly EMBEDDING_BATCH_SIZE = 32;

  constructor(
    private readonly pdfParserService: PdfParserService,
    private readonly textParserService: TextParserService,
    private readonly docxParserService: DocxParserService,
    private readonly chunkingService: ChunkingService,
    private readonly fileValidationService: FileValidationService,
    @Inject(EMBEDDING_SERVICE)
    private readonly embeddingService: EmbeddingServiceInterface,
    @Inject(DOCUMENTS_REPOSITORY)
    private readonly documentsRepository: DocumentsRepositoryInterface,
    @Inject(SOURCE_REPOSITORY)
    private readonly sourceRepository: SourceRepositoryInterface,
    @Inject(FILE_STORAGE)
    private readonly fileStorage: FileStorage,
    private readonly appCacheService: AppCacheService,
    private readonly metricsService: MetricsService,
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
    let storageKey: string | null = null;

    try {
      const safeFilename = this.fileValidationService.sanitizeFilename(
        file.originalname,
      );
      const parsedMetadata = this.parseMetadata(dto.metadata);
      storageKey = this.buildStorageKey(safeFilename);
      const storageUrl = await this.fileStorage.upload(
        file.buffer,
        storageKey,
        {
          contentType: file.mimetype,
          filename: safeFilename,
          ...parsedMetadata,
        },
      );

      const source = await this.sourceRepository.create({
        filename: safeFilename,
        type: file.mimetype,
        storageKey,
        storageUrl,
      });
      const extractedText = await this.extractText(file);

      if (!extractedText) {
        throw new BadRequestException(
          'The uploaded file does not contain extractable text',
        );
      }

      const chunks = this.chunkingService.splitText(extractedText, {
        chunkSize: dto.chunkSize,
        chunkOverlap: dto.chunkOverlap,
      });

      if (chunks.length === 0) {
        throw new BadRequestException(
          'No chunks were generated from the uploaded document',
        );
      }

      const documentsPayload = await this.createDocumentsPayload(
        chunks,
        source.id,
        safeFilename,
        file.mimetype,
        parsedMetadata,
      );
      const documents =
        await this.documentsRepository.createMany(documentsPayload);

      await Promise.all([
        this.appCacheService.invalidateByPrefix('rag:retrieval'),
        this.appCacheService.invalidateByPrefix('rag:context'),
      ]);

      this.metricsService.recordIngestion(
        IngestionService.INGESTION_ROUTE,
        'success',
      );
      this.metricsService.incrementChunksGenerated(
        IngestionService.INGESTION_ROUTE,
        'success',
        chunks.length,
      );
      this.metricsService.incrementDocumentsProcessed(
        IngestionService.INGESTION_ROUTE,
        'success',
        documents.length,
      );

      this.logger.info(
        {
          sourceId: source.id,
          filename: source.filename,
          storageKey,
          chunks: chunks.length,
        },
        'Document ingestion completed successfully',
      );

      return {
        sourceId: source.id,
        filename: source.filename,
        storageKey,
        storageUrl,
        uploadedAt: source.uploadedAt,
        chunksGenerated: chunks.length,
        documentsProcessed: documents.length,
      };
    } catch (error) {
      if (storageKey) {
        await this.fileStorage.delete(storageKey).catch(() => undefined);
      }

      this.metricsService.recordIngestion(
        IngestionService.INGESTION_ROUTE,
        'error',
      );
      this.logger.error(
        { err: error, filename: file.originalname },
        'Document ingestion failed',
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new ServiceUnavailableException(
        'Document ingestion is unavailable',
      );
    }
  }

  private async extractText(file: Express.Multer.File): Promise<string> {
    if (file.mimetype === 'application/pdf') {
      return this.pdfParserService.extractText(file.buffer);
    }

    if (
      file.mimetype === 'text/plain' ||
      file.mimetype === 'text/markdown' ||
      file.mimetype === 'text/x-markdown'
    ) {
      return this.textParserService.extractText(file.buffer);
    }

    if (
      file.mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return this.docxParserService.extractText(file.buffer);
    }

    const extension = extname(file.originalname).replace('.', '').toLowerCase();

    if (extension === 'md') {
      return this.textParserService.extractText(file.buffer);
    }

    if (extension === 'docx') {
      return this.docxParserService.extractText(file.buffer);
    }

    throw new BadRequestException(
      'Only PDF, TXT, MD, and DOCX files are supported',
    );
  }

  private async createDocumentsPayload(
    chunks: string[],
    sourceId: number,
    filename: string,
    mimeType: string,
    metadata: Record<string, string>,
  ): Promise<CreateDocumentPayload[]> {
    const embeddings = await this.embeddingService.generateEmbeddings(chunks, {
      batchSize: IngestionService.EMBEDDING_BATCH_SIZE,
    });
    const tenantId = metadata.tenantId?.trim() || 'default-tenant';

    return chunks.map((chunk, index) => ({
      tenantId,
      sourceId,
      content: chunk,
      embedding: embeddings[index],
      metadata: {
        filename,
        mimeType,
        chunkIndex: index,
        totalChunks: chunks.length,
        ...metadata,
      },
    }));
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
