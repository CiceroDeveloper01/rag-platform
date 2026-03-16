import { LoadingState } from "@/src/components/ui/loading-state";
import { SectionCard } from "@/src/components/ui/section-card";

export function LoadingPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <SectionCard className="space-y-4">

      <LoadingState label={title} />
            <p className="text-sm leading-7 text-slate-600">{description}</p>

    </SectionCard>
  );
}
