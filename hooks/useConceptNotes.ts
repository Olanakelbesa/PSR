// ============================================================================
// PSR Platform — TanStack Query Hooks: Concept Notes
// ============================================================================
// Rule ref: NEXTJS_FRONTEND_API_RULES.md §3.6, §3.7
// Components must consume data ONLY through these hooks.
// Hooks call the service layer — no direct API calls in components.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getConceptNotes,
  getConceptNoteById,
  createConceptNote,
  updateConceptNote,
  submitConceptNote,
  type ConceptNoteFilters,
} from "@/api/services/concept-notes.service";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const conceptNoteKeys = {
  all: ["concept-notes"] as const,
  list: (filters: ConceptNoteFilters) => ["concept-notes", "list", filters] as const,
  detail: (id: string | number) => ["concept-notes", "detail", String(id)] as const,
};

// ─── useConceptNotes ──────────────────────────────────────────────────────────
// Fetches a paginated list of concept notes.
export function useConceptNotes(filters: ConceptNoteFilters = {}) {
  return useQuery({
    queryKey: conceptNoteKeys.list(filters),
    queryFn: () => getConceptNotes(filters),
    staleTime: 1_000 * 60 * 2, // 2 minutes
  });
}

// ─── useConceptNote ───────────────────────────────────────────────────────────
// Fetches a single concept note by ID.
export function useConceptNote(id: string | number | undefined) {
  return useQuery({
    queryKey: conceptNoteKeys.detail(id ?? ""),
    queryFn: () => getConceptNoteById(id!),
    enabled: !!id,
  });
}

// ─── useCreateConceptNote ─────────────────────────────────────────────────────
export function useCreateConceptNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown> | FormData) =>
      createConceptNote(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conceptNoteKeys.all });
    },
  });
}

// ─── useUpdateConceptNote ─────────────────────────────────────────────────────
export function useUpdateConceptNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string | number;
      payload: Record<string, unknown> | FormData;
    }) => updateConceptNote(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: conceptNoteKeys.all });
      queryClient.invalidateQueries({ queryKey: conceptNoteKeys.detail(id) });
    },
  });
}

// ─── useSubmitConceptNote ─────────────────────────────────────────────────────
export function useSubmitConceptNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => submitConceptNote(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: conceptNoteKeys.all });
      queryClient.invalidateQueries({ queryKey: conceptNoteKeys.detail(id) });
    },
  });
}
