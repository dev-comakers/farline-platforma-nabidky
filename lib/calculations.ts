import type { Currency, Offer, OfferItem, OfferSummary, Product } from "./types";

const round2 = (n: number) => Math.round(n * 100) / 100;

export function itemTotalBeforeDiscount(item: OfferItem, product: Product): number {
  return round2(product.unitPrice * item.quantity);
}

export function itemDiscountAmount(item: OfferItem, product: Product): number {
  return round2(itemTotalBeforeDiscount(item, product) * (item.discountPercent / 100));
}

export function itemTotalAfterDiscount(item: OfferItem, product: Product): number {
  return round2(itemTotalBeforeDiscount(item, product) - itemDiscountAmount(item, product));
}

export function offerSummary(offer: Offer, products: Product[]): OfferSummary {
  const byId = new Map(products.map((p) => [p.id, p]));
  let totalBeforeDiscount = 0;
  let totalDiscount = 0;
  for (const item of offer.items) {
    const product = byId.get(item.productId);
    if (!product) continue;
    totalBeforeDiscount += itemTotalBeforeDiscount(item, product);
    totalDiscount += itemDiscountAmount(item, product);
  }
  totalBeforeDiscount = round2(totalBeforeDiscount);
  totalDiscount = round2(totalDiscount);
  const totalAfterDiscount = round2(totalBeforeDiscount - totalDiscount);
  const vatAmount = offer.showVat ? round2(totalAfterDiscount * offer.vatRate) : 0;
  return {
    totalBeforeDiscount,
    totalDiscount,
    totalAfterDiscount,
    vatAmount,
    totalWithVat: round2(totalAfterDiscount + vatAmount),
    itemCount: offer.items.length,
    currency: offer.currency,
    showVat: offer.showVat,
  };
}

export function formatCurrency(n: number, currency: Currency): string {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  }
  if (currency === "EUR") {
    return new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  }
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "právě teď";
  if (m < 60) return `před ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `před ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `před ${d} ${d === 1 ? "dnem" : "dny"}`;
  return formatDate(iso);
}
