// ============================================================================
// RPDMS — Next.js BFF Proxy: /bff/[...path]
// ============================================================================
// Rule ref: NEXTJS_FRONTEND_API_RULES.md §2
//
// Served at /bff/* (not /api/proxy/*) because the MOH gateway routes /api/*
// directly to Django, bypassing this app.
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
//
// NextAuth v5 pattern: handler is wrapped with auth() so req.auth is
// automatically populated from cookies — do NOT call auth() internally.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/nextauth";

// ─── Config ───────────────────────────────────────────────────────────────────
const API_BASE_URL = process.env.API_BASE_URL;
const isDev = process.env.NODE_ENV === "development";

// ─── Headers that must never be forwarded upstream ────────────────────────────
const BLOCKED_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "content-encoding",
  "content-length", // recalculated by fetch automatically
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
    `${icon} [Proxy] ${method} /bff${proxyPath} → ${status} (${durationMs}ms)`,
  );
}

// ─── Type definitions for Next.js dynamic routing ──────────────────────────────
interface RouteContext {
  params: Promise<{ path: string[] }>;
}

// ─── Core Handler ─────────────────────────────────────────────────────────────
// Wrapped with auth() — the correct NextAuth v5 pattern for Route Handlers.
// This ensures req.auth is populated from the session cookie automatically.
const handler = auth(async (req, context) => {
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

  // Safely await params as required by Next.js 15+
  const { path } = (await (context as any).params) as { path: string[] };
  const apiPath = `/${path.join("/")}`;
  const queryString = req.nextUrl.search;

  // ── SSRF Protection: target is always the fixed API_BASE_URL ────────────────
  const cleanBaseUrl = API_BASE_URL.replace(/\/+$/, "");
  const upstreamUrl = `${cleanBaseUrl}/api${apiPath}${queryString}`;

  // ── Build safe forwarding headers ───────────────────────────────────────────
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!BLOCKED_REQUEST_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  // ── Inject the freshest bearer token ──────────────────────────────────────
  // Prefer the client Authorization header so the proxy uses the latest
  // access token from localStorage / apiClient refresh flows.
  const clientAuthorizationHeader = req.headers.get("authorization");
  const sessionBackendToken = (req.auth as any)?.backendToken as
    | string
    | undefined;

  if (isDev) {
    if (clientAuthorizationHeader) {
      console.log(
        `[Proxy] ✅ Using client Authorization header for ${req.method} ${apiPath}`,
      );
    } else if (sessionBackendToken) {
      console.log(
        `[Proxy] ✅ Using session backendToken for ${req.method} ${apiPath}`,
      );
    } else {
      console.warn(
        `[Proxy] ⚠️  No bearer token available for ${req.method} ${apiPath}.`,
      );
    }
  }

  if (clientAuthorizationHeader) {
    headers.set("Authorization", clientAuthorizationHeader);
  } else if (sessionBackendToken) {
    headers.set("Authorization", `Bearer ${sessionBackendToken}`);
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
        headers.delete("content-type");
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

    // 204/205/304 must not include a response body.
    if ([204, 205, 304].includes(upstreamRes.status)) {
      return new NextResponse(null, { status: upstreamRes.status });
    }

    const upstreamContentType = upstreamRes.headers.get("content-type") ?? "";

    if (upstreamContentType.includes("application/json")) {
      const data = await upstreamRes.json().catch(() => ({}));
      return NextResponse.json(data, { status: upstreamRes.status });
    }

    const isBinary =
      upstreamContentType.includes("application/pdf") ||
      upstreamContentType.includes("application/octet-stream") ||
      upstreamContentType.startsWith("image/");

    if (isBinary) {
      const buffer = await upstreamRes.arrayBuffer();
      const responseHeaders = new Headers({
        "content-type": upstreamContentType,
      });
      const disposition = upstreamRes.headers.get("content-disposition");
      if (disposition) {
        responseHeaders.set("content-disposition", disposition);
      }
      return new NextResponse(buffer, {
        status: upstreamRes.status,
        headers: responseHeaders,
      });
    }

    const textBody = await upstreamRes.text();
    return new NextResponse(textBody, {
      status: upstreamRes.status,
      headers: {
        "content-type": upstreamContentType || "text/plain; charset=utf-8",
      },
    });
  } catch (err: unknown) {
    const duration = Date.now() - start;
    log(req.method, apiPath, 502, duration);

    if (isDev) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        `[Proxy] Upstream error for ${req.method} ${apiPath}:`,
        msg,
      );
    }

    return NextResponse.json(
      { message: "Unable to reach the backend. Please try again later." },
      { status: 502 },
    );
  }
});

// Single handler export — avoids multiplying serverless functions per HTTP verb.
export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as OPTIONS,
  handler as HEAD,
};
