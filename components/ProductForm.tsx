"use client";

import { useState, useEffect, useRef } from "react";
import { X, Camera } from "@phosphor-icons/react/dist/ssr";
import { useToast } from "./Toast";
import type { CategoryField, Product, ProductCategory } from "@/lib/types";

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  product?: Product;
  onSaved: (product: Product) => void;
}

const inputCls = "mt-1 w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-zinc-400";

const FIELD_PLACEHOLDERS: Record<string, string> = {
  rozmery: "š × v × h cm (např. 350 × 500 × 120)",
  material: "např. mosaz, nerez, keramika",
  povrch: "např. chrom, matná černá",
  pripojeni: "např. 1/2\"",
  zaruka: "roky (např. 2)",
  prutok: "l/min (např. 6.5)",
  objem: "litry (např. 190)",
  hmotnost: "kg (např. 45)",
};

export function ProductForm({ open, onClose, product, onSaved }: ProductFormProps) {
  const { push } = useToast();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [busy, setBusy] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [decor, setDecor] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [currency, setCurrency] = useState<"CZK" | "USD" | "EUR">("CZK");
  const [params, setParams] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (product) {
      setCode(product.code);
      setName(product.name);
      setBrand(product.brand);
      setDecor(product.decor);
      setUnitPrice(String(product.unitPrice));
      setCurrency(product.currency);
      setParams(product.parameters ?? {});
      setImageFile(null);
      setImagePreview(product.imageUrl ?? null);
    } else {
      setCode(""); setName(""); setBrand(""); setDecor("");
      setCategoryId(""); setUnitPrice(""); setCurrency("CZK"); setParams({});
      setImageFile(null);
      setImagePreview(null);
    }
  }, [open, product]);

  useEffect(() => {
    if (!open || !product || categories.length === 0) return;
    const cat = categories.find((c) => c.key === product.type);
    if (cat) setCategoryId(cat.id);
  }, [open, product, categories]);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const categoryFields: CategoryField[] = selectedCategory?.fields ?? [];

  if (!open) return null;

  const handleImageChange = (file: File) => {
    if (!file.type.startsWith("image/")) {
      push("Vyberte obrázek (JPG, PNG, WebP)", "info");
      return;
    }
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(unitPrice);
    if (!code || !name || !brand || !categoryId || isNaN(price) || price <= 0) {
      push("Vyplňte všechna povinná pole", "info");
      return;
    }

    setBusy(true);
    try {
      const body = { code, name, brand, decor, categoryId, unitPrice: price, currency, parameters: params };
      const url = product ? `/api/products/${product.id}` : "/api/products";
      const method = product ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) { push(data.error?.message ?? "Chyba při ukládání", "info"); return; }

      let savedProduct: Product = data.product;

      if (imageFile) {
        const fd = new FormData();
        fd.append("image", imageFile);
        const imgRes = await fetch(`/api/products/${savedProduct.id}/photo`, { method: "POST", body: fd });
        if (imgRes.ok) {
          const imgData = await imgRes.json();
          savedProduct = { ...savedProduct, imageUrl: imgData.imagePath ? `/api/uploads/${imgData.imagePath}` : null };
        }
      }

      onSaved(savedProduct);
      push(product ? "Produkt uložen" : "Produkt přidán");
      onClose();
    } catch {
      push("Chyba při ukládání", "info");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] flex flex-col">
        <header className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between shrink-0">
          <h3 className="text-lg font-semibold text-zinc-900" style={{ fontFamily: "var(--font-display)" }}>
            {product ? "Upravit produkt" : "Nový produkt"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500">
            <X size={16} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto">
          <div>
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Fotografie</span>
            <div
              className="mt-1 relative w-full h-32 rounded-xl border-2 border-dashed border-zinc-200 hover:border-zinc-300 flex items-center justify-center cursor-pointer overflow-hidden bg-zinc-50 transition-colors"
              onClick={() => imageInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) handleImageChange(f);
              }}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="preview" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-zinc-900/0 hover:bg-zinc-900/20 transition-colors flex items-center justify-center">
                    <span className="opacity-0 hover:opacity-100 text-xs text-white font-medium bg-zinc-900/60 px-2 py-1 rounded-full transition-opacity">Změnit</span>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <Camera size={24} className="mx-auto mb-1 text-zinc-400" weight="duotone" />
                  <span className="text-xs text-zinc-500">Nahrát fotografii</span>
                  <span className="block text-[10px] text-zinc-400 mt-0.5">nebo přetáhněte soubor sem</span>
                </div>
              )}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImageChange(f);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Kód *</span>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="PRO-001"
                className={inputCls + " font-mono"} />
            </label>
            <label className="block">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Kategorie *</span>
              <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setParams({}); }}
                className={inputCls}>
                <option value="">Vybrat…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Název *</span>
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Umyvadlová baterie Premium" className={inputCls} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Značka *</span>
              <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Hansgrohe" className={inputCls} />
            </label>
            <label className="block">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Dekor</span>
              <input value={decor} onChange={(e) => setDecor(e.target.value)} placeholder="Chrom" className={inputCls} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Cena bez DPH *</span>
              <input type="number" min="0" step="0.01" value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)} placeholder="12 500"
                className={inputCls + " font-mono tabular-nums"} />
            </label>
            <label className="block">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Měna</span>
              <select value={currency} onChange={(e) => setCurrency(e.target.value as "CZK" | "USD" | "EUR")}
                className={inputCls}>
                <option value="CZK">CZK</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </label>
          </div>

          {categoryFields.length > 0 && (
            <div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Parametry kategorie</div>
              <div className="space-y-2">
                {categoryFields.map((f) => (
                  <label key={f.key} className="block">
                    <span className="text-xs text-zinc-500">{f.label}</span>
                    {f.type === "select" ? (
                      <select
                        value={params[f.key] ?? ""}
                        onChange={(e) => setParams((p) => ({ ...p, [f.key]: e.target.value }))}
                        className={inputCls}
                      >
                        <option value="">—</option>
                        {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        type={f.type === "number" ? "number" : "text"}
                        placeholder={FIELD_PLACEHOLDERS[f.key] ?? ""}
                        value={params[f.key] ?? ""}
                        onChange={(e) => setParams((p) => ({ ...p, [f.key]: e.target.value }))}
                        className={inputCls + (f.type === "number" ? " font-mono tabular-nums" : "")}
                      />
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg">
              Zrušit
            </button>
            <button type="submit" disabled={busy}
              className="btn-tactile px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
              style={{ background: "var(--accent)" }}>
              {busy ? "Ukládám…" : product ? "Uložit" : "Přidat produkt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
