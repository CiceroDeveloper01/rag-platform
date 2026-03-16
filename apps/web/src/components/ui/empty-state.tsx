import { SectionCard } from "./section-card";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <SectionCard className="border-dashed bg-slate-50/80 text-center">

      <div className="mx-auto max-w-md space-y-3 py-8">

        <h3 className="font-[family:var(--font-heading)] text-xl font-semibold text-slate-900">
                    {title}

        </h3>

        <p className="text-sm leading-7 text-slate-600">{description}</p>

      </div>

    </SectionCard>
  );
}
