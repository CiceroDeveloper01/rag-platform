"use client";

import { useState } from "react";
import { SuccessFeedback } from "@/src/components/states/success-feedback";
import { SectionCard } from "@/src/components/ui/section-card";
import { StatusPill } from "@/src/components/ui/status-pill";
import { DocumentTable } from "./document-table";
import { UploadDropzone } from "./upload-dropzone";
import { useDocumentUpload } from "../hooks/use-document-upload";

export function UploadPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [chunkSize, setChunkSize] = useState("500");
  const [chunkOverlap, setChunkOverlap] = useState("50");
  const {
    result,
    error,
    progress,
    isPending,
    upload,
    filteredDocuments,
    documentsError,
    documentsSource,
    documentsUnavailableReason,
    isLoadingDocuments,
    isMutatingDocument,
    filters,
    setFilters,
    updateDocument,
    deleteDocument,
  } = useDocumentUpload();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      return;
    }

    upload(file, {
      chunkSize: Number(chunkSize),
      chunkOverlap: Number(chunkOverlap),
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">

      <div className="space-y-6">

        <SectionCard className="space-y-6">

          <div className="space-y-2">
                        <StatusPill tone="info">Ingestion pipeline</StatusPill>

            <h2 className="font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
                            Upload de PDF e TXT com feedback mais rico

            </h2>

            <p className="text-sm leading-7 text-slate-600">
                            O frontend envia o arquivo para
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-[family:var(--font-mono)] text-xs">
                                /ingestion/upload
              </code>
                            e acompanha visualmente o andamento da operacao.

            </p>

          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            <UploadDropzone file={file} onFileSelect={setFile} />

            <div className="grid gap-4 sm:grid-cols-2">

              <label className="space-y-2">

                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                    Chunk size
                </span>

                <input
                  value={chunkSize}
                  onChange={(event) => setChunkSize(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />

              </label>

              <label className="space-y-2">

                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                    Chunk overlap
                </span>

                <input
                  value={chunkOverlap}
                  onChange={(event) => setChunkOverlap(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />

              </label>

            </div>

            <div className="space-y-3">

              <div className="flex items-center justify-between text-sm text-slate-500">
                                <span>Progresso estimado</span>
                                <span>{progress}%</span>

              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-100">

                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#0ea5e9,#2563eb)] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />

              </div>

            </div>

            <button
              type="submit"
              disabled={!file || isPending}
              className="inline-flex h-13 items-center justify-center rounded-[18px] bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
                            {isPending ? "Enviando..." : "Iniciar ingestao"}

            </button>

          </form>

          {result ? (
            <SuccessFeedback
              title="Document queued successfully"
              description={result.message}
            />
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {error}

            </div>
          ) : null}

        </SectionCard>

      </div>

      <DocumentTable
        documents={filteredDocuments}
        isLoading={isLoadingDocuments || isMutatingDocument}
        error={documentsError}
        source={documentsSource}
        unavailableReason={documentsUnavailableReason}
        filters={filters}
        onChangeFilters={(next) =>
          setFilters((current) => ({
            ...current,
            ...next,
          }))
        }
        onEditDocument={updateDocument}
        onDeleteDocument={deleteDocument}
      />

    </div>
  );
}
