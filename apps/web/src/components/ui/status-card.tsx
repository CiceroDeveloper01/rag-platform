import { SectionCard } from "./section-card";
import { StatusPill } from "./status-pill";

export function StatusCard({
  title,
  value,
  description,
  tone = "neutral",
}: {
  title: string;
  value: string;
  description: string;
  tone?: "neutral" | "success" | "error" | "info" | "warning";
}) {
  return (
    <SectionCard className="space-y-4">

      <div className="flex items-center justify-between gap-4">

        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    {title}

        </div>
                <StatusPill tone={tone}>{value}</StatusPill>

      </div>
            <p className="text-sm leading-7 text-slate-600">{description}</p>

    </SectionCard>
  );
}
