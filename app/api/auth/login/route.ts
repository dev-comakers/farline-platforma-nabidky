import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { signToken } from "@/lib/auth";
import { checkOnly, recordFailure } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation/auth";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input", fields: parsed.error.flatten().fieldErrors } },
      { status: 400 }
    );
  }

  const rl = checkOnly(`login:${ip}`, MAX_FAILURES, WINDOW_MS);
  if (!rl.ok) {
    return Response.json(
      { error: { code: "TOO_MANY_REQUESTS", message: "Too many failed attempts. Try again later." } },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  const passwordMatch = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !passwordMatch) {
    recordFailure(`login:${ip}`, WINDOW_MS);
    return Response.json(
      { error: { code: "INVALID_CREDENTIALS", message: "Nesprávný e-mail nebo heslo" } },
      { status: 401 }
    );
  }

  const token = await signToken({ userId: user.id, role: user.role });

  const isProduction = process.env.NODE_ENV === "production";
  const response = Response.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });

  const cookieHeader = [
    `token=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${60 * 60 * 24 * 7}`,
    isProduction ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");

  response.headers.set("Set-Cookie", cookieHeader);
  return response;
}
