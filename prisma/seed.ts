import { PrismaClient, Currency, OfferStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

const CATEGORIES = [
  { key: "umyvadlove_baterie", label: "Umyvadlové baterie", order: 0 },
  { key: "vanove_baterie", label: "Vanové baterie", order: 1 },
  { key: "sprchove_sety", label: "Sprchové sety", order: 2 },
  { key: "hlavove_sprchy", label: "Hlavové sprchy", order: 3 },
  { key: "podomitkove_moduly", label: "Podomítkové moduly", order: 4 },
  { key: "vany", label: "Vany", order: 5 },
  { key: "wc", label: "WC", order: 6 },
  { key: "doplnky", label: "Doplňky", order: 7 },
  { key: "kuchynske_baterie", label: "Kuchyňské baterie", order: 8 },
  { key: "bidetove_baterie", label: "Bidetové baterie", order: 9 },
  { key: "sprchove_kanaly", label: "Sprchové kanálky", order: 10 },
  { key: "ostatni", label: "Ostatní", order: 11 },
];

const CATEGORY_FIELDS: Record<string, { key: string; label: string; order: number }[]> = {
  umyvadlove_baterie: [
    { key: "rozmery", label: "Rozměry", order: 0 },
    { key: "material", label: "Materiál", order: 1 },
    { key: "povrch", label: "Povrch", order: 2 },
    { key: "pripojeni", label: "Připojení", order: 3 },
    { key: "zaruka", label: "Záruka", order: 4 },
  ],
  vanove_baterie: [
    { key: "rozmery", label: "Rozměry", order: 0 },
    { key: "material", label: "Materiál", order: 1 },
    { key: "povrch", label: "Povrch", order: 2 },
    { key: "pripojeni", label: "Připojení", order: 3 },
    { key: "zaruka", label: "Záruka", order: 4 },
  ],
  sprchove_sety: [
    { key: "rozmery", label: "Rozměry", order: 0 },
    { key: "material", label: "Materiál", order: 1 },
    { key: "povrch", label: "Povrch", order: 2 },
    { key: "prutok", label: "Průtok (l/min)", order: 3 },
    { key: "zaruka", label: "Záruka", order: 4 },
  ],
  hlavove_sprchy: [
    { key: "rozmery", label: "Rozměry", order: 0 },
    { key: "material", label: "Materiál", order: 1 },
    { key: "povrch", label: "Povrch", order: 2 },
    { key: "prutok", label: "Průtok (l/min)", order: 3 },
    { key: "zaruka", label: "Záruka", order: 4 },
  ],
  podomitkove_moduly: [
    { key: "rozmery", label: "Rozměry", order: 0 },
    { key: "material", label: "Materiál", order: 1 },
    { key: "pripojeni", label: "Připojení", order: 2 },
    { key: "zaruka", label: "Záruka", order: 3 },
  ],
  vany: [
    { key: "rozmery", label: "Rozměry", order: 0 },
    { key: "material", label: "Materiál", order: 1 },
    { key: "povrch", label: "Povrch", order: 2 },
    { key: "objem", label: "Objem (l)", order: 3 },
    { key: "hmotnost", label: "Hmotnost (kg)", order: 4 },
    { key: "zaruka", label: "Záruka", order: 5 },
  ],
  wc: [
    { key: "rozmery", label: "Rozměry", order: 0 },
    { key: "material", label: "Materiál", order: 1 },
    { key: "povrch", label: "Povrch", order: 2 },
    { key: "hmotnost", label: "Hmotnost (kg)", order: 3 },
    { key: "zaruka", label: "Záruka", order: 4 },
  ],
  doplnky: [
    { key: "rozmery", label: "Rozměry", order: 0 },
    { key: "material", label: "Materiál", order: 1 },
    { key: "povrch", label: "Povrch", order: 2 },
    { key: "hmotnost", label: "Hmotnost (kg)", order: 3 },
    { key: "zaruka", label: "Záruka", order: 4 },
  ],
  kuchynske_baterie: [
    { key: "rozmery", label: "Rozměry", order: 0 },
    { key: "material", label: "Materiál", order: 1 },
    { key: "povrch", label: "Povrch", order: 2 },
    { key: "pripojeni", label: "Připojení", order: 3 },
    { key: "zaruka", label: "Záruka", order: 4 },
  ],
  bidetove_baterie: [
    { key: "rozmery", label: "Rozměry", order: 0 },
    { key: "material", label: "Materiál", order: 1 },
    { key: "povrch", label: "Povrch", order: 2 },
    { key: "pripojeni", label: "Připojení", order: 3 },
    { key: "zaruka", label: "Záruka", order: 4 },
  ],
  sprchove_kanaly: [
    { key: "rozmery", label: "Rozměry", order: 0 },
    { key: "material", label: "Materiál", order: 1 },
    { key: "povrch", label: "Povrch", order: 2 },
    { key: "zaruka", label: "Záruka", order: 3 },
  ],
  ostatni: [
    { key: "rozmery", label: "Rozměry", order: 0 },
    { key: "material", label: "Materiál", order: 1 },
    { key: "zaruka", label: "Záruka", order: 2 },
  ],
};

async function main() {
  console.log("Seeding database...");

  // Admin user (idempotent)
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@farline.cz";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "changeme";
  const passwordHash = await hashPassword(adminPassword);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: {
      email: adminEmail,
      name: "Filip Kott",
      role: "admin",
      passwordHash,
    },
  });
  console.log(`Admin upserted: ${adminEmail}`);

  // Categories + fields
  const categoryIdByKey: Record<string, string> = {};
  for (const cat of CATEGORIES) {
    const category = await prisma.productCategory.upsert({
      where: { key: cat.key },
      update: { label: cat.label, order: cat.order },
      create: { key: cat.key, label: cat.label, order: cat.order },
    });
    categoryIdByKey[cat.key] = category.id;

    const fields = CATEGORY_FIELDS[cat.key] ?? [];
    for (const field of fields) {
      await prisma.categoryField.upsert({
        where: { categoryId_key: { categoryId: category.id, key: field.key } },
        update: { label: field.label, order: field.order },
        create: {
          categoryId: category.id,
          key: field.key,
          label: field.label,
          type: "text",
          options: [],
          order: field.order,
        },
      });
    }
  }
  console.log("Categories and fields seeded");

  // Products
  const productsJson = await import("../data/products.json", {
    with: { type: "json" },
  });
  const products = productsJson.default as Array<{
    id: string;
    code: string;
    name: string;
    brand: string;
    decor: string;
    type: string;
    unitPrice: number;
    currency: string;
  }>;

  const productIdByCode: Record<string, string> = {};
  for (const p of products) {
    const categoryId = categoryIdByKey[p.type];
    if (!categoryId) {
      console.warn(`No category for type "${p.type}", skipping product ${p.code}`);
      continue;
    }
    const product = await prisma.product.upsert({
      where: { code: p.code },
      update: {
        name: p.name,
        brand: p.brand,
        decor: p.decor,
        categoryId,
        unitPrice: p.unitPrice,
        currency: p.currency as Currency,
      },
      create: {
        code: p.code,
        name: p.name,
        brand: p.brand,
        decor: p.decor,
        categoryId,
        unitPrice: p.unitPrice,
        currency: p.currency as Currency,
      },
    });
    productIdByCode[p.id] = product.id;
  }
  console.log(`${products.length} products seeded`);

  // Offers + items
  const offersJson = await import("../data/offers.json", {
    with: { type: "json" },
  });
  const offers = offersJson.default as Array<{
    id: string;
    name: string;
    architect: string;
    status: string;
    currency: string;
    createdAt: string;
    updatedAt: string;
    internalNote?: string;
    items: Array<{
      id: string;
      productId: string;
      quantity: number;
      discountPercent: number;
      note?: string;
    }>;
  }>;

  // Need product prices for snapshots
  const productPrices: Record<string, number> = {};
  for (const p of products) {
    productPrices[p.id] = p.unitPrice;
  }

  for (const offer of offers) {
    const existing = await prisma.offer.findFirst({
      where: { name: offer.name, architect: offer.architect },
    });

    const offerId = existing?.id ?? (await prisma.offer.create({
      data: {
        name: offer.name,
        architect: offer.architect,
        status: offer.status as OfferStatus,
        currency: offer.currency as Currency,
        internalNote: offer.internalNote ?? null,
        createdAt: new Date(offer.createdAt),
        updatedAt: new Date(offer.updatedAt),
      },
    })).id;

    // Upsert items
    for (let i = 0; i < offer.items.length; i++) {
      const item = offer.items[i];
      const productId = productIdByCode[item.productId];
      if (!productId) {
        console.warn(`Product not found for item ${item.id}, skipping`);
        continue;
      }
      const unitPriceSnapshot = productPrices[item.productId] ?? 0;
      const existingItem = await prisma.offerItem.findFirst({
        where: { offerId, productId, position: i },
      });
      if (!existingItem) {
        await prisma.offerItem.create({
          data: {
            offerId,
            productId,
            quantity: item.quantity,
            discountPercent: item.discountPercent,
            unitPriceSnapshot,
            note: item.note ?? null,
            position: i,
          },
        });
      }
    }
  }
  console.log(`${offers.length} offers seeded`);

  // Demo comment
  const commentsJson = await import("../data/comments.json", {
    with: { type: "json" },
  });
  const comments = commentsJson.default as Array<{
    offerId: string;
    authorName: string;
    authorEmail: string;
    text: string;
    isNew: boolean;
    createdAt: string;
  }>;

  const nebusiceOffer = await prisma.offer.findFirst({
    where: { name: "RD Nebušice" },
  });

  if (nebusiceOffer) {
    const existingComment = await prisma.comment.findFirst({
      where: { offerId: nebusiceOffer.id },
    });
    if (!existingComment) {
      for (const c of comments) {
        await prisma.comment.create({
          data: {
            offerId: nebusiceOffer.id,
            authorName: c.authorName,
            authorEmail: c.authorEmail,
            text: c.text,
            isNew: c.isNew,
            createdAt: new Date(c.createdAt),
          },
        });
      }
      console.log("Demo comments seeded");
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
