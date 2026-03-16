import { Injectable } from "@nestjs/common";
import type {
  AttachmentPayload,
  ChannelMessageEvent,
  DocumentPayload,
} from "@rag-platform/contracts";

export interface DownloadedDocument {
  documentId: string;
  fileName: string;
  mimeType: string;
  fileSize?: number;
  providerFileId?: string;
  extractedText?: string;
  bodyFallback?: string;
}

@Injectable()
export class DownloadFileToolService {
  async execute(payload: {
    message: ChannelMessageEvent;
  }): Promise<DownloadedDocument> {
    const canonicalDocument = payload.message.document;
    const attachment = payload.message.attachments?.[0];
    const resolved = this.resolveDocument(
      canonicalDocument,
      attachment,
      payload.message,
    );

    return {
      documentId:
        resolved.providerFileId ??
        resolved.storageKey ??
        payload.message.externalMessageId,
      fileName: resolved.fileName ?? "document",
      mimeType: resolved.mimeType ?? "application/octet-stream",
      fileSize: resolved.fileSize,
      providerFileId: resolved.providerFileId,
      extractedText: resolved.extractedText,
      bodyFallback: payload.message.text ?? payload.message.body,
    };
  }

  private resolveDocument(
    document: DocumentPayload | undefined,
    attachment: AttachmentPayload | undefined,
    message: ChannelMessageEvent,
  ) {
    return {
      providerFileId: document?.providerFileId ?? attachment?.providerFileId,
      storageKey: document?.storageKey ?? attachment?.storageKey,
      fileName:
        document?.fileName ??
        attachment?.fileName ??
        message.subject ??
        "document",
      mimeType:
        document?.mimeType ??
        attachment?.mimeType ??
        "application/octet-stream",
      fileSize: document?.fileSize ?? attachment?.fileSize,
      extractedText:
        document?.extractedText ?? attachment?.extractedText ?? undefined,
    };
  }
}
