import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { FundingRecommendation } from "@/types/funding-recommendation";
import type {
  FinalSubmission,
  FinalSubmissionCreateInput,
  FinalSubmissionDownloadFileType,
  FinalSubmissionDownloadResult,
  FinalSubmissionLookupOption,
  FinalSubmissionUpdateInput,
} from "@/types/final-submission";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";

type QueryValue = string | number | boolean | undefined | null;

export interface FinalSubmissionFilters {
  page?: number;
  limit?: number;
  search?: string;
  fundedproposal?: number | string;
  output_type?: number | string;
  data_center?: number | string;
  status?: string;
  ordering?: string;
}

export interface ApiListResponse<T> {
  data: T[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
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

function normalizeList<T>(payload: unknown): ApiListResponse<T> {
  if (Array.isArray(payload)) {
    return { data: payload as T[] };
  }

  if (payload && typeof payload === "object") {
    const objectPayload = payload as {
      success?: boolean;
      data?: T[] | { data?: T[]; meta?: ApiListResponse<T>["meta"] };
      results?: T[];
      meta?: ApiListResponse<T>["meta"];
      count?: number;
    };

    if (Array.isArray(objectPayload.data)) {
      return { data: objectPayload.data, meta: objectPayload.meta };
    }

    if (
      objectPayload.data &&
      typeof objectPayload.data === "object" &&
      Array.isArray(objectPayload.data.data)
    ) {
      return {
        data: objectPayload.data.data,
        meta: objectPayload.data.meta ?? objectPayload.meta,
      };
    }

    if (Array.isArray(objectPayload.results)) {
      return {
        data: objectPayload.results,
        meta: {
          page: Number(objectPayload.meta?.page ?? 1),
          limit: Number(objectPayload.meta?.limit ?? 10),
          total: Number(
            objectPayload.meta?.total ??
              objectPayload.count ??
              objectPayload.results.length,
          ),
          totalPages: Number(objectPayload.meta?.totalPages ?? 0),
        },
      };
    }
  }

  return { data: [] };
}

function normalizeDetail<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    const nested = (payload as { data: unknown }).data;
    if (nested && typeof nested === "object" && "data" in nested) {
      return (nested as { data: T }).data;
    }
    return nested as T;
  }

