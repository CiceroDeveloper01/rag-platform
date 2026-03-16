"use client";

export function ConversationDeleteButton({
  onDelete,
}: {
  onDelete: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        if (window.confirm("Deseja remover esta conversa?")) {
          onDelete();
        }
      }}
      className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
      aria-label="Excluir conversa"
    >
            Delete
    </button>
  );
}
