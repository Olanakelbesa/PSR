import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { API_ENDPOINTS } from "@/api/endpoints";
import { invalidateDashboardAnalytics } from "@/lib/queries/dashboard";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";

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
  downloadCount: number;
}

export interface PolicyRepositoryDownloadResponse {
  success: boolean;
  data: {
    id: number;
    downloadCount: number;
    draftFile: string;
  };
}

export interface PolicyRepositoryResponse {
  success: boolean;
  data: PolicyRepositoryItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    statistics?: {
      totalRegistered: number;
      published: number;
      unpublished: number;
      readyForRegistration: number;
    };
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
      const response = data as PolicyRepositoryResponse;
      if (response?.data) {
        response.data = response.data.map((item) => ({
          ...item,
          downloadCount: item.downloadCount ?? 0,
          draftFile: resolveFileUrl(item.draftFile) ?? item.draftFile,
        }));
      }
      return response;
    },
  });
}

export interface PolicyRepositoryDetailThematicArea {
  id?: number;
  name: string;
}

export interface PolicyRepositoryDetail {
  id: number;
  overview: {
    title: string;
    policyDescription: string;
    draftFile: string;
  };
  registryMetadata: {
    serialNumber: string;
    versionCode: string;
    documentType: string;
    sourceDraft: string;
    approvalDate: string;
    effectiveDate: string;
    operationalPeriod: string;
    nextReviewDate: string;
    organizationName?: string;
  };
  thematicAreas: PolicyRepositoryDetailThematicArea[];
  publicationStatus: {
    status: string;
    accessLevel: string;
    nextReview: string;
    period: string;
    downloadCount?: number;
  };
}

export interface PolicyRepositoryDetailResponse {
  success: boolean;
  data: PolicyRepositoryDetail;
}

export interface PolicyRepositoryViewModel {
  id: number;
  title: string;
  serialNumber: string;
  versionCode: string;
  type: string;
  organization: string;
  approvalDate: string;
  effectiveDate: string;
  operationalPeriod: string;
  nextReviewDate: string;
  publishStatus: boolean;
  publishStatusLabel: string;
  accessLevel: string;
  accessLevelLabel: string;
  description: string;
  executiveSummary: string;
  draftFile: string;
  documentUrl: string | null;
  documentFileName: string;
  sourceDraft: string;
  thematicAreas: string[];
  downloadCount: number;
  versionHistory: Array<{
    version: string;
    date: string;
    author: { firstName: string; lastName: string };
    description: string;
    status: string;
    size: string;
    file: string | null;
  }>;
  timeline: Array<{
    date: string;
    label: string;
    status: "done" | "upcoming";
  }>;
}

function normalizeAccessLevel(value?: string): string {
  return (value ?? "public").toLowerCase();
}

function isPublishedStatus(value?: string): boolean {
  return (value ?? "").toLowerCase() === "published";
}

export function mapPolicyRepositoryDetail(
  detail: PolicyRepositoryDetail,
  extractName: (path?: string | null) => string,
): PolicyRepositoryViewModel {
  const { overview, registryMetadata, publicationStatus, thematicAreas } =
    detail;

  const draftFile = resolveFileUrl(overview?.draftFile?.trim()) ?? "";
  const documentUrl = draftFile || null;
  const approvalDate = registryMetadata?.approvalDate ?? "";
  const effectiveDate = registryMetadata?.effectiveDate ?? "";
  const nextReviewDate =
    registryMetadata?.nextReviewDate ??
    publicationStatus?.nextReview ??
    "";

  const thematicAreaNames = (thematicAreas ?? []).map((area) =>
    typeof area === "string" ? area : area.name,
  );

  const versionCode = registryMetadata?.versionCode ?? "";
  const documentType = registryMetadata?.documentType ?? "Policy Document";

  const timeline: PolicyRepositoryViewModel["timeline"] = [
    approvalDate && {
      date: approvalDate,
      label: "Approved",
      status: "done" as const,
    },
    effectiveDate && {
      date: effectiveDate,
      label: "Effective",
      status: "done" as const,
    },
    nextReviewDate && {
      date: nextReviewDate,
      label: "Next review",
      status: "upcoming" as const,
    },
  ].filter(Boolean) as PolicyRepositoryViewModel["timeline"];

  return {
    id: detail.id,
    title: overview?.title ?? "Registered Policy",
    serialNumber: registryMetadata?.serialNumber ?? "",
    versionCode,
    type: documentType,
    organization: registryMetadata?.organizationName ?? "—",
    approvalDate,
    effectiveDate,
    operationalPeriod:
      registryMetadata?.operationalPeriod ?? publicationStatus?.period ?? "",
    nextReviewDate,
    publishStatus: isPublishedStatus(publicationStatus?.status),
    publishStatusLabel: publicationStatus?.status ?? "Unpublished",
    accessLevel: normalizeAccessLevel(publicationStatus?.accessLevel),
    accessLevelLabel: publicationStatus?.accessLevel ?? "Public",
    description: overview?.policyDescription ?? "",
    executiveSummary: overview?.policyDescription ?? "",
    draftFile,
    documentUrl,
    documentFileName: extractName(draftFile) || overview?.title || "Document",
    sourceDraft: registryMetadata?.sourceDraft ?? "",
    thematicAreas: thematicAreaNames,
    downloadCount: publicationStatus?.downloadCount ?? 0,
    versionHistory: versionCode
      ? [
          {
            version: versionCode,
            date: approvalDate || effectiveDate,
            author: { firstName: "Repository", lastName: "" },
            description: `Registered policy document (${documentType}).`,
            status: "current",
            size: documentType,
            file: documentUrl,
          },
        ]
      : [],
    timeline,
  };
}

