"use client";

// ============================================================================
// RPDMS — useApiError Hook
// ============================================================================
// Converts ApiError objects into user-friendly toast messages.
// Usage:
//   const { handleError } = useApiError();
//   mutation.mutate(data, { onError: handleError });

import { useCallback } from "react";
import { toast } from "sonner";
import type { ApiError } from "@/lib/axios";

export function useApiError() {
  const handleError = useCallback((error: unknown) => {
    const apiError = error as ApiError;

    if (apiError?.errors) {
      const firstField = Object.keys(apiError.errors)[0];
      const firstMsg = apiError.errors[firstField]?.[0];
      if (firstMsg) {
        toast.error(`${firstField}: ${firstMsg}`);
        return;
      }
    }

    toast.error(apiError?.message ?? "An unexpected error occurred.");
  }, []);

  return { handleError };
}
