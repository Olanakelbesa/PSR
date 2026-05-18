// ============================================================================
// PSR Platform — Service Layer: Concept Notes
// ============================================================================
// Rule ref: NEXTJS_FRONTEND_API_RULES.md §3.3
// Call chain: Hook → Service → apiClient → Proxy → Backend

import { z } from "zod";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

// ─── Zod Schemas ──────────────────────────────────────────────────────────────
export const ConceptNoteStatusSchema = z.enum([
  "draft",
  "submitted",
  "under_review",
  "accepted",
  "partially_accepted",
  "not_accepted",
  "revision_required",
  "resubmitted",
  "policy_draft_ready",
]);

export const ConceptNoteSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string(),
  executiveSummary: z.string().optional().default(""),
  docType: z.object({ id: z.number(), name: z.string() }).nullable().optional(),
  versionNumber: z.string().nullable().optional(),
  thematicAreas: z
    .array(z.object({ id: z.number(), name: z.string() }))
    .optional()
    .default([]),
  submittedBy: z
    .object({
      id: z.union([z.string(), z.number()]).transform(String),
      fullName: z.string(),
      email: z.string(),
      photoUrl: z.string().nullable().optional(),
    })
    .optional(),
  organization: z
    .object({ id: z.number(), name: z.string() })
    .nullable()
    .optional(),
  unit: z.object({ id: z.number(), name: z.string() }).nullable().optional(),
  submissionDate: z.string().optional(),
  status: z.object({ id: z.number(), name: z.string() }).nullable().optional(),
  updatedAt: z.string().optional(),
  documentCategory: z.enum(["new", "revision"]).optional(),
  currentStatus: ConceptNoteStatusSchema.optional(),
  psrFinalDecision: z
    .enum(["accepted", "partially_accepted", "not_accepted"])
    .nullable()
    .optional(),
  expertReviewer: z.number().nullable().optional(),
});

const ConceptNotesListSchema = z.object({
  data: z.array(ConceptNoteSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    })
    .optional(),
});

// ─── Types ────────────────────────────────────────────────────────────────────
export type ConceptNote = z.infer<typeof ConceptNoteSchema>;
export type ConceptNoteStatus = z.infer<typeof ConceptNoteStatusSchema>;
export type ConceptNotesList = z.infer<typeof ConceptNotesListSchema>;

export interface ConceptNoteFilters {
  page?: number;
  limit?: number;
  search?: string;
  current_status?: ConceptNoteStatus;
  document_category?: "new" | "revision";
  organization?: number;
  submitted_by?: number;
  ordering?: string;
}

// ─── GET /v1/concept-notes/ ───────────────────────────────────────────────────
export async function getConceptNotes(
  filters: ConceptNoteFilters = {},
): Promise<ConceptNotesList> {
  const res = await apiClient.get(API_ENDPOINTS.CONCEPT_NOTES.LIST, {
    params: filters,
  });
  return ConceptNotesListSchema.parse(res.data);
}

// ─── GET /v1/concept-notes/:id/ ───────────────────────────────────────────────
export async function getConceptNoteById(id: string | number): Promise<ConceptNote> {
  const res = await apiClient.get(API_ENDPOINTS.CONCEPT_NOTES.DETAIL(id));
  return ConceptNoteSchema.parse(res.data?.data ?? res.data);
}

// ─── POST /v1/concept-notes/ ──────────────────────────────────────────────────
export async function createConceptNote(
  payload: Record<string, unknown> | FormData,
): Promise<ConceptNote> {
  const isFormData = payload instanceof FormData;
  const res = await apiClient.post(API_ENDPOINTS.CONCEPT_NOTES.CREATE, payload, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });
  return ConceptNoteSchema.parse(res.data?.data ?? res.data);
}

// ─── PATCH /v1/concept-notes/:id/ ─────────────────────────────────────────────
export async function updateConceptNote(
  id: string | number,
  payload: Record<string, unknown> | FormData,
): Promise<ConceptNote> {
  const isFormData = payload instanceof FormData;
  const res = await apiClient.patch(
    API_ENDPOINTS.CONCEPT_NOTES.UPDATE(id),
    payload,
    {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
    },
  );
  return ConceptNoteSchema.parse(res.data?.data ?? res.data);
}

// ─── POST /v1/concept-notes/:id/submit/ ──────────────────────────────────────
export async function submitConceptNote(id: string | number): Promise<ConceptNote> {
  const res = await apiClient.post(API_ENDPOINTS.CONCEPT_NOTES.SUBMIT(id), {});
  return ConceptNoteSchema.parse(res.data?.data ?? res.data);
}
