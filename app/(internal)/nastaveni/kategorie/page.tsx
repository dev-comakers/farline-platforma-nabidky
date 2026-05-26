import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { CategoryFieldsManager } from "@/components/CategoryFieldsManager";
import type { ProductCategory } from "@/lib/types";

export default async function KategorieAdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload || payload.role !== "admin") notFound();

  const dbCategories = await prisma.productCategory.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      key: true,
      label: true,
      order: true,
      fields: {
        orderBy: { order: "asc" },
        select: { id: true, key: true, label: true, type: true, options: true, order: true },
      },
    },
  });

  const categories: ProductCategory[] = dbCategories.map((c) => ({
    id: c.id,
    key: c.key,
    label: c.label,
    order: c.order,
    fields: c.fields.map((f) => ({
      id: f.id,
      key: f.key,
      label: f.label,
      type: f.type as "text" | "number" | "select",
      options: f.options,
      order: f.order,
    })),
  }));

  return (
    <div className="px-10 py-8 max-w-[900px]">
      <header className="mb-8">
        <div className="text-xs uppercase tracking-[0.2em] text-zinc-400 mb-2">Nastavení</div>
        <h1
          className="text-4xl font-semibold tracking-tight text-zinc-900"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Kategorie produktů
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Spravujte pole parametrů pro každou kategorii. Změny se okamžitě projeví ve formuláři produktu.
        </p>
      </header>

      <CategoryFieldsManager initialCategories={categories} />
    </div>
  );
}
