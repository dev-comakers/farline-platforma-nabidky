import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthFromRequest, unauthorizedResponse } from "@/lib/auth";
import { categoryFieldSchema } from "@/lib/validation/categories";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();
  if (payload.role !== "admin") {
    return Response.json({ error: { code: "FORBIDDEN", message: "Pouze admin" } }, { status: 403 });
  }

  const { id: categoryId } = await params;

  const category = await prisma.productCategory.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!category) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Kategorie nenalezena" } }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = categoryFieldSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: { code: "VALIDATION_ERROR", message: "Neplatná data", fields: parsed.error.flatten().fieldErrors } }, { status: 400 });
  }

  const existing = await prisma.categoryField.findUnique({
    where: { categoryId_key: { categoryId, key: parsed.data.key } },
    select: { id: true },
  });
  if (existing) {
    return Response.json({ error: { code: "CONFLICT", message: "Pole s tímto klíčem již existuje" } }, { status: 409 });
  }

  const field = await prisma.categoryField.create({
    data: { categoryId, ...parsed.data },
    select: { id: true, key: true, label: true, type: true, options: true, order: true },
  });

  return Response.json({ field }, { status: 201 });
}
