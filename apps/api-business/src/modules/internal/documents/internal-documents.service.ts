import { Injectable } from '@nestjs/common';
import { DocumentsService } from '../../documents/services/documents.service';
import { RegisterDocumentRequest } from './dtos/request/register-document.request';

@Injectable()
export class InternalDocumentsService {
  constructor(private readonly documentsService: DocumentsService) {}

  async register(dto: RegisterDocumentRequest) {
    const document = await this.documentsService.createDocument({
      tenantId: dto.tenantId,
      content: dto.content,
      metadata: {
        tenantId: dto.tenantId,
        source: dto.source,
        externalMessageId: dto.externalMessageId,
        ...(dto.metadata ?? {}),
      },
    });

    return {
      success: true as const,
      documentId: document.id,
    };
  }
}
