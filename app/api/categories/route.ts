import { prisma } from "@/lib/db/prisma";
import { getAuthFromRequest, unauthorizedResponse } from "@/lib/auth";
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
