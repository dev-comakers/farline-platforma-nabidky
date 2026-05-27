import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { verifyToken } from "@/lib/auth";
import { offerListSelect, mapOffer, productSelect, mapProduct, snapshotProducts, commentSelect, mapComment } from "@/lib/db/selects";
import { OfferEditor } from "@/components/OfferEditor";

export default async function OfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const payload = token ? await verifyToken(token) : null;
  const userRole = payload?.role ?? "manager";

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
      userRole={userRole}
    />
  );
}
