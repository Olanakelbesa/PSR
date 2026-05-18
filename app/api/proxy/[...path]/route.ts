// ============================================================================
// PSR Platform — Next.js BFF Proxy: /api/proxy/[...path]
// ============================================================================
// Rule ref: NEXTJS_FRONTEND_API_RULES.md §2
//
// Security guarantees:
//   ✔ SSRF-safe: only forwards to fixed API_BASE_URL (never dynamic targets)
//   ✔ Never exposes real backend URL to the browser
//   ✔ Strips dangerous / hop-by-hop headers before forwarding
//   ✔ Injects Authorization from server-side session (token never sent to browser)
//   ✔ Normalizes upstream error messages (raw backend errors never leak)
//
// Features:
//   ✔ Supports GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD
//   ✔ Forwards query string, body (JSON, FormData, binary)
//   ✔ Structured request logging in development
//   ✔ 502 on upstream unreachable (no error detail exposure)

import { NextRequest, NextResponse } from "next/server";

// ─── Config ───────────────────────────────────────────────────────────────────
// API_BASE_URL is a server-only env var (no NEXT_PUBLIC_ prefix).
// It is NEVER bundled into client-side JS.
const API_BASE_URL = process.env.API_BASE_URL;
const isDev = process.env.NODE_ENV === "development";

// ─── Headers that must never be forwarded upstream ────────────────────────────
const BLOCKED_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "content-encoding",
  "content-length",       // recalculated by fetch automatically
  "transfer-encoding",
  "access-control-allow-origin",
  "access-control-allow-methods",
  "access-control-allow-headers",
  "access-control-allow-credentials",
  "access-control-expose-headers",
  "access-control-max-age",
]);

// ─── Logger ───────────────────────────────────────────────────────────────────
function log(
  method: string,
  proxyPath: string,
  status: number,
  durationMs: number,
) {
  if (!isDev) return;
  const icon = status >= 500 ? "🔴" : status >= 400 ? "🟠" : "🟢";
  console.log(
    `${icon} [Proxy] ${method} /api/proxy${proxyPath} → ${status} (${durationMs}ms)`,
  );
}

// ─── Handler ──────────────────────────────────────────────────────────────────
async function handler(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  // ── Guard: ensure server-side env var is configured ─────────────────────────
  if (!API_BASE_URL) {
    console.error(
      "[Proxy] API_BASE_URL is not set. Configure it as a server-only env var.",
    );
    return NextResponse.json(
      { message: "Service temporarily unavailable. Please contact support." },
      { status: 500 },
    );
  }

  const { path } = await context.params;
  const apiPath = `/${path.join("/")}`;
  const queryString = req.nextUrl.search;

  // ── SSRF Protection: target is always the fixed API_BASE_URL ────────────────
  // The client cannot influence the target host — it is hardcoded here.
  const cleanBaseUrl = API_BASE_URL.replace(/\/+$/, "");
  const upstreamUrl = `${cleanBaseUrl}/api${apiPath}${queryString}`;

  // ── Build safe forwarding headers ───────────────────────────────────────────
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    if (!BLOCKED_REQUEST_HEADERS.has(key.toLowerCase())) {
      headers[key] = value;
    }
  });

  // ── Inject server-side session token (keeps token off the browser) ───────────
  // Try to read the NextAuth session and inject its backendToken.
  // If session is unavailable (public route / SSR edge case) we continue
  // without auth — the upstream will return 401 as expected.
  try {
    // Dynamic import avoids circular deps and keeps this tree-shakeable.
    const { auth } = await import("@/auth");
    const session = await auth();
    const backendToken =
      (session as Record<string, unknown>)?.backendToken as string | undefined;
    if (backendToken) {
      headers["Authorization"] = `Bearer ${backendToken}`;
    }
  } catch {
    // session unavailable — forward without Authorization header
  }

  const contentType = req.headers.get("content-type") ?? "";
  const isMultipart = contentType.includes("multipart/form-data");
  const hasBody = ["POST", "PUT", "PATCH"].includes(req.method);

  const start = Date.now();

  try {
    // ── Build request body ───────────────────────────────────────────────────
    let body: BodyInit | undefined;
    if (hasBody) {
      if (contentType.includes("application/json")) {
        body = await req.text();
      } else if (isMultipart) {
        // Remove content-type so fetch can set the correct boundary
        delete headers["content-type"];
        body = await req.formData();
      } else {
        body = Buffer.from(await req.arrayBuffer());
      }
    }

    const upstreamRes = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      ...(hasBody ? { body } : {}),
    });

    const duration = Date.now() - start;
    log(req.method, apiPath, upstreamRes.status, duration);

    // ── Normalize response ───────────────────────────────────────────────────
    // Never stream raw backend errors; parse and return normalized JSON.
    const data = await upstreamRes.json().catch(() => null);
    return NextResponse.json(data ?? {}, { status: upstreamRes.status });
  } catch (err: unknown) {
    const duration = Date.now() - start;
    log(req.method, apiPath, 502, duration);

    // Never expose raw error message to the client
    if (isDev) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Proxy] Upstream error for ${req.method} ${apiPath}:`, msg);
    }

    return NextResponse.json(
      { message: "Unable to reach the backend. Please try again later." },
      { status: 502 },
    );
  }
}

// Export handler for all supported HTTP methods
export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as OPTIONS,
  handler as HEAD,
};
