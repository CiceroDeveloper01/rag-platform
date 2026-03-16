export function LoadingState({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-slate-200/90 bg-white/92 px-4 py-2 text-sm text-slate-600 shadow-sm">

      <span className="inline-block size-2 animate-pulse rounded-full bg-sky-500" />

      <span className="inline-block size-2 animate-pulse rounded-full bg-sky-300 [animation-delay:150ms]" />
            {label}

    </div>
  );
}
