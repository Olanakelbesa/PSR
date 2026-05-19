import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { API_ENDPOINTS } from "@/api/endpoints";

export interface PolicyRepositoryItem {
  id: number;
  draftPolicyId: number;
  draftPolicy: string;
  docType: string;
  accessLevel: "public" | "restricted";
  effectiveDate: string;
  status: "Published" | "Unpublished";
  serialNumber: string;
  versionCode: string;
  draftFile: string;
  organizationName: string;
}

export interface PolicyRepositoryResponse {
  success: boolean;
  data: PolicyRepositoryItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PolicyRepositoryFilters {
  search?: string;
  access_level?: string;
  publish_status?: boolean;
  source_draft__doc_type?: number | string;
  page?: number;
  limit?: number;
  ordering?: string;
}

export function usePolicyRepository(filters: PolicyRepositoryFilters = {}) {
  return useQuery<PolicyRepositoryResponse>({
    queryKey: ["policy-repository", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.access_level && filters.access_level !== "all") {
        params.append("access_level", filters.access_level);
      }
      if (filters.publish_status !== undefined) {
        params.append("publish_status", String(filters.publish_status));
      }
      if (filters.source_draft__doc_type && filters.source_draft__doc_type !== "all") {
        params.append("source_draft__doc_type", String(filters.source_draft__doc_type));
      }
      if (filters.page) params.append("page", String(filters.page));
      if (filters.limit) params.append("limit", String(filters.limit));
      if (filters.ordering) params.append("ordering", filters.ordering);

      const queryString = params.toString();
      const url = `${API_ENDPOINTS.POLICY_REPOSITORY.LIST}${queryString ? `?${queryString}` : ""}`;
      
      const { data } = await api.get(url);
      return data as PolicyRepositoryResponse;
    },
  });
}

export function usePolicyRepositoryDetail(id: string | number) {
  return useQuery<any>({
    queryKey: ["policy-repository-detail", String(id)],
    queryFn: async () => {
      const { data } = await api.get(API_ENDPOINTS.POLICY_REPOSITORY.DETAIL(id));
      return data;
    },
    enabled: !!id,
  });
}

export function useRegisterPolicy() {
  const queryClient = useQueryClient();
  return useMutation<
    any,
    any,
    {
      source_draft_id: number;
      approval_date: string;
      effective_date: string;
      next_review_date: string;
      access_level: string;
      publish_status: boolean;
      policy_document_source?: File | null;
    }
  >({
    mutationFn: async (variables) => {
      const formData = new FormData();
      formData.append("source_draft_id", String(variables.source_draft_id));
      formData.append("approval_date", variables.approval_date);
      formData.append("effective_date", variables.effective_date);
      formData.append("next_review_date", variables.next_review_date);
      formData.append("access_level", variables.access_level.toLowerCase());
      formData.append("publish_status", String(variables.publish_status));
      if (variables.policy_document_source) {
        formData.append("policy_document_source", variables.policy_document_source);
      }

      const { data } = await api.post(
        API_ENDPOINTS.POLICY_REPOSITORY.REGISTER,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policy-repository"] });
    },
  });
}
