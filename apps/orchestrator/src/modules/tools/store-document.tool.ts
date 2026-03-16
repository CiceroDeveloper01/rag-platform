import { Injectable } from "@nestjs/common";

export interface StoredDocumentDescriptor {
  documentId: string;
  metadata: Record<string, unknown>;
}

@Injectable()
export class StoreDocumentToolService {
  async execute(payload: {
    documentId: string;
    tenantId: string;
    channel: string;
    conversationId?: string;
    fileName: string;
    mimeType: string;
    fileSize?: number;
    createdAt: string;
    providerFileId?: string;
  }): Promise<StoredDocumentDescriptor> {
    return {
      documentId: payload.documentId,
      metadata: {
        tenantId: payload.tenantId,
        channel: payload.channel,
        conversationId: payload.conversationId,
        documentId: payload.documentId,
        fileName: payload.fileName,
        mimeType: payload.mimeType,
        fileSize: payload.fileSize,
        providerFileId: payload.providerFileId,
        createdAt: payload.createdAt,
      },
    };
  }
}
