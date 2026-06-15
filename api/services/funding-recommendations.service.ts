import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { AwardData } from "@/components/document/AwardLetterPDF";
import type { ContractData } from "@/types/agriments";
import type {
  FundingRecommendation,
  FundingRecommendationCandidate,
  FundingRecommendationCandidateResponse,
  FundingRecommendationCreateInput,
  FundingRecommendationListResponse,
} from "@/types/funding-recommendation";

type QueryValue = string | number | boolean | undefined | null;

export interface FundingRecommendationFilters {
  page?: number;
  limit?: number;
  search?: string;
  proposal?: number | string;
  has_ethical_clearance_approval?: boolean;
  funding_decision_status?: string;
  screening_status?: string;
  need_irb_ethical_clearance?: boolean;
  ordering?: string;
}

export interface FundingRecommendationCandidateFilters {
  page?: number;
  limit?: number;
  search?: string;
  call?: number | string;
  funding_decision_id?: number | string;
  organization?: number | string;
  unit?: number | string;
  proposal_type?: number | string;
  has_funding_decision?: boolean;
  funding_decision_status?: "pending" | "approved" | "rejected" | "deferred";
  has_funding_recommendation?: boolean;
  need_irb_ethical_clearance?: boolean;
  ethical_clearance_status?: string;
  proposal_workflow_state?: string;
  ordering?: string;
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

function normalizeList<T>(payload: unknown): {
  success: boolean;
  data: T[];
  meta?: FundingRecommendationListResponse["meta"];
} {
  if (Array.isArray(payload)) {
    return { success: true, data: payload as T[] };
  }

  if (payload && typeof payload === "object") {
    const objectPayload = payload as {
      success?: boolean;
      data?:
        | T[]
        | { data?: T[]; meta?: FundingRecommendationListResponse["meta"] };
      meta?: FundingRecommendationListResponse["meta"];
    };

    if (Array.isArray(objectPayload.data)) {
      return {
        success: objectPayload.success ?? true,
        data: objectPayload.data,
        meta: normalizeMetadata(objectPayload.meta),
      };
    }

    if (
      objectPayload.data &&
      typeof objectPayload.data === "object" &&
      Array.isArray(objectPayload.data.data)
    ) {
      return {
        success: objectPayload.success ?? true,
        data: objectPayload.data.data,
        meta: normalizeMetadata(objectPayload.data.meta ?? objectPayload.meta),
      };
    }
  }

  return { success: true, data: [] };
}

function normalizeMetadata(meta: any) {
  if (!meta) return undefined;
  const normalized: any = {};

  // Copy pagination fields
  if (meta.page !== undefined) normalized.page = meta.page;
  if (meta.limit !== undefined) normalized.limit = meta.limit;
  if (meta.total !== undefined) normalized.total = meta.total;
  if (meta.total_pages !== undefined) normalized.total_pages = meta.total_pages;

  // Normalize statistics
  if (meta.statistics) {
    normalized.statistics = {
      totalAwarded:
        meta.statistics.total_awarded ?? meta.statistics.totalAwarded,
      totalRequested:
        meta.statistics.total_requested ?? meta.statistics.totalRequested,
      recommendationsCount:
        meta.statistics.recommendations_count ??
        meta.statistics.recommendationsCount,
      ethicalClearanceApprovedCount:
        meta.statistics.ethical_clearance_approved_count ??
        meta.statistics.ethicalClearanceApprovedCount,
    };
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
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

// The backend wraps responses in success_envelope(), which camelCases every
// key. The PDF templates, however, consume the exact AwardData / ContractData
// shapes (mixed snake_case and camelCase). These mappers translate the
// camelized payload back into the shapes the templates expect.
type CamelRecord = Record<string, unknown>;

function str(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return undefined;
}

function mapAwardLetterData(payload: CamelRecord): AwardData {
  const recipients = Array.isArray(payload.recipients)
    ? (payload.recipients as unknown[]).map((r) => String(r)).filter(Boolean)
    : [];

  return {
    organization_name: str(payload.organizationName) ?? "",
    organization_amharic: str(payload.organizationAmharic),
    document_no: str(payload.documentNo),
    issue_no: str(payload.issueNo),
    refNo: str(payload.refNo) ?? "",
    date: str(payload.date) ?? "",
    recipients: recipients.length > 0 ? recipients : ["Principal Investigator"],
    projectTitle: str(payload.projectTitle) ?? "",
    approvalStart: str(payload.approvalStart) ?? "",
    approvalEnd: str(payload.approvalEnd) ?? "",
    totalAmount: str(payload.totalAmount) ?? "0",
    percentageAmount: str(payload.percentageAmount) ?? "0",
    percentageAmountWords: str(payload.percentageAmountWords),
    percentage: str(payload.percentage) ?? "100",
    agreementDeadline: str(payload.agreementDeadline) ?? "",
    logoPath: str(payload.logoPath),
    vicePresidentName: str(payload.vicePresidentName),
    submitting_office_name_en: str(payload.submittingOfficeNameEn),
    second_level_office_name_en: str(payload.secondLevelOfficeNameEn),
  };
}

function mapContractData(payload: CamelRecord): ContractData {
  const coInvestigators = Array.isArray(payload.coInvestigators)
    ? (payload.coInvestigators as CamelRecord[]).map((co) => ({
        id: (co.id as string | number | undefined) ?? undefined,
        index: typeof co.index === "number" ? co.index : undefined,
        name: str(co.name) ?? "",
      }))
    : [];

  return {
    organization_name: str(payload.organizationName) ?? "",
    logoPath: str(payload.logoPath),
    organization_amharic: str(payload.organizationAmharic),
    document_no: str(payload.documentNo),
    issue_no: str(payload.issueNo),
    principal_investigator: str(payload.principalInvestigator),
    co_investigators: coInvestigators,
    proposal_title: str(payload.proposalTitle),
    project_duration_years: str(payload.projectDurationYears),
    college: str(payload.college),
    department: str(payload.department),
    center_of_excellence: str(payload.centerOfExcellence),
    email: str(payload.email),
    phone: str(payload.phone),
    approved_budget: str(payload.approvedBudget),
    approved_budget_words: str(payload.approvedBudgetWords),
    day: str(payload.day),
    month: str(payload.month),
  };
}

export const fundingRecommendationsService = {
  async list(
    filters: FundingRecommendationFilters = {},
  ): Promise<FundingRecommendationListResponse> {
    const { data } = await apiClient.get(
      API_ENDPOINTS.FUNDING_RECOMMENDATIONS.LIST,
      {
        params: cleanParams(filters),
      },
    );

    return normalizeList<FundingRecommendation>(data);
  },

  async listCandidates(
    filters: FundingRecommendationCandidateFilters = {},
  ): Promise<FundingRecommendationCandidateResponse> {
    const { data } = await apiClient.get(
      API_ENDPOINTS.SCREENINGS.REVIEWED_WITH_MARKS,
      {
        params: cleanParams(filters),
      },
    );

    return normalizeList<FundingRecommendationCandidate>(data);
  },

  async retrieve(id: string | number): Promise<FundingRecommendation> {
    const { data } = await apiClient.get(
      API_ENDPOINTS.FUNDING_RECOMMENDATIONS.DETAIL(id),
    );

    return normalizeDetail<FundingRecommendation>(data);
  },

  async create(
    payload: FundingRecommendationCreateInput,
  ): Promise<FundingRecommendation> {
    const { data } = await apiClient.post(
      API_ENDPOINTS.FUNDING_RECOMMENDATIONS.LIST,
      payload,
    );

    return normalizeDetail<FundingRecommendation>(data);
  },

  async replace(
    id: string | number,
    payload: FundingRecommendationCreateInput,
  ): Promise<FundingRecommendation> {
    const { data } = await apiClient.put(
      API_ENDPOINTS.FUNDING_RECOMMENDATIONS.DETAIL(id),
      payload,
    );

    return normalizeDetail<FundingRecommendation>(data);
  },

  async update(
    id: string | number,
    payload: Partial<FundingRecommendationCreateInput>,
  ): Promise<FundingRecommendation> {
    const { data } = await apiClient.patch(
      API_ENDPOINTS.FUNDING_RECOMMENDATIONS.DETAIL(id),
      payload,
    );

    return normalizeDetail<FundingRecommendation>(data);
  },

  async remove(id: string | number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.FUNDING_RECOMMENDATIONS.DETAIL(id));
  },

  async listReadyForFinalSubmission(
    filters: FundingRecommendationCandidateFilters = {},
  ): Promise<FundingRecommendationListResponse> {
    const { data } = await apiClient.get(
      API_ENDPOINTS.FUNDING_RECOMMENDATIONS.READY_FOR_FINAL_SUBMISSION,
      {
        params: cleanParams(filters),
      },
    );

    return normalizeList<FundingRecommendation>(data);
  },

  async getAwardLetterData(id: string | number): Promise<AwardData> {
    const { data } = await apiClient.get(
      API_ENDPOINTS.FUNDING_RECOMMENDATIONS.AWARD_LETTER_DATA(id),
    );

    return mapAwardLetterData(normalizeDetail<CamelRecord>(data));
  },

  async getAgreementData(id: string | number): Promise<ContractData> {
    const { data } = await apiClient.get(
      API_ENDPOINTS.FUNDING_RECOMMENDATIONS.AGREEMENT_DATA(id),
    );

    return mapContractData(normalizeDetail<CamelRecord>(data));
  },
};
