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

  const [dbOffer, dbAllProducts, dbComments, dbCategories] = await Promise.all([
    prisma.offer.findUnique({ where: { id }, select: offerListSelect }),
    prisma.product.findMany({ select: productSelect, orderBy: [{ brand: "asc" }, { name: "asc" }] }),
    prisma.comment.findMany({ where: { offerId: id }, orderBy: { createdAt: "asc" }, select: commentSelect }),
    prisma.productCategory.findMany({
      orderBy: { order: "asc" },
      select: {
        id: true, key: true, label: true, order: true,
        fields: { orderBy: { order: "asc" }, select: { id: true, key: true, label: true, type: true, options: true, order: true } },
      },
    }),
  ]);

  if (!dbOffer) notFound();

  const offer = mapOffer(dbOffer);
  const snapProds = snapshotProducts(dbOffer.items);
  const allProducts = dbAllProducts.map(mapProduct);
  const comments = dbComments.map(mapComment);
  const categories = dbCategories.map((c) => ({
    id: c.id, key: c.key, label: c.label, order: c.order,
    fields: c.fields.map((f) => ({ id: f.id, key: f.key, label: f.label, type: f.type as "text" | "number" | "select", options: f.options, order: f.order })),
  }));

  return (
    <OfferEditor
      initialOffer={offer}
      snapshotProducts={snapProds}
      allProducts={allProducts}
      initialComments={comments}
      categories={categories}
      userRole={userRole}
    />
  );
}
