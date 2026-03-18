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
    const statuses =
      await optionalApiRequest<Array<Record<string, unknown>>>("/documents/status");

    if (statuses) {
      return {
        items: statuses.map((source) => ({
          id: Number(source.documentId ?? source.id ?? 0),
          filename: String(source.fileName ?? source.filename ?? "Source"),
          sourceChannel:
            typeof source.sourceChannel === "string"
              ? source.sourceChannel
              : null,
          type: String(source.type ?? "unknown"),
          createdAt: String(
            source.createdAt ??
              source.uploadedAt ??
              source.created_at ??
              new Date().toISOString(),
          ),
          updatedAt: String(
            source.updatedAt ??
              source.uploadedAt ??
              source.updated_at ??
              new Date().toISOString(),
          ),
          status: normalizeStatus(source.status),
          currentStep:
            typeof source.currentStep === "string" ? source.currentStep : null,
          errorMessage:
            typeof source.errorMessage === "string" ? source.errorMessage : null,
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
              status: "completed",
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

function normalizeStatus(
  status: unknown,
): "pending" | "processing" | "completed" | "failed" {
  switch (String(status ?? "").toUpperCase()) {
    case "PROCESSING":
      return "processing";
    case "COMPLETED":
      return "completed";
    case "FAILED":
      return "failed";
    case "PENDING":
    default:
      return "pending";
  }
}
