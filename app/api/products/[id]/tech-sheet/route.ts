import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthFromRequest, unauthorizedResponse } from "@/lib/auth";
import { ensureProductDir, detectMimeType, isPdfMime, getProductDir } from "@/lib/uploads";
import fs from "fs/promises";
import path from "path";

const MAX_BYTES = 10 * 1024 * 1024;

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteCtx) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();

  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, select: { id: true, technicalSheetPath: true } });
  if (!product) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Produkt nenalezen" } }, { status: 404 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("sheet");
  if (!file || !(file instanceof Blob)) {
    return Response.json({ error: { code: "VALIDATION_ERROR", message: "Chybí soubor sheet" } }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return Response.json({ error: { code: "FILE_TOO_LARGE", message: "Soubor nesmí být větší než 10 MB" } }, { status: 413 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const mime = detectMimeType(buf);
  if (!mime || !isPdfMime(mime)) {
    return Response.json(
      { error: { code: "INVALID_FILE_TYPE", message: "Povoleny jsou pouze PDF soubory" } },
      { status: 422 }
    );
  }

  const dir = await ensureProductDir(id);
  const filePath = path.join(dir, "sheet.pdf");

  await fs.writeFile(filePath, buf);

  const relativePath = path.join("products", id, "sheet.pdf");
  const updated = await prisma.product.update({
    where: { id },
    data: { technicalSheetPath: relativePath },
    select: { id: true, technicalSheetPath: true },
  });

  return Response.json({ technicalSheetPath: updated.technicalSheetPath });
}

export async function DELETE(req: NextRequest, { params }: RouteCtx) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();

  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, select: { id: true, technicalSheetPath: true } });
  if (!product) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Produkt nenalezen" } }, { status: 404 });
  }

  if (product.technicalSheetPath) {
    const dir = getProductDir(id);
    await fs.rm(path.join(dir, "sheet.pdf"), { force: true });
    await prisma.product.update({ where: { id }, data: { technicalSheetPath: null } });
  }

  return new Response(null, { status: 204 });
}
