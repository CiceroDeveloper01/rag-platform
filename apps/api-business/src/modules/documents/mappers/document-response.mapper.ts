import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import type { DocumentRecord } from '../interfaces/document-record.interface';
import { DocumentResponse } from '../dtos/response/document.response';

@Injectable()
export class DocumentResponseMapper {
  toResponse(document: DocumentRecord): DocumentResponse {
    return plainToInstance(
      DocumentResponse,
      {
        id: document.id,
        sourceId: document.sourceId,
        content: document.content,
        metadata: document.metadata,
        createdAt: document.createdAt.toISOString(),
      },
      { excludeExtraneousValues: true },
    );
  }

  toResponseList(documents: DocumentRecord[]): DocumentResponse[] {
    return documents.map((document) => this.toResponse(document));
  }
}
