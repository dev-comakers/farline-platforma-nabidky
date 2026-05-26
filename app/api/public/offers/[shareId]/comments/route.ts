import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { addCommentSchema } from "@/lib/validation/offers";
import { commentSelect, mapComment } from "@/lib/db/selects";

export async function POST(req: NextRequest, { params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;

  const offer = await prisma.offer.findUnique({
    where: { shareId },
    select: { id: true, shareEnabled: true },
  });
  if (!offer || !offer.shareEnabled) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Nabídka nenalezena" } }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = addCommentSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: { code: "VALIDATION_ERROR", message: "Neplatná data", fields: parsed.error.flatten().fieldErrors } }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      offerId: offer.id,
      authorName: parsed.data.authorName,
      authorEmail: parsed.data.authorEmail,
      text: parsed.data.text,
      isNew: true,
    },
    select: commentSelect,
  });

  await prisma.offer.update({
    where: { id: offer.id },
    data: { status: "okomentovana" },
  });

  return Response.json({ comment: mapComment(comment) }, { status: 201 });
}
