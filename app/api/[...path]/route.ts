// ============================================================================
// PSR Platform — Next.js BFF Proxy: /api/[...path]
// ============================================================================
// This single catch-all route forwards ALL requests to the real backend.
// The browser NEVER sees the actual backend URL — it only talks to /api/*.
//
// Features:
//   ✔ Forwards Authorization header from the browser
//   ✔ Passes request body as-is (GET / POST / PATCH / DELETE)
//   ✔ Normalizes upstream errors into a consistent JSON shape
//   ✔ API request logging in development mode

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;
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

  // ── Delegate NextAuth routes to the auth handler to avoid accidental 404s
  if (apiPath.startsWith("/auth")) {
    try {
      const authModule = await import("../auth/[...nextauth]/route");
      // Prefer the exported handlers from the NextAuth route
      const handlers = authModule.handlers as any;
      const method = (req.method ?? "GET").toUpperCase();
      if (handlers && typeof handlers[method] === "function") {
        return handlers[method](req);
      }
      // Fallback to generic GET if specific method not found
      if (handlers && typeof handlers.GET === "function") {
        return handlers.GET(req);
      }
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Auth handler delegation failed";
      return NextResponse.json({ message: msg }, { status: 500 });
    }
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
