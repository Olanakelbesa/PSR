// ============================================================================
// RPDMS — Legacy Catch-all Proxy: /api/[...path]
// ============================================================================
// NOTE: The canonical proxy is now at /api/proxy/[...path]/route.ts
// This file is kept as a fallback for any existing calls that still
// target /api/* directly. New code should use /api/proxy/* via apiClient.
// Rule ref: NEXTJS_FRONTEND_API_RULES.md §2.3
// This single catch-all route forwards ALL requests to the real backend.
// The browser NEVER sees the actual backend URL — it only talks to /api/*.
//
// Features:
//   ✔ Forwards Authorization header from the browser
//   ✔ Passes request body as-is (GET / POST / PATCH / DELETE)
//   ✔ Normalizes upstream errors into a consistent JSON shape
//   ✔ API request logging in development mode

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.API_BASE_URL;
const isDev = process.env.NODE_ENV === "development";

// ─── Logger ───────────────────────────────────────────────────────────────────
function log(method: string, path: string, status: number, durationMs: number) {
  if (isDev) {
    const emoji = status >= 400 ? "❌" : "✅";
    console.log(
      `${emoji} [API Proxy] ${method} /api${path} → ${status} (${durationMs}ms)`,
    );
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────
async function handler(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  if (!BACKEND_URL) {
    return NextResponse.json(
      { message: "BACKEND_URL environment variable is not configured." },
      { status: 500 },
    );
  }

  const { path } = await context.params;
  const hasTrailingSlash = req.nextUrl.pathname.endsWith("/");
  let apiPath = `/${path.join("/")}`;
  if (hasTrailingSlash && !apiPath.endsWith("/")) {
    apiPath += "/";
  }

  // ── Auth routes are handled natively by NextAuth at /api/auth/* —
  // no delegation needed here. Only forward non-auth backend requests.
  if (apiPath.startsWith("/auth/callback") || apiPath.startsWith("/auth/session") || apiPath.startsWith("/auth/csrf") || apiPath.startsWith("/auth/signin") || apiPath.startsWith("/auth/signout")) {
    return NextResponse.json({ message: "Use /api/auth for NextAuth routes" }, { status: 404 });
  }
  const queryString = req.nextUrl.search;
  const targetPath = apiPath.startsWith("/api") ? apiPath : `/api${apiPath}`;
  const cleanBackendUrl = BACKEND_URL ? BACKEND_URL.replace(/\/+$/, "") : "http://localhost:8000";
  const upstreamUrl = `${cleanBackendUrl}${targetPath}${queryString}`;

  // Forward the Authorization header and content-type
  const headers: Record<string, string> = {};
  const contentType = req.headers.get("content-type");
  const isMultipart = contentType?.includes("multipart/form-data");
  
  if (contentType && !isMultipart) {
    headers["content-type"] = contentType;
  }
  const auth = req.headers.get("Authorization");
  if (auth) headers["Authorization"] = auth;

  const start = Date.now();

  try {
    const hasBody = ["POST", "PUT", "PATCH"].includes(req.method);
    let body: any = undefined;
    if (hasBody) {
      const isJson = contentType?.includes("application/json");
      if (isJson) {
        body = await req.text();
      } else if (isMultipart) {
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

    // Pass through the upstream response body directly
    const data = await upstreamRes.json().catch(() => null);
    return NextResponse.json(data ?? {}, { status: upstreamRes.status });
  } catch (err: unknown) {
    const duration = Date.now() - start;
    log(req.method, apiPath, 502, duration);
    const msg = err instanceof Error ? err.message : "Upstream unreachable";
    return NextResponse.json({ message: msg }, { status: 502 });
  }
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
};
