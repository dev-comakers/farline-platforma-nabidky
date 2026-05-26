"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash,
  ShareNetwork,
  FilePdf,
  MicrosoftExcelLogo,
  ChatCircleDots,
  PaperPlaneTilt,
  CheckCircle,
} from "@phosphor-icons/react/dist/ssr";
import {
  offerSummary,
  itemTotalAfterDiscount,
  itemTotalBeforeDiscount,
  formatCurrency,
  formatDateTime,
  formatRelative,
} from "@/lib/calculations";
import type { Comment, Currency, Offer, OfferItem, OfferStatus, Product } from "@/lib/types";
import { PhotoUploader } from "@/components/PhotoUploader";
import { ProductCatalogPanel } from "@/components/ProductCatalogPanel";
import { ShareModal } from "@/components/ShareModal";
import { SummaryBlock } from "@/components/SummaryBlock";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/Toast";
import { exportOfferToPdf } from "@/lib/pdf-export";
import { exportOfferToExcel } from "@/lib/excel-export";

type SaveStatus = "idle" | "saving" | "saved";

export function OfferEditor({
  initialOffer,
  snapshotProducts,
  allProducts,
  initialComments,
}: {
  initialOffer: Offer;
  snapshotProducts: Product[];
  allProducts: Product[];
  initialComments: Comment[];
}) {
  const router = useRouter();
  const { push } = useToast();

  const [offer, setOffer] = useState<Offer>(initialOffer);
  const [products, setProducts] = useState<Product[]>(snapshotProducts);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [showCatalog, setShowCatalog] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPatchRef = useRef<Partial<Offer>>({});

  const scheduleSave = useCallback((patch: Partial<Offer>) => {
    pendingPatchRef.current = { ...pendingPatchRef.current, ...patch };
    setSaveStatus("saving");

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const data = pendingPatchRef.current;
      pendingPatchRef.current = {};
      try {
        await fetch(`/api/offers/${offer.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        setSaveStatus("saved");
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("idle");
      }
    }, 1000);
  }, [offer.id]);

  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
  }, []);

  const updateField = <K extends keyof Offer>(key: K, value: Offer[K]) => {
    setOffer((prev) => ({ ...prev, [key]: value }));
    scheduleSave({ [key]: value });
  };

  const handleStatusChange = async (status: OfferStatus) => {
    const res = await fetch(`/api/offers/${offer.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setOffer((prev) => ({ ...prev, status }));
      push(status === "odeslana" ? "Nabídka označena jako odeslaná" : "Nabídka potvrzena");
    }
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/offers/${offer.id}`, { method: "DELETE" });
    if (res.ok) router.push("/nabidky");
  };

  const handleAddItem = async (productId: string) => {
    const res = await fetch(`/api/offers/${offer.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (res.ok) {
      const { item, product } = await res.json() as { item: OfferItem; product: Product };
      setOffer((prev) => ({ ...prev, items: [...prev.items, item] }));
      setProducts((prev) => {
        if (prev.find((p) => p.id === product.id)) return prev;
        return [...prev, product];
      });
      push("Produkt přidán");
    }
  };

  const handleUpdateItem = async (itemId: string, patch: Partial<Pick<OfferItem, "quantity" | "discountPercent" | "note">>) => {
    setOffer((prev) => ({
      ...prev,
      items: prev.items.map((i) => i.id === itemId ? { ...i, ...patch } : i),
    }));
    await fetch(`/api/offers/${offer.id}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  };

  const handleRemoveItem = async (itemId: string) => {
    setOffer((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== itemId) }));
    await fetch(`/api/offers/${offer.id}/items/${itemId}`, { method: "DELETE" });
  };

  const handleMarkRead = async () => {
    await fetch(`/api/offers/${offer.id}/comments/read`, { method: "PATCH" });
    setComments((prev) => prev.map((c) => ({ ...c, isNew: false })));
  };

  const productsById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );

  const summary = useMemo(() => offerSummary(offer, products), [offer, products]);

  const offerComments = comments;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-0 min-h-screen">
      <div className="px-10 py-8 max-w-[1100px]">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push("/nabidky")}
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900"
          >
            <ArrowLeft size={14} /> Zpět na seznam
          </button>
          <span className="text-xs text-zinc-400 font-mono">
            {saveStatus === "saving" && "Ukládání…"}
            {saveStatus === "saved" && "Uloženo"}
          </span>
        </div>

        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <StatusBadge status={offer.status} pulse />
            <span className="text-xs text-zinc-500">
              Upraveno {formatRelative(offer.updatedAt)}
            </span>
          </div>
          <input
            value={offer.name}
            onChange={(e) => updateField("name", e.target.value)}
            className="block w-full bg-transparent text-4xl font-semibold tracking-tight text-zinc-900 focus:outline-none border-b border-transparent focus:border-zinc-200 py-1"
            style={{ fontFamily: "var(--font-display)" }}
          />
          <div className="mt-3 flex items-center gap-2 text-sm text-zinc-500">
            <span>Architekt:</span>
            <input
              value={offer.architect}
              onChange={(e) => updateField("architect", e.target.value)}
              placeholder="Jméno architekta / studio"
              className="bg-transparent text-zinc-900 focus:outline-none flex-1 border-b border-transparent focus:border-zinc-200"
            />
            <CurrencyToggle
              value={offer.currency}
              onChange={(c) => updateField("currency", c)}
            />
          </div>
        </header>

        <section className="bg-white border border-zinc-200/70 rounded-2xl overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2
              className="text-base font-semibold text-zinc-900"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Položky nabídky ({offer.items.length})
            </h2>
            <button
              onClick={() => setShowCatalog(true)}
              className="btn-tactile inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
              style={{ background: "var(--accent)" }}
            >
              <Plus size={14} weight="bold" /> Přidat z katalogu
            </button>
          </div>

          {offer.items.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-zinc-500">
              Žádné položky. Přidejte produkty z katalogu.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-zinc-400">
                  <th className="px-4 py-3 font-medium">Produkt</th>
                  <th className="px-2 py-3 font-medium text-center">Počet</th>
                  <th className="px-2 py-3 font-medium text-right">Jedn. cena</th>
                  <th className="px-2 py-3 font-medium text-center">Sleva</th>
                  <th className="px-4 py-3 font-medium text-right">Po slevě</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {offer.items.map((item) => {
                  const product = productsById.get(item.productId);
                  if (!product) return null;
                  const totalBefore = itemTotalBeforeDiscount(item, product);
                  const totalAfter = itemTotalAfterDiscount(item, product);
                  return (
                    <tr
                      key={item.id}
                      className="border-t border-zinc-100 hover:bg-zinc-50/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <PhotoUploader
                            product={product}
                            size="sm"
                            onUpdate={(imagePath) => {
                              setProducts((prev) =>
                                prev.map((p) => p.id === product.id ? { ...p, imageUrl: imagePath } : p)
                              );
                            }}
                          />
                          <div className="min-w-0">
                            <div className="font-mono text-[10px] text-zinc-500">
                              {product.code}
                            </div>
                            <div className="text-sm font-medium text-zinc-900 truncate max-w-[340px]">
                              {product.name}
                            </div>
                            <div className="text-[11px] text-zinc-500">
                              {product.brand} · {product.decor}
                            </div>
                            {item.note && (
                              <div className="text-[11px] text-amber-700 mt-0.5">
                                Pozn.: {item.note}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center">
                        <QtyStepper
                          value={item.quantity}
                          onChange={(q) => handleUpdateItem(item.id, { quantity: q })}
                        />
                      </td>
                      <td className="px-2 py-3 text-right font-mono tabular-nums text-zinc-700 text-xs">
                        {formatCurrency(product.unitPrice, product.currency)}
                      </td>
                      <td className="px-2 py-3 text-center">
                        <DiscountInput
                          value={item.discountPercent}
                          onChange={(d) => handleUpdateItem(item.id, { discountPercent: d })}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-mono tabular-nums text-sm font-medium text-zinc-900">
                          {formatCurrency(totalAfter, product.currency)}
                        </div>
                        {item.discountPercent > 0 && (
                          <div className="font-mono tabular-nums text-[10px] text-zinc-400 line-through">
                            {formatCurrency(totalBefore, product.currency)}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-3">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-zinc-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50"
                          aria-label="Odstranit"
                        >
                          <Trash size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <SummaryBlock summary={summary} />

        <section className="mt-6 bg-white border border-zinc-200/70 rounded-2xl p-6">
          <h3
            className="text-sm font-semibold text-zinc-900 mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Interní poznámka
          </h3>
          <textarea
            value={offer.internalNote ?? ""}
            onChange={(e) => updateField("internalNote", e.target.value || null)}
            placeholder="Soukromé poznámky — architekt je neuvidí."
            className="w-full min-h-[80px] text-sm bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-400 resize-y"
          />
        </section>

        <section className="mt-6 bg-white border border-zinc-200/70 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h3
              className="text-sm font-semibold text-zinc-900 flex items-center gap-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <ChatCircleDots size={16} weight="duotone" color="var(--accent)" />
              Komentáře architekta ({offerComments.length})
            </h3>
            {offerComments.some((c) => c.isNew) && (
              <button
                onClick={handleMarkRead}
                className="text-xs text-zinc-500 hover:text-zinc-900"
              >
                Označit jako přečtené
              </button>
            )}
          </div>
          {offerComments.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-zinc-500">
              Zatím žádné komentáře.
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {offerComments.map((c) => (
                <li key={c.id} className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                      style={{ background: "var(--accent)" }}
                    >
                      {c.authorName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-900">
                          {c.authorName}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {c.authorEmail}
                        </span>
                        {c.isNew && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full animate-pulse-subtle">
                            Nový
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-zinc-700 whitespace-pre-line">
                        {c.text}
                      </p>
                      <div className="mt-1 text-[11px] text-zinc-400">
                        {formatDateTime(c.createdAt)}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <aside className="xl:sticky xl:top-0 xl:h-screen border-l border-zinc-200/70 bg-white/50 px-6 py-8">
        <div className="text-xs uppercase tracking-[0.2em] text-zinc-400 mb-4">
          Akce
        </div>
        <div className="space-y-2">
          <ActionButton
            icon={ShareNetwork}
            label="Sdílet odkaz"
            onClick={() => setShowShare(true)}
            primary
          />
          {offer.status === "rozpracovana" && (
            <ActionButton
              icon={PaperPlaneTilt}
              label="Označit jako odeslané"
              onClick={() => handleStatusChange("odeslana")}
            />
          )}
          {(offer.status === "odeslana" || offer.status === "okomentovana") && (
            <ActionButton
              icon={CheckCircle}
              label="Označit jako potvrzené"
              onClick={() => handleStatusChange("potvrzena")}
            />
          )}
          <ActionButton
            icon={FilePdf}
            label="Stáhnout PDF"
            onClick={async () => {
              await exportOfferToPdf(offer, products);
              push("PDF staženo");
            }}
          />
          <ActionButton
            icon={MicrosoftExcelLogo}
            label="Stáhnout Excel"
            onClick={async () => {
              await exportOfferToExcel(offer, products);
              push("Excel staženo");
            }}
          />
        </div>
        <hr className="my-6 border-zinc-200/60" />
        {showDeleteConfirm ? (
          <div className="space-y-2">
            <p className="text-xs text-zinc-600">Opravdu smazat?</p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                className="flex-1 btn-tactile px-3 py-2 rounded-lg text-xs font-medium bg-red-500 text-white"
              >
                Ano, smazat
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 btn-tactile px-3 py-2 rounded-lg text-xs font-medium border border-zinc-200 text-zinc-700"
              >
                Zrušit
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full text-xs text-red-500 hover:text-red-700 py-2"
          >
            Smazat nabídku
          </button>
        )}
      </aside>

      <ProductCatalogPanel
        open={showCatalog}
        onClose={() => setShowCatalog(false)}
        products={allProducts}
        currency={offer.currency}
        onAdd={(pid) => {
          handleAddItem(pid);
          setShowCatalog(false);
        }}
      />
      <ShareModal
        open={showShare}
        onClose={() => setShowShare(false)}
        shareId={offer.shareId}
      />
    </div>
  );
}

function CurrencyToggle({ value, onChange }: { value: Currency; onChange: (c: Currency) => void }) {
  return (
    <div className="ml-auto flex bg-zinc-100 rounded-md p-0.5 text-[11px] font-medium">
      {(["CZK", "USD", "EUR"] as const).map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`px-2 py-1 rounded ${
            value === c ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

function QtyStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="inline-flex items-center bg-zinc-50 border border-zinc-200 rounded-md">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        className="w-6 h-7 text-zinc-500 hover:text-zinc-900"
        aria-label="−"
      >
        −
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          onChange(Number.isFinite(n) && n > 0 ? n : 1);
        }}
        className="w-9 text-center bg-transparent text-sm font-mono tabular-nums focus:outline-none"
      />
      <button
        onClick={() => onChange(value + 1)}
        className="w-6 h-7 text-zinc-500 hover:text-zinc-900"
        aria-label="+"
      >
        +
      </button>
    </div>
  );
}

function DiscountInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="inline-flex items-center bg-zinc-50 border border-zinc-200 rounded-md px-2">
      <input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(e) => {
          const n = parseFloat(e.target.value);
          if (!Number.isFinite(n)) { onChange(0); return; }
          onChange(Math.max(0, Math.min(100, n)));
        }}
        className="w-10 text-right bg-transparent text-sm font-mono tabular-nums focus:outline-none py-1"
      />
      <span className="text-xs text-zinc-400">%</span>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  primary = false,
}: {
  icon: React.ComponentType<{ size?: number; weight?: "fill" | "regular"; }>;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`btn-tactile w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        primary
          ? "text-white shadow-sm"
          : "text-zinc-700 hover:bg-zinc-100 border border-zinc-200"
      }`}
      style={primary ? { background: "var(--accent)" } : undefined}
    >
      <Icon size={16} weight={primary ? "fill" : "regular"} />
      {label}
    </button>
  );
}
