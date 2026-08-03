import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import type {
  ExternalResearchApprovalRecord,
  ExternalResearchDownloadFileType,
  ExternalResearchFilters,
  ExternalResearchRecord,
} from "@/types/external-research";

type QueryValue = string | number | boolean | undefined | null;

export interface ApiListResponse<T> {
  data: T[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    statistics?: {
      total: number;
      draft: number;
      submitted: number;
      under_review: number;
      revision_requested: number;
      approved: number;
      rejected: number;
    };
  };
}

function cleanParams(params?: object) {
  if (!params) return undefined;

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      const typedValue = value as QueryValue;
      if (typedValue === undefined || typedValue === null) return false;
      if (typeof value === "string") return value.trim().length > 0;
      return true;
    }),
  );
}

export function normalizeExternalResearchRecord(item: any): ExternalResearchRecord {
  if (!item || typeof item !== "object") return item;

  const fullReport = item.full_report ?? item.fullReport ?? item.file ?? null;
  const policyBrief = item.policy_brief ?? item.policyBrief ?? null;
  const supplementaryDocument =
    item.supplementary_document ?? item.supplementaryDocument ?? null;

  return {
    ...item,
    id: item.id,
    title: item.title ?? "",
    authors: item.authors ?? "",
    institution: item.institution ?? "",
    year: item.year ?? new Date().getFullYear(),
    department: item.department ?? null,
    abstract: item.abstract ?? null,
    executive_summary: item.executive_summary ?? item.executiveSummary ?? null,
    executiveSummary: item.executiveSummary ?? item.executive_summary ?? null,
    graded_evidence: item.graded_evidence ?? item.gradedEvidence ?? "not_graded",
    gradedEvidence: item.gradedEvidence ?? item.graded_evidence ?? "not_graded",
    research_type: item.research_type ?? item.researchType ?? null,
    researchType: item.researchType ?? item.research_type ?? null,
    output_type: item.output_type ?? item.outputType ?? null,
    outputType: item.outputType ?? item.output_type ?? null,
    keywords: item.keywords ?? null,
    file: item.file ?? fullReport,
    full_report: fullReport,
    fullReport: fullReport,
    policy_brief: policyBrief,
    policyBrief: policyBrief,
    supplementary_document: supplementaryDocument,
    supplementaryDocument: supplementaryDocument,
    external_link: item.external_link ?? item.externalLink ?? null,
    externalLink: item.externalLink ?? item.external_link ?? null,
    doi: item.doi ?? null,
    data_center: item.data_center ?? item.dataCenter ?? null,
    dataCenter: item.dataCenter ?? item.data_center ?? null,
    custom_data_center: item.custom_data_center ?? item.customDataCenter ?? null,
    customDataCenter: item.customDataCenter ?? item.custom_data_center ?? null,
    data_sharing_checklist_completed:
      item.data_sharing_checklist_completed ??
      item.dataSharingChecklistCompleted ??
      false,
    dataSharingChecklistCompleted:
      item.dataSharingChecklistCompleted ??
      item.data_sharing_checklist_completed ??
      false,
    is_published: item.is_published ?? item.isPublished ?? true,
    isPublished: item.isPublished ?? item.is_published ?? true,
    version: item.version ?? 1,
    download_count: item.download_count ?? item.downloadCount ?? 0,
    downloadCount: item.downloadCount ?? item.download_count ?? 0,
    uploaded_by: item.uploaded_by ?? item.uploadedBy ?? null,
    uploadedBy: item.uploadedBy ?? item.uploaded_by ?? null,
    uploaded_by_name:
      item.uploaded_by_name ??
      item.uploadedByName ??
      item.uploaded_by_detail?.full_name ??
      item.uploadedByDetail?.fullName ??
      null,
    uploadedByName:
      item.uploadedByName ??
      item.uploaded_by_name ??
      item.uploaded_by_detail?.full_name ??
      item.uploadedByDetail?.fullName ??
      null,
    uploaded_at: item.uploaded_at ?? item.uploadedAt ?? null,
    uploadedAt: item.uploadedAt ?? item.uploaded_at ?? null,
    approval_status: item.approval_status ?? item.approvalStatus ?? "pending",
    approvalStatus: item.approvalStatus ?? item.approval_status ?? "pending",
    approval_remarks: item.approval_remarks ?? item.approvalRemarks ?? null,
    approvalRemarks: item.approvalRemarks ?? item.approval_remarks ?? null,
    reviewed_by: item.reviewed_by ?? item.reviewedBy ?? null,
    reviewedBy: item.reviewedBy ?? item.reviewed_by ?? null,
    reviewed_by_name: item.reviewed_by_name ?? item.reviewedByName ?? null,
    reviewedByName: item.reviewedByName ?? item.reviewed_by_name ?? null,
    reviewed_at: item.reviewed_at ?? item.reviewedAt ?? null,
    output_types: item.output_types ?? item.outputTypes ?? [],
    outputTypes: item.outputTypes ?? item.output_types ?? [],
    output_types_detail: item.output_types_detail ?? item.outputTypesDetail ?? (item.output_type_detail ? [item.output_type_detail] : []),
    outputTypesDetail: item.outputTypesDetail ?? item.output_types_detail ?? (item.outputTypeDetail ? [item.outputTypeDetail] : []),
    data_center_detail: item.data_center_detail ?? item.dataCenterDetail ?? null,
    dataCenterDetail: item.dataCenterDetail ?? item.data_center_detail ?? null,
    uploaded_by_detail: item.uploaded_by_detail ?? item.uploadedByDetail ?? null,
    uploadedByDetail: item.uploadedByDetail ?? item.uploaded_by_detail ?? null,
    reviewed_by_detail: item.reviewed_by_detail ?? item.reviewedByDetail ?? null,
    reviewedByDetail: item.reviewedByDetail ?? item.reviewed_by_detail ?? null,
    approvals: item.approvals ?? [],
  } as ExternalResearchRecord;
}

