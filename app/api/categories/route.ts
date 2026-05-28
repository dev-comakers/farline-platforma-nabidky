import { prisma } from "@/lib/db/prisma";
import { getAuthFromRequest, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";
import { z } from "zod";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();

  const categories = await prisma.productCategory.findMany({
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

  return Response.json({ categories });
}

const createSchema = z.object({
  key: z.string().min(1).max(100).regex(/^[a-z_]+$/, "Klíč smí obsahovat pouze malá písmena a podtržítka"),
  label: z.string().min(1).max(200),
  order: z.number().int().optional().default(999),
});

export async function POST(req: NextRequest) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();
  if (payload.role !== "admin") return forbiddenResponse();

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Neplatná data", fields: parsed.error.flatten().fieldErrors } },
      { status: 400 }
    );
  }

  const existing = await prisma.productCategory.findUnique({ where: { key: parsed.data.key } });
  if (existing) {
    return Response.json(
      { error: { code: "CONFLICT", message: `Kategorie s klíčem "${parsed.data.key}" již existuje` } },
      { status: 409 }
    );
  }

  const category = await prisma.productCategory.create({
    data: { key: parsed.data.key, label: parsed.data.label, order: parsed.data.order },
    select: { id: true, key: true, label: true, order: true },
  });

  return Response.json({ category }, { status: 201 });
}
