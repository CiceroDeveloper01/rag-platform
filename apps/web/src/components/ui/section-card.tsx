import { cn } from "@/src/lib/utils/cn";

export function SectionCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-[30px] border border-slate-200/80 bg-white/88 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur",
        className,
      )}
    >
            {children}

    </section>
  );
}
