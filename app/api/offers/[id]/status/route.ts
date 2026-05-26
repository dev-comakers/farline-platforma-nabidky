import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthFromRequest, unauthorizedResponse } from "@/lib/auth";
import { offerListSelect, mapOffer } from "@/lib/db/selects";
import { updateOfferStatusSchema } from "@/lib/validation/offers";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = updateOfferStatusSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: { code: "VALIDATION_ERROR", message: "Neplatný stav" } }, { status: 400 });
  }

  const existing = await prisma.offer.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return Response.json({ error: { code: "NOT_FOUND", message: "Nabídka nenalezena" } }, { status: 404 });

  const offer = await prisma.offer.update({
    where: { id },
    data: { status: parsed.data.status },
    select: offerListSelect,
  });

  return Response.json({ offer: mapOffer(offer) });
}
