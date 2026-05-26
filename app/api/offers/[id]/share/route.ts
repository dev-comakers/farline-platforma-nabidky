import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthFromRequest, unauthorizedResponse } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();

  const { id } = await params;
  const offer = await prisma.offer.findUnique({
    where: { id },
    select: { id: true, shareId: true, status: true, sharedAt: true },
  });
  if (!offer) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Nabídka nenalezena" } }, { status: 404 });
  }

  const alreadyShared = offer.sharedAt !== null;

  if (!alreadyShared) {
    await prisma.offer.update({
      where: { id },
      data: {
        sharedAt: new Date(),
        ...(offer.status === "rozpracovana" ? { status: "odeslana" } : {}),
      },
    });
  }

  const newStatus = !alreadyShared && offer.status === "rozpracovana" ? "odeslana" : offer.status;

  return Response.json({
    shareId: offer.shareId,
    alreadyShared,
    status: newStatus,
  });
}
