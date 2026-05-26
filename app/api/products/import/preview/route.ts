import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthFromRequest, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";
import { parseFileBuffer, validateRows } from "@/lib/import-parse";

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const payload = await getAuthFromRequest(req);
  if (!payload) return unauthorizedResponse();
  if (payload.role !== "admin") return forbiddenResponse();

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return Response.json({ error: { code: "VALIDATION_ERROR", message: "Očekáváno multipart/form-data" } }, { status: 400 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || typeof file === "string") {
    return Response.json({ error: { code: "VALIDATION_ERROR", message: "Soubor nenalezen" } }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_BYTES) {
    return Response.json({ error: { code: "FILE_TOO_LARGE", message: "Soubor je příliš velký (max 10 MB)" } }, { status: 413 });
  }

  const buffer = Buffer.from(arrayBuffer);

  let rawRows: Record<string, string>[];
  try {
    rawRows = parseFileBuffer(buffer);
  } catch {
    return Response.json({ error: { code: "PARSE_ERROR", message: "Nepodařilo se načíst soubor. Zkontrolujte formát." } }, { status: 422 });
  }

  if (rawRows.length === 0) {
    return Response.json({ error: { code: "EMPTY_FILE", message: "Soubor neobsahuje žádná data" } }, { status: 422 });
  }

  if (rawRows.length > 2000) {
    return Response.json({ error: { code: "TOO_MANY_ROWS", message: "Soubor obsahuje více než 2000 řádků" } }, { status: 422 });
  }

  const categories = await prisma.productCategory.findMany({ select: { id: true, key: true } });
  const rows = validateRows(rawRows, categories);

  const validCount = rows.filter((r) => r.valid).length;
  const errorCount = rows.length - validCount;

  return Response.json({ rows, validCount, errorCount });
}
