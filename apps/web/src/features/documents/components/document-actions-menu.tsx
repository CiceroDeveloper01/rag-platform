import type { DocumentListItem } from "../types/documents.types";
import { DocumentDeleteDialog } from "./document-delete-dialog";
import { DocumentEditDialog } from "./document-edit-dialog";

export function DocumentActionsMenu({
  item,
  onEdit,
  onDelete,
}: {
  item: DocumentListItem;
  onEdit: (payload: { filename: string; type: string }) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
}) {
  return (
    <div className="inline-flex items-center gap-2">

      <DocumentEditDialog item={item} onSave={onEdit} />

      <DocumentDeleteDialog filename={item.filename} onConfirm={onDelete} />

    </div>
  );
}
