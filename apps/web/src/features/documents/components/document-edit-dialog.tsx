"use client";

import { useState } from "react";
import type { DocumentListItem } from "../types/documents.types";

export function DocumentEditDialog({
  item,
  onSave,
}: {
  item: DocumentListItem;
  onSave: (payload: { filename: string; type: string }) => Promise<void> | void;
}) {
  const [filename, setFilename] = useState(item.filename);
  const [type, setType] = useState(item.type);
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
        aria-label={`Editar ${item.filename}`}
      >
                Edit
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/30 p-4">

      <div
        className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.18)]"
        role="dialog"
        aria-modal="true"
        aria-label="Editar documento"
      >

        <div className="space-y-4">

          <h3 className="font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
                        Editar documento
          </h3>

          <label className="space-y-2">

            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                            Filename
            </span>

            <input
              value={filename}
              onChange={(event) => setFilename(event.target.value)}
              className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            />

          </label>

          <label className="space-y-2">

            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                            Type
            </span>

            <input
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            />

          </label>

          <div className="flex justify-end gap-3">

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex h-10 items-center justify-center rounded-[16px] border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700"
            >
                            Cancelar
            </button>

            <button
              type="button"
              onClick={async () => {
                await onSave({ filename, type });
                setIsOpen(false);
              }}
              className="inline-flex h-10 items-center justify-center rounded-[16px] bg-slate-950 px-4 text-sm font-medium text-white"
            >
                            Salvar
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}
