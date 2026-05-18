import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { API_CONFIG } from "@/lib/config/api";

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
  psrFinalDecision:
    | "accepted"
    | "partially_accepted"
    | "not_accepted"
    | null;
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

export function useConceptNotes(params: ConceptNotesParams = {}, token?: string | null) {
  return useQuery({
    queryKey: ["concept-notes", params],
    // If caller provides a `token` param we wait until it's non-null before
    // firing (avoids an immediate 401). If `token` is omitted (undefined),
    // we allow the query to run and rely on the Axios interceptor / default
    // auth behaviour.
    enabled: token === undefined ? true : token !== null,
    queryFn: async () => {
      const { data } = await api.get(API_CONFIG.endpoints.conceptNotes.list, {
        params,
        // Inject the NextAuth backendToken when available.
        // Falls back to whatever the Axios interceptor provides (localStorage).
        ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
      });
      console.log("Fetched concept notes:", data);
      return {
        data: data.data as ConceptNoteItem[],
        meta: data.meta as ConceptNotesMeta,
      };
    },
  });
}

export function useCreateConceptNote(backendToken?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Record<string, any> | FormData) => {
      const isMultipart = payload instanceof FormData;
      const headers: Record<string, string> = {};
      if (backendToken) {
        headers.Authorization = `Bearer ${backendToken}`;
      }
      if (isMultipart) {
        headers["Content-Type"] = "multipart/form-data";
      }

      const { data } = await api.post(
        API_CONFIG.endpoints.conceptNotes.create,
        payload,
        { headers }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["concept-notes"] });
    },
  });
}

export function useUpdateConceptNote(backendToken?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string | number; payload: Record<string, any> | FormData }) => {
      const isMultipart = payload instanceof FormData;
      const headers: Record<string, string> = {};
      if (backendToken) {
        headers.Authorization = `Bearer ${backendToken}`;
      }
      if (isMultipart) {
        headers["Content-Type"] = "multipart/form-data";
      }

      const { data } = await api.patch(
        API_CONFIG.endpoints.conceptNotes.update(id),
        payload,
        { headers }
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
        API_CONFIG.endpoints.conceptNotes.submit(id),
        {}, 
        backendToken ? { headers: { Authorization: `Bearer ${backendToken}` } } : {}
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["concept-notes"] });
    },
  });
}
