"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import productsData from "@/data/products.json";
import offersData from "@/data/offers.json";
import commentsData from "@/data/comments.json";
import type {
  Comment,
  Offer,
  OfferItem,
  OfferStatus,
  Product,
} from "./types";

interface StoreContextValue {
  products: Product[];
  offers: Offer[];
  comments: Comment[];
  addOffer: (offer: Offer) => void;
  updateOffer: (id: string, patch: Partial<Offer>) => void;
  deleteOffer: (id: string) => void;
  addOfferItem: (offerId: string, productId: string) => void;
  updateOfferItem: (
    offerId: string,
    itemId: string,
    patch: Partial<OfferItem>
  ) => void;
  removeOfferItem: (offerId: string, itemId: string) => void;
  setOfferStatus: (offerId: string, status: OfferStatus) => void;
  addComment: (comment: Comment) => void;
  markCommentsRead: (offerId: string) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const uid = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(productsData as Product[]);

  const updateProduct = useCallback((id: string, patch: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p
      )
    );
  }, []);
  const [offers, setOffers] = useState<Offer[]>(offersData as Offer[]);
  const [comments, setComments] = useState<Comment[]>(commentsData as Comment[]);

  const addOffer = useCallback((offer: Offer) => {
    setOffers((prev) => [offer, ...prev]);
  }, []);

  const updateOffer = useCallback((id: string, patch: Partial<Offer>) => {
    setOffers((prev) =>
      prev.map((o) =>
        o.id === id
          ? { ...o, ...patch, updatedAt: new Date().toISOString() }
          : o
      )
    );
  }, []);

  const deleteOffer = useCallback((id: string) => {
    setOffers((prev) => prev.filter((o) => o.id !== id));
    setComments((prev) => prev.filter((c) => c.offerId !== id));
  }, []);

  const addOfferItem = useCallback((offerId: string, productId: string) => {
    setOffers((prev) =>
      prev.map((o) => {
        if (o.id !== offerId) return o;
        const newItem: OfferItem = {
          id: uid("i"),
          productId,
          quantity: 1,
          discountPercent: 0,
        };
        return {
          ...o,
          items: [...o.items, newItem],
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  const updateOfferItem = useCallback(
    (offerId: string, itemId: string, patch: Partial<OfferItem>) => {
      setOffers((prev) =>
        prev.map((o) => {
          if (o.id !== offerId) return o;
          return {
            ...o,
            items: o.items.map((i) =>
              i.id === itemId ? { ...i, ...patch } : i
            ),
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    []
  );

  const removeOfferItem = useCallback((offerId: string, itemId: string) => {
    setOffers((prev) =>
      prev.map((o) => {
        if (o.id !== offerId) return o;
        return {
          ...o,
          items: o.items.filter((i) => i.id !== itemId),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  const setOfferStatus = useCallback((offerId: string, status: OfferStatus) => {
    setOffers((prev) =>
      prev.map((o) =>
        o.id === offerId
          ? { ...o, status, updatedAt: new Date().toISOString() }
          : o
      )
    );
  }, []);

  const addComment = useCallback((comment: Comment) => {
    setComments((prev) => [...prev, comment]);
    setOffers((prev) =>
      prev.map((o) =>
        o.id === comment.offerId
          ? { ...o, status: "okomentovana", updatedAt: new Date().toISOString() }
          : o
      )
    );
  }, []);

  const markCommentsRead = useCallback((offerId: string) => {
    setComments((prev) =>
      prev.map((c) => (c.offerId === offerId ? { ...c, isNew: false } : c))
    );
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      products,
      offers,
      comments,
      addOffer,
      updateOffer,
      deleteOffer,
      addOfferItem,
      updateOfferItem,
      removeOfferItem,
      setOfferStatus,
      addComment,
      markCommentsRead,
      updateProduct,
    }),
    [
      products,
      offers,
      comments,
      addOffer,
      updateOffer,
      deleteOffer,
      addOfferItem,
      updateOfferItem,
      removeOfferItem,
      setOfferStatus,
      addComment,
      markCommentsRead,
      updateProduct,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export function createEmptyOffer(): Offer {
  const now = new Date().toISOString();
  return {
    id: uid("offer"),
    name: "Nová nabídka",
    architect: "",
    status: "rozpracovana",
    currency: "CZK",
    items: [],
    internalNote: null,
    createdAt: now,
    updatedAt: now,
  };
}

export { uid };
