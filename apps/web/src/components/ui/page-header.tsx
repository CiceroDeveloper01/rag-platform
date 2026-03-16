interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

      <div className="space-y-4">

        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                    {eyebrow}

        </div>

        <div className="space-y-3">

          <h1 className="max-w-4xl font-[family:var(--font-heading)] text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                        {title}

          </h1>

          <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                        {description}

          </p>

        </div>

      </div>
            {actions ? <div className="shrink-0">{actions}</div> : null}

    </header>
  );
}
