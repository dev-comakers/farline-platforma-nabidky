import { z } from "zod";

export const createProductSchema = z.object({
  code: z.string().min(1).max(100),
  name: z.string().min(1).max(300),
  brand: z.string().min(1).max(200),
  decor: z.string().max(200).default(""),
  categoryId: z.string().uuid(),
  unitPrice: z.number().positive(),
  currency: z.enum(["CZK", "USD", "EUR"]).default("CZK"),
  parameters: z.record(z.string(), z.string()).default({}),
});

export const updateProductSchema = z.object({
  code: z.string().min(1).max(100).optional(),
  name: z.string().min(1).max(300).optional(),
  brand: z.string().min(1).max(200).optional(),
  decor: z.string().max(200).optional(),
  categoryId: z.string().uuid().optional(),
  unitPrice: z.number().positive().optional(),
  currency: z.enum(["CZK", "USD", "EUR"]).optional(),
  parameters: z.record(z.string(), z.string()).optional(),
});
