// ============================================================================
// RPDMS — Canonical API Client
// ============================================================================
// Rule ref: NEXTJS_FRONTEND_API_RULES.md §3.1
//
// Single centralized HTTP client used everywhere in the frontend.
// Base URL: /bff (relative) — routes through the BFF proxy.
// The real backend URL is NEVER visible to the browser.
//
// Features:
//   ✔ Points to /bff (Next.js BFF proxy layer)
//   ✔ JWT Bearer injection on every request
//   ✔ Silent refresh-token rotation on 401
//   ✔ Normalized ApiError shape for UI consumption
//   ✔ Request deduplication via pending-refresh queue
//   ✔ Server-side safe (no window/localStorage during SSR)
//
// Usage:
//   import apiClient from "@/api/client";
//   const res = await apiClient.get(API_ENDPOINTS.CONCEPT_NOTES.LIST);

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { API_ENDPOINTS } from "./endpoints";
import { isPublicPath } from "@/lib/auth/public-routes";

// ─── Normalized Error Shape ───────────────────────────────────────────────────
export interface ApiError {
  message: string;
  status: number;
  code?: string;
  errors?: Record<string, string[]>;
  /** Extra payload from the backend envelope (e.g. retryAfterSeconds on 429). */
  data?: Record<string, unknown>;
}

type BackendErrorEnvelope = {
  success?: boolean;
  message?: string;
  data?: Record<string, unknown>;
  errors?: Record<string, string[]>;
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, string[]>;
  };
};

function parseBackendError(
  responseData: BackendErrorEnvelope | undefined,
  fallbackMessage: string,
): Pick<ApiError, "message" | "code" | "errors"> {
  const envelopeError = responseData?.error;
  if (envelopeError && typeof envelopeError === "object") {
    return {
      message:
        (typeof envelopeError.message === "string" && envelopeError.message) ||
        fallbackMessage,
      code:
        typeof envelopeError.code === "string" ? envelopeError.code : undefined,
      errors: envelopeError.details ?? undefined,
    };
  }

  return {
    message:
      (typeof responseData?.message === "string" && responseData.message) ||
      fallbackMessage,
    errors: responseData?.errors,
  };
}

// ─── Token Storage (browser-only) ────────────────────────────────────────────
const isBrowser = typeof window !== "undefined";
const TOKEN_KEY = "psr_token";
const REFRESH_TOKEN_KEY = "psr_refresh_token";

export const tokenStorage = {
  get: (): string | null =>
    isBrowser ? localStorage.getItem(TOKEN_KEY) : null,
  set: (token: string): void => {
    if (isBrowser) localStorage.setItem(TOKEN_KEY, token);
  },
  remove: (): void => {
    if (isBrowser) localStorage.removeItem(TOKEN_KEY);
  },
  getRefresh: (): string | null =>
    isBrowser ? localStorage.getItem(REFRESH_TOKEN_KEY) : null,
  setRefresh: (token: string): void => {
    if (isBrowser) localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },
  clear: (): void => {
    if (isBrowser) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  },
};

// ─── Axios Instance ───────────────────────────────────────────────────────────
// Base URL is hardcoded to /bff — the Next.js BFF proxy layer.
// Multipart uploads on production use /api instead (gateway routes /api/* to Django).
const apiClient = axios.create({
  baseURL: "/bff",
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

const UPLOAD_TIMEOUT_MS = 300_000;

function shouldUseDirectApiUpload(): boolean {
  if (!isBrowser) return false;
  const host = window.location.hostname;
  return host !== "localhost" && host !== "127.0.0.1";
}

// ─── Refresh Token Queue ──────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: ApiError) => void;
}> = [];

function processQueue(error: ApiError | null, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token as string);
  });
  failedQueue = [];
}

// ─── Request Interceptor: inject Bearer token ────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.get();
    const headers = config.headers as InternalAxiosRequestConfig["headers"] & {
      Authorization?: string;
      authorization?: string;
    };

    if (config.data instanceof FormData) {
      if (headers) {
        delete headers["Content-Type"];
        delete headers["content-type"];
      }
      // Production gateway serves Django at /api/* — skip Next.js BFF for large bodies.
      if (shouldUseDirectApiUpload()) {
        config.baseURL = "/api";
      }
      config.timeout = UPLOAD_TIMEOUT_MS;
    }

    const hasExplicitAuthHeader = Boolean(
      headers?.Authorization ?? headers?.authorization,
    );

    if (token && config.headers && !hasExplicitAuthHeader) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor: normalize errors & silent refresh ─────────────────
apiClient.interceptors.response.use(
  (res) => res,
  async (
    error: AxiosError<{
      message?: string;
      data?: Record<string, unknown>;
      errors?: Record<string, string[]>;
      error?: Record<string, string[]>;
    }>,
  ) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const responseData = error.response?.data as BackendErrorEnvelope | undefined;
    const parsed = parseBackendError(
      responseData,
      error.message ?? "Something went wrong",
    );

    const normalized: ApiError = {
      message: parsed.message,
      status: error.response?.status ?? 0,
      code: parsed.code,
      errors: parsed.errors,
      data:
        responseData?.data && typeof responseData.data === "object"
          ? (responseData.data as Record<string, unknown>)
          : undefined,
    };

    // ── 401 → attempt silent token refresh ────────────────────────────────
    if (normalized.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch(() => Promise.reject(normalized));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenStorage.getRefresh();

      if (!refreshToken) {
        isRefreshing = false;
        tokenStorage.clear();
        processQueue(normalized, null);
        if (isBrowser && !isPublicPath(window.location.pathname)) {
          window.location.href = "/login";
        }
        return Promise.reject(normalized);
      }

      try {
        const { data } = await axios.post(
          `/bff${API_ENDPOINTS.AUTH.REFRESH}`,
          { refresh: refreshToken },
        );

        const newToken: string = data.access ?? data.accessToken ?? data.token;
        const newRefresh: string = data.refresh ?? data.refreshToken ?? refreshToken;

        tokenStorage.set(newToken);
        tokenStorage.setRefresh(newRefresh);
        apiClient.defaults.headers.common["Authorization"] =
          `Bearer ${newToken}`;

        processQueue(null, newToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return apiClient(originalRequest);
      } catch {
        tokenStorage.clear();
        processQueue(normalized, null);
        if (isBrowser && !isPublicPath(window.location.pathname)) {
          window.location.href = "/login";
        }
        return Promise.reject(normalized);
      } finally {
        isRefreshing = false;
      }
    }

    // ── 403 → normalize permission error ────────────────────────────────────
    if (normalized.status === 403) {
      normalized.message = "You do not have permission to perform this action.";
    }

    // ── 5xx → normalize server error ────────────────────────────────────────
    if (normalized.status >= 500) {
      normalized.message = "A server error occurred. Please try again later.";
    }

    return Promise.reject(normalized);
  },
);

export default apiClient;
export * from "./legacy-apis";
