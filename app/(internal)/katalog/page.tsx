import { prisma } from "@/lib/db/prisma";
import { productSelect, mapProduct } from "@/lib/db/selects";
import { KatalogClient } from "@/components/KatalogClient";

export default async function KatalogPage() {
  const dbProducts = await prisma.product.findMany({
    select: productSelect,
    orderBy: [{ brand: "asc" }, { name: "asc" }],
  });
  const products = dbProducts.map(mapProduct);

  return <KatalogClient initialProducts={products} />;
}
