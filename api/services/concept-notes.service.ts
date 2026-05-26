// ============================================================================
// RPDMS — Service Layer: Concept Notes
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

const IdOnlyOrObjectSchema = z
  .union([
    z.object({
      id: z.union([z.string(), z.number()]),
      name: z.string().optional().default(""),
    }),
    z.union([z.string(), z.number()]),
  ])
  .transform((value) =>
    typeof value === "object" && value !== null && "id" in value
      ? { id: Number(value.id), name: value.name ?? "" }
      : { id: Number(value), name: "" },
  );

const UserOrIdSchema = z
  .union([
    z.object({
      id: z.union([z.string(), z.number()]).transform(String),
      fullName: z.string(),
      email: z.string(),
      photoUrl: z.string().nullable().optional(),
    }),
    z.union([z.string(), z.number()]),
  ])
  .transform((value) =>
    typeof value === "object" && value !== null && "id" in value
      ? value
      : {
          id: String(value),
          fullName: "",
          email: "",
          photoUrl: null,
        },
  );

export const ConceptNoteSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string(),
  executiveSummary: z.string().optional().default(""),
  docType: IdOnlyOrObjectSchema.nullable().optional(),
  versionNumber: z.string().nullable().optional(),
  thematicAreas: z
    .array(z.object({ id: z.number(), name: z.string() }))
    .optional()
    .default([]),
  submittedBy: UserOrIdSchema.optional(),
  organization: IdOnlyOrObjectSchema.nullable().optional(),
  unit: IdOnlyOrObjectSchema.nullable().optional(),
  submissionDate: z.string().optional(),
  status: IdOnlyOrObjectSchema.nullable().optional(),
  updatedAt: z.string().optional(),
  documentCategory: z.enum(["new", "revision"]).optional(),
  currentStatus: ConceptNoteStatusSchema.optional(),
  psrFinalDecision: z
    .enum(["accepted", "partially_accepted", "not_accepted"])
    .nullable()
    .optional(),
  expertReviewer: z.number().nullable().optional(),
});

const ConceptNoteDetailFileSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  versionNumber: z.string(),
  file: z.string(),
  fileSha256: z.string().optional(),
  isLatest: z.boolean(),
  isResubmission: z.boolean(),
  parentVersionNumber: z.string().nullable().optional(),
  createdByName: z.string(),
  createdByEmail: z.string(),
  createdAt: z.string(),
});

const ConceptNoteDetailTimelineSchema = z.object({
  eventType: z.string(),
  title: z.string(),
  actor: z.string(),
  actorPhoto: z.string().nullable(),
  timestamp: z.string(),
  version: z.string().nullable(),
  metadataSummary: z
    .object({
      title: z.string().optional(),
      decision: z.string().optional(),
      recommendation: z.string().optional(),
    })
    .partial()
    .optional(),
});

const ConceptNoteDetailFeedbackSchema = z.object({
  versionNumber: z.string(),
  isLatest: z.boolean(),
  isResubmission: z.boolean(),
  feedbackDetail: z.array(z.unknown()).default([]),
});

export const ConceptNoteDetailSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string(),
  docType: IdOnlyOrObjectSchema.nullable().optional(),
  overview: z.object({
    executiveSummary: z.string().default(""),
    thematicAreas: z
      .array(z.object({ id: z.number(), name: z.string() }))
      .default([]),
    file: z.string().nullable().optional(),
  }),
  documentCategory: z.enum(["new", "revision"]).optional(),
  psrFinalDecision: z
    .enum(["accepted", "partially_accepted", "not_accepted"])
    .nullable()
    .optional(),
  organization: IdOnlyOrObjectSchema.nullable().optional(),
  unit: IdOnlyOrObjectSchema.nullable().optional(),
  expertFeedback: z.array(ConceptNoteDetailFeedbackSchema).default([]),
  timeline: z.array(ConceptNoteDetailTimelineSchema).default([]),
  versions: z.array(ConceptNoteDetailFileSchema).default([]),
  currentStatus: z.object({
    status: z.string(),
    conceptId: z.string(),
    version: z.string(),
  }),
  submittedBy: z.object({
    id: z.union([z.string(), z.number()]).transform(String),
    fullName: z.string(),
    email: z.string(),
    photoUrl: z.string().nullable().optional(),
    submittedAt: z.string(),
    lastUpdated: z.string(),
  }),
});

