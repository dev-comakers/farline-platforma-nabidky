import { describe, it, expect } from "vitest";
import {
  itemTotalBeforeDiscount,
  itemDiscountAmount,
  itemTotalAfterDiscount,
  offerSummary,
  formatCurrency,
} from "./calculations";
import type { Product, OfferItem, Offer } from "./types";

const makeProduct = (unitPrice: number): Product => ({
  id: "p1",
  code: "TEST-001",
  name: "Test Product",
  brand: "Test",
  decor: "Chrome",
  type: "umyvadlove_baterie",
  unitPrice,
  currency: "CZK",
  imageUrl: null,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
});

const makeItem = (
  productId: string,
  quantity: number,
  discountPercent: number
): OfferItem => ({
  id: "i1",
  productId,
  quantity,
  discountPercent,
  confirmed: false,
  ordered: false,
  received: false,
});

describe("itemTotalBeforeDiscount", () => {
  it("multiplies quantity by unitPrice", () => {
    expect(itemTotalBeforeDiscount(makeItem("p1", 3, 0), makeProduct(1000))).toBe(3000);
  });

  it("rounds to 2 decimal places", () => {
    expect(itemTotalBeforeDiscount(makeItem("p1", 3, 0), makeProduct(33.335))).toBe(100.01);
  });

  it("handles quantity of 1", () => {
    expect(itemTotalBeforeDiscount(makeItem("p1", 1, 0), makeProduct(5499))).toBe(5499);
  });
});

describe("itemDiscountAmount", () => {
  it("calculates discount correctly", () => {
    expect(itemDiscountAmount(makeItem("p1", 2, 10), makeProduct(1000))).toBe(200);
  });

  it("returns 0 for 0% discount", () => {
    expect(itemDiscountAmount(makeItem("p1", 5, 0), makeProduct(1000))).toBe(0);
  });

  it("rounds result to 2 decimal places", () => {
    expect(itemDiscountAmount(makeItem("p1", 1, 10), makeProduct(333.33))).toBe(33.33);
  });
});

describe("itemTotalAfterDiscount", () => {
  it("subtracts discount from total", () => {
    expect(itemTotalAfterDiscount(makeItem("p1", 2, 10), makeProduct(1000))).toBe(1800);
  });

  it("equals total when discount is 0", () => {
    expect(itemTotalAfterDiscount(makeItem("p1", 3, 0), makeProduct(500))).toBe(1500);
  });

  it("equals 0 for 100% discount", () => {
    expect(itemTotalAfterDiscount(makeItem("p1", 1, 100), makeProduct(9999))).toBe(0);
  });
});

describe("offerSummary", () => {
  const p1 = { ...makeProduct(1000), id: "p1" };
  const p2 = { ...makeProduct(500), id: "p2" };

  const offer: Offer = {
    id: "o1",
    shareId: "share-o1",
    name: "Test Offer",
    architect: "Jan Novák",
    status: "rozpracovana",
    currency: "CZK",
    items: [
      makeItem("p1", 2, 10),
      makeItem("p2", 4, 0),
    ],
    internalNote: null,
    showVat: false,
    vatRate: 0.21,
    hideCode: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  };

  it("sums before-discount totals", () => {
    const summary = offerSummary(offer, [p1, p2]);
    expect(summary.totalBeforeDiscount).toBe(4000);
  });

  it("sums discount amounts", () => {
    const summary = offerSummary(offer, [p1, p2]);
    expect(summary.totalDiscount).toBe(200);
  });

  it("computes total after discount", () => {
    const summary = offerSummary(offer, [p1, p2]);
    expect(summary.totalAfterDiscount).toBe(3800);
  });

  it("vatAmount is 0 when showVat=false", () => {
    const summary = offerSummary(offer, [p1, p2]);
    expect(summary.vatAmount).toBe(0);
    expect(summary.totalWithVat).toBe(3800);
    expect(summary.showVat).toBe(false);
  });

  it("computes vatAmount when showVat=true", () => {
    const vatOffer: Offer = { ...offer, showVat: true, vatRate: 0.21 };
    const summary = offerSummary(vatOffer, [p1, p2]);
    expect(summary.vatAmount).toBe(798);
    expect(summary.totalWithVat).toBe(4598);
    expect(summary.showVat).toBe(true);
  });

  it("counts items correctly", () => {
    const summary = offerSummary(offer, [p1, p2]);
    expect(summary.itemCount).toBe(2);
  });

  it("copies currency from offer", () => {
    const summary = offerSummary(offer, [p1, p2]);
    expect(summary.currency).toBe("CZK");
  });

  it("skips orphaned items (missing product)", () => {
    const orphanOffer: Offer = {
      ...offer,
      items: [...offer.items, makeItem("missing-id", 10, 0)],
    };
    const summary = offerSummary(orphanOffer, [p1, p2]);
    expect(summary.totalBeforeDiscount).toBe(4000);
    expect(summary.itemCount).toBe(3);
  });
});

describe("formatCurrency", () => {
  it("formats CZK in cs-CZ locale", () => {
    const result = formatCurrency(1234.56, "CZK");
    expect(result).toContain("1");
    expect(result).toContain("234");
    expect(result).toContain("Kč");
  });

  it("formats USD in en-US locale", () => {
    const result = formatCurrency(1234.56, "USD");
    expect(result).toContain("$");
    expect(result).toContain("1,234.56");
  });

  it("formats zero correctly for CZK", () => {
    const result = formatCurrency(0, "CZK");
    expect(result).toContain("0");
    expect(result).toContain("Kč");
  });

  it("formats EUR in cs-CZ locale", () => {
    const result = formatCurrency(1234.56, "EUR");
    expect(result).toContain("€");
    expect(result).toContain("1");
  });
});
