"use client";

import { X, DownloadSimple } from "@phosphor-icons/react/dist/ssr";
import { ProductIconBox } from "@/components/ProductIconBox";
import { formatCurrency } from "@/lib/calculations";
import type { CategoryField, Product } from "@/lib/types";

interface ProductDetailModalProps {
  product: Product;
  categoryFields: CategoryField[];
  onClose: () => void;
}

export function ProductDetailModal({ product, categoryFields, onClose }: ProductDetailModalProps) {
  const params = (product.parameters ?? {}) as Record<string, string>;
  const paramEntries = categoryFields
    .filter((f) => params[f.key] !== undefined && params[f.key] !== "")
    .map((f) => ({ label: f.label, value: params[f.key] }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 shadow-2xl overflow-hidden">
        <header className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {product.code && (
              <span className="font-mono text-[11px] text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
                {product.code}
              </span>
            )}
            <h2
              className="text-lg font-semibold text-zinc-900"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {product.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500"
          >
            <X size={16} />
          </button>
        </header>

        <div className="flex gap-0 max-h-[75vh] overflow-y-auto">
          {/* Photo */}
          <div className="w-64 shrink-0 bg-zinc-50 flex items-center justify-center p-6 border-r border-zinc-100">
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

          {/* Info */}
          <div className="flex-1 px-6 py-5 space-y-5">
            <div>
              <div className="text-sm text-zinc-500">{product.brand}</div>
              {product.decor && (
                <div className="text-xs text-zinc-400">{product.decor}</div>
              )}
              <div
                className="text-2xl font-semibold font-mono tabular-nums mt-2"
                style={{ color: "var(--accent)" }}
              >
                {formatCurrency(product.unitPrice, product.currency)}
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">bez DPH</div>
            </div>

            {paramEntries.length > 0 && (
              <div>
                <div className="text-[11px] uppercase tracking-wider text-zinc-400 mb-2">Parametry</div>
                <table className="w-full text-sm">
                  <tbody>
                    {paramEntries.map(({ label, value }) => (
                      <tr key={label} className="border-t border-zinc-100 first:border-t-0">
                        <td className="py-1.5 pr-4 text-zinc-500 w-1/2">{label}</td>
                        <td className="py-1.5 text-zinc-900 font-medium">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {product.technicalSheetUrl && (
              <div className="pt-2 border-t border-zinc-100">
                <div className="text-[11px] uppercase tracking-wider text-zinc-400 mb-2">Dokumenty</div>
                <a
                  href={product.technicalSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
                  style={{ color: "var(--accent)" }}
                >
                  <DownloadSimple size={16} weight="duotone" />
                  Stáhnout technický list
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
