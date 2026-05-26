import { prisma } from "@/lib/db/prisma";
import { offerListSelect, mapOffer, snapshotProducts } from "@/lib/db/selects";
import { NabidkyClient } from "@/components/NabidkyClient";
import { offerSummary } from "@/lib/calculations";
import type { Prisma } from "@prisma/client";

type DbOffer = Prisma.OfferGetPayload<{ select: typeof offerListSelect }>;

export default async function NabidkyPage() {
  const dbOffers = await prisma.offer.findMany({
    select: offerListSelect,
    orderBy: { updatedAt: "desc" },
  });

  const offersWithTotals = dbOffers.map((dbOffer: DbOffer) => {
    const offer = mapOffer(dbOffer);
    const products = snapshotProducts(dbOffer.items);
    const summary = offerSummary(offer, products);
    return { offer, total: summary.totalAfterDiscount, itemCount: summary.itemCount };
  });

  return <NabidkyClient offersWithTotals={offersWithTotals} />;
}