  return payload as T;
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

function normalizeFundingProposalDetail(item: any) {
  if (!item || typeof item !== "object") return null;

  return {
    funding_recommendation_id:
      item.fundingRecommendationId ??
      item.funding_recommendation_id ??
      item.id ??
      null,
    proposal_id: item.proposalId ?? item.proposal_id ?? null,
    reference_number: item.referenceNumber ?? item.reference_number ?? null,
    title: item.title ?? null,
    total_award_amount:
      item.totalAwardAmount ?? item.total_award_amount ?? null,
  };
}

function normalizeOutputTypeDetail(item: any) {
  if (!item || typeof item !== "object") return null;

  return {
    id: item.id ?? null,
    name: item.name ?? null,
  };
}

function normalizeDataCenterDetail(item: any) {
  if (!item || typeof item !== "object") return null;

  return {
    id: item.id ?? null,
    name: item.name ?? null,
  };
}

function normalizeSubmitterDetail(item: any) {
  if (!item || typeof item !== "object") return null;

  return {
    id: item.id ?? null,
    full_name: item.fullName ?? item.full_name ?? null,
    email: item.email ?? null,
  };
}

function normalizeFileField(value: unknown) {
  if (!value || typeof value !== "string") return null;
  return resolveFileUrl(value) ?? value;
}

function mapFinalSubmissionItem(item: any): FinalSubmission {
  return {
    id: item.id ?? item.pk,
    submitted_by_name:
      item.submittedByName ??
      item.submitted_by_name ??
      item.submittedBy?.fullName ??
      undefined,
    title: item.title,
    abstract: item.abstract ?? null,
    executive_summary:
      item.executiveSummary ?? item.executive_summary ?? null,
    full_report: normalizeFileField(item.fullReport ?? item.full_report),
    policy_brief: normalizeFileField(item.policyBrief ?? item.policy_brief),
    supplementary_document: normalizeFileField(
      item.supplementaryDocument ?? item.supplementary_document,
    ),
    external_link: item.externalLink ?? item.external_link ?? null,
    doi: item.doi ?? null,
    ndmc_submission_reference:
      item.ndmcSubmissionReference ?? item.ndmc_submission_reference ?? null,
    data_sharing_checklist_completed:
      item.dataSharingChecklistCompleted ??
      item.data_sharing_checklist_completed ??
      false,
    submission_date: item.submissionDate ?? item.submission_date ?? null,
    status: item.status ?? "draft",
    version: item.version ?? null,
    fundedproposal:
      item.fundedproposal?.fundingRecommendationId ??
      item.fundedproposal?.funding_recommendation_id ??
      item.fundedproposal?.proposalId ??
      item.fundedproposal ??
      null,
    fundedproposal_detail: normalizeFundingProposalDetail(
      item.fundedproposal ?? item.fundedProposal,
    ),
    output_type: item.outputType?.id ?? item.output_type ?? null,
    output_type_detail: normalizeOutputTypeDetail(
      item.outputType ?? item.output_type_detail,
    ),
    data_center: item.dataCenter?.id ?? item.data_center ?? null,
    data_center_detail: normalizeDataCenterDetail(
      item.dataCenter ?? item.data_center_detail,
    ),
    submitted_by: item.submittedBy?.id ?? item.submitted_by ?? null,
    submitted_by_detail: normalizeSubmitterDetail(
      item.submittedBy ?? item.submitted_by_detail,
    ),
    download_count: item.downloadCount ?? item.download_count ?? 0,
  };
}

export const finalSubmissionsService = {
  async list(
    filters: FinalSubmissionFilters = {},
  ): Promise<ApiListResponse<FinalSubmission>> {
    const { data } = await apiClient.get(API_ENDPOINTS.FINAL_SUBMISSIONS.LIST, {
      params: cleanParams(filters),
    });

    const list = normalizeList<any>(data);

    const normalized = list.data.map((item: any) => mapFinalSubmissionItem(item));

    return { data: normalized as FinalSubmission[], meta: list.meta };
  },

  async retrieve(id: string | number): Promise<FinalSubmission> {
    const { data } = await apiClient.get(
      API_ENDPOINTS.FINAL_SUBMISSIONS.DETAIL(id),
    );

    const payload = normalizeDetail<any>(data);
    return mapFinalSubmissionItem(payload);
  },

  async create(values: FinalSubmissionCreateInput): Promise<FinalSubmission> {
    const formData = buildFormData(values);
    const { data } = await apiClient.post(
      API_ENDPOINTS.FINAL_SUBMISSIONS.CREATE,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return normalizeDetail<FinalSubmission>(data);
  },

  async update(
    id: string | number,
    values: FinalSubmissionUpdateInput,
  ): Promise<FinalSubmission> {
    const formData = buildFormData(values);
    const { data } = await apiClient.patch(
      API_ENDPOINTS.FINAL_SUBMISSIONS.UPDATE(id),
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    const payload = normalizeDetail<any>(data);
    return mapFinalSubmissionItem(payload);
  },

  async listReadyForFinalSubmission(
    filters: Record<string, unknown> = {},
  ): Promise<ApiListResponse<FundingRecommendation>> {
    const { data } = await apiClient.get(
      API_ENDPOINTS.FUNDING_RECOMMENDATIONS.READY_FOR_FINAL_SUBMISSION,
      { params: cleanParams(filters) },
    );

    const raw = normalizeList<any>(data);

    // The endpoint returns camelCase; map to the snake_case FundingRecommendation shape.
    const normalized: FundingRecommendation[] = raw.data.map((item: any) => ({
      id: item.id,
      proposal: item.proposal,
      ready_for_funding_id:
        item.readyForFundingId ?? item.ready_for_funding_id ?? undefined,
      screening_id: item.screeningId ?? item.screening_id ?? null,
      referenceNumber: item.referenceNumber ?? item.reference_number ?? null,
      reference_number: item.referenceNumber ?? item.reference_number ?? null,
      proposalTitle: item.proposalTitle ?? item.proposal_title ?? null,
      proposal_title: item.proposalTitle ?? item.proposal_title ?? null,
      pi: item.pi
        ? {
            id: item.pi.id,
            fullName: item.pi.fullName ?? item.pi.full_name,
            full_name: item.pi.fullName ?? item.pi.full_name,
            email: item.pi.email,
          }
        : null,
      total_award_amount:
        item.totalAwardAmount ?? item.total_award_amount ?? "0",
      amount_english_in_words:
        item.amountEnglishInWords ?? item.amount_english_in_words ?? "",
      has_ethical_clearance_approval:
        item.hasEthicalClearanceApproval ??
        item.has_ethical_clearance_approval ??
        false,
      comments: item.comments ?? "",
      recommended_at: item.recommendedAt ?? item.recommended_at ?? "",
      terminal_report_status:
        item.terminalReportStatus ?? item.terminal_report_status ?? null,
      funding_decision_status:
        item.fundingDecisionStatus ?? item.funding_decision_status ?? null,
      screening_status: item.screeningStatus ?? item.screening_status ?? null,
    }));

    return { data: normalized, meta: raw.meta };
  },

  async listOutputTypes(
    filters: Record<string, unknown> = {},
  ): Promise<ApiListResponse<FinalSubmissionLookupOption>> {
    const { data } = await apiClient.get(API_ENDPOINTS.OUTPUT_TYPES.LIST, {
      params: cleanParams(filters),
    });

    return normalizeList<FinalSubmissionLookupOption>(data);
  },

  async listDataCenters(
    filters: Record<string, unknown> = {},
  ): Promise<ApiListResponse<FinalSubmissionLookupOption>> {
    const { data } = await apiClient.get(API_ENDPOINTS.DATA_CENTERS.LIST, {
      params: cleanParams(filters),
    });

    return normalizeList<FinalSubmissionLookupOption>(data);
  },

  async recordDownload(
    id: string | number,
    fileType?: FinalSubmissionDownloadFileType,
  ): Promise<FinalSubmissionDownloadResult> {
    const { data } = await apiClient.post(
      API_ENDPOINTS.FINAL_SUBMISSIONS.DOWNLOAD(id),
      fileType ? { file_type: fileType } : {},
    );

    const payload = normalizeDetail<any>(data);

    return {
      id: payload.id,
      downloadCount: payload.downloadCount ?? payload.download_count ?? 0,
      fileType: payload.fileType ?? payload.file_type,
      fileUrl: resolveFileUrl(payload.fileUrl ?? payload.file_url) ?? "",
    };
  },
};
