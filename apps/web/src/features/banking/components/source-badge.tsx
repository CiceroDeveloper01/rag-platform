import type { BankingDataSource } from "../types/banking.types";

export function SourceBadge({ source }: { source: BankingDataSource }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${
        source === "api"
          ? "bg-emerald-100 text-emerald-700"
          : "bg-amber-100 text-amber-700"
      }`}
    >
      {source === "api" ? "Dados reais" : "Mock coerente"}
    </span>
  );
}
