import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getAuthFromRequest, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";

const commitRowSchema = z.object({
  code: z.string().min(1).max(100),
  name: z.string().min(1).max(300),
  brand: z.string().max(200),
  decor: z.string().max(200).default(""),
  categoryId: z.string().uuid(),
  unitPrice: z.number().positive(),
  currency: z.enum(["CZK", "USD", "EUR"]),
  parameters: z.record(z.string(), z.string()).optional(),
  description: z.string().max(2000).nullable().optional(),
});

const commitSchema = z.object({
  rows: z.array(commitRowSchema).min(1).max(2000),
});

export async function POST(req: NextRequest) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();
  if (payload.role !== "admin") return forbiddenResponse();

  const body = await req.json().catch(() => null);
  const parsed = commitSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Neplatná data", fields: parsed.error.flatten().fieldErrors } },
      { status: 400 }
    );
  }

  const { rows } = parsed.data;

  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const existing = await prisma.product.findUnique({ where: { code: row.code } });
    if (existing) {
      await prisma.product.update({
        where: { code: row.code },
        data: {
          name: row.name, brand: row.brand, decor: row.decor,
          categoryId: row.categoryId, unitPrice: row.unitPrice, currency: row.currency,
          ...(row.parameters ? { parameters: row.parameters } : {}),
          ...(row.description !== undefined ? { description: row.description ?? null } : {}),
        },
      });
      updated++;
    } else {
      await prisma.product.create({
        data: {
          code: row.code, name: row.name, brand: row.brand, decor: row.decor,
          categoryId: row.categoryId, unitPrice: row.unitPrice, currency: row.currency,
          parameters: row.parameters ?? {},
          description: row.description ?? null,
        },
      });
      created++;
    }
  }

  return Response.json({ created, updated, total: rows.length });
}