function normalizeList<T>(payload: unknown): ApiListResponse<T> {
  if (Array.isArray(payload)) {
    return { data: payload.map(normalizeExternalResearchRecord) as unknown as T[] };
  }

  if (payload && typeof payload === "object") {
    const objectPayload = payload as any;

    let itemsRaw: any[] = [];
    let metaData: any = undefined;

    if (Array.isArray(objectPayload.data)) {
      itemsRaw = objectPayload.data;
      metaData = objectPayload.meta;
    } else if (
      objectPayload.data &&
      typeof objectPayload.data === "object" &&
      Array.isArray(objectPayload.data.data)
    ) {
      itemsRaw = objectPayload.data.data;
      metaData = objectPayload.data.meta ?? objectPayload.meta;
    } else if (Array.isArray(objectPayload.results)) {
      itemsRaw = objectPayload.results;
      metaData = {
        page: Number(objectPayload.meta?.page ?? 1),
        limit: Number(objectPayload.meta?.limit ?? 10),
        total: Number(
          objectPayload.meta?.total ??
            objectPayload.count ??
            objectPayload.results.length,
        ),
        totalPages: Number(objectPayload.meta?.totalPages ?? 0),
        statistics: objectPayload.meta?.statistics,
      };
    }

    if (itemsRaw.length > 0) {
      return {
        data: itemsRaw.map(normalizeExternalResearchRecord) as unknown as T[],
        meta: metaData,
      };
    }
  }

  return { data: [] };
}

function normalizeDetail<T>(payload: unknown): T {
  let target = payload;
  if (payload && typeof payload === "object" && "data" in payload) {
    const nested = (payload as { data: unknown }).data;
    if (nested && typeof nested === "object" && "data" in nested) {
      target = (nested as { data: T }).data;
    } else {
      target = nested;
    }
  }

  return normalizeExternalResearchRecord(target) as unknown as T;
}

function buildFormData<T extends object>(values: T) {
  const formData = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => formData.append(key, String(item)));
      return;
    }

    if (value instanceof File) {
      formData.append(key, value);
      return;
    }

    formData.append(key, String(value));
  });

  return formData;
}

export const externalResearchService = {
  async list(filters: ExternalResearchFilters = {}) {
    const { data } = await apiClient.get(API_ENDPOINTS.EXTERNAL_RESEARCH.LIST, {
      params: cleanParams(filters),
    });

    const list = normalizeList<ExternalResearchRecord>(data);
    return list;
  },

  async retrieve(id: string | number) {
    const { data } = await apiClient.get(
      API_ENDPOINTS.EXTERNAL_RESEARCH.DETAIL(id),
    );

    const payload = normalizeDetail<ExternalResearchRecord>(data);
    return payload;
  },

  async create(values: Record<string, unknown> | FormData) {
    const payload = values instanceof FormData ? values : buildFormData(values);
    const { data } = await apiClient.post(
      API_ENDPOINTS.EXTERNAL_RESEARCH.CREATE,
      payload,
    );

    return normalizeDetail<ExternalResearchRecord>(data);
  },

  async update(id: string | number, values: Record<string, unknown> | FormData) {
    const payload = values instanceof FormData ? values : buildFormData(values);
    const { data } = await apiClient.patch(
      API_ENDPOINTS.EXTERNAL_RESEARCH.UPDATE(id),
      payload,
    );

    return normalizeDetail<ExternalResearchRecord>(data);
  },

  async submit(id: string | number) {
    const { data } = await apiClient.post(
      API_ENDPOINTS.EXTERNAL_RESEARCH.SUBMIT(id),
    );
    return normalizeDetail<ExternalResearchRecord>(data);
  },

  async recordDownload(
    id: string | number,
    fileType?: ExternalResearchDownloadFileType,
  ) {
    const { data } = await apiClient.post(
      API_ENDPOINTS.EXTERNAL_RESEARCH.DOWNLOAD(id),
      { file_type: fileType },
    );

    const result = normalizeDetail<{
      download_count?: number;
      downloadCount?: number;
      file_url?: string;
      fileUrl?: string;
      file_type?: string;
      fileType?: string;
    }>(data);

    return {
      downloadCount: Number(result.download_count ?? result.downloadCount ?? 0),
      fileUrl: String(result.file_url ?? result.fileUrl ?? ""),
      fileType: String(result.file_type ?? result.fileType ?? "document"),
    };
  },

  async listApprovals(filters: Record<string, unknown> = {}) {
    const { data } = await apiClient.get(
      API_ENDPOINTS.EXTERNAL_RESEARCH.APPROVALS,
      { params: cleanParams(filters) },
    );

    return normalizeList<ExternalResearchApprovalRecord>(data);
  },

  async createApproval(values: Record<string, unknown>) {
    const { data } = await apiClient.post(
      API_ENDPOINTS.EXTERNAL_RESEARCH.APPROVALS,
      values,
    );

    return normalizeDetail<ExternalResearchApprovalRecord>(data);
  },
};
