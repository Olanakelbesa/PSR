// ============================================================================
// RPDMS — Auth Proxy (Next.js 16 — Edge routing, not counted as Serverless Fn)
// ============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isPublicPath } from "@/lib/auth/public-routes";

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;

  if (
    req.auth?.error === "RefreshTokenError" &&
    !isPublicPath(pathname) &&
    !pathname.startsWith("/api/auth")
  ) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
