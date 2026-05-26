import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { API_ENDPOINTS } from "@/api/endpoints";
import {
  getConceptNoteDetailById,
  getManageConceptNoteDetailById,
  approveConceptNote,
  resubmitConceptNote,
  reviewConceptNote,
  type ConceptNoteDetail,
} from "@/api/services/concept-notes.service";

// ── Backend response shape ────────────────────────────────────────────────────
export interface ConceptNoteItem {
  id: number;
  title: string;
  docType: { id: number; name: string } | null;
  versionNumber: string | null;
  executiveSummary: string;
  thematicAreas: { id: number; name: string }[];
  submittedBy: {
    id: number;
    fullName: string;
    email: string;
    photoUrl: string | null;
  };
  organization: { id: number; name: string } | null;
  unit: { id: number; name: string } | null;
  submissionDate: string;
  status: { id: number; name: string } | null;
  updatedAt: string;
  documentCategory: "new" | "revision";
  psrFinalDecision: "accepted" | "partially_accepted" | "not_accepted" | null;
  currentStatus:
    | "draft"
    | "submitted"
    | "under_review"
    | "accepted"
    | "partially_accepted"
    | "not_accepted"
    | "revision_required"
    | "resubmitted"
    | "policy_draft_ready";
  expertReviewer: number | null;
}

export interface ConceptNotesParams {
  page?: number;
  limit?: number;
  search?: string;
  current_status?: ConceptNoteItem["currentStatus"];
  document_category?: "new" | "revision";
  organization?: number;
  submitted_by?: number;
  ordering?: string;
}

export interface ConceptNotesMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function useConceptNotes(
  params: ConceptNotesParams = {},
  backendToken?: string | null,
) {
  return useQuery({
    queryKey: ["concept-notes", params],
    queryFn: async () => {
      const { data } = await api.get(API_ENDPOINTS.CONCEPT_NOTES.LIST, {
        params,
        ...(backendToken && { backendToken }),
      });
      return {
        data: data.data as ConceptNoteItem[],
        meta: data.meta as ConceptNotesMeta,
      };
    },
  });
}

// Admin-only endpoint: /v1/concept-notes/manage/ — returns only submitted/reviewed notes
export function useManageConceptNotes(
  params: ConceptNotesParams = {},
  backendToken?: string | null,
) {
  return useQuery({
    queryKey: ["concept-notes-manage", params],
    queryFn: async () => {
      const { data } = await api.get(API_ENDPOINTS.CONCEPT_NOTES.MANAGE, {
        params,
        ...(backendToken && { backendToken }),
      });
      return {
        data: data.data as ConceptNoteItem[],
        meta: data.meta as ConceptNotesMeta & {
          statistics?: {
            totalConceptNote: number;
            inDraft: number;
            underReview: number;
            approved: number;
          };
        },
      };
    },
  });
}

export function useMyReviews(
  params: ConceptNotesParams = {},
  backendToken?: string | null,
) {
  return useQuery({
    queryKey: ["my-reviews", params],
    queryFn: async () => {
      const { data } = await api.get(API_ENDPOINTS.CONCEPT_NOTES.MY_REVIEWS, {
        params,
        ...(backendToken && { backendToken }),
      });
      return {
        data: data.data as ConceptNoteItem[],
        meta: data.meta as ConceptNotesMeta & {
          statistics?: {
            totalConceptNote: number;
            inDraft: number;
            underReview: number;
            approved: number;
          };
        },
      };
    },
  });
}

export function useConceptNoteDetail(
  id?: string | number,
  backendToken?: string | null,
) {
  return useQuery<ConceptNoteDetail>({
    queryKey: ["concept-note-detail", id],
    enabled: Boolean(id),
    queryFn: () =>
      getConceptNoteDetailById(id as string | number),
  });
}

// Admin detail hook — calls /v1/concept-notes/:id/manage/
export function useManageConceptNoteDetail(
  id?: string | number,
  backendToken?: string | null,
) {
  return useQuery<ConceptNoteDetail>({
    queryKey: ["concept-note-manage-detail", id],
    enabled: Boolean(id),
    queryFn: () =>
      getManageConceptNoteDetailById(id as string | number, backendToken),
  });
}

export function useCreateConceptNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Record<string, any> | FormData) => {
      const isMultipart = payload instanceof FormData;

      // The BFF proxy injects Authorization automatically — no token needed here.
      const { data } = await api.post(
        API_ENDPOINTS.CONCEPT_NOTES.CREATE,
        payload,
        isMultipart
          ? { headers: { "Content-Type": "multipart/form-data" } }
          : undefined,
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate list and also the detail cache for the updated id
      queryClient.invalidateQueries({ queryKey: ["concept-notes"] });
      if (variables && (variables as any).id) {
        queryClient.invalidateQueries({
          queryKey: ["concept-note-detail", (variables as any).id],
        });
      }
    },
  });
}

export function useUpdateConceptNote(backendToken?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string | number;
      payload: Record<string, any> | FormData;
    }) => {
      const isMultipart = payload instanceof FormData;

      const { data } = await api.patch(
        API_ENDPOINTS.CONCEPT_NOTES.UPDATE(id),
        payload,
        isMultipart
          ? { headers: { "Content-Type": "multipart/form-data" } }
          : undefined,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["concept-notes"] });
    },
  });
}

export function useSubmitConceptNote(backendToken?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number) => {
      const { data } = await api.post(
        API_ENDPOINTS.CONCEPT_NOTES.SUBMIT(id),
        {},
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["concept-notes"] });
    },
  });
}

export function useResubmitConceptNote(backendToken?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
    }: {
      id: string | number;
    }) => {
      return resubmitConceptNote(id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["concept-notes"] });
      queryClient.invalidateQueries({ queryKey: ["concept-note-detail", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["concept-note-manage-detail", variables.id] });
    },
  });
}

export function useApproveConceptNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      decision,
      comments,
    }: {
      id: string | number;
      decision: "approve" | "revision" | "reject";
      comments?: string;
    }) => {
      return approveConceptNote(id, { decision, comments });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["concept-notes"] });
      queryClient.invalidateQueries({ queryKey: ["concept-notes-manage"] });
      queryClient.invalidateQueries({
        queryKey: ["concept-note-detail", variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["concept-note-manage-detail", variables.id],
      });
    },
  });
}

export function useMyReviewDetail(
  id?: string | number,
  backendToken?: string | null,
) {
  return useQuery<ConceptNoteDetail>({
    queryKey: ["my-review-detail", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get(
        API_ENDPOINTS.CONCEPT_NOTES.MY_REVIEW_DETAIL(id as string | number),
      );
      return data.data as ConceptNoteDetail;
    },
  });
}

export function useReviewConceptNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string | number;
      payload: Record<string, any> | FormData;
    }) => {
      return reviewConceptNote(id, payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["concept-notes"] });
      queryClient.invalidateQueries({ queryKey: ["concept-notes-manage"] });
      queryClient.invalidateQueries({ queryKey: ["my-reviews"] });
      queryClient.invalidateQueries({
        queryKey: ["concept-note-detail", variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["concept-note-manage-detail", variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["my-review-detail", variables.id],
      });
    },
  });
}
