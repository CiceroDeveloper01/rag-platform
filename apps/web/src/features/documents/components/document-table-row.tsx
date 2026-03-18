import type { DocumentListItem as DocumentListItemModel } from "../types/documents.types";
import { StatusPill } from "@/src/components/ui/status-pill";
import { DocumentActionsMenu } from "./document-actions-menu";

export function DocumentTableRow({
  item,
  onEdit,
  onDelete,
}: {
  item: DocumentListItemModel;
  onEdit: (payload: { filename: string; type: string }) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
}) {
  return (
    <tr className="border-t border-slate-200/80">

      <td className="px-4 py-4 text-sm font-medium text-slate-950">
                {item.filename}

      </td>
            <td className="px-4 py-4 text-sm text-slate-600">
                {item.sourceChannel ?? "n/a"}

      </td>

      <td className="px-4 py-4">
        <StatusPill tone={resolveStatusTone(item.status)}>
          {item.status}
        </StatusPill>
      </td>

      <td className="px-4 py-4 text-sm text-slate-600">
                {item.currentStep ?? "n/a"}

      </td>

      <td className="px-4 py-4 text-sm text-slate-600">
                {new Date(item.updatedAt ?? item.createdAt).toLocaleString("pt-BR")}

      </td>

      <td className="px-4 py-4 text-sm text-slate-600">
                {item.errorMessage ?? "—"}

      </td>

      <td className="px-4 py-4 text-right">

        <DocumentActionsMenu item={item} onEdit={onEdit} onDelete={onDelete} />

      </td>

    </tr>
  );
}

function resolveStatusTone(status: DocumentListItemModel["status"]) {
  switch (status) {
    case "completed":
      return "success";
    case "failed":
      return "error";
    case "processing":
      return "info";
    case "pending":
    default:
      return "warning";
  }
}
