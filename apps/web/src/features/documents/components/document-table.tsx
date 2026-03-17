import { ErrorState } from "@/src/components/states/error-state";
import { LoadingPanel } from "@/src/components/states/loading-panel";
import { SectionCard } from "@/src/components/ui/section-card";
import { StatusPill } from "@/src/components/ui/status-pill";
import type {
  DocumentListItem,
  DocumentFiltersState,
} from "../types/documents.types";
import { DocumentEmptyState } from "./document-empty-state";
import { DocumentTableRow } from "./document-table-row";
import { DocumentToolbar } from "./document-toolbar";

export function DocumentTable({
  documents,
  isLoading,
  error,
  source,
  unavailableReason,
  filters,
  onChangeFilters,
  onEditDocument,
  onDeleteDocument,
}: {
  documents: DocumentListItem[];
  isLoading: boolean;
  error: string | null;
  source: "api" | "local";
  unavailableReason: string | null;
  filters: DocumentFiltersState;
  onChangeFilters: (next: Partial<DocumentFiltersState>) => void;
  onEditDocument: (
    documentId: number,
    payload: { filename: string; type: string },
  ) => Promise<void> | void;
  onDeleteDocument: (documentId: number) => Promise<void> | void;
}) {
  if (isLoading) {
    return (
      <LoadingPanel
        title="Carregando documentos"
        description="Buscando a listagem exposta pela API ou o historico local do frontend."
      />
    );
  }

  if (error) {
    return <ErrorState description={error} />;
  }

  return (
    <SectionCard className="space-y-5">

      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>

          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Documents inventory
          </div>

          <h2 className="mt-2 font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
                        Gerenciamento de documentos
          </h2>

        </div>

        <StatusPill tone={source === "api" ? "success" : "warning"}>
                    {source === "api" ? "API list" : "Local fallback"}

        </StatusPill>

      </div>

      <DocumentToolbar filters={filters} onChange={onChangeFilters} />

      {documents.length === 0 ? (
        <DocumentEmptyState
          description={
            unavailableReason ??
            "Nenhum documento corresponde aos filtros atuais. Ajuste a busca ou faca um novo upload."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">

          <table className="min-w-full border-collapse">

            <thead className="bg-slate-50/90">

              <tr className="text-left text-xs uppercase tracking-[0.22em] text-slate-500">
                                <th className="px-4 py-4">Arquivo</th>
                                <th className="px-4 py-4">Channel</th>
                                <th className="px-4 py-4">Status</th>
                                <th className="px-4 py-4">Step</th>
                                <th className="px-4 py-4">Updated At</th>
                                <th className="px-4 py-4">Error</th>
                                <th className="px-4 py-4 text-right">Acoes</th>

              </tr>

            </thead>

            <tbody>

              {documents.map((document) => (
                <DocumentTableRow
                  key={`${document.id}-${document.createdAt}`}
                  item={document}
                  onEdit={(payload) => onEditDocument(document.id, payload)}
                  onDelete={() => onDeleteDocument(document.id)}
                />
              ))}

            </tbody>

          </table>

        </div>
      )}

    </SectionCard>
  );
}
