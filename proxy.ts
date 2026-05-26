// ============================================================================
// RPDMS — Auth Middleware (NextAuth v5)
// ============================================================================
// Protects all dashboard routes server-side.
// Unauthenticated users are redirected to /login automatically.
//
// Public routes (accessible without a session):
//   /login, /signup, /forgot-password, /reset-password, /verify-otp,
//   /api/auth/*, /api/health

export { auth as proxy } from "@/app/api/auth/[...nextauth]/route";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|fonts|api|login|signup|forgot-password|reset-password|verify-otp|health).*)",
  ],
};
