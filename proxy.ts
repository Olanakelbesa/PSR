// ============================================================================
// RPDMS — Auth Proxy (Next.js 16 — Edge routing)
// ============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isPublicPath } from "@/lib/auth/public-routes";

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;

  // Fast-bypass: API proxy routes (/bff), auth endpoints (/auth-api), static build assets,
  // images, and media files bypass heavy session error checks.
  if (
    pathname.startsWith("/bff") ||
    pathname.startsWith("/auth-api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/media") ||
    pathname.startsWith("/images")
  ) {
    return NextResponse.next();
  }

  if (
    req.auth?.error === "RefreshTokenError" &&
    !isPublicPath(pathname)
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
