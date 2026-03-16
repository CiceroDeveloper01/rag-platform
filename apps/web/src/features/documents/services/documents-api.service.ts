import { ApiClientError } from "@/src/types/api";
import { apiRequest, optionalApiRequest } from "@/src/lib/api/api-client";
import type {
  DocumentsListResponse,
  UpdateDocumentPayload,
  UploadDocumentResponse,
} from "../types/documents.types";

export const documentsApiService = {
  async uploadDocument(
    file: File,
    options?: { chunkSize?: number; chunkOverlap?: number },
  ) {
    const formData = new FormData();
    formData.append("file", file);

    if (typeof options?.chunkSize === "number") {
      formData.append("chunkSize", String(options.chunkSize));
    }

    if (typeof options?.chunkOverlap === "number") {
      formData.append("chunkOverlap", String(options.chunkOverlap));
    }

    return apiRequest<UploadDocumentResponse>("/ingestion/upload", {
      method: "POST",
      body: formData,
    });
  },

  async listDocuments(): Promise<DocumentsListResponse> {
    const sources =
      await optionalApiRequest<Array<Record<string, unknown>>>("/sources");

    if (sources) {
      return {
        items: sources.map((source) => ({
          id: Number(source.id ?? 0),
          filename: String(source.filename ?? "Source"),
          type: String(source.type ?? "unknown"),
          createdAt: String(
            source.uploadedAt ?? source.created_at ?? new Date().toISOString(),
          ),
          status: "processed",
          chunksCount:
            Number(source.chunksCount ?? source.documentsProcessed ?? 0) ||
            undefined,
        })),
        source: "api",
      };
    }

    try {
      const documents =
        await optionalApiRequest<Array<Record<string, unknown>>>("/documents");

      if (documents) {
        return {
          items: documents.map((document) => {
            const metadata = document.metadata as
              | Record<string, unknown>
              | undefined;

            return {
              id: Number(document.id ?? 0),
              filename: String(
                metadata?.filename ?? `Document ${document.id ?? ""}`,
              ),
              type: String(metadata?.mimeType ?? "document"),
              createdAt: String(
                document.created_at ??
                  document.createdAt ??
                  new Date().toISOString(),
              ),
              status: "processed",
              chunksCount:
                Number(metadata?.totalChunks ?? metadata?.chunksCount ?? 0) ||
                undefined,
            };
          }),
          source: "api",
        };
      }

      return {
        items: [],
        source: "local",
        unavailableReason: "A API ainda nao expoe listagem de documentos.",
      };
    } catch (error) {
      if (error instanceof ApiClientError && error.statusCode === 404) {
        return {
          items: [],
          source: "local",
          unavailableReason: "A API ainda nao expoe listagem de documentos.",
        };
      }

      throw error;
    }
  },

  async updateDocument(documentId: number, payload: UpdateDocumentPayload) {
    return apiRequest<Record<string, unknown>>(
      `/sources/${String(documentId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
  },

  async deleteDocument(documentId: number) {
    return apiRequest<{ success: boolean }>(`/sources/${String(documentId)}`, {
      method: "DELETE",
    });
  },
};
