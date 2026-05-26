import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthFromRequest, unauthorizedResponse } from "@/lib/auth";
import { offerListSelect, mapOffer } from "@/lib/db/selects";
import { createOfferSchema } from "@/lib/validation/offers";

export async function GET(req: NextRequest) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();

  const offers = await prisma.offer.findMany({
    select: offerListSelect,
    orderBy: { updatedAt: "desc" },
  });

  return Response.json({ offers: offers.map(mapOffer) });
}

export async function POST(req: NextRequest) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();

  const body = await req.json().catch(() => ({}));
  const parsed = createOfferSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: { code: "VALIDATION_ERROR", message: "Neplatná data", fields: parsed.error.flatten().fieldErrors } }, { status: 400 });
  }

  const offer = await prisma.offer.create({
    data: {
      name: parsed.data.name,
      architect: parsed.data.architect,
      currency: parsed.data.currency,
      createdById: payload.userId,
    },
    select: offerListSelect,
  });

  return Response.json({ offer: mapOffer(offer) }, { status: 201 });
}
