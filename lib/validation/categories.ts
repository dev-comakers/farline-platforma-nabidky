import { z } from "zod";

export const categoryFieldSchema = z.object({
  key: z.string().min(1).max(100).regex(/^[a-z_]+$/, "Pouze malá písmena a podtržítka"),
  label: z.string().min(1).max(200),
  type: z.enum(["text", "number", "select"]),
  options: z.array(z.string().max(200)).default([]),
  order: z.number().int().min(0).default(0),
});

export const updateCategoryFieldSchema = categoryFieldSchema.partial();
