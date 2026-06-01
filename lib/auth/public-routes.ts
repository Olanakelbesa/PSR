// Routes that do not require an authenticated session.

const PUBLIC_PATH_EXACT = new Set([
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-otp",
]);

const PUBLIC_PATH_PREFIXES = [
  "/about",
  "/attachments",
  "/thematic-areas",
  "/publications",
  "/manuals",
  "/calls",
  "/external-grant",
  "/contact",
];

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATH_EXACT.has(pathname)) return true;
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
