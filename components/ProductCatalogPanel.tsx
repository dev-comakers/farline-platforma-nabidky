"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlass, X, Plus } from "@phosphor-icons/react/dist/ssr";
import type { Product, Currency } from "@/lib/types";
import { formatCurrency } from "@/lib/calculations";
import { ProductIconBox } from "./ProductIconBox";
import { ProductDetailModal } from "./ProductDetailModal";

export function ProductCatalogPanel({
  open,
  onClose,
  products,
  currency,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  products: Product[];
  currency: Currency;
  onAdd: (productId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState<string | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  const brands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand))).sort(),
    [products]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => p.currency === currency)
      .filter((p) => (brand ? p.brand === brand : true))
      .filter((p) =>
        q
          ? p.code.toLowerCase().includes(q) ||
            p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q)
          : true
      );
  }, [products, query, brand, currency]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-zinc-900/20 z-40"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 bottom-0 w-[480px] bg-white border-l border-zinc-200 z-50 flex flex-col animate-slide-in-right shadow-2xl">
        <header className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-zinc-400 mb-1">
              Katalog
            </div>
            <h2
              className="text-xl font-semibold text-zinc-900"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Přidat produkt
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500"
            aria-label="Zavřít"
          >
            <X size={18} />
          </button>
        </header>

        <div className="px-6 pt-4 pb-3 space-y-3 border-b border-zinc-100">
          <div className="relative">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              placeholder="Hledat kód, název, značku..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-zinc-400"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setBrand(null)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                brand === null
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
              }`}
            >
              Vše
            </button>
            {brands.map((b) => (
              <button
                key={b}
                onClick={() => setBrand(b)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  brand === b
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {filtered.length === 0 && (
            <div className="text-center text-sm text-zinc-500 py-12">
              {currency === "USD"
                ? "Žádné produkty v USD."
                : "Žádné produkty odpovídající filtru."}
            </div>
          )}
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => setDetailProduct(p)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-50 text-left group transition-colors"
            >
              <ProductIconBox type={p.type} size="sm" imageUrl={p.imageUrl} />
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[11px] text-zinc-500">{p.code}</div>
                <div className="text-sm font-medium text-zinc-900 truncate">
                  {p.name}
                </div>
                <div className="text-xs text-zinc-500 truncate">
                  {p.brand} · {p.decor}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="font-mono text-sm tabular-nums text-zinc-900">
                  {formatCurrency(p.unitPrice, p.currency)}
                </span>
                <span
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-white p-1 rounded-md"
                  style={{ background: "var(--accent)" }}
                >
                  <Plus size={12} weight="bold" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          onClose={() => setDetailProduct(null)}
          onAdd={(productId) => {
            onAdd(productId);
            setDetailProduct(null);
          }}
        />
      )}
    </>
  );
}
