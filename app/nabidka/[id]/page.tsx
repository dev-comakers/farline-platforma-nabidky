import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { offerPublicSelect, mapOfferPublic, snapshotProductsPublic, commentSelect } from "@/lib/db/selects";
import { NabidkaPublic } from "@/components/NabidkaPublic";
import type { ProductCategory } from "@/lib/types";

export default async function NabidkaPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: shareId } = await params;

  const [dbOffer, dbCategories] = await Promise.all([
    prisma.offer.findUnique({
      where: { shareId },
      select: offerPublicSelect,
    }),
    prisma.productCategory.findMany({
      orderBy: { order: "asc" },
      select: {
        id: true, key: true, label: true, order: true,
        fields: { orderBy: { order: "asc" }, select: { id: true, key: true, label: true, type: true, options: true, order: true } },
      },
    }),
  ]);

  if (!dbOffer || !dbOffer.shareEnabled) notFound();

  const dbComments = await prisma.comment.findMany({
    where: { offerId: dbOffer.id },
    orderBy: { createdAt: "asc" },
    select: commentSelect,
  });

  const categories: ProductCategory[] = dbCategories.map((c) => ({
    id: c.id, key: c.key, label: c.label, order: c.order,
    fields: c.fields.map((f) => ({ id: f.id, key: f.key, label: f.label, type: f.type as "text" | "number" | "select", options: f.options, order: f.order })),
  }));

  const publicOffer = mapOfferPublic(dbOffer);
  const hideCode = dbOffer.hideCode;

  const snapProds = snapshotProductsPublic(dbOffer.items).map((p) =>
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
      categories={categories}
    />
  );
}
