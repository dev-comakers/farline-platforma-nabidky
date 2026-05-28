"use client";

import { useRef, useState } from "react";
import { Camera, X, ImageSquare } from "@phosphor-icons/react/dist/ssr";
import { ProductIconBox } from "./ProductIconBox";
import { useToast } from "./Toast";
import type { Product } from "@/lib/types";

async function uploadPhoto(productId: string, file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch(`/api/products/${productId}/photo`, { method: "POST", body: formData });
  if (!res.ok) return null;
  const data = await res.json();
  return data.imagePath ? `/api/uploads/${data.imagePath}?t=${Date.now()}` : null;
}

export function PhotoUploader({
  product,
  size = "md",
  showLabel = false,
  onUpdate,
}: {
  product: Product;
  size?: "sm" | "md";
  showLabel?: boolean;
  onUpdate?: (imageUrl: string | null) => void;
}) {
  const { push } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      push("Vyberte obrázek", "info");
      return;
    }
    setBusy(true);
    try {
      const url = await uploadPhoto(product.id, file);
      if (url) {
        onUpdate?.(url);
        push("Fotografie nahrána");
      } else {
        push("Nahrání selhalo", "info");
      }
    } catch {
      push("Nahrání selhalo", "info");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await fetch(`/api/products/${product.id}/photo`, { method: "DELETE" });
    if (res.ok) onUpdate?.(null);
  };

  return (
    <div className="relative group inline-block">
      <ProductIconBox type={product.type} size={size} imageUrl={product.imageUrl} />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          inputRef.current?.click();
        }}
        disabled={busy}
        className={`absolute inset-0 flex items-center justify-center bg-zinc-900/55 text-white rounded-md transition-opacity ${
          busy ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        aria-label="Nahrát fotografii"
      >
        {busy ? (
          <span className="text-[10px] animate-pulse">…</span>
        ) : (
          <Camera size={size === "sm" ? 14 : 18} weight="duotone" />
        )}
      </button>
      {product.imageUrl && !busy && (
        <button
          type="button"
          onClick={handleRemove}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-zinc-200 text-zinc-500 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100"
          aria-label="Odstranit fotografii"
        >
          <X size={10} />
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) await handleFile(f);
          e.target.value = "";
        }}
      />
      {showLabel && !product.imageUrl && (
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[9px] text-zinc-400 bg-white/85 px-1.5 py-0.5 rounded-full border border-zinc-200">
            <ImageSquare size={10} className="inline mb-px mr-0.5" />
            Foto
          </span>
        </span>
      )}
    </div>
  );
}

export function ProductCardPhotoUploader({ product, onUpdate }: { product: Product; onUpdate?: (imageUrl: string | null) => void }) {
  const { push } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [localImageUrl, setLocalImageUrl] = useState(product.imageUrl);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setBusy(true);
    try {
      const url = await uploadPhoto(product.id, file);
      if (url) {
        setLocalImageUrl(url);
        onUpdate?.(url);
        push("Fotografie nahrána");
      } else {
        push("Nahrání selhalo", "info");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-100 group cursor-pointer ${
        dragOver ? "ring-2" : ""
      }`}
      style={dragOver ? { boxShadow: "inset 0 0 0 2px var(--accent)" } : undefined}
      onClick={(e) => {
        e.stopPropagation();
        inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={async (e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) await handleFile(f);
      }}
    >
      <ProductIconBox type={product.type} size="lg" imageUrl={localImageUrl} />
      <div className="absolute inset-0 bg-zinc-900/0 group-hover:bg-zinc-900/30 transition-colors flex items-center justify-center">
        <span
          className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-xs font-medium text-white px-3 py-1.5 rounded-full ${
            busy ? "opacity-100" : ""
          }`}
          style={{ background: "var(--accent)" }}
        >
          <Camera size={12} weight="bold" />
          {busy ? "Nahrávám…" : localImageUrl ? "Změnit" : "Nahrát fotografii"}
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) await handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
