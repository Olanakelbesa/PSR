import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { FundingRecommendation } from "@/types/funding-recommendation";
import type {
  FinalSubmission,
  FinalSubmissionCreateInput,
  FinalSubmissionLookupOption,
} from "@/types/final-submission";

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

export const finalSubmissionsService = {
  async list(
    filters: FinalSubmissionFilters = {},
  ): Promise<ApiListResponse<FinalSubmission>> {
    const { data } = await apiClient.get(API_ENDPOINTS.FINAL_SUBMISSIONS.LIST, {
      params: cleanParams(filters),
    });

    return normalizeList<FinalSubmission>(data);
  },

  async retrieve(id: string | number): Promise<FinalSubmission> {
    const { data } = await apiClient.get(
      API_ENDPOINTS.FINAL_SUBMISSIONS.DETAIL(id),
    );

    return normalizeDetail<FinalSubmission>(data);
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

  async listReadyForFinalSubmission(
    filters: Record<string, unknown> = {},
  ): Promise<ApiListResponse<FundingRecommendation>> {
    const { data } = await apiClient.get(
      API_ENDPOINTS.FUNDING_RECOMMENDATIONS.READY_FOR_FINAL_SUBMISSION,
      { params: cleanParams(filters) },
    );

    return normalizeList<FundingRecommendation>(data);
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
};
