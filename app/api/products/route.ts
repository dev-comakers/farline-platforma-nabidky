import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthFromRequest, unauthorizedResponse } from "@/lib/auth";
import { productSelect, mapProduct } from "@/lib/db/selects";
import { createProductSchema } from "@/lib/validation/products";

export async function GET(req: NextRequest) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";

  const products = await prisma.product.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { code: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
              { brand: { contains: q, mode: "insensitive" } },
              { decor: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(categoryId ? { categoryId } : {}),
    },
    select: productSelect,
    orderBy: [{ brand: "asc" }, { code: "asc" }],
  });

  return Response.json({ products: products.map(mapProduct) });
}

export async function POST(req: NextRequest) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();

  const body = await req.json().catch(() => ({}));
  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Neplatná data", fields: parsed.error.flatten().fieldErrors } },
      { status: 400 }
    );
  }

  const existing = await prisma.product.findUnique({
    where: { code: parsed.data.code },
    select: { id: true },
  });
  if (existing) {
    return Response.json(
      { error: { code: "CONFLICT", message: "Produkt s tímto kódem již existuje" } },
      { status: 409 }
    );
  }

  const product = await prisma.product.create({
    data: {
      code: parsed.data.code,
      name: parsed.data.name,
      brand: parsed.data.brand,
      decor: parsed.data.decor,
      category: { connect: { id: parsed.data.categoryId } },
      unitPrice: parsed.data.unitPrice,
      currency: parsed.data.currency,
      parameters: parsed.data.parameters as Record<string, string>,
    },
    select: productSelect,
  });

  return Response.json({ product: mapProduct(product) }, { status: 201 });
}
