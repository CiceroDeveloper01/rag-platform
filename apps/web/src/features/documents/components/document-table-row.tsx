import type { DocumentListItem as DocumentListItemModel } from "../types/documents.types";
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
            <td className="px-4 py-4 text-sm text-slate-600">{item.type}</td>

      <td className="px-4 py-4 text-sm text-slate-600">
                {new Date(item.createdAt).toLocaleString("pt-BR")}

      </td>

      <td className="px-4 py-4 text-sm text-slate-600">
                {item.chunksGenerated ?? item.chunksCount ?? "n/a"}

      </td>

      <td className="px-4 py-4">

        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600">
                    {item.status}

        </span>

      </td>

      <td className="px-4 py-4 text-right">

        <DocumentActionsMenu item={item} onEdit={onEdit} onDelete={onDelete} />

      </td>

    </tr>
  );
}
