import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthFromRequest, unauthorizedResponse } from "@/lib/auth";
import { productSelect, mapProduct } from "@/lib/db/selects";
import { updateProductSchema } from "@/lib/validation/products";
import { getProductDir } from "@/lib/uploads";
import fs from "fs/promises";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteCtx) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();

  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, select: productSelect });
  if (!product) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Produkt nenalezen" } }, { status: 404 });
  }

  return Response.json({ product: mapProduct(product) });
}

export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();

  const { id } = await params;
  const existing = await prisma.product.findUnique({ where: { id }, select: { id: true, code: true } });
  if (!existing) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Produkt nenalezen" } }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Neplatná data", fields: parsed.error.flatten().fieldErrors } },
      { status: 400 }
    );
  }

  if (parsed.data.code && parsed.data.code !== existing.code) {
    const conflict = await prisma.product.findUnique({ where: { code: parsed.data.code }, select: { id: true } });
    if (conflict) {
      return Response.json(
        { error: { code: "CONFLICT", message: "Produkt s tímto kódem již existuje" } },
        { status: 409 }
      );
    }
  }

  const { categoryId, parameters, description, ...rest } = parsed.data;
  const product = await prisma.product.update({
    where: { id },
    data: {
      ...rest,
      ...(parameters !== undefined ? { parameters: parameters as Record<string, string> } : {}),
      ...(description !== undefined ? { description: description ?? null } : {}),
      ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
    },
    select: productSelect,
  });

  return Response.json({ product: mapProduct(product) });
}

export async function DELETE(req: NextRequest, { params }: RouteCtx) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();

  const { id } = await params;
  const existing = await prisma.product.findUnique({
    where: { id },
    select: { id: true, _count: { select: { offerItems: true } } },
  });
  if (!existing) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Produkt nenalezen" } }, { status: 404 });
  }

  if (existing._count.offerItems > 0) {
    return Response.json(
      { error: { code: "CONFLICT", message: "Produkt je použit v nabídkách a nelze ho smazat" } },
      { status: 409 }
    );
  }

  await prisma.product.delete({ where: { id } });
  await fs.rm(getProductDir(id), { recursive: true, force: true });

  return new Response(null, { status: 204 });
}
