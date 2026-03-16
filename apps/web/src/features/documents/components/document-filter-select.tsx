import type { DocumentFiltersState } from "../types/documents.types";

export function DocumentFilterSelect({
  value,
  onChange,
}: {
  value: DocumentFiltersState["type"];
  onChange: (value: DocumentFiltersState["type"]) => void;
}) {
  return (
    <select
      aria-label="Filtrar documentos por tipo"
      value={value}
      onChange={(event) =>
        onChange(event.target.value as DocumentFiltersState["type"])
      }
      className="h-11 rounded-[18px] border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
    >
            <option value="all">Todos os tipos</option>
            <option value="pdf">PDF</option>
            <option value="txt">TXT</option>
            <option value="other">Outros</option>

    </select>
  );
}