const ConceptNoteDetailResponseSchema = z.object({
  success: z.boolean(),
  data: ConceptNoteDetailSchema,
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
export type ConceptNoteDetail = z.infer<typeof ConceptNoteDetailSchema>;
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
export async function getConceptNoteById(
  id: string | number,
): Promise<ConceptNote> {
  const res = await apiClient.get(API_ENDPOINTS.CONCEPT_NOTES.DETAIL(id));
  return ConceptNoteSchema.parse(res.data?.data ?? res.data);
}

// ─── GET /v1/concept-notes/:id/ (detail view payload) ───────────────────────
export async function getConceptNoteDetailById(
  id: string | number
): Promise<ConceptNoteDetail> {
  const res = await apiClient.get(API_ENDPOINTS.CONCEPT_NOTES.DETAIL(id));
  const normalized = {
    ...res.data,
    data: {
      ...res.data?.data,
      psrFinalDecision:
        res.data?.data?.psrFinalDecision ?? res.data?.data?.psr_final_decision,
      currentStatus:
        res.data?.data?.currentStatus ?? res.data?.data?.current_status,
    },
  };
  return ConceptNoteDetailResponseSchema.parse(normalized).data;
}

// ─── GET /v1/concept-notes/:id/manage/ (admin detail view) ──────────────────
export async function getManageConceptNoteDetailById(
  id: string | number,
  backendToken?: string | null,
): Promise<ConceptNoteDetail> {
  const res = await apiClient.get(
    API_ENDPOINTS.CONCEPT_NOTES.MANAGE_DETAIL(id),
    {
      params: backendToken ? { backendToken } : undefined,
    },
  );
  const normalized = {
    ...res.data,
    data: {
      ...res.data?.data,
      psrFinalDecision:
        res.data?.data?.psrFinalDecision ?? res.data?.data?.psr_final_decision,
      currentStatus:
        res.data?.data?.currentStatus ?? res.data?.data?.current_status,
    },
  };
  return ConceptNoteDetailResponseSchema.parse(normalized).data;
}

// ─── POST /v1/concept-notes/ ──────────────────────────────────────────────────
export async function createConceptNote(
  payload: Record<string, unknown> | FormData,
): Promise<ConceptNote> {
  const isFormData = payload instanceof FormData;
  const res = await apiClient.post(
    API_ENDPOINTS.CONCEPT_NOTES.CREATE,
    payload,
    {
      headers: isFormData
        ? { "Content-Type": "multipart/form-data" }
        : undefined,
    },
  );
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
      headers: isFormData
        ? { "Content-Type": "multipart/form-data" }
        : undefined,
    },
  );
  return ConceptNoteSchema.parse(res.data?.data ?? res.data);
}

// ─── POST /v1/concept-notes/:id/submit/ ──────────────────────────────────────
export async function submitConceptNote(
  id: string | number,
  backendToken?: string | null,
): Promise<ConceptNote> {
  const res = await apiClient.post(
    API_ENDPOINTS.CONCEPT_NOTES.SUBMIT(id),
    {},
    backendToken
      ? { headers: { Authorization: `Bearer ${backendToken}` } }
      : {},
  );
  return ConceptNoteSchema.parse(res.data?.data ?? res.data);
}

// ─── POST /v1/concept-notes/:id/resubmit/ ───────────────────────────────────
export async function resubmitConceptNote(
  id: string | number,
): Promise<ConceptNote> {
  const res = await apiClient.post(API_ENDPOINTS.CONCEPT_NOTES.RESUBMIT(id), {});
  return ConceptNoteSchema.parse(res.data?.data ?? res.data);
}

// ─── POST /v1/concept-notes/:id/psr-approval/ ───────────────────────────────
export async function approveConceptNote(
  id: string | number,
  payload: { decision: "approve" | "revision" | "reject"; comments?: string },
  backendToken?: string | null,
): Promise<any> {
  const res = await apiClient.post(
    API_ENDPOINTS.CONCEPT_NOTES.APPROVAL(id),
    payload,
    backendToken
      ? { headers: { Authorization: `Bearer ${backendToken}` } }
      : {},
  );
  return res.data;
}
export async function reviewConceptNote(
  id: string | number,
  payload: Record<string, any> | FormData,
  backendToken?: string | null,
): Promise<any> {
  const isFormData = payload instanceof FormData;
  const res = await apiClient.post(
    API_ENDPOINTS.CONCEPT_NOTES.REVIEW(id),
    payload,
    {
      headers: {
        ...(backendToken && { Authorization: `Bearer ${backendToken}` }),
        ...(isFormData && { "Content-Type": "multipart/form-data" }),
      },
    },
  );
  return res.data;
}
