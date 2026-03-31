import { SectionCard } from "@/src/components/ui/section-card";
import { StatusPill } from "@/src/components/ui/status-pill";

export function FinancialStatCard({
  label,
  value,
  description,
  tone = "neutral",
}: {
  label: string;
  value: string;
  description: string;
  tone?: "neutral" | "success" | "error" | "info" | "warning";
}) {
  return (
    <SectionCard className="space-y-4 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.88))]">
      <div className="flex items-center justify-between gap-4">
        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
          {label}
        </div>
        <StatusPill tone={tone}>{value}</StatusPill>
      </div>
      <p className="text-sm leading-7 text-slate-600">{description}</p>
    </SectionCard>
  );
}
