import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

type QueryValue = string | number | boolean | undefined | null;

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
    const objectPayload = payload as any;

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

export const externalResearchService = {
  async list(filters: Record<string, unknown> = {}) {
    const { data } = await apiClient.get(API_ENDPOINTS.EXTERNAL_RESEARCH.LIST, {
      params: cleanParams(filters),
    });

    return normalizeList<any>(data);
  },

  async retrieve(id: string | number) {
    const { data } = await apiClient.get(
      API_ENDPOINTS.EXTERNAL_RESEARCH.DETAIL(id),
    );
    return normalizeDetail<any>(data);
  },

  async create(values: Record<string, unknown>) {
    const formData = buildFormData(values);
    const { data } = await apiClient.post(
      API_ENDPOINTS.EXTERNAL_RESEARCH.CREATE,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return normalizeDetail<any>(data);
  },

  async update(id: string | number, values: Record<string, unknown>) {
    const payload =
      values instanceof FormData ? values : buildFormData(values as any);
    const { data } = await apiClient.patch(
      API_ENDPOINTS.EXTERNAL_RESEARCH.UPDATE(id),
      payload,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return normalizeDetail<any>(data);
  },
};
