// ============================================================================
// RPDMS — Axios HTTP Client (Legacy Adapter)
// ============================================================================
// This file is kept for backward-compatibility with lib/queries/* imports.
// New code should import from @/api/client instead.
//
// Features:
//   ✔ JWT Bearer injection on every request
//   ✔ Refresh-token rotation (silent re-auth)
//   ✔ Normalized error shape for UI consumption
//   ✔ Request deduplication via a pending-refresh queue
//   ✔ Server-side safe (no window/localStorage access during SSR)
//
// Rule ref: NEXTJS_FRONTEND_API_RULES.md §2.2 — baseURL is /api/proxy,
// never a NEXT_PUBLIC_ env var.

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_ENDPOINTS } from "@/api/endpoints";

// ─── Constants ────────────────────────────────────────────────────────────────
const TOKEN_KEY = "psr_token";
const REFRESH_TOKEN_KEY = "psr_refresh_token";

// ─── Normalized Error Shape ───────────────────────────────────────────────────
export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

// ─── Token Helpers (browser-only) ─────────────────────────────────────────────
const isBrowser = typeof window !== "undefined";

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

// ─── Axios Instance ────────────────────────────────────────────────────────────
// baseURL points to the Next.js BFF proxy — NEVER the real backend URL.
// Rule ref: NEXTJS_FRONTEND_API_RULES.md §3.1
const api = axios.create({
  baseURL: "/api/proxy",
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

// ─── Refresh Token Queue ───────────────────────────────────────────────────────
// Queues requests that arrive while a refresh is already in-flight, so we don't
// fire multiple refresh calls simultaneously.
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: ApiError) => void;
}> = [];

function processQueue(error: ApiError | null, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token as string);
    }
  });
  failedQueue = [];
}

// ─── Request Interceptor: inject Bearer token ─────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.get();
    const headers = config.headers as InternalAxiosRequestConfig["headers"] & {
      Authorization?: string;
      authorization?: string;
    };

    if (config.data instanceof FormData && headers) {
      delete headers["Content-Type"];
      delete headers["content-type"];
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor: normalize errors & refresh rotation ────────────────
api.interceptors.response.use(
  (res) => res,
  async (
    error: AxiosError<{
      message?: string;
      errors?: Record<string, string[]>;
      error?: Record<string, string[]>;
    }>,
  ) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const normalized: ApiError = {
      message:
        error.response?.data?.message ??
        (error.response?.data as any)?.error?.message ??
        error.message ??
        "Something went wrong",
      status: error.response?.status ?? 0,
      errors:
        error.response?.data?.errors ??
        (error.response?.data as any)?.error?.details ??
        error.response?.data?.error,
    };

    // ── 401 → attempt silent token refresh ──────────────────────────────────
    if (normalized.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request until the refresh completes
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
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
        // Let the app handle redirect to login, but skip if already on auth pages
        if (isBrowser) {
          const path = window.location.pathname;
          if (
            ![
              "/login",
              "/signup",
              "/forgot-password",
              "/reset-password",
            ].includes(path)
          ) {
            window.location.href = "/login";
          }
        }
        return Promise.reject(normalized);
      }

      try {
        // Exchange refresh token for a new access token via the proxy layer
        const { data } = await axios.post(
          `/api/proxy${API_ENDPOINTS.AUTH.REFRESH}`,
          { refresh: refreshToken },
        );

        const newToken: string = data.access ?? data.accessToken ?? data.token;
        const newRefresh: string = data.refresh ?? data.refreshToken ?? refreshToken;

        tokenStorage.set(newToken);
        tokenStorage.setRefresh(newRefresh);
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

        processQueue(null, newToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        tokenStorage.clear();
        processQueue(normalized, null);
        if (isBrowser) {
          const path = window.location.pathname;
          if (
            ![
              "/login",
              "/signup",
              "/forgot-password",
              "/reset-password",
            ].includes(path)
          ) {
            window.location.href = "/login";
          }
        }
        return Promise.reject(normalized);
      } finally {
        isRefreshing = false;
      }
    }

    // ── 403 → RBAC: user lacks permission ───────────────────────────────────
    if (normalized.status === 403) {
      normalized.message = "You do not have permission to perform this action.";
    }

    // ── 500 → server error ───────────────────────────────────────────────────
    if (normalized.status >= 500) {
      normalized.message = "A server error occurred. Please try again later.";
    }

    return Promise.reject(normalized);
  },
);

export default api;
