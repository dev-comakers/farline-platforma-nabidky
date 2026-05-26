import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthFromRequest, unauthorizedResponse } from "@/lib/auth";
import { offerItemSelect, mapOfferItem } from "@/lib/db/selects";
import { updateItemSchema } from "@/lib/validation/offers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();

  const { id: offerId, itemId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = updateItemSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: { code: "VALIDATION_ERROR", message: "Neplatná data" } }, { status: 400 });
  }

  const existing = await prisma.offerItem.findFirst({
    where: { id: itemId, offerId },
    select: { id: true },
  });
  if (!existing) return Response.json({ error: { code: "NOT_FOUND", message: "Položka nenalezena" } }, { status: 404 });

  const item = await prisma.offerItem.update({
    where: { id: itemId },
    data: {
      ...(parsed.data.quantity !== undefined && { quantity: parsed.data.quantity }),
      ...(parsed.data.discountPercent !== undefined && { discountPercent: parsed.data.discountPercent }),
      ...(parsed.data.note !== undefined && { note: parsed.data.note }),
      ...(parsed.data.confirmed !== undefined && { confirmed: parsed.data.confirmed }),
      ...(parsed.data.ordered !== undefined && { ordered: parsed.data.ordered }),
      ...(parsed.data.received !== undefined && { received: parsed.data.received }),
    },
    select: offerItemSelect,
  });

  await prisma.offer.update({ where: { id: offerId }, data: { updatedAt: new Date() } });

  return Response.json({ item: mapOfferItem(item) });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();

  const { id: offerId, itemId } = await params;
  const existing = await prisma.offerItem.findFirst({
    where: { id: itemId, offerId },
    select: { id: true },
  });
  if (!existing) return Response.json({ error: { code: "NOT_FOUND", message: "Položka nenalezena" } }, { status: 404 });

  await prisma.offerItem.delete({ where: { id: itemId } });
  await prisma.offer.update({ where: { id: offerId }, data: { updatedAt: new Date() } });

  return new Response(null, { status: 204 });
}
