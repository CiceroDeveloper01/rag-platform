import { StatusPill } from "@/src/components/ui/status-pill";
import { cn } from "@/src/lib/utils/cn";

export function SuccessFeedback({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-emerald-200 bg-emerald-50/90 px-5 py-4",
        className,
      )}
    >

      <div className="flex flex-wrap items-center gap-3">
                <StatusPill tone="success">Success</StatusPill>
                <h3 className="font-medium text-emerald-900">{title}</h3>

      </div>

      <p className="mt-3 text-sm leading-7 text-emerald-800">{description}</p>

    </div>
  );
}
