import {
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { AppCacheService } from '../../../common/cache/services/app-cache.service';
import { EMBEDDING_SERVICE } from '../../../infra/ai/embeddings/embedding.interface';
import type { EmbeddingServiceInterface } from '../../../infra/ai/embeddings/embedding.interface';
import { DOCUMENTS_REPOSITORY } from '../interfaces/documents-repository.interface';
import type { DocumentsRepositoryInterface } from '../interfaces/documents-repository.interface';
import { DocumentRecord } from '../interfaces/document-record.interface';
import { CreateDocumentRequest } from '../dtos/request/create-document.request';
import { ListDocumentsRequest } from '../dtos/request/list-documents.request';
import { UpdateDocumentRequest } from '../dtos/request/update-document.request';

@Injectable()
export class DocumentsService {
  constructor(
    @Inject(DOCUMENTS_REPOSITORY)
    private readonly documentsRepository: DocumentsRepositoryInterface,
    @Inject(EMBEDDING_SERVICE)
    private readonly embeddingService: EmbeddingServiceInterface,
    private readonly appCacheService: AppCacheService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DocumentsService.name);
  }

  async createDocument(dto: CreateDocumentRequest): Promise<DocumentRecord> {
    try {
      const embedding = await this.embeddingService.generateEmbedding(
        dto.content,
      );
      const document = await this.documentsRepository.create({
        tenantId: dto.tenantId?.trim() || 'default-tenant',
        content: dto.content,
        embedding,
        metadata: dto.metadata,
      });
      await this.invalidateRetrievalCache();

      this.logger.info(
        { documentId: document.id },
        'Document persisted successfully',
      );

      return document;
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to persist document');
      throw new ServiceUnavailableException(
        'Document persistence is unavailable',
      );
    }
  }

  async listDocuments(dto: ListDocumentsRequest): Promise<DocumentRecord[]> {
    return this.documentsRepository.list({
      tenantId: dto.tenantId?.trim() || 'default-tenant',
      limit: dto.limit ?? 25,
      offset: dto.offset ?? 0,
      query: dto.q,
      order: dto.order ?? 'desc',
    });
  }

  async getDocument(
    documentId: number,
    tenantId = 'default-tenant',
  ): Promise<DocumentRecord> {
    const document = await this.documentsRepository.findById(
      documentId,
      tenantId,
    );

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async updateDocument(
    documentId: number,
    dto: UpdateDocumentRequest,
  ): Promise<DocumentRecord> {
    try {
      const nextContent = dto.content;
      const updatedDocument = await this.documentsRepository.update(
        documentId,
        dto.tenantId?.trim() || 'default-tenant',
        {
          content: nextContent,
          metadata: dto.metadata,
        },
      );

      if (!updatedDocument) {
        throw new NotFoundException('Document not found');
      }

      await this.invalidateRetrievalCache();

      return updatedDocument;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error({ err: error }, 'Failed to update document');
      throw new ServiceUnavailableException('Document update is unavailable');
    }
  }

  async deleteDocument(
    documentId: number,
    tenantId = 'default-tenant',
  ): Promise<{ success: true }> {
    await this.getDocument(documentId, tenantId);
    await this.documentsRepository.delete(documentId, tenantId);
    await this.invalidateRetrievalCache();
    return { success: true };
  }

  private async invalidateRetrievalCache(): Promise<void> {
    await Promise.all([
      this.appCacheService.invalidateByPrefix('rag:retrieval'),
      this.appCacheService.invalidateByPrefix('rag:context'),
    ]);
  }
}
