import Link from "next/link";
import {
  FileText,
  CircleDashed,
  PaperPlaneTilt,
  ChatCircleDots,
  ArrowRight,
  Package,
} from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/db/prisma";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatRelative, formatDateTime } from "@/lib/calculations";
import { offerListSelect, mapOffer, commentSelect, mapComment, snapshotProducts } from "@/lib/db/selects";
import { offerSummary } from "@/lib/calculations";
import { CreateOfferButton } from "@/components/CreateOfferButton";
import type { Prisma } from "@prisma/client";

const extendedOfferSelect = {
  ...offerListSelect,
  createdBy: { select: { name: true } },
} satisfies Prisma.OfferSelect;

type DbOfferEx = Prisma.OfferGetPayload<{ select: typeof extendedOfferSelect }>;

function offerTotal(dbOffer: DbOfferEx): number {
  const offer = mapOffer(dbOffer);
  const products = snapshotProducts(dbOffer.items);
  return offerSummary(offer, products).totalAfterDiscount;
}

export default async function DashboardPage() {
  const [dbOffers, dbComments] = await Promise.all([
    prisma.offer.findMany({
      select: extendedOfferSelect,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.comment.findMany({
      select: commentSelect,
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const offers = dbOffers.map(mapOffer);
  const comments = dbComments.map(mapComment);

  const counts = {
    total: offers.length,
    rozpracovane: offers.filter((o) => o.status === "rozpracovana").length,
    odeslane: offers.filter((o) => o.status === "odeslana" || o.status === "okomentovana").length,
    noveKomentare: comments.filter((c) => c.isNew).length,
  };

  const recentDbOffers = dbOffers.slice(0, 5);

  const activity = [
    ...comments.map((c) => {
      const offer = offers.find((o) => o.id === c.offerId);
      return {
        id: `c-${c.id}`,
        when: c.createdAt,
        icon: ChatCircleDots,
        title: `Nový komentář od ${c.authorName}`,
        meta: offer?.name ?? "—",
        author: null as string | null,
        href: `/nabidky/${c.offerId}`,
      };
    }),
    ...dbOffers
      .filter((o) => o.status === "odeslana" || o.status === "okomentovana")
      .map((o) => ({
        id: `o-${o.id}`,
        when: o.updatedAt.toISOString(),
        icon: PaperPlaneTilt,
        title: `Nabídka odeslána`,
        meta: o.name,
        author: o.createdBy?.name ?? null,
        href: `/nabidky/${o.id}`,
      })),
  ]
    .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
    .slice(0, 6);

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-8 max-w-[1400px]">
      <header className="flex flex-wrap items-start sm:items-end justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-400 mb-2">
            Dashboard
          </div>
          <h1
            className="text-2xl sm:text-4xl font-semibold tracking-tight text-zinc-900"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Přehled
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/katalog"
            className="btn-tactile inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
          >
            <Package size={16} weight="duotone" color="var(--accent)" />
            Otevřít katalog
          </Link>
          <CreateOfferButton />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Celkem nabídek" value={counts.total} icon={FileText} accent />
            <MetricCard label="Rozpracované" value={counts.rozpracovane} icon={CircleDashed} />
            <MetricCard label="Odeslané" value={counts.odeslane} icon={PaperPlaneTilt} />
            <MetricCard
              label="Nové komentáře"
              value={counts.noveKomentare}
              icon={ChatCircleDots}
              accent={counts.noveKomentare > 0}
            />
          </div>

          <section className="bg-white border border-zinc-200/70 rounded-2xl overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h2
                className="text-lg font-semibold text-zinc-900"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Poslední nabídky
              </h2>
              <Link
                href="/nabidky"
                className="text-xs text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-1"
              >
                Všechny <ArrowRight size={12} />
              </Link>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-zinc-400">
                  <th className="px-6 py-3 font-medium">Akce</th>
                  <th className="px-6 py-3 font-medium">Klient</th>
                  <th className="px-6 py-3 font-medium text-right">Cena</th>
                  <th className="px-6 py-3 font-medium">Stav</th>
                </tr>
              </thead>
              <tbody>
                {recentDbOffers.map((dbOffer) => {
                  const o = mapOffer(dbOffer);
                  const total = offerTotal(dbOffer);
                  return (
                    <tr key={o.id} className="border-t border-zinc-100 hover:bg-zinc-50/70 cursor-pointer transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/nabidky/${o.id}`} className="font-medium text-zinc-900 hover:underline">
                          {o.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-zinc-600">{o.architect || "—"}</td>
                      <td className="px-6 py-4 text-right font-mono tabular-nums text-zinc-900">
                        {formatCurrency(total, o.currency)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={o.status} pulse />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </section>
        </div>

        <aside className="bg-white border border-zinc-200/70 rounded-2xl overflow-hidden h-fit">
          <div className="px-6 py-4 border-b border-zinc-100">
            <h2
              className="text-lg font-semibold text-zinc-900"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Aktivita
            </h2>
          </div>
          <ul className="divide-y divide-zinc-100">
            {activity.map((a) => (
              <li key={a.id}>
                <Link
                  href={a.href}
                  className="block px-6 py-4 hover:bg-zinc-50/70 transition-colors"
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5">
                      <a.icon size={16} weight="duotone" color="var(--accent)" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-zinc-900 truncate">{a.title}</div>
                      <div className="text-xs text-zinc-500 truncate">{a.meta}</div>
                      <div className="text-[11px] text-zinc-400 mt-1">
                        {formatRelative(a.when)}
                        <span className="text-zinc-300"> ({formatDateTime(a.when)})</span>
                        {a.author && <span className="text-zinc-400"> · {a.author}</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
            {activity.length === 0 && (
              <li className="px-6 py-8 text-sm text-zinc-500 text-center">
                Žádná nedávná aktivita.
              </li>
            )}
          </ul>
        </aside>
      </div>
    </div>
  );
}
