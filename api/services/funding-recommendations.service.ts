import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
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
  ordering?: string;
}

export interface FundingRecommendationCandidateFilters {
  page?: number;
  limit?: number;
  search?: string;
  organization?: number | string;
  unit?: number | string;
  proposal_type?: number | string;
  has_funding_decision?: boolean;
  funding_decision_status?: "pending" | "approved" | "rejected" | "deferred";
  has_funding_recommendation?: boolean;
  need_irb_ethical_clearance?: boolean;
  ethical_clearance_status?: string;
  ordering?: string;
}

function cleanParams<T extends Record<string, QueryValue>>(params?: T) {
  if (!params) return undefined;

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      if (value === undefined || value === null) return false;
      if (typeof value === "string") return value.trim().length > 0;
      return true;
    }),
  );
}

function normalizeList<T>(
  payload: unknown,
): { success: boolean; data: T[]; meta?: FundingRecommendationListResponse["meta"] } {
  if (Array.isArray(payload)) {
    return { success: true, data: payload as T[] };
  }

  if (payload && typeof payload === "object") {
    const objectPayload = payload as {
      success?: boolean;
      data?: T[] | { data?: T[]; meta?: FundingRecommendationListResponse["meta"] };
      meta?: FundingRecommendationListResponse["meta"];
    };

    if (Array.isArray(objectPayload.data)) {
      return {
        success: objectPayload.success ?? true,
        data: objectPayload.data,
        meta: objectPayload.meta,
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
        meta: objectPayload.data.meta ?? objectPayload.meta,
      };
    }
  }

  return { success: true, data: [] };
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

export const fundingRecommendationsService = {
  async list(
    filters: FundingRecommendationFilters = {},
  ): Promise<FundingRecommendationListResponse> {
    const { data } = await apiClient.get(API_ENDPOINTS.FUNDING_RECOMMENDATIONS.LIST, {
      params: cleanParams(filters),
    });

    return normalizeList<FundingRecommendation>(data);
  },

  async listCandidates(
    filters: FundingRecommendationCandidateFilters = {},
  ): Promise<FundingRecommendationCandidateResponse> {
    const { data } = await apiClient.get(API_ENDPOINTS.SCREENINGS.REVIEWED_WITH_MARKS, {
      params: cleanParams(filters),
    });

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
};
