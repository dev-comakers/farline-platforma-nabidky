import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthFromRequest, unauthorizedResponse } from "@/lib/auth";
import { offerItemSelect, mapOfferItem, mapProduct } from "@/lib/db/selects";
import { addItemSchema } from "@/lib/validation/offers";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();

  const { id: offerId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = addItemSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: { code: "VALIDATION_ERROR", message: "Neplatná data" } }, { status: 400 });
  }

  const offer = await prisma.offer.findUnique({ where: { id: offerId }, select: { id: true } });
  if (!offer) return Response.json({ error: { code: "NOT_FOUND", message: "Nabídka nenalezena" } }, { status: 404 });

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true, unitPrice: true },
  });
  if (!product) return Response.json({ error: { code: "NOT_FOUND", message: "Produkt nenalezen" } }, { status: 404 });

  const maxPos = await prisma.offerItem.aggregate({
    where: { offerId },
    _max: { position: true },
  });
  const position = (maxPos._max.position ?? -1) + 1;

  const item = await prisma.offerItem.create({
    data: {
      offerId,
      productId: parsed.data.productId,
      unitPriceSnapshot: product.unitPrice,
      position,
    },
    select: offerItemSelect,
  });

  return Response.json({
    item: mapOfferItem(item),
    product: { ...mapProduct(item.product), unitPrice: item.unitPriceSnapshot.toNumber() },
  }, { status: 201 });
}
