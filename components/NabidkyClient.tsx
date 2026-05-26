"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/calculations";
import type { Offer, OfferStatus } from "@/lib/types";

type FilterKey = "vsechny" | OfferStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "vsechny", label: "Všechny" },
  { key: "rozpracovana", label: "Rozpracované" },
  { key: "odeslana", label: "Odeslané" },
  { key: "okomentovana", label: "Okomentované" },
  { key: "potvrzena", label: "Potvrzené" },
];

interface OfferRow {
  offer: Offer;
  total: number;
  itemCount: number;
}

export function NabidkyClient({ offersWithTotals }: { offersWithTotals: OfferRow[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("vsechny");
  const [creating, setCreating] = useState(false);

  const offers = offersWithTotals.map((r) => r.offer);

  const filtered = offersWithTotals.filter(({ offer }) =>
    filter === "vsechny" ? true : offer.status === filter
  );

  const counts: Record<FilterKey, number> = {
    vsechny: offers.length,
    rozpracovana: offers.filter((o) => o.status === "rozpracovana").length,
    odeslana: offers.filter((o) => o.status === "odeslana").length,
    okomentovana: offers.filter((o) => o.status === "okomentovana").length,
    potvrzena: offers.filter((o) => o.status === "potvrzena").length,
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/offers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      if (res.ok) {
        const { offer } = await res.json();
        router.push(`/nabidky/${offer.id}`);
      }
    } finally {
      setCreating(false);
    }
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
          disabled={creating}
          className="btn-tactile inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white shadow-sm disabled:opacity-50"
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
            {filtered.map(({ offer, total, itemCount }) => (
              <tr
                key={offer.id}
                className="border-t border-zinc-100 hover:bg-zinc-50/70 cursor-pointer transition-colors"
                onClick={() => router.push(`/nabidky/${offer.id}`)}
              >
                <td className="px-6 py-4 font-medium text-zinc-900">{offer.name}</td>
                <td className="px-6 py-4 text-zinc-600">{offer.architect || "—"}</td>
                <td className="px-6 py-4 text-zinc-500 font-mono text-xs tabular-nums">
                  {formatDate(offer.updatedAt)}
                </td>
                <td className="px-6 py-4 text-right text-zinc-600 font-mono tabular-nums">
                  {itemCount}
                </td>
                <td className="px-6 py-4 text-right font-mono tabular-nums text-zinc-900">
                  {formatCurrency(total, offer.currency)}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={offer.status} pulse />
                </td>
              </tr>
            ))}
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
