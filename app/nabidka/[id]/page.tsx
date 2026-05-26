import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { offerListSelect, mapOffer, productSelect, mapProduct, snapshotProducts, commentSelect, mapComment } from "@/lib/db/selects";
import { NabidkaPublic } from "@/components/NabidkaPublic";

export default async function NabidkaPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: shareId } = await params;

  const dbOffer = await prisma.offer.findUnique({
    where: { shareId },
    select: { ...offerListSelect, shareEnabled: true },
  });

  if (!dbOffer || !dbOffer.shareEnabled) notFound();

  const [dbAllProducts, dbComments] = await Promise.all([
    prisma.product.findMany({ select: productSelect }),
    prisma.comment.findMany({ where: { offerId: dbOffer.id }, orderBy: { createdAt: "asc" }, select: commentSelect }),
  ]);

  const { internalNote: _stripped, ...publicOffer } = mapOffer(dbOffer);
  const snapProds = snapshotProducts(dbOffer.items);
  const comments = dbComments.map(mapComment);

  return (
    <NabidkaPublic
      offer={publicOffer}
      snapshotProducts={snapProds}
      initialComments={comments}
    />
  );
}
