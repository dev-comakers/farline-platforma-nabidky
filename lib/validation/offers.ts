import { z } from "zod";

export const createOfferSchema = z.object({
  name: z.string().min(1).max(200).default("Nová nabídka"),
  architect: z.string().max(200).default(""),
  currency: z.enum(["CZK", "USD", "EUR"]).default("CZK"),
});

export const updateOfferSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  architect: z.string().max(200).optional(),
  currency: z.enum(["CZK", "USD", "EUR"]).optional(),
  internalNote: z.string().nullable().optional(),
  showVat: z.boolean().optional(),
  hideCode: z.boolean().optional(),
});

export const updateOfferStatusSchema = z.object({
  status: z.enum(["rozpracovana", "odeslana", "okomentovana", "potvrzena"]),
});

export const addItemSchema = z.object({
  productId: z.string().uuid(),
});

export const updateItemSchema = z.object({
  quantity: z.number().int().min(1).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  note: z.string().max(500).nullable().optional(),
  confirmed: z.boolean().optional(),
  ordered: z.boolean().optional(),
  received: z.boolean().optional(),
});

export const addCommentSchema = z.object({
  authorName: z.string().min(1).max(200),
  authorEmail: z.string().email(),
  text: z.string().min(1).max(5000),
});
