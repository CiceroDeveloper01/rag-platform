export function ChatLoadingMessage() {
  return (
    <div className="mr-auto max-w-[92%] rounded-[28px] border border-slate-200 bg-white px-5 py-4 shadow-[0_16px_35px_rgba(15,23,42,0.04)]">

      <div className="flex items-center gap-2">

        <span className="size-2 animate-pulse rounded-full bg-sky-500" />

        <span className="size-2 animate-pulse rounded-full bg-sky-400 [animation-delay:150ms]" />

        <span className="size-2 animate-pulse rounded-full bg-sky-300 [animation-delay:300ms]" />

      </div>

      <p className="mt-3 text-sm text-slate-500">
                A resposta esta chegando em streaming...
      </p>

    </div>
  );
}
