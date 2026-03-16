"use client";

import { cn } from "@/src/lib/utils/cn";

export function UploadDropzone({
  file,
  onFileSelect,
}: {
  file: File | null;
  onFileSelect: (file: File | null) => void;
}) {
  return (
    <label
      className={cn(
        "block rounded-[28px] border border-dashed border-slate-300 bg-slate-50/90 p-8 text-center transition hover:border-sky-300 hover:bg-sky-50/50",
        file ? "border-sky-300 bg-sky-50/70" : "",
      )}
    >

      <div className="space-y-3">

        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <span className="text-xl">↑</span>

        </div>

        <div className="font-medium text-slate-900">

          {file ? file.name : "Arraste ou selecione um arquivo para ingestao"}

        </div>

        <div className="text-sm text-slate-500">
                    Formatos aceitos: PDF e TXT
        </div>

      </div>

      <input
        type="file"
        accept=".pdf,.txt,text/plain,application/pdf"
        className="sr-only"
        onChange={(event) => onFileSelect(event.target.files?.[0] ?? null)}
      />

    </label>
  );
}
