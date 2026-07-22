// ============================================================================
// RPDMS — TanStack Query Client Factory
// ============================================================================
// Configured with enterprise-grade defaults:
//   ✔ 5-minute stale time (reduces redundant fetches)
//   ✔ Single retry on failure (prevents infinite loops on real errors)
//   ✔ Disabled window-focus refetch (prevents jarring UX on tab switch)
//   ✔ Structured error logging to console in development
//
// NOTE: The QueryClient is created via useState in the Providers component
// (not as a module-level singleton) to avoid shared state across renders
// which causes "Maximum update depth exceeded" errors in React 19 / Next.js 16.

import { QueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/lib/axios";

const isDev = process.env.NODE_ENV === "development";

function normalizeMutationError(error: unknown): {
  message: string;
  status: number | null;
  errors: Record<string, string[]> | null;
  raw: unknown;
} {
  if (
    error &&
    typeof error === "object" &&
    ("message" in error || "status" in error || "errors" in error)
  ) {
    const apiErr = error as Partial<ApiError>;
    return {
      message:
        typeof apiErr.message === "string" && apiErr.message.trim().length > 0
          ? apiErr.message
          : "Mutation failed",
      status: typeof apiErr.status === "number" ? apiErr.status : null,
      errors:
        apiErr.errors && typeof apiErr.errors === "object"
          ? apiErr.errors
          : null,
      raw: error,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message || "Mutation failed",
      status: null,
      errors: null,
      raw: error,
    };
  }

  return {
    message: "Mutation failed",
    status: null,
    errors: null,
    raw: error,
  };
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is fresh for 5 minutes — avoids re-fetching on every render
        staleTime: 1_000 * 60 * 5,
        // Retry once on transient failures; avoids hammering after real errors
        retry: 1,
        // Automatically refetch stale queries when user switches back to a tab
        refetchOnWindowFocus: true,
      },
      mutations: {
        // Global mutation error handler — logs in dev, silent in production
        onError: (error: unknown) => {
          if (isDev) {
            const apiErr = normalizeMutationError(error);
            console.error("[Mutation Error]", {
              message: apiErr.message,
              status: apiErr.status,
              errors: apiErr.errors,
              raw: apiErr.raw,
            });
          }
        },
      },
    },
  });
}
