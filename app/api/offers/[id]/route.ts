import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthFromRequest, unauthorizedResponse } from "@/lib/auth";
import { offerListSelect, mapOffer } from "@/lib/db/selects";
import { updateOfferSchema } from "@/lib/validation/offers";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();

  const { id } = await params;
  const offer = await prisma.offer.findUnique({ where: { id }, select: offerListSelect });
  if (!offer) return Response.json({ error: { code: "NOT_FOUND", message: "Nabídka nenalezena" } }, { status: 404 });

  return Response.json({ offer: mapOffer(offer) });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = updateOfferSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: { code: "VALIDATION_ERROR", message: "Neplatná data", fields: parsed.error.flatten().fieldErrors } }, { status: 400 });
  }

  const existing = await prisma.offer.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return Response.json({ error: { code: "NOT_FOUND", message: "Nabídka nenalezena" } }, { status: 404 });

  const offer = await prisma.offer.update({
    where: { id },
    data: parsed.data,
    select: offerListSelect,
  });

  return Response.json({ offer: mapOffer(offer) });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();
  if (payload.role !== "admin") {
    return Response.json({ error: { code: "FORBIDDEN", message: "Pouze admin může smazat nabídku" } }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.offer.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!existing) return Response.json({ error: { code: "NOT_FOUND", message: "Nabídka nenalezena" } }, { status: 404 });
  if (existing.status === "potvrzena") {
    return Response.json({ error: { code: "FORBIDDEN", message: "Potvrzenou nabídku nelze smazat" } }, { status: 403 });
  }

  await prisma.offer.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
