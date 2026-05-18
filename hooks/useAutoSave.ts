"use client";

import { useEffect, useRef, useState } from "react";

type AutoSaveProps<T> = {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number;
};

export function useAutoSave<T>({
  data,
  onSave,
  delay = 1000,
}: AutoSaveProps<T>) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  // We track the last serialized data to avoid saving if nothing actually changed
  const lastDataRef = useRef<string>("");

  useEffect(() => {
    const serialized = JSON.stringify(data);
    if (serialized === lastDataRef.current) {
      return;
    }

    const handler = setTimeout(async () => {
      try {
        setIsSaving(true);
        setSaveError(null);
        await onSaveRef.current(data);
        lastDataRef.current = serialized;
        setLastSaved(new Date());
      } catch (error) {
        console.error("[AutoSave] Failed to save draft:", error);
        setSaveError(error instanceof Error ? error.message : "Failed to auto-save");
      } finally {
        setIsSaving(false);
      }
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [data, delay]);

  return {
    isSaving,
    lastSaved,
    saveError,
  };
}
