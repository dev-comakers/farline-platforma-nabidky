import { formatCurrency } from "@/lib/calculations";
import type { OfferSummary } from "@/lib/types";

export function SummaryBlock({ summary }: { summary: OfferSummary }) {
  return (
    <div className={`bg-white border border-zinc-200/70 rounded-2xl p-4 sm:p-6 grid grid-cols-2 gap-4 ${summary.showVat ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
      <div>
        <div className="text-[10px] sm:text-xs uppercase tracking-wider text-zinc-500 mb-1 sm:mb-2">Před slevou</div>
        <div className="text-base sm:text-2xl font-semibold font-mono tabular-nums text-zinc-900 break-all">
          {formatCurrency(summary.totalBeforeDiscount, summary.currency)}
        </div>
      </div>
      <div>
        <div className="text-[10px] sm:text-xs uppercase tracking-wider text-zinc-500 mb-1 sm:mb-2">Sleva</div>
        <div className="text-base sm:text-2xl font-semibold font-mono tabular-nums text-zinc-500 break-all">
          − {formatCurrency(summary.totalDiscount, summary.currency)}
        </div>
      </div>
      {summary.showVat && (
        <div>
          <div className="text-[10px] sm:text-xs uppercase tracking-wider text-zinc-500 mb-1 sm:mb-2">
            DPH 21&nbsp;%
          </div>
          <div className="text-base sm:text-2xl font-semibold font-mono tabular-nums text-zinc-700 break-all">
            + {formatCurrency(summary.vatAmount, summary.currency)}
          </div>
        </div>
      )}
      <div className="border-l border-zinc-200/70 pl-3 sm:pl-4">
        <div className="text-[10px] sm:text-xs uppercase tracking-wider mb-1 sm:mb-2" style={{ color: "var(--accent)" }}>
          {summary.showVat ? "Celkem s DPH" : "Cena po slevě"}
        </div>
        <div className="text-base sm:text-2xl font-semibold font-mono tabular-nums break-all" style={{ color: "var(--accent)" }}>
          {formatCurrency(
            summary.showVat ? summary.totalWithVat : summary.totalAfterDiscount,
            summary.currency
          )}
        </div>
      </div>
    </div>
  );
}
