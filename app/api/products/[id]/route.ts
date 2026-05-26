import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthFromRequest, unauthorizedResponse } from "@/lib/auth";
import { z } from "zod";

const updateProductSchema = z.object({
  imagePath: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: { code: "VALIDATION_ERROR", message: "Neplatná data" } }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return Response.json({ error: { code: "NOT_FOUND", message: "Produkt nenalezen" } }, { status: 404 });

  const product = await prisma.product.update({
    where: { id },
    data: parsed.data,
    select: { id: true, imagePath: true },
  });

  return Response.json({ product: { id: product.id, imagePath: product.imagePath } });
}
