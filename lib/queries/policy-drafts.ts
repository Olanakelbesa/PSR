import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { API_ENDPOINTS } from "@/api/endpoints";

export interface PolicyDraftItem {
  id: number;
  title: string;
  conceptNote: {
    id: number;
    title: string;
  } | null;
  docType: {
    id: number;
    name: string;
  } | null;
  organization: {
    id: number;
    name: string;
  } | null;
  unit: {
    id: number;
    name: string;
  } | null;
  versionNumber: string;
  submittedBy: {
    id: number;
    fullName: string;
    email: string;
    photoUrl: string | null;
  } | null;
  submissionDate: string;
  updatedAt: string;
  currentStatus: string;
  currentStatusDisplay: string;
}

export interface PolicyDraftResponse {
  success: boolean;
  data: PolicyDraftItem[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PolicyDraftFilters {
  current_status?: string;
  doc_type?: number | string;
  organization?: number | string;
  search?: string;
}

function normalizePolicyDraftListResponse(payload: any): PolicyDraftItem[] {
  const candidates = [
    payload?.data,
    payload?.results,
    payload?.data?.results,
    payload?.data?.data,
  ];

  const list = candidates.find((value) => Array.isArray(value));
  if (!Array.isArray(list)) {
    return [];
  }

  return list as PolicyDraftItem[];
}

export function usePolicyDrafts(
  filters?: PolicyDraftFilters,
  backendToken?: string | null,
) {
  return useQuery<PolicyDraftItem[]>({
    queryKey: ["policy-drafts", filters, backendToken],
    queryFn: async () => {
      const cleanFilters = filters
        ? Object.fromEntries(
            Object.entries(filters).filter(([_, value]) => value !== undefined && value !== "")
          )
        : {};

      const { data } = await api.get(API_ENDPOINTS.POLICY_DRAFTS.LIST, {
        params: {
          ...cleanFilters,
          ...(backendToken ? { backendToken } : {}),
        },
      });
      return normalizePolicyDraftListResponse(data);
    },
  });
}

export function usePolicyDraft(id: string | number) {
  return useQuery<any>({
    queryKey: ["policy-draft", id],
    queryFn: async () => {
      const { data } = await api.get(API_ENDPOINTS.POLICY_DRAFTS.DETAIL(id));
      return data.data || data;
    },
    enabled: !!id,
  });
}

export function usePolicyDraftManage(id?: string | number) {
  return useQuery<any>({
    queryKey: ["policy-draft-manage", id],
    queryFn: async () => {
      const { data } = await api.get(API_ENDPOINTS.POLICY_DRAFTS.MANAGE_DETAIL(id as string | number));
      return data.data || data;
    },
    enabled: !!id,
  });
}

export function usePolicyDraftsManage(filters?: PolicyDraftFilters) {
  return useQuery<PolicyDraftResponse>({
    queryKey: ["policy-drafts-manage", filters],
    queryFn: async () => {
      const cleanFilters = filters
        ? Object.fromEntries(
            Object.entries(filters).filter(([_, value]) => value !== undefined && value !== "")
          )
        : {};

      const { data } = await api.get(API_ENDPOINTS.POLICY_DRAFTS.MANAGE, {
        params: cleanFilters,
      });
      return data as PolicyDraftResponse;
    },
  });
}

export interface ChecklistTemplateItem {
  id: number;
  name: string;
  doc_type: number;
  pass_rule_type: string;
  is_active: boolean;
}

export function useChecklistTemplates(docTypeId?: number) {
  return useQuery<ChecklistTemplateItem[]>({
    queryKey: ["checklist-templates", docTypeId],
    queryFn: async () => {
      const { data } = await api.get(API_ENDPOINTS.REFERENCE.CHECKLIST_TEMPLATES, {
        params: {
          doc_type: docTypeId,
          is_active: true,
        },
      });
      return data.data as ChecklistTemplateItem[];
    },
    enabled: !!docTypeId,
  });
}

export function useAssignedDraftReviewers(draftId: string | number) {
  return useQuery<{ reviewerIds: number[]; reviewers: any[]; checklist_template_id?: number | null }>({
    queryKey: ["policy-drafts-assigned-reviewers", String(draftId)],
    queryFn: async () => {
      const { data } = await api.get(API_ENDPOINTS.POLICY_DRAFTS.ASSIGNED_REVIEWERS(draftId));
      return data.data || data;
    },
    enabled: !!draftId,
  });
}

export function useAssignDraftReviewers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      draftId,
      reviewers,
      checklistTemplateId,
    }: {
      draftId: string | number;
      reviewers: number[];
      checklistTemplateId?: number;
    }) => {
      const { data } = await api.patch(
        API_ENDPOINTS.POLICY_DRAFTS.ASSIGN_REVIEWERS(draftId),
        {
          reviewers,
          ...(checklistTemplateId !== undefined && { checklist_template_id: checklistTemplateId }),
        }
      );
      return data;
    },
    onSuccess: (_data, { draftId }) => {
      queryClient.invalidateQueries({ queryKey: ["policy-drafts-manage"] });
      queryClient.invalidateQueries({ queryKey: ["policy-drafts-assigned-reviewers", String(draftId)] });
      queryClient.invalidateQueries({ queryKey: ["policy-draft", String(draftId)] });
      queryClient.invalidateQueries({ queryKey: ["policy-draft", Number(draftId)] });
    },
  });
}

