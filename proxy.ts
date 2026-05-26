import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!login|nabidka|api/auth|api/public|_next/static|_next/image|favicon\\.ico|fonts).*)",
  ],
};
