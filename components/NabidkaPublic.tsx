"use client";

import { useMemo, useState } from "react";
import {
  FilePdf,
  MicrosoftExcelLogo,
  CheckCircle,
  ChatCircleDots,
  PaperPlaneTilt,
} from "@phosphor-icons/react/dist/ssr";
import {
  offerSummary,
  itemTotalAfterDiscount,
  itemTotalBeforeDiscount,
  formatCurrency,
  formatDateTime,
  formatDate,
} from "@/lib/calculations";
import type { Comment, Offer, Product } from "@/lib/types";
import { ProductIconBox } from "@/components/ProductIconBox";
import { SummaryBlock } from "@/components/SummaryBlock";
import { useToast } from "@/components/Toast";
import { exportOfferToPdf } from "@/lib/pdf-export";
import { exportOfferToExcel } from "@/lib/excel-export";

export function NabidkaPublic({
  offer,
  snapshotProducts,
  initialComments,
}: {
  offer: Omit<Offer, "internalNote">;
  snapshotProducts: Product[];
  initialComments: Comment[];
}) {
  const { push } = useToast();
  const [comments, setComments] = useState<Comment[]>(initialComments);

  const productsById = useMemo(
    () => new Map(snapshotProducts.map((p) => [p.id, p])),
    [snapshotProducts]
  );
  const summary = useMemo(() => offerSummary(offer, snapshotProducts), [offer, snapshotProducts]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !text.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/offers/${offer.shareId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName: name.trim(), authorEmail: email.trim(), text: text.trim() }),
      });
      if (res.ok) {
        const { comment } = await res.json() as { comment: Comment };
        setComments((prev) => [...prev, comment]);
        setSubmitted(true);
        push("Notifikace odeslána Filipovi");
        setText("");
        setTimeout(() => setSubmitted(false), 2800);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-zinc-200/70 bg-white">
        <div className="max-w-5xl mx-auto px-8 py-8 text-center">
          <div
            className="text-[15px] tracking-[0.32em] uppercase font-semibold text-zinc-900"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Farline
          </div>
          <div
            className="text-[10px] tracking-[0.4em] uppercase text-zinc-400 mt-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Living
          </div>
          <div
            className="w-12 h-px mx-auto my-6"
            style={{ background: "var(--accent)" }}
          />
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-400 mb-2">
            Cenová nabídka
          </div>
          <h1
            className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {offer.name}
          </h1>
          {offer.architect && (
            <p className="mt-2 text-zinc-500 text-sm">
              Připraveno pro {offer.architect}
            </p>
          )}
          <p className="mt-1 text-xs text-zinc-400 font-mono">
            {formatDate(offer.updatedAt)}
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-10 space-y-6">
        <section className="bg-white border border-zinc-200/70 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-zinc-400">
                <th className="px-5 py-3 font-medium">Produkt</th>
                <th className="px-2 py-3 font-medium text-center">Počet</th>
                <th className="px-2 py-3 font-medium text-right">Jedn. cena</th>
                <th className="px-2 py-3 font-medium text-center">Sleva</th>
                <th className="px-5 py-3 font-medium text-right">Po slevě</th>
              </tr>
            </thead>
            <tbody>
              {offer.items.map((item) => {
                const p = productsById.get(item.productId);
                if (!p) return null;
                const before = itemTotalBeforeDiscount(item, p);
                const after = itemTotalAfterDiscount(item, p);
                return (
                  <tr key={item.id} className="border-t border-zinc-100">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <ProductIconBox type={p.type} size="xs" imageUrl={p.imageUrl} />
                        <div className="min-w-0">
                          <div className="font-mono text-[10px] text-zinc-500">{p.code}</div>
                          <div className="text-sm font-medium text-zinc-900">{p.name}</div>
                          <div className="text-[11px] text-zinc-500">{p.brand} · {p.decor}</div>
                          {item.note && (
                            <div className="text-[11px] text-amber-700 mt-0.5">{item.note}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-4 text-center font-mono tabular-nums text-sm">{item.quantity}</td>
                    <td className="px-2 py-4 text-right font-mono tabular-nums text-zinc-700 text-xs">
                      {formatCurrency(p.unitPrice, p.currency)}
                    </td>
                    <td className="px-2 py-4 text-center font-mono tabular-nums text-sm">
                      {item.discountPercent.toFixed(0)} %
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="font-mono tabular-nums text-sm font-medium text-zinc-900">
                        {formatCurrency(after, p.currency)}
                      </div>
                      {item.discountPercent > 0 && (
                        <div className="font-mono tabular-nums text-[10px] text-zinc-400 line-through">
                          {formatCurrency(before, p.currency)}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <SummaryBlock summary={summary} />

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <p className="text-xs text-zinc-500">
            Ceny jsou bez DPH. Platnost nabídky 30 dní.
          </p>
          <div className="flex gap-2">
            <button
              onClick={async () => { await exportOfferToPdf(offer, snapshotProducts); push("PDF staženo"); }}
              className="btn-tactile inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            >
              <FilePdf size={16} weight="duotone" color="var(--accent)" /> Stáhnout PDF
            </button>
            <button
              onClick={async () => { await exportOfferToExcel(offer, snapshotProducts); push("Excel staženo"); }}
              className="btn-tactile inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            >
              <MicrosoftExcelLogo size={16} weight="duotone" color="var(--accent)" /> Stáhnout Excel
            </button>
          </div>
        </div>

        <section className="mt-8">
          <h2
            className="text-xl font-semibold text-zinc-900 mb-4 flex items-center gap-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <ChatCircleDots size={18} weight="duotone" color="var(--accent)" />
            Komentáře
          </h2>

          {comments.length > 0 && (
            <ul className="space-y-3 mb-6">
              {comments.map((c) => (
                <li key={c.id} className="bg-white border border-zinc-200/70 rounded-xl px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-semibold shrink-0"
                      style={{ background: "var(--accent)" }}
                    >
                      {c.authorName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-zinc-900">{c.authorName}</div>
                      <p className="mt-1 text-sm text-zinc-700 whitespace-pre-line">{c.text}</p>
                      <div className="mt-1 text-[11px] text-zinc-400">{formatDateTime(c.createdAt)}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleSubmit} className="bg-white border border-zinc-200/70 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-zinc-900 mb-3">Přidat komentář</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                placeholder="Vaše jméno"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-zinc-400"
              />
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-zinc-400"
              />
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Co byste rádi sdělili Filipovi?"
              required
              rows={4}
              className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-zinc-400 resize-y"
            />
            <div className="mt-4 flex items-center justify-end gap-3">
              {submitted && (
                <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700 animate-spring-scale">
                  <CheckCircle size={16} weight="fill" /> Odesláno
                </span>
              )}
              <button
                type="submit"
                disabled={!name || !email || !text || submitting}
                className="btn-tactile inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                style={{ background: "var(--accent)" }}
              >
                <PaperPlaneTilt size={14} weight="bold" /> Odeslat komentář
              </button>
            </div>
          </form>
        </section>

        <footer className="text-center text-[11px] text-zinc-400 py-8">
          Powered by Farline Nabídky — coMakers.cz
        </footer>
      </main>
    </div>
  );
}
