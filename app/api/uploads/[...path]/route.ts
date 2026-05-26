import type { NextRequest } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { resolveUploadPath } from "@/lib/uploads";
import fs from "fs/promises";
import path from "path";

type RouteCtx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, { params }: RouteCtx) {
  const segments = (await params).path;
  const relativePath = segments.join("/");

  const isSheet = segments[segments.length - 1] === "sheet.pdf";
  if (isSheet) {
    const payload = await getAuthFromRequest(req);
    if (!payload) {
      return new Response(null, { status: 401 });
    }
  }

  const resolved = resolveUploadPath(relativePath);
  if (!resolved) {
    return new Response(null, { status: 404 });
  }

  let data: Buffer;
  try {
    data = await fs.readFile(resolved);
  } catch {
    return new Response(null, { status: 404 });
  }

  const ext = path.extname(resolved).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
  };
  const contentType = mimeMap[ext] ?? "application/octet-stream";

  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "public, max-age=31536000, immutable",
  };

  if (ext === ".pdf") {
    headers["Content-Disposition"] = "attachment";
    headers["Cache-Control"] = "private, no-cache";
  }

  return new Response(new Uint8Array(data), { headers });
}
