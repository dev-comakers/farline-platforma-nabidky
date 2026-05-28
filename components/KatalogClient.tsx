"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlass,
  UploadSimple,
  Plus,
  SquaresFour,
  ListBullets,
  PencilSimple,
  Trash,
  CaretDown,
} from "@phosphor-icons/react/dist/ssr";
import { ProductCard } from "@/components/ProductCard";
import { ImportModal } from "@/components/ImportModal";
import { ProductForm } from "@/components/ProductForm";
import { ProductDetailModal } from "@/components/ProductDetailModal";
import { PRODUCT_TYPE_LABEL, type CategoryField, type ProductCategory, type ProductType, type Product } from "@/lib/types";
import { ProductIconBox } from "@/components/ProductIconBox";
import { formatCurrency, normalizeText } from "@/lib/calculations";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";

export function KatalogClient({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter();
  const { push } = useToast();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState<string | null>(null);
  const [type, setType] = useState<ProductType | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [importOpen, setImportOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | undefined>(undefined);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => {});
  }, []);

  const getCategoryFields = (product: Product): CategoryField[] => {
    const cat = categories.find((c) => c.key === product.type);
    return cat?.fields ?? [];
  };

  const brands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand))).sort(),
    [products]
  );

  const types = useMemo(
    () => Array.from(new Set(products.map((p) => p.type))),
    [products]
  );

  const filtered = useMemo(() => {
    const q = normalizeText(query.trim());
    return products
      .filter((p) => (brand ? p.brand === brand : true))
      .filter((p) => (type ? p.type === type : true))
      .filter((p) =>
        q
          ? normalizeText(p.code).includes(q) ||
            normalizeText(p.name).includes(q) ||
            normalizeText(p.brand).includes(q) ||
            normalizeText(p.decor).includes(q)
          : true
      );
  }, [products, query, brand, type]);

  const handleSaved = (saved: Product) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
  };

  const handleDelete = async (product: Product) => {
    const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      push("Produkt smazán");
    } else {
      const data = await res.json().catch(() => ({}));
      push(data.error?.message ?? "Smazání selhalo", "info");
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-8 max-w-[1400px]">
      <header className="flex flex-wrap items-start sm:items-end justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-400 mb-2">
            Katalog
          </div>
          <h1
            className="text-2xl sm:text-4xl font-semibold tracking-tight text-zinc-900"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Produkty
            <span className="ml-3 text-base font-normal text-zinc-400 tabular-nums">
              {products.length}
            </span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-700 border border-zinc-200 bg-white hover:bg-zinc-50 min-h-[44px]"
          >
            <UploadSimple size={16} weight="bold" /> Importovat CSV
          </button>
          <button
            onClick={() => { setEditProduct(undefined); setFormOpen(true); }}
            className="btn-tactile inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white shadow-sm min-h-[44px]"
            style={{ background: "var(--accent)" }}
          >
            <Plus size={16} weight="bold" /> Přidat produkt
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            placeholder="Hledat kód, název, značku, dekor..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-zinc-400 min-h-[44px]"
          />
        </div>

        <div className="relative">
          <select
            value={type ?? ""}
            onChange={(e) => setType((e.target.value || null) as ProductType | null)}
            className="appearance-none pl-3 pr-8 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-zinc-400 min-h-[44px]"
          >
            <option value="">Všechny typy</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {PRODUCT_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
          <CaretDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        </div>

        <div className="flex bg-white border border-zinc-200 rounded-lg p-0.5">
          <button
            onClick={() => setView("grid")}
            className={`p-2 rounded-md ${
              view === "grid" ? "bg-zinc-100 text-zinc-900" : "text-zinc-400"
            }`}
            aria-label="Mřížka"
          >
            <SquaresFour size={16} />
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-2 rounded-md ${
              view === "list" ? "bg-zinc-100 text-zinc-900" : "text-zinc-400"
            }`}
            aria-label="Seznam"
          >
            <ListBullets size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6">
        <FilterChip active={brand === null} onClick={() => setBrand(null)}>
          Všechny značky
        </FilterChip>
        {brands.map((b) => (
          <FilterChip key={b} active={brand === b} onClick={() => setBrand(b)}>
            {b}
          </FilterChip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-zinc-200/70 rounded-2xl py-16 text-center text-sm text-zinc-500">
          Žádné produkty neodpovídají filtrům.
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((p, i) => (
            <div key={p.id} className="relative group/card cursor-pointer" onClick={() => setDetailProduct(p)}>
              <ProductCard product={p} index={i} />
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditProduct(p); setFormOpen(true); }}
                  className="p-1.5 bg-white rounded-lg border border-zinc-200 shadow-sm text-zinc-600 hover:text-zinc-900"
                  title="Upravit"
                >
                  <PencilSimple size={12} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(p); }}
                  className="p-1.5 bg-white rounded-lg border border-zinc-200 shadow-sm text-red-500 hover:text-red-700"
                  title="Smazat"
                >
                  <Trash size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-zinc-200/70 rounded-2xl overflow-hidden">
          {filtered.map((p) => (
            <div
              key={p.id}
              onClick={() => setDetailProduct(p)}
              className="flex items-center gap-4 px-4 py-3 border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/60 group cursor-pointer"
            >
              <ProductIconBox type={p.type} size="sm" imageUrl={p.imageUrl} />
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[10px] text-zinc-500">{p.code}</div>
                <div className="text-sm font-medium text-zinc-900 truncate">
                  {p.name}
                </div>
                <div className="text-xs text-zinc-500">
                  {p.brand} · {p.decor}
                </div>
              </div>
              <span className="text-xs text-zinc-500 uppercase tracking-wider">
                {PRODUCT_TYPE_LABEL[p.type]}
              </span>
              <span className="font-mono tabular-nums text-sm font-medium text-zinc-900 min-w-[120px] text-right">
                {formatCurrency(p.unitPrice, p.currency)}
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditProduct(p); setFormOpen(true); }}
                  className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:text-zinc-900"
                  title="Upravit"
                >
                  <PencilSimple size={12} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(p); }}
                  className="p-1.5 rounded-lg border border-zinc-200 text-red-400 hover:text-red-600"
                  title="Smazat"
                >
                  <Trash size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} onImported={() => router.refresh()} />
      <ProductForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        product={editProduct}
        onSaved={handleSaved}
      />
      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          categoryFields={getCategoryFields(detailProduct)}
          onClose={() => setDetailProduct(null)}
          allowUpload
        />
      )}
      <ConfirmDialog
        open={confirmDelete !== null}
        title="Smazat produkt"
        message={`Opravdu chcete smazat produkt „${confirmDelete?.name}"? Tato akce je nevratná.`}
        confirmLabel="Smazat"
        destructive
        onConfirm={async () => {
          if (confirmDelete) await handleDelete(confirmDelete);
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
      }`}
    >
      {children}
    </button>
  );
}
