"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { documentsApiService } from "../services/documents-api.service";
import type {
  DocumentListItem,
  DocumentFiltersState,
  DocumentsListResponse,
  UpdateDocumentPayload,
  UploadDocumentResponse,
} from "../types/documents.types";

const LOCAL_STORAGE_KEY = "rag-platform.documents.upload-history";

function readLocalHistory(): DocumentListItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DocumentListItem[]) : [];
  } catch {
    return [];
  }
}

function writeLocalHistory(items: DocumentListItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
}

export function useDocumentUpload() {
  const [result, setResult] = useState<UploadDocumentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [documentsSource, setDocumentsSource] =
    useState<DocumentsListResponse["source"]>("local");
  const [documentsUnavailableReason, setDocumentsUnavailableReason] = useState<
    string | null
  >(null);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [isMutatingDocument, setIsMutatingDocument] = useState(false);
  const [filters, setFilters] = useState<DocumentFiltersState>({
    search: "",
    type: "all",
    sort: "newest",
  });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const localHistory = readLocalHistory();
    setDocuments(localHistory);

    let isMounted = true;

    async function loadDocuments() {
      try {
        const response = await documentsApiService.listDocuments();

        if (!isMounted) {
          return;
        }

        if (response.items.length > 0) {
          setDocuments(response.items);
          writeLocalHistory(response.items);
        }

        setDocumentsSource(response.source);
        setDocumentsUnavailableReason(response.unavailableReason ?? null);
      } catch (requestError) {
        console.error("[documents] list request failed", requestError);

        if (isMounted) {
          setDocumentsError(
            requestError instanceof Error
              ? requestError.message
              : "Nao foi possivel listar os documentos.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingDocuments(false);
        }
      }
    }

    void loadDocuments();

    return () => {
      isMounted = false;
    };
  }, []);

  function upload(
    file: File,
    options?: { chunkSize?: number; chunkOverlap?: number },
  ) {
    setError(null);
    setResult(null);
    setProgress(8);

    startTransition(async () => {
      const progressInterval = window.setInterval(() => {
        setProgress((current) => (current >= 92 ? current : current + 9));
      }, 280);

      try {
        const response = await documentsApiService.uploadDocument(
          file,
          options,
        );
        setResult(response);
        setProgress(100);
        setDocuments((current) => {
          const next = [
            {
              id: response.sourceId,
              filename: response.filename,
              type: file.type || "application/octet-stream",
              createdAt: response.uploadedAt,
              status: "processed" as const,
              chunksGenerated: response.chunksGenerated,
              documentsProcessed: response.documentsProcessed,
            },
            ...current.filter((item) => item.id !== response.sourceId),
          ];
          writeLocalHistory(next);
          return next;
        });
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Nao foi possivel concluir o upload.";

        console.error("[documents] upload failed", requestError);
        setError(message);
        setProgress(0);
      } finally {
        window.clearInterval(progressInterval);
      }
    });
  }

  const processedDocuments = useMemo(
    () => documents.filter((document) => document.status === "processed"),
    [documents],
  );

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();

    return [...documents]
      .filter((document) => {
        const matchesSearch =
          normalizedSearch.length === 0 ||
          document.filename.toLowerCase().includes(normalizedSearch) ||
          document.type.toLowerCase().includes(normalizedSearch);

        const normalizedType = document.type.toLowerCase();
        const matchesType =
          filters.type === "all" ||
          (filters.type === "pdf" && normalizedType.includes("pdf")) ||
          (filters.type === "txt" &&
            (normalizedType.includes("text") ||
              normalizedType.includes("txt"))) ||
          (filters.type === "other" &&
            !normalizedType.includes("pdf") &&
            !normalizedType.includes("text") &&
            !normalizedType.includes("txt"));

        return matchesSearch && matchesType;
      })
      .sort((left, right) => {
        const diff =
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime();

        return filters.sort === "newest" ? diff : diff * -1;
      });
  }, [documents, filters]);

  async function updateDocument(
    documentId: number,
    payload: UpdateDocumentPayload,
  ) {
    setIsMutatingDocument(true);

    try {
      const updatedDocument = await documentsApiService.updateDocument(
        documentId,
        payload,
      );

      setDocuments((current) => {
        const next = current.map((document) =>
          document.id === documentId
            ? {
                ...document,
                filename: String(updatedDocument.filename ?? document.filename),
                type: String(updatedDocument.type ?? document.type),
              }
            : document,
        );
        writeLocalHistory(next);
        return next;
      });
    } finally {
      setIsMutatingDocument(false);
    }
  }

  async function deleteDocument(documentId: number) {
    setIsMutatingDocument(true);

    try {
      await documentsApiService.deleteDocument(documentId);
      setDocuments((current) => {
        const next = current.filter((document) => document.id !== documentId);
        writeLocalHistory(next);
        return next;
      });
    } finally {
      setIsMutatingDocument(false);
    }
  }

  return {
    result,
    error,
    progress,
    isPending,
    documents,
    processedDocuments,
    filteredDocuments,
    documentsError,
    documentsSource,
    documentsUnavailableReason,
    isLoadingDocuments,
    isMutatingDocument,
    filters,
    setFilters,
    upload,
    updateDocument,
    deleteDocument,
  };
}
