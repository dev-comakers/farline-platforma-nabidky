"use client";

import { useState, useRef } from "react";
import { X, UploadSimple, DownloadSimple } from "@phosphor-icons/react/dist/ssr";
import { ProductIconBox } from "@/components/ProductIconBox";
import { formatCurrency } from "@/lib/calculations";
import type { CategoryField, Product } from "@/lib/types";

interface ProductDetailModalProps {
  product: Product;
  categoryFields?: CategoryField[];
  onClose: () => void;
  onAdd?: (productId: string) => void;
  allowUpload?: boolean;
}

export function ProductDetailModal({
  product,
  categoryFields = [],
  onClose,
  onAdd,
  allowUpload = false,
}: ProductDetailModalProps) {
  const [sheetUrl, setSheetUrl] = useState(product.technicalSheetUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const params = (product.parameters ?? {}) as Record<string, string>;
  const paramEntries = categoryFields
    .filter((f) => params[f.key] !== undefined && params[f.key] !== "")
    .map((f) => ({ label: f.label, value: params[f.key] }));

  const allParams = [...paramEntries, { label: "Kód", value: product.code }];

  const handleSheetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const fd = new FormData();
    fd.append("sheet", file);
    const res = await fetch(`/api/products/${product.id}/tech-sheet`, {
      method: "POST",
      body: fd,
    });
    if (res.ok) {
      setSheetUrl(`/api/uploads/products/${product.id}/sheet.pdf`);
    } else {
      const d = await res.json().catch(() => ({}));
      setUploadError(d.error?.message ?? "Nahrání selhalo");
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-zinc-900/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-[640px] sm:mx-4 shadow-2xl overflow-hidden animate-fade-in-up max-h-[92vh] sm:max-h-[85vh] overflow-y-auto">
        {/* Top: photo + info */}
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-[220px] shrink-0 bg-zinc-50 flex items-center justify-center p-6 min-h-[180px] sm:min-h-[280px]">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-contain max-h-52"
              />
            ) : (
              <ProductIconBox type={product.type} size="lg" imageUrl={null} />
            )}
          </div>

          <div className="flex-1 relative px-6 py-5 sm:max-h-[60vh] sm:overflow-y-auto">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              <X size={16} />
            </button>

            <div className="pr-8">
              {product.code && (
                <span className="font-mono text-[11px] text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                  {product.code}
                </span>
              )}
              <h2
                className="text-xl font-semibold text-zinc-900 mt-2 leading-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {product.name}
              </h2>
              <div className="text-sm text-zinc-500 mt-0.5">
                {product.brand}
                {product.decor ? ` · ${product.decor}` : ""}
              </div>
            </div>

            <div className="mt-4">
              <div className="text-[10px] uppercase tracking-[0.15em] text-zinc-400">Cena</div>
              <div className="font-mono tabular-nums text-2xl font-bold text-zinc-900 mt-0.5">
                {formatCurrency(product.unitPrice, product.currency)}
              </div>
            </div>

            <div className="mt-4 border-t border-zinc-100 pt-4">
              <table className="w-full text-sm">
                <tbody>
                  {allParams.map(({ label, value }) => (
                    <tr key={label} className="border-b border-zinc-50 last:border-b-0">
                      <td className="py-1.5 pr-4 text-zinc-500 w-1/2">{label}</td>
                      <td className="py-1.5 text-zinc-900 font-medium">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Technický list */}
        {(allowUpload || sheetUrl) && (
          <div className="px-6 py-4 border-t border-zinc-100">
            <div className="text-xs text-zinc-500 mb-2">Technický list</div>
            {allowUpload ? (
              <>
                <label
                  className={`flex items-center justify-between px-4 py-3 border border-dashed rounded-xl cursor-pointer transition-colors ${
                    uploading ? "border-zinc-200 opacity-60 cursor-not-allowed" : "border-zinc-300 hover:border-[#8B7355]"
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <UploadSimple size={16} weight="duotone" />
                    {uploading ? "Nahrávám…" : sheetUrl ? "Nahradit PDF" : "Nahrát PDF"}
                  </div>
                  <span className="text-xs text-zinc-400">max. 10 MB</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    disabled={uploading}
                    onChange={handleSheetUpload}
                  />
                </label>
                {uploadError && <div className="text-xs text-red-500 mt-1">{uploadError}</div>}
                {sheetUrl && (
                  <a
                    href={sheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs mt-2 hover:underline"
                    style={{ color: "var(--accent)" }}
                  >
                    <DownloadSimple size={13} weight="duotone" />
                    Stáhnout technický list
                  </a>
                )}
              </>
            ) : (
              <a
                href={sheetUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
                style={{ color: "var(--accent)" }}
              >
                <DownloadSimple size={16} weight="duotone" />
                Stáhnout technický list
              </a>
            )}
          </div>
        )}

        {/* CTA */}
        {onAdd && (
          <div className="px-6 pb-6">
            <button
              onClick={() => { onAdd(product.id); onClose(); }}
              className="btn-tactile w-full py-3 rounded-xl text-sm font-medium text-white"
              style={{ background: "var(--accent)" }}
            >
              + Přidat do nabídky
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
