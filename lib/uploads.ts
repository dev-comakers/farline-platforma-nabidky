import fs from "fs/promises";
import path from "path";

export function getUploadsDir(): string {
  return process.env.UPLOADS_DIR ?? path.join(process.cwd(), "data", "uploads");
}

export function getProductDir(productId: string): string {
  return path.join(getUploadsDir(), "products", productId);
}

export async function ensureProductDir(productId: string): Promise<string> {
  const dir = getProductDir(productId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export function resolveUploadPath(relativePath: string): string | null {
  const uploadsDir = getUploadsDir();
  const resolved = path.resolve(uploadsDir, relativePath);
  if (!resolved.startsWith(uploadsDir + path.sep) && resolved !== uploadsDir) return null;
  return resolved;
}

const MAGIC: Record<string, { bytes: number[]; mask?: number[] }[]> = {
  "image/jpeg": [{ bytes: [0xff, 0xd8, 0xff] }],
  "image/png": [{ bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  "image/webp": [{ bytes: [0x52, 0x49, 0x46, 0x46] }],
  "application/pdf": [{ bytes: [0x25, 0x50, 0x44, 0x46] }],
};

function matchesMagic(buf: Buffer, pattern: { bytes: number[] }): boolean {
  if (buf.length < pattern.bytes.length) return false;
  return pattern.bytes.every((b, i) => buf[i] === b);
}

export function detectMimeType(buf: Buffer): string | null {
  for (const [mime, patterns] of Object.entries(MAGIC)) {
    if (patterns.some((p) => matchesMagic(buf, p))) {
      if (mime === "image/webp") {
        if (buf.length < 12) return null;
        const marker = buf.slice(8, 12).toString("ascii");
        if (marker !== "WEBP") return null;
      }
      return mime;
    }
  }
  return null;
}

export function isImageMime(mime: string): boolean {
  return mime === "image/jpeg" || mime === "image/png" || mime === "image/webp";
}

export function isPdfMime(mime: string): boolean {
  return mime === "application/pdf";
}

export function mimeToExt(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
  };
  return map[mime] ?? "bin";
}
