import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { ExternalResearchRecord } from "@/types/external-research";

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

    const list = normalizeList<ExternalResearchRecord>(data);

    const normalized = list.data.map((item) => ({
      id: item.id ?? item.pk,
      uploaded_by_name:
        item.uploadedByName ??
        item.uploaded_by_name ??
        item.uploadedBy?.fullName ??
        undefined,
      title: item.title,
      authors: item.authors ?? item.author ?? null,
      institution: item.institution ?? null,
      year: item.year ?? item.publication_year ?? null,
      abstract: item.abstract ?? item.summary ?? item.description ?? null,
      methodology:
        item.methodology ?? item.methods ?? item.methodologicalSummary ?? null,
      citation: item.citation ?? item.apaCitation ?? null,
      // map gradedEvidence to UI 'grade' values
      grade: ((): string | null => {
        const g = item.gradedEvidence ?? item.graded_evidence ?? null;
        if (!g) return null;
        if (String(g).toLowerCase() === "high") return "good";
        if (String(g).toLowerCase() === "medium") return "good";
        return "poor";
      })(),
      // research type (could be numeric id or string)
      type: item.researchTypeName ?? item.researchType ?? item.type ?? null,
      keywords: item.keywords ?? null,
      file: item.file ?? item.document ?? null,
      uploaded_at: item.uploadedAt ?? item.uploaded_at ?? null,
      uploaded_by: item.uploadedBy ?? item.uploaded_by ?? null,
      reviewed_by_name:
        item.reviewedByName ?? item.reviewed_by_name ?? undefined,
      reviewed_at: item.reviewedAt ?? item.reviewed_at ?? null,
      approval_status: item.approvalStatus ?? item.approval_status ?? "pending",
      approval_remarks: item.approvalRemarks ?? item.approval_remarks ?? null,
    }));

    return { data: normalized, meta: list.meta };
  },

  async retrieve(id: string | number) {
    const { data } = await apiClient.get(
      API_ENDPOINTS.EXTERNAL_RESEARCH.DETAIL(id),
    );

    const payload = normalizeDetail<ExternalResearchRecord>(data);

    const mapped = {
      id: payload.id ?? payload.pk,
      uploaded_by_name:
        payload.uploadedByName ??
        payload.uploaded_by_name ??
        payload.uploadedBy?.fullName ??
        undefined,
      title: payload.title,
      authors: payload.authors ?? payload.author ?? null,
      institution: payload.institution ?? null,
      year: payload.year ?? payload.publication_year ?? null,
      abstract:
        payload.abstract ?? payload.summary ?? payload.description ?? null,
      methodology:
        payload.methodology ??
        payload.methods ??
        payload.methodologicalSummary ??
        null,
      citation: payload.citation ?? payload.apaCitation ?? null,
      grade:
        payload.gradedEvidence === "high" || payload.gradedEvidence === "medium"
          ? "good"
          : payload.gradedEvidence
            ? "poor"
            : null,
      type:
        payload.researchTypeName ??
        payload.researchType ??
        payload.type ??
        null,
      keywords: payload.keywords ?? null,
      file: payload.file ?? payload.document ?? null,
      uploaded_at: payload.uploadedAt ?? payload.uploaded_at ?? null,
      uploaded_by: payload.uploadedBy ?? payload.uploaded_by ?? null,
      reviewed_by_name:
        payload.reviewedByName ?? payload.reviewed_by_name ?? undefined,
      reviewed_at: payload.reviewedAt ?? payload.reviewed_at ?? null,
      approval_status:
        payload.approvalStatus ?? payload.approval_status ?? "pending",
      approval_remarks:
        payload.approvalRemarks ?? payload.approval_remarks ?? null,
    };

    return mapped;
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

    return normalizeDetail<ExternalResearchRecord>(data);
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

    return normalizeDetail<ExternalResearchRecord>(data);
  },
};
