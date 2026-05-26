import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { offerListSelect, mapOffer, snapshotProducts, commentSelect, mapComment } from "@/lib/db/selects";
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

  const dbComments = await prisma.comment.findMany({
    where: { offerId: dbOffer.id },
    orderBy: { createdAt: "asc" },
    select: commentSelect,
  });

  const { internalNote: _i, ...publicOffer } = mapOffer(dbOffer);
  const hideCode = dbOffer.hideCode;

  const snapProds = snapshotProducts(dbOffer.items).map((p) =>
    hideCode ? { ...p, code: "" } : p
  );

  const comments = dbComments.map((c) => ({
    id: c.id,
    offerId: c.offerId,
    authorName: c.authorName,
    authorEmail: "",
    text: c.text,
    isNew: c.isNew,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <NabidkaPublic
      offer={publicOffer}
      snapshotProducts={snapProds}
      initialComments={comments}
    />
  );
}
