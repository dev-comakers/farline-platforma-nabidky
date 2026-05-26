import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthFromRequest, unauthorizedResponse } from "@/lib/auth";
import { ensureProductDir, detectMimeType, isImageMime, mimeToExt, getProductDir } from "@/lib/uploads";
import fs from "fs/promises";
import path from "path";

const MAX_BYTES = 5 * 1024 * 1024;

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteCtx) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();

  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, select: { id: true, imagePath: true } });
  if (!product) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Produkt nenalezen" } }, { status: 404 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("image");
  if (!file || !(file instanceof Blob)) {
    return Response.json({ error: { code: "VALIDATION_ERROR", message: "Chybí soubor image" } }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return Response.json({ error: { code: "FILE_TOO_LARGE", message: "Soubor nesmí být větší než 5 MB" } }, { status: 413 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const mime = detectMimeType(buf);
  if (!mime || !isImageMime(mime)) {
    return Response.json(
      { error: { code: "INVALID_FILE_TYPE", message: "Povoleny jsou pouze obrázky JPG, PNG nebo WebP" } },
      { status: 422 }
    );
  }

  const dir = await ensureProductDir(id);
  const filename = `photo.${mimeToExt(mime)}`;
  const filePath = path.join(dir, filename);

  if (product.imagePath) {
    const old = path.join(getProductDir(id), path.basename(product.imagePath ?? ""));
    await fs.rm(old, { force: true });
  }

  await fs.writeFile(filePath, buf);

  const relativePath = path.join("products", id, filename);
  const updated = await prisma.product.update({
    where: { id },
    data: { imagePath: relativePath },
    select: { id: true, imagePath: true },
  });

  return Response.json({ imagePath: updated.imagePath });
}

export async function DELETE(req: NextRequest, { params }: RouteCtx) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();

  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, select: { id: true, imagePath: true } });
  if (!product) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Produkt nenalezen" } }, { status: 404 });
  }

  if (product.imagePath) {
    const dir = getProductDir(id);
    await fs.rm(path.join(dir, path.basename(product.imagePath)), { force: true });
    await prisma.product.update({ where: { id }, data: { imagePath: null } });
  }

  return new Response(null, { status: 204 });
}
