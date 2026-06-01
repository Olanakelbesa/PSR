// ============================================================================
// RPDMS — Auth Middleware (NextAuth v5)
// ============================================================================
// Protects all dashboard routes server-side.
// Unauthenticated users are redirected to /login automatically.
//
// Public routes (accessible without a session): see lib/auth/public-routes.ts
//   / (landing), /login, /signup, /about, /publications, /calls, …
//   /api/auth/*, /api/health

import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export const proxy = auth((req) => {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|fonts|api).*)",
  ],
};
