import { formatCurrency } from "@/lib/calculations";
import type { OfferSummary } from "@/lib/types";

export function SummaryBlock({ summary }: { summary: OfferSummary }) {
  const cols = summary.showVat ? 4 : 3;

  return (
    <div
      className="bg-white border border-zinc-200/70 rounded-2xl p-6"
      style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "1rem" }}
    >
      <div>
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Před slevou</div>
        <div className="text-2xl font-semibold font-mono tabular-nums text-zinc-900">
          {formatCurrency(summary.totalBeforeDiscount, summary.currency)}
        </div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Sleva</div>
        <div className="text-2xl font-semibold font-mono tabular-nums text-zinc-500">
          − {formatCurrency(summary.totalDiscount, summary.currency)}
        </div>
      </div>
      {summary.showVat && (
        <div>
          <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
            DPH 21&nbsp;%
          </div>
          <div className="text-2xl font-semibold font-mono tabular-nums text-zinc-700">
            + {formatCurrency(summary.vatAmount, summary.currency)}
          </div>
        </div>
      )}
      <div className="border-l border-zinc-200/70 pl-4">
        <div className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--accent)" }}>
          {summary.showVat ? "Celkem s DPH" : "Cena po slevě"}
        </div>
        <div className="text-2xl font-semibold font-mono tabular-nums" style={{ color: "var(--accent)" }}>
          {formatCurrency(
            summary.showVat ? summary.totalWithVat : summary.totalAfterDiscount,
            summary.currency
          )}
        </div>
      </div>
    </div>
  );
}
