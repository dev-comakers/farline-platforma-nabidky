import { productIcon } from "@/lib/productIcons";
import type { ProductType } from "@/lib/types";

export function ProductIconBox({
  type,
  size = "md",
  imageUrl,
}: {
  type: ProductType;
  size?: "xs" | "sm" | "md" | "lg";
  imageUrl?: string | null;
}) {
  const Icon = productIcon[type];
  const dims = {
    xs: { box: "w-9 h-9 rounded-md", icon: 16 },
    sm: { box: "w-11 h-11 rounded-lg", icon: 20 },
    md: { box: "w-16 h-16 rounded-xl", icon: 28 },
    lg: { box: "w-full aspect-[4/3] rounded-2xl", icon: 48 },
  }[size];

  if (imageUrl) {
    return (
      <div
        className={`${dims.box} overflow-hidden bg-zinc-100 shrink-0 relative`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`${dims.box} flex items-center justify-center bg-zinc-100 text-zinc-500 shrink-0`}
    >
      <Icon size={dims.icon} weight="duotone" color="var(--accent)" />
    </div>
  );
}
