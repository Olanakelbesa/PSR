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

const StrategicObjectiveSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(Number),
  name: z.string(),
});

export const ConceptNoteSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string().nullable().optional().transform(v => v || "Untitled"),
  executiveSummary: z.string().nullable().optional().transform(v => v || ""),
  docType: IdOnlyOrObjectSchema.nullable().optional(),
  versionNumber: z.string().nullable().optional(),
  thematicAreas: z
    .array(z.object({ id: z.number(), name: z.string() }))
    .nullable()
    .optional()
    .transform(v => v || []),
  submittedBy: UserOrIdSchema.nullable().optional(),
  organization: IdOnlyOrObjectSchema.nullable().optional(),
  unit: IdOnlyOrObjectSchema.nullable().optional(),
  strategicObjectives: z.array(StrategicObjectiveSchema).nullable().optional().transform(v => v || []),
  submissionDate: z.string().nullable().optional().transform(v => v || ""),
  status: IdOnlyOrObjectSchema.nullable().optional(),
  updatedAt: z.string().nullable().optional().transform(v => v || ""),
  documentCategory: z.string().nullable().optional(),
  currentStatus: z.any().transform(v => {
    if (typeof v === 'string') return v;
    if (v && typeof v === 'object' && typeof v.status === 'string') return v.status;
    return "draft";
  }),
  psrFinalDecision: z
    .enum(["accepted", "partially_accepted", "not_accepted"])
    .nullable()
    .optional(),
  expertReviewer: z.number().nullable().optional(),
});

const ConceptNoteDetailFileSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  versionNumber: z.string().nullable().optional().transform(v => v || ""),
  file: z.string().nullable().optional().transform(v => v || ""),
  fileSha256: z.string().nullable().optional(),
  isLatest: z.boolean().nullable().optional().transform(v => v ?? false),
  isResubmission: z.boolean().nullable().optional().transform(v => v ?? false),
  parentVersionNumber: z.string().nullable().optional(),
  createdByName: z.string().nullable().optional().transform(v => v || ""),
  createdByEmail: z.string().nullable().optional().transform(v => v || ""),
  createdAt: z.string().nullable().optional().transform(v => v || ""),
});

const ConceptNoteDetailTimelineSchema = z.object({
  eventType: z.string().nullable().optional().transform(v => v || ""),
  title: z.string().nullable().optional().transform(v => v || ""),
  actor: z.string().nullable().optional().transform(v => v || ""),
  actorPhoto: z.string().nullable().optional(),
  timestamp: z.string().nullable().optional().transform(v => v || ""),
  version: z.string().nullable().optional(),
  metadataSummary: z
    .object({
      title: z.string().nullable().optional(),
      decision: z.string().nullable().optional(),
      recommendation: z.string().nullable().optional(),
    })
    .partial()
    .nullable()
    .optional(),
});

const ConceptNoteDetailFeedbackSchema = z.object({
  versionNumber: z.string().nullable().optional().transform(v => v || ""),
  isLatest: z.boolean().nullable().optional().transform(v => v ?? false),
  isResubmission: z.boolean().nullable().optional().transform(v => v ?? false),
  feedbackDetail: z.array(z.unknown()).nullable().optional().transform(v => v || []),
});

export const ConceptNoteDetailSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string().nullable().optional().transform(v => v || "Untitled"),
  docType: IdOnlyOrObjectSchema.nullable().optional(),
  strategicObjectives: z.array(StrategicObjectiveSchema).nullable().optional().transform(v => v || []),
  overview: z.object({
    executiveSummary: z.string().nullable().optional().transform(v => v || ""),
    thematicAreas: z
      .array(z.object({ id: z.number(), name: z.string() }))
      .nullable()
      .optional()
      .transform(v => v || []),
    file: z.string().nullable().optional(),
  }).nullable().optional().transform(v => v || { executiveSummary: "", thematicAreas: [] }),
  documentCategory: z.string().nullable().optional(),
  psrFinalDecision: z
    .enum(["accepted", "partially_accepted", "not_accepted"])
    .nullable()
    .optional(),
  organization: IdOnlyOrObjectSchema.nullable().optional(),
  unit: IdOnlyOrObjectSchema.nullable().optional(),
  expertFeedback: z.array(ConceptNoteDetailFeedbackSchema).nullable().optional().transform(v => v || []),
  timeline: z.array(ConceptNoteDetailTimelineSchema).nullable().optional().transform(v => v || []),
  versions: z.array(ConceptNoteDetailFileSchema).nullable().optional().transform(v => v || []),
  currentStatus: z.object({
    status: z.string().nullable().optional().transform(v => v || "draft"),
    conceptId: z.string().nullable().optional().transform(v => v || ""),
    version: z.string().nullable().optional().transform(v => v || "v1.0.0"),
  }).nullable().optional(),
  submittedBy: z.object({
    id: z.union([z.string(), z.number()]).transform(String),
    fullName: z.string().nullable().optional().transform(v => v || "Unknown"),
    email: z.string().nullable().optional().transform(v => v || ""),
    photoUrl: z.string().nullable().optional(),
    submittedAt: z.string().nullable().optional().transform(v => v || new Date().toISOString()),
    lastUpdated: z.string().nullable().optional().transform(v => v || new Date().toISOString()),
  }).nullable().optional(),
});

