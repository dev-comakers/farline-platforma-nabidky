import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { offerListSelect, mapOffer, productSelect, mapProduct, snapshotProducts, commentSelect, mapComment } from "@/lib/db/selects";
import { OfferEditor } from "@/components/OfferEditor";

export default async function OfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [dbOffer, dbAllProducts, dbComments] = await Promise.all([
    prisma.offer.findUnique({ where: { id }, select: offerListSelect }),
    prisma.product.findMany({ select: productSelect, orderBy: [{ brand: "asc" }, { name: "asc" }] }),
    prisma.comment.findMany({ where: { offerId: id }, orderBy: { createdAt: "asc" }, select: commentSelect }),
  ]);

  if (!dbOffer) notFound();

  const offer = mapOffer(dbOffer);
  const snapProds = snapshotProducts(dbOffer.items);
  const allProducts = dbAllProducts.map(mapProduct);
  const comments = dbComments.map(mapComment);

  return (
    <OfferEditor
      initialOffer={offer}
      snapshotProducts={snapProds}
      allProducts={allProducts}
      initialComments={comments}
    />
  );
}