export function useAssignPSRDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      draftId,
      psr_decision,
      psr_comments,
    }: {
      draftId: string | number;
      psr_decision: string;
      psr_comments: string;
    }) => {
      const { data } = await api.post(
        API_ENDPOINTS.POLICY_DRAFTS.PSR_DECISION(draftId),
        { psr_decision, psr_comments }
      );
      return data;
    },
    onSuccess: (_data, { draftId }) => {
      queryClient.invalidateQueries({ queryKey: ["policy-drafts-manage"] });
      queryClient.invalidateQueries({ queryKey: ["policy-draft-manage", String(draftId)] });
      queryClient.invalidateQueries({ queryKey: ["policy-draft-manage", Number(draftId)] });
      queryClient.invalidateQueries({ queryKey: ["policy-draft-manage", String(draftId)] });
      queryClient.invalidateQueries({ queryKey: ["policy-draft-manage", Number(draftId)] });
      queryClient.invalidateQueries({ queryKey: ["policy-draft", String(draftId)] });
      queryClient.invalidateQueries({ queryKey: ["policy-draft", Number(draftId)] });
    },
  });
}

export function usePolicyDraftsMyReviews() {
  return useQuery<PolicyDraftResponse>({
    queryKey: ["policy-drafts-my-reviews"],
    queryFn: async () => {
      const { data } = await api.get(API_ENDPOINTS.POLICY_DRAFTS.MY_REVIEWS);
      return data as PolicyDraftResponse;
    },
  });
}

export function usePolicyDraftMyReviewDetail(id: string | number) {
  return useQuery<any>({
    queryKey: ["policy-draft-my-review", String(id)],
    queryFn: async () => {
      const { data } = await api.get(
        API_ENDPOINTS.POLICY_DRAFTS.MY_REVIEW_DETAIL(id)
      );
      return data;
    },
    enabled: !!id,
  });
}

export function usePolicyDraftVersionChecklist(id: string | number, versionId: string | number) {
  return useQuery<any>({
    queryKey: ["policy-draft-checklist", String(id), String(versionId)],
    queryFn: async () => {
      const { data } = await api.get(
        API_ENDPOINTS.POLICY_DRAFTS.GET_CHECKLIST(id, versionId)
      );
      return data;
    },
    enabled: !!id && !!versionId,
    // Always fetch fresh data — never use cached checklist responses
    staleTime: 0,
    refetchOnMount: true,
  });
}

export function useSubmitPolicyDraftChecklistReview() {
  const queryClient = useQueryClient();
  return useMutation<any, any, { id: string | number; versionId: string | number; reviewerId: number; responses: any[] }>({
    mutationFn: async ({ id, versionId, reviewerId, responses }) => {
      const { data } = await api.post(
        API_ENDPOINTS.POLICY_DRAFTS.SUBMIT_CHECKLIST_REVIEW(id, versionId),
        {
          reviewerId,
          responses,
        }
      );
      return data;
    },
    onSuccess: (_, { id, versionId }) => {
      queryClient.invalidateQueries({ queryKey: ["policy-draft-my-review", String(id)] });
      queryClient.invalidateQueries({ queryKey: ["policy-draft-checklist", String(id), String(versionId)] });
      queryClient.invalidateQueries({ queryKey: ["policy-drafts-my-reviews"] });
    },
  });
}
