"use client";

export function DocumentDeleteDialog({
  filename,
  onConfirm,
}: {
  filename: string;
  onConfirm: () => Promise<void> | void;
}) {
  return (
    <button
      type="button"
      onClick={async () => {
        if (window.confirm(`Deseja excluir "${filename}"?`)) {
          await onConfirm();
        }
      }}
      className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
      aria-label={`Excluir ${filename}`}
    >
            Delete
    </button>
  );
}
