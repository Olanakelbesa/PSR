import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import type {
  MinuteCreateInput,
  MinuteListResponse,
  MinuteRecord,
} from "@/types/minutes";

type QueryValue = string | number | boolean | undefined | null;

export interface MinutesFilters {
  page?: number;
  limit?: number;
  search?: string;
  budget_year?: string;
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

function normalizeList<T>(payload: unknown): MinuteListResponse {
  if (Array.isArray(payload)) {
    return { data: payload as T[] as MinuteRecord[] };
  }

  if (payload && typeof payload === "object") {
    const objectPayload = payload as {
      success?: boolean;
      data?:
        | MinuteRecord[]
        | { data?: MinuteRecord[]; meta?: MinuteListResponse["meta"] };
      results?: MinuteRecord[];
      meta?: MinuteListResponse["meta"];
      count?: number;
    };

    if (Array.isArray(objectPayload.data)) {
      return {
        success: objectPayload.success,
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
        success: objectPayload.success,
        data: objectPayload.data.data,
        meta: objectPayload.data.meta ?? objectPayload.meta,
      };
    }

    if (Array.isArray(objectPayload.results)) {
      return {
        success: objectPayload.success,
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
    return (payload as { data: T }).data;
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

export const minutesService = {
  async list(filters: MinutesFilters = {}): Promise<MinuteListResponse> {
    const { data } = await apiClient.get(API_ENDPOINTS.MINUTES.LIST, {
      params: cleanParams(filters),
    });

    return normalizeList<MinuteRecord>(data);
  },

  async retrieve(id: string | number): Promise<MinuteRecord> {
    const { data } = await apiClient.get(API_ENDPOINTS.MINUTES.DETAIL(id));
    return normalizeDetail<MinuteRecord>(data);
  },

  async create(values: MinuteCreateInput): Promise<MinuteRecord> {
    const formData = buildFormData(values);
    const { data } = await apiClient.post(
      API_ENDPOINTS.MINUTES.CREATE,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return normalizeDetail<MinuteRecord>(data);
  },
};