const ConceptNoteDetailResponseSchema = z.object({
  success: z.boolean().nullable().optional().transform(v => v ?? true),
  data: ConceptNoteDetailSchema,
});

const ConceptNotesListSchema = z.object({
  data: z.array(ConceptNoteSchema).nullable().optional().transform(v => v || []),
  meta: z
    .object({
      page: z.number().nullable().optional().transform(v => v ?? 1),
      limit: z.number().nullable().optional().transform(v => v ?? 10),
      total: z.number().nullable().optional().transform(v => v ?? 0),
      totalPages: z.number().nullable().optional().transform(v => v ?? 0),
    })
    .nullable()
    .optional()
    .transform(v => v || { page: 1, limit: 10, total: 0, totalPages: 0 }),
});

function normalizeConceptNoteItem(raw: any) {
  if (!raw || typeof raw !== "object") return raw;
  return {
    ...raw,
    psrFinalDecision:
      raw.psrFinalDecision ?? raw.psr_final_decision,
    currentStatus: raw.currentStatus ?? raw.current_status,
    strategicObjectives:
      raw.strategicObjectives ?? raw.strategic_objectives ?? [],
  };
}

function normalizeConceptNotesListResponse(response: any) {
  if (!response || typeof response !== "object") return response;
  return {
    ...response,
    data: Array.isArray(response.data)
      ? response.data.map((item: any) => normalizeConceptNoteItem(item))
      : response.data,
  };
}

function normalizeConceptNoteEnvelope(response: any) {
  if (!response || typeof response !== "object") return response;
  
  // If the response is already wrapped with 'data', use it; otherwise, wrap the response itself
  const hasDataWrapper = "data" in response;
  const rawData = hasDataWrapper ? response.data : response;

  return {
    success: response.success ?? true,
    data: normalizeConceptNoteItem(rawData),
  };
}

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
  return ConceptNotesListSchema.parse(normalizeConceptNotesListResponse(res.data));
}

// ─── GET /v1/concept-notes/:id/ ───────────────────────────────────────────────
export async function getConceptNoteById(
  id: string | number,
): Promise<ConceptNote> {
  const res = await apiClient.get(API_ENDPOINTS.CONCEPT_NOTES.DETAIL(id));
  return ConceptNoteSchema.parse(normalizeConceptNoteItem(res.data?.data ?? res.data));
}

// ─── GET /v1/concept-notes/:id/ (detail view payload) ───────────────────────
export async function getConceptNoteDetailById(
  id: string | number
): Promise<ConceptNoteDetail> {
  const res = await apiClient.get(API_ENDPOINTS.CONCEPT_NOTES.DETAIL(id));
  return ConceptNoteDetailResponseSchema.parse(normalizeConceptNoteEnvelope(res.data)).data;
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
  return ConceptNoteDetailResponseSchema.parse(normalizeConceptNoteEnvelope(res.data)).data;
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
  return ConceptNoteSchema.parse(normalizeConceptNoteItem(res.data?.data ?? res.data));
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
  return ConceptNoteSchema.parse(normalizeConceptNoteItem(res.data?.data ?? res.data));
}

// ─── DELETE /v1/concept-notes/:id/ ───────────────────────────────────────────
export async function deleteConceptNote(id: string | number): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.CONCEPT_NOTES.DETAIL(id));
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
  return ConceptNoteSchema.parse(normalizeConceptNoteItem(res.data?.data ?? res.data));
}

// ─── POST /v1/concept-notes/:id/resubmit/ ───────────────────────────────────
export async function resubmitConceptNote(
  id: string | number,
): Promise<ConceptNote> {
  const res = await apiClient.post(API_ENDPOINTS.CONCEPT_NOTES.RESUBMIT(id), {});
  return ConceptNoteSchema.parse(normalizeConceptNoteItem(res.data?.data ?? res.data));
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
