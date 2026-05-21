import { formatCurrency } from "@/lib/calculations";
import type { OfferSummary } from "@/lib/types";

export function SummaryBlock({ summary }: { summary: OfferSummary }) {
  return (
    <div className="grid grid-cols-3 gap-4 bg-white border border-zinc-200/70 rounded-2xl p-6">
      <div>
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
          Před slevou
        </div>
        <div
          className="text-2xl font-semibold font-mono tabular-nums text-zinc-900"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {formatCurrency(summary.totalBeforeDiscount, summary.currency)}
        </div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
          Sleva
        </div>
        <div className="text-2xl font-semibold font-mono tabular-nums text-zinc-500">
          − {formatCurrency(summary.totalDiscount, summary.currency)}
        </div>
      </div>
      <div className="border-l border-zinc-200/70 pl-4">
        <div
          className="text-xs uppercase tracking-wider mb-2"
          style={{ color: "var(--accent)" }}
        >
          Cena po slevě
        </div>
        <div
          className="text-2xl font-semibold font-mono tabular-nums"
          style={{ color: "var(--accent)" }}
        >
          {formatCurrency(summary.totalAfterDiscount, summary.currency)}
        </div>
      </div>
    </div>
  );
}
