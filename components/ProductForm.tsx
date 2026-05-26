"use client";

import { useState, useEffect } from "react";
import { X } from "@phosphor-icons/react/dist/ssr";
import { useToast } from "./Toast";
import type { Product } from "@/lib/types";

type Category = { id: string; key: string; label: string };

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  product?: Product;
  onSaved: (product: Product) => void;
}

export function ProductForm({ open, onClose, product, onSaved }: ProductFormProps) {
  const { push } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [decor, setDecor] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [currency, setCurrency] = useState<"CZK" | "USD" | "EUR">("CZK");

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
      setCategoryId("");
      setUnitPrice(String(product.unitPrice));
      setCurrency(product.currency);
    } else {
      setCode("");
      setName("");
      setBrand("");
      setDecor("");
      setCategoryId("");
      setUnitPrice("");
      setCurrency("CZK");
    }
  }, [open, product]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(unitPrice);
    if (!code || !name || !brand || !categoryId || isNaN(price) || price <= 0) {
      push("Vyplňte všechna povinná pole", "info");
      return;
    }

    setBusy(true);
    try {
      const body = { code, name, brand, decor, categoryId, unitPrice: price, currency };
      const url = product ? `/api/products/${product.id}` : "/api/products";
      const method = product ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        push(data.error?.message ?? "Chyba při ukládání", "info");
        return;
      }

      onSaved(data.product);
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
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        <header className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
          <h3
            className="text-lg font-semibold text-zinc-900"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {product ? "Upravit produkt" : "Nový produkt"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500">
            <X size={16} />
          </button>
        </header>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Kód *</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="PRO-001"
                className="mt-1 w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-zinc-400 font-mono"
              />
            </label>
            <label className="block">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Kategorie *</span>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-zinc-400"
              >
                <option value="">Vybrat…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Název *</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Umyvadlová baterie Premium"
              className="mt-1 w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-zinc-400"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Značka *</span>
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Hansgrohe"
                className="mt-1 w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-zinc-400"
              />
            </label>
            <label className="block">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Dekor</span>
              <input
                value={decor}
                onChange={(e) => setDecor(e.target.value)}
                placeholder="Chrom"
                className="mt-1 w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-zinc-400"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Cena bez DPH *</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="12 500"
                className="mt-1 w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-zinc-400 font-mono tabular-nums"
              />
            </label>
            <label className="block">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Měna</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as "CZK" | "USD" | "EUR")}
                className="mt-1 w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-zinc-400"
              >
                <option value="CZK">CZK</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={busy}
              className="btn-tactile px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
              style={{ background: "var(--accent)" }}
            >
              {busy ? "Ukládám…" : product ? "Uložit" : "Přidat produkt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
