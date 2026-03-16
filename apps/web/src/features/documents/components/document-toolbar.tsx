import type { DocumentFiltersState } from "../types/documents.types";
import { DocumentFilterSelect } from "./document-filter-select";
import { DocumentSearchInput } from "./document-search-input";
import { DocumentSortSelect } from "./document-sort-select";

export function DocumentToolbar({
  filters,
  onChange,
}: {
  filters: DocumentFiltersState;
  onChange: (next: Partial<DocumentFiltersState>) => void;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">

      <DocumentSearchInput
        value={filters.search}
        onChange={(value) => onChange({ search: value })}
      />

      <DocumentFilterSelect
        value={filters.type}
        onChange={(value) => onChange({ type: value })}
      />

      <DocumentSortSelect
        value={filters.sort}
        onChange={(value) => onChange({ sort: value })}
      />

    </div>
  );
}
