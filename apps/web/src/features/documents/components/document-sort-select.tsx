import type { DocumentFiltersState } from "../types/documents.types";

export function DocumentSortSelect({
  value,
  onChange,
}: {
  value: DocumentFiltersState["sort"];
  onChange: (value: DocumentFiltersState["sort"]) => void;
}) {
  return (
    <select
      aria-label="Ordenar documentos"
      value={value}
      onChange={(event) =>
        onChange(event.target.value as DocumentFiltersState["sort"])
      }
      className="h-11 rounded-[18px] border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
    >
            <option value="newest">Mais recentes</option>
            <option value="oldest">Mais antigos</option>

    </select>
  );
}
