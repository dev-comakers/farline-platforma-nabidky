import { prisma } from "@/lib/db/prisma";
import { getAuthFromRequest, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";
import { z } from "zod";
import type { NextRequest } from "next/server";

const updateSchema = z.object({
  label: z.string().min(1).max(200).optional(),
  key: z.string().min(1).max(100).regex(/^[a-z_]+$/, "Klíč smí obsahovat pouze malá písmena a podtržítka").optional(),
  order: z.number().int().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();
  if (payload.role !== "admin") return forbiddenResponse();

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Neplatná data", fields: parsed.error.flatten().fieldErrors } },
      { status: 400 }
    );
  }

  if (parsed.data.key) {
    const conflict = await prisma.productCategory.findFirst({
      where: { key: parsed.data.key, NOT: { id } },
    });
    if (conflict) {
      return Response.json(
        { error: { code: "CONFLICT", message: `Klíč "${parsed.data.key}" již používá jiná kategorie` } },
        { status: 409 }
      );
    }
  }

  const category = await prisma.productCategory.update({
    where: { id },
    data: parsed.data,
    select: { id: true, key: true, label: true, order: true },
  });

  return Response.json({ category });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();
  if (payload.role !== "admin") return forbiddenResponse();

  const { id } = await params;

  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    return Response.json(
      { error: { code: "HAS_PRODUCTS", message: `Kategorii nelze smazat — obsahuje ${productCount} produktů` } },
      { status: 400 }
    );
  }

  await prisma.productCategory.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
