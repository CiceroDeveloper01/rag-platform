export function ServiceLinkCard({
  title,
  href,
  description,
}: {
  title: string;
  href: string;
  description: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-[24px] border border-slate-200 bg-white/92 px-5 py-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
    >

      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Service link
      </div>

      <div className="mt-2 font-[family:var(--font-heading)] text-xl font-semibold text-slate-950">
                {title}

      </div>

      <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>

      <div className="mt-4 break-all font-[family:var(--font-mono)] text-xs text-slate-400">
                {href}

      </div>

    </a>
  );
}