export function usePolicyRepositoryDetail(id: string | number) {
  return useQuery<PolicyRepositoryDetailResponse>({
    queryKey: ["policy-repository-detail", String(id)],
    queryFn: async () => {
      const { data } = await api.get<PolicyRepositoryDetailResponse>(
        API_ENDPOINTS.POLICY_REPOSITORY.DETAIL(id),
      );
      return data;
    },
    enabled: !!id,
  });
}

export function useRecordPolicyDownload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<PolicyRepositoryDownloadResponse>(
        API_ENDPOINTS.POLICY_REPOSITORY.DOWNLOAD(id),
      );
      const payload = data.data;
      return {
        ...payload,
        draftFile: resolveFileUrl(payload.draftFile) ?? payload.draftFile,
      };
    },
    onSuccess: (result, id) => {
      queryClient.setQueryData(["policy-repository"], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((item: any) =>
            item.id === id ? { ...item, downloadCount: result.downloadCount } : item
          ),
        };
      });
      queryClient.setQueryData(["policy-repository-detail", String(id)], (old: any) => {
        if (!old) return old;
        return { ...old, data: { ...old.data, downloadCount: result.downloadCount } };
      });
      queryClient.invalidateQueries({ queryKey: ["policy-repository"] });
      queryClient.invalidateQueries({
        queryKey: ["policy-repository-detail", String(id)],
      });
    },
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["policy-repository"] });
      queryClient.invalidateQueries({ queryKey: ["policy-drafts"] });
      queryClient.invalidateQueries({ queryKey: ["policy-draft", String(variables.source_draft_id)] });
      queryClient.invalidateQueries({ queryKey: ["policy-draft", Number(variables.source_draft_id)] });
      queryClient.invalidateQueries({ queryKey: ["policy-drafts-manage"] });
      void invalidateDashboardAnalytics(queryClient);
    },
  });
}

export function useUpdateRegisteredPolicy(id: string | number) {
  const queryClient = useQueryClient();
  return useMutation<
    any,
    any,
    {
      serial_number: string;
      version_code: string;
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
      formData.append("serial_number", variables.serial_number.trim());
      formData.append("version_code", variables.version_code.trim());
      formData.append("approval_date", variables.approval_date);
      formData.append("effective_date", variables.effective_date);
      formData.append("next_review_date", variables.next_review_date);
      formData.append("access_level", variables.access_level.toLowerCase());
      formData.append("publish_status", String(variables.publish_status));
      if (variables.policy_document_source) {
        formData.append(
          "policy_document_source",
          variables.policy_document_source,
        );
      }

      const { data } = await api.patch(
        API_ENDPOINTS.POLICY_REPOSITORY.UPDATE(id),
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policy-repository"] });
      queryClient.invalidateQueries({
        queryKey: ["policy-repository-detail", String(id)],
      });
      void invalidateDashboardAnalytics(queryClient);
    },
  });
}
