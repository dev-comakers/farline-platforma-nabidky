import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { getAuthFromRequest, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";
import { updateUserSchema } from "@/lib/validation/users";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();
  if (payload.role !== "admin") return forbiddenResponse();

  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Neplatná data", fields: parsed.error.flatten().fieldErrors } },
      { status: 400 }
    );
  }

  const { name, role, password } = parsed.data;
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (role !== undefined) updateData.role = role;
  if (password !== undefined) updateData.passwordHash = await bcrypt.hash(password, 12);

  if (Object.keys(updateData).length === 0) {
    return Response.json({ error: { code: "VALIDATION_ERROR", message: "Žádná data k aktualizaci" } }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  }).catch(() => null);

  if (!user) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Uživatel nenalezen" } }, { status: 404 });
  }

  return Response.json({ user });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();
  if (payload.role !== "admin") return forbiddenResponse();

  const { id } = await params;

  if (payload.userId === id) {
    return Response.json(
      { error: { code: "FORBIDDEN", message: "Nemůžete smazat vlastní účet" } },
      { status: 403 }
    );
  }

  await prisma.user.delete({ where: { id } }).catch(() => null);

  return new Response(null, { status: 204 });
}
