import { formatCurrency } from "@/lib/calculations";
import type { Product } from "@/lib/types";
import { ProductIconBox } from "./ProductIconBox";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  return (
    <div
      className="group bg-white border border-zinc-200/70 rounded-2xl overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 animate-fade-in-up"
      style={{ animationDelay: `${Math.min(index * 40, 480)}ms` }}
    >
      <div className="w-full aspect-[4/3] overflow-hidden bg-zinc-100">
        <ProductIconBox type={product.type} size="lg" imageUrl={product.imageUrl} />
      </div>
      <div className="px-4 py-4 relative">
        <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
          {product.code}
        </div>
        <h3
          className="text-sm font-semibold text-zinc-900 mt-1 leading-snug line-clamp-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {product.name}
        </h3>
        <div className="mt-3 flex flex-wrap gap-1">
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
            {product.brand}
          </span>
          {product.decor !== "—" && (
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-50 text-zinc-500">
              {product.decor}
            </span>
          )}
        </div>
        <div className="mt-4 flex items-end justify-between border-t border-zinc-100 pt-3">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400">
            bez DPH
          </span>
          <span className="font-mono tabular-nums text-base font-semibold text-zinc-900">
            {formatCurrency(product.unitPrice, product.currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
