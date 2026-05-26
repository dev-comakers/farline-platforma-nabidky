import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthFromRequest, unauthorizedResponse } from "@/lib/auth";
import { offerListSelect, mapOffer } from "@/lib/db/selects";
import { createOfferSchema } from "@/lib/validation/offers";

export async function GET(req: NextRequest) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const skip = (page - 1) * limit;

  const where = status ? { status: status as never } : {};

  const [offers, total] = await prisma.$transaction([
    prisma.offer.findMany({
      where,
      select: offerListSelect,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.offer.count({ where }),
  ]);

  return Response.json({ offers: offers.map(mapOffer), total, page, limit });
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
