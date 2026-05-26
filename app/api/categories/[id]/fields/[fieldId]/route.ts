import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthFromRequest, unauthorizedResponse } from "@/lib/auth";
import { updateCategoryFieldSchema } from "@/lib/validation/categories";

type Params = { params: Promise<{ id: string; fieldId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();
  if (payload.role !== "admin") {
    return Response.json({ error: { code: "FORBIDDEN", message: "Pouze admin" } }, { status: 403 });
  }

  const { fieldId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = updateCategoryFieldSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: { code: "VALIDATION_ERROR", message: "Neplatná data", fields: parsed.error.flatten().fieldErrors } }, { status: 400 });
  }

  const field = await prisma.categoryField.update({
    where: { id: fieldId },
    data: parsed.data,
    select: { id: true, key: true, label: true, type: true, options: true, order: true },
  });

  return Response.json({ field });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();
  if (payload.role !== "admin") {
    return Response.json({ error: { code: "FORBIDDEN", message: "Pouze admin" } }, { status: 403 });
  }

  const { fieldId } = await params;
  await prisma.categoryField.delete({ where: { id: fieldId } });
  return new Response(null, { status: 204 });
}
