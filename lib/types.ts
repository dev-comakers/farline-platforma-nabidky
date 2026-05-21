export type ProductType =
  | "umyvadlove_baterie"
  | "vanove_baterie"
  | "sprchove_sety"
  | "hlavove_sprchy"
  | "podomitkove_moduly"
  | "vany"
  | "wc"
  | "doplnky"
  | "kuchynske_baterie"
  | "bidetove_baterie"
  | "sprchove_kanaly"
  | "ostatni";

export type Currency = "CZK" | "USD";

export type OfferStatus =
  | "rozpracovana"
  | "odeslana"
  | "okomentovana"
  | "potvrzena";

export interface Product {
  id: string;
  code: string;
  name: string;
  brand: string;
  decor: string;
  type: ProductType;
  unitPrice: number;
  currency: Currency;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OfferItem {
  id: string;
  productId: string;
  quantity: number;
  discountPercent: number;
  note?: string;
}

export interface Offer {
  id: string;
  name: string;
  architect: string;
  status: OfferStatus;
  currency: Currency;
  items: OfferItem[];
  internalNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  offerId: string;
  authorName: string;
  authorEmail: string;
  text: string;
  isNew: boolean;
  createdAt: string;
}

export interface OfferSummary {
  totalBeforeDiscount: number;
  totalDiscount: number;
  totalAfterDiscount: number;
  itemCount: number;
  currency: Currency;
}

export const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
  umyvadlove_baterie: "Umyvadlové baterie",
  vanove_baterie: "Vanové baterie",
  sprchove_sety: "Sprchové sety",
  hlavove_sprchy: "Hlavové sprchy",
  podomitkove_moduly: "Podomítkové moduly",
  vany: "Vany",
  wc: "WC",
  doplnky: "Doplňky",
  kuchynske_baterie: "Kuchyňské baterie",
  bidetove_baterie: "Bidetové baterie",
  sprchove_kanaly: "Sprchové kanálky",
  ostatni: "Ostatní",
};

export const OFFER_STATUS_LABEL: Record<OfferStatus, string> = {
  rozpracovana: "Rozpracovaná",
  odeslana: "Odeslaná",
  okomentovana: "Okomentovaná",
  potvrzena: "Potvrzená",
};
