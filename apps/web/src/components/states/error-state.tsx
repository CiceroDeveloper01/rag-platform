import { SectionCard } from "@/src/components/ui/section-card";

export function ErrorState({
  title = "Algo saiu do esperado",
  description,
  action,
}: {
  title?: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <SectionCard className="border-rose-200/80 bg-rose-50/80">

      <div className="space-y-4">

        <div className="inline-flex rounded-full border border-rose-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-rose-700">
                    Error state
        </div>

        <div className="space-y-2">

          <h3 className="font-[family:var(--font-heading)] text-xl font-semibold text-rose-950">
                        {title}

          </h3>

          <p className="max-w-2xl text-sm leading-7 text-rose-700">
                        {description}

          </p>

        </div>
                {action ? <div>{action}</div> : null}

      </div>

    </SectionCard>
  );
}
