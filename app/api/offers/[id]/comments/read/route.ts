import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthFromRequest, unauthorizedResponse } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();

  const { id: offerId } = await params;
  await prisma.comment.updateMany({
    where: { offerId, isNew: true },
    data: { isNew: false },
  });

  return new Response(null, { status: 204 });
}
