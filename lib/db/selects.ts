import type { Offer, OfferItem, Product, Comment, OfferStatus, Currency, ProductType } from "@/lib/types";
import type { Prisma } from "@prisma/client";

export const productSelect = {
  id: true,
  code: true,
  name: true,
  brand: true,
  decor: true,
  unitPrice: true,
  currency: true,
  imagePath: true,
  technicalSheetPath: true,
  parameters: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { key: true } },
} satisfies Prisma.ProductSelect;

export const offerItemSelect = {
  id: true,
  productId: true,
  quantity: true,
  discountPercent: true,
  unitPriceSnapshot: true,
  note: true,
  confirmed: true,
  ordered: true,
  received: true,
  position: true,
  product: { select: productSelect },
} satisfies Prisma.OfferItemSelect;

export const offerListSelect = {
  id: true,
  shareId: true,
  name: true,
  architect: true,
  status: true,
  currency: true,
  internalNote: true,
  showVat: true,
  vatRate: true,
  hideCode: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: offerItemSelect,
    orderBy: { position: "asc" as const },
  },
} satisfies Prisma.OfferSelect;

export const commentSelect = {
  id: true,
  offerId: true,
  authorName: true,
  authorEmail: true,
  text: true,
  isNew: true,
  createdAt: true,
} satisfies Prisma.CommentSelect;

type DbProduct = Prisma.ProductGetPayload<{ select: typeof productSelect }>;
type DbOfferItem = Prisma.OfferItemGetPayload<{ select: typeof offerItemSelect }>;
type DbOffer = Prisma.OfferGetPayload<{ select: typeof offerListSelect }>;
type DbComment = Prisma.CommentGetPayload<{ select: typeof commentSelect }>;

export function mapProduct(p: DbProduct): Product {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    brand: p.brand,
    decor: p.decor,
    type: p.category.key as ProductType,
    unitPrice: p.unitPrice.toNumber(),
    currency: p.currency as Currency,
    imageUrl: p.imagePath ? `/api/uploads/${p.imagePath}` : null,
    technicalSheetUrl: p.technicalSheetPath ? `/api/uploads/${p.technicalSheetPath}` : null,
    parameters: (p.parameters ?? {}) as Record<string, string>,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export function mapOfferItem(item: DbOfferItem): OfferItem {
  return {
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    discountPercent: item.discountPercent.toNumber(),
    note: item.note ?? undefined,
    confirmed: item.confirmed,
    ordered: item.ordered,
    received: item.received,
  };
}

export function snapshotProducts(items: DbOfferItem[]): Product[] {
  const seen = new Set<string>();
  const products: Product[] = [];
  for (const item of items) {
    if (!seen.has(item.productId)) {
      seen.add(item.productId);
      products.push({
        ...mapProduct(item.product),
        unitPrice: item.unitPriceSnapshot.toNumber(),
      });
    }
  }
  return products;
}

export function mapOffer(o: DbOffer): Offer {
  return {
    id: o.id,
    shareId: o.shareId,
    name: o.name,
    architect: o.architect,
    status: o.status as OfferStatus,
    currency: o.currency as Currency,
    internalNote: o.internalNote,
    showVat: o.showVat,
    vatRate: o.vatRate.toNumber(),
    hideCode: o.hideCode,
    items: o.items.map(mapOfferItem),
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  };
}

export function mapComment(c: DbComment): Comment {
  return {
    id: c.id,
    offerId: c.offerId,
    authorName: c.authorName,
    authorEmail: c.authorEmail,
    text: c.text,
    isNew: c.isNew,
    createdAt: c.createdAt.toISOString(),
  };
}
