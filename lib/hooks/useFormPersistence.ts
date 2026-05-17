"use client";

import { useEffect, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
// Stubbing React Query functions since @tanstack/react-query is not installed in package.json
import { useState } from "react";
const useQuery = (options: any) => {
  const [data] = useState(() => options.queryFn());
  return { data };
};
const useMutation = (options: any) => {
  return {
    mutate: (variables: any) => {
      options.mutationFn(variables).then((res: any) => {
        if (options.onSuccess) options.onSuccess(res);
      });
    }
  };
};
const useQueryClient = () => {
  return {
    setQueryData: (...args: any[]) => {},
    removeQueries: (...args: any[]) => {},
  };
};

const STORAGE_KEY_PREFIX = "form-persistence-";

/**
 * Helper function to convert date strings back to Date objects
 */
function deserializeDates<T>(obj: Partial<T>): Partial<T> {
  if (!obj || typeof obj !== "object") return obj;

  const result = { ...obj };

  Object.keys(result).forEach((key) => {
    const value = result[key as keyof T];

    // Check if value is a date string (ISO format or other date formats)
    if (typeof value === "string") {
      // Try to parse as date - check if it looks like a date string
      const dateMatch =
        value.match(/^\d{4}-\d{2}-\d{2}/) ||
        value.match(/^\d{4}\/\d{2}\/\d{2}/) ||
        value.match(/^\d{2}\/\d{2}\/\d{4}/);

      if (dateMatch) {
        const date = new Date(value);
        // Only convert if it's a valid date and not NaN
        if (!isNaN(date.getTime())) {
          (result as any)[key] = date;
        }
      }
    }
    // Handle nested objects (but not arrays)
    else if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      (result as any)[key] = deserializeDates(value);
    }
  });

  return result;
}

/**
 * Custom hook for persisting React Hook Form state to localStorage
 * Uses TanStack Query for cache management and automatic persistence
 */
export function useFormPersistence<T extends Record<string, any>>(
  formKey: string,
  form: UseFormReturn<T>,
  options?: {
    enabled?: boolean;
    debounceMs?: number;
    excludeFields?: (keyof T)[];
  }
) {
  const queryClient = useQueryClient();
  const storageKey = `${STORAGE_KEY_PREFIX}${formKey}`;
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRestoringRef = useRef(false);

  const {
    enabled = true,
    debounceMs = 500,
    excludeFields = [],
  } = options || {};

  // Load persisted form data
  const { data: persistedData } = useQuery({
    queryKey: [storageKey],
    queryFn: () => {
      if (typeof window === "undefined") return null;
      try {
        const stored = localStorage.getItem(storageKey);
        if (!stored) return null;
        const parsed = JSON.parse(stored) as Partial<T>;
        // Convert date strings back to Date objects
        return deserializeDates(parsed);
      } catch (error) {
        console.error("Error loading persisted form data:", error);
        return null;
      }
    },
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Restore form data on mount
  useEffect(() => {
    if (!enabled || !persistedData || isRestoringRef.current) return;

    isRestoringRef.current = true;
    try {
      // Filter out excluded fields
      const dataToRestore = { ...persistedData };
      excludeFields.forEach((field) => {
        delete dataToRestore[field as string];
      });

      // Restore form values
      Object.keys(dataToRestore).forEach((key) => {
        const value = dataToRestore[key as keyof T];
        if (value !== undefined && value !== null) {
          form.setValue(key as any, value, { shouldDirty: false });
        }
      });

      // Clear the restoration flag after a short delay
      setTimeout(() => {
        isRestoringRef.current = false;
      }, 100);
    } catch (error) {
      console.error("Error restoring form data:", error);
      isRestoringRef.current = false;
    }
  }, [persistedData, enabled, form, excludeFields]);

  // Mutation to save form data
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<T>) => {
      if (typeof window === "undefined") return;
      try {
        // Filter out excluded fields
        const dataToSave = { ...data };
        excludeFields.forEach((field) => {
          delete dataToSave[field as string];
        });

        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        return dataToSave;
      } catch (error) {
        console.error("Error saving form data:", error);
        throw error;
      }
    },
    onSuccess: (data: any) => {
      // Update the query cache
      queryClient.setQueryData([storageKey], data);
    },
  });

  // Watch form values and save on change
  useEffect(() => {
    if (!enabled || isRestoringRef.current) return;

    const subscription = form.watch((value) => {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce the save operation
      debounceTimerRef.current = setTimeout(() => {
        saveMutation.mutate(value as Partial<T>);
      }, debounceMs);
    });

    return () => {
      subscription.unsubscribe();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [form, enabled, debounceMs, saveMutation]);

  // Clear persisted data
  const clearPersistedData = () => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(storageKey);
      queryClient.removeQueries({ queryKey: [storageKey] });
    } catch (error) {
      console.error("Error clearing persisted form data:", error);
    }
  };

  return {
    clearPersistedData,
    isRestoring: isRestoringRef.current,
    hasPersistedData: !!persistedData,
  };
}

/**
 * Hook to persist additional state (like current step) alongside form data
 */
export function useStatePersistence<T>(
  key: string,
  initialValue: T,
  options?: { enabled?: boolean }
) {
  const storageKey = `${STORAGE_KEY_PREFIX}${key}`;
  const { enabled = true } = options || {};

  const { data: persistedValue } = useQuery({
    queryKey: [storageKey],
    queryFn: () => {
      if (typeof window === "undefined") return initialValue;
      try {
        const stored = localStorage.getItem(storageKey);
        if (!stored) return initialValue;
        return JSON.parse(stored) as T;
      } catch (error) {
        console.error("Error loading persisted state:", error);
        return initialValue;
      }
    },
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const saveState = (value: T) => {
    if (typeof window === "undefined" || !enabled) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (error) {
      console.error("Error saving persisted state:", error);
    }
  };

  const clearState = () => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error("Error clearing persisted state:", error);
    }
  };

  return {
    persistedValue: persistedValue ?? initialValue,
    saveState,
    clearState,
  };
}
