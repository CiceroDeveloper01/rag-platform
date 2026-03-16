"use client";

export interface KeywordPoint {
  keyword: string;
  total: number;
}

export function KeywordCloud({ data }: { data: KeywordPoint[] }) {
  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">

      <div className="mb-4">

        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-fuchsia-600">
                    Busca
        </p>

        <h3 className="text-xl font-semibold text-slate-950">
                    Palavras mais buscadas
        </h3>

      </div>

      <div className="flex min-h-72 flex-wrap content-start gap-3">

        {data.length ? (
          data.map((item) => (
            <span
              key={item.keyword}
              className="rounded-full border border-fuchsia-200 bg-fuchsia-50 px-4 py-2 font-medium text-fuchsia-900"
              style={{
                fontSize: `${0.85 + Math.min(item.total, 8) * 0.14}rem`,
              }}
            >
                            {item.keyword}

            </span>
          ))
        ) : (
          <p className="text-sm text-slate-500">
                        As palavras-chave aparecem assim que os eventos comecam a chegar.

          </p>
        )}

      </div>

    </section>
  );
}
