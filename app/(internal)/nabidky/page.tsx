"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { useStore, createEmptyOffer } from "@/lib/store";
import { StatusBadge } from "@/components/StatusBadge";
import { offerSummary, formatCurrency, formatDate } from "@/lib/calculations";
import type { OfferStatus } from "@/lib/types";

type FilterKey = "vsechny" | OfferStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "vsechny", label: "Všechny" },
  { key: "rozpracovana", label: "Rozpracované" },
  { key: "odeslana", label: "Odeslané" },
  { key: "okomentovana", label: "Okomentované" },
  { key: "potvrzena", label: "Potvrzené" },
];

export default function NabidkyPage() {
  const { offers, products, addOffer } = useStore();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("vsechny");

  const filtered = offers.filter((o) =>
    filter === "vsechny" ? true : o.status === filter
  );

  const counts: Record<FilterKey, number> = {
    vsechny: offers.length,
    rozpracovana: offers.filter((o) => o.status === "rozpracovana").length,
    odeslana: offers.filter((o) => o.status === "odeslana").length,
    okomentovana: offers.filter((o) => o.status === "okomentovana").length,
    potvrzena: offers.filter((o) => o.status === "potvrzena").length,
  };

  const handleCreate = () => {
    const offer = createEmptyOffer();
    addOffer(offer);
    router.push(`/nabidky/${offer.id}`);
  };

  return (
    <div className="px-10 py-8 max-w-[1400px]">
      <header className="flex items-end justify-between mb-8">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-400 mb-2">
            Nabídky
          </div>
          <h1
            className="text-4xl font-semibold tracking-tight text-zinc-900"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Seznam nabídek
          </h1>
        </div>
        <button
          onClick={handleCreate}
          className="btn-tactile inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white shadow-sm"
          style={{ background: "var(--accent)" }}
        >
          <Plus size={16} weight="bold" /> Nová nabídka
        </button>
      </header>

      <div className="flex gap-1 mb-6 border-b border-zinc-200/70">
        {FILTERS.map((f) => {
          const isActive = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                {f.label}
                <span className="text-xs text-zinc-400 tabular-nums">
                  {counts[f.key]}
                </span>
              </span>
              {isActive && (
                <span
                  className="absolute left-2 right-2 bottom-0 h-0.5 rounded-full"
                  style={{ background: "var(--accent)" }}
                />
              )}
            </button>
          );
        })}
      </div>

      <section className="bg-white border border-zinc-200/70 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-zinc-400">
              <th className="px-6 py-3 font-medium">Akce</th>
              <th className="px-6 py-3 font-medium">Architekt</th>
              <th className="px-6 py-3 font-medium">Datum</th>
              <th className="px-6 py-3 font-medium text-right">Položky</th>
              <th className="px-6 py-3 font-medium text-right">Cena po slevě</th>
              <th className="px-6 py-3 font-medium">Stav</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const summary = offerSummary(o, products);
              return (
                <tr
                  key={o.id}
                  className="border-t border-zinc-100 hover:bg-zinc-50/70 cursor-pointer transition-colors"
                  onClick={() => router.push(`/nabidky/${o.id}`)}
                >
                  <td className="px-6 py-4 font-medium text-zinc-900">{o.name}</td>
                  <td className="px-6 py-4 text-zinc-600">{o.architect || "—"}</td>
                  <td className="px-6 py-4 text-zinc-500 font-mono text-xs tabular-nums">
                    {formatDate(o.updatedAt)}
                  </td>
                  <td className="px-6 py-4 text-right text-zinc-600 font-mono tabular-nums">
                    {summary.itemCount}
                  </td>
                  <td className="px-6 py-4 text-right font-mono tabular-nums text-zinc-900">
                    {formatCurrency(summary.totalAfterDiscount, o.currency)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={o.status} pulse />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-zinc-500">
                  Žádné nabídky v této kategorii.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
