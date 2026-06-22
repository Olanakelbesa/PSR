import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import type {
  AttachmentCreateInput,
  AttachmentListResponse,
  AttachmentRecord,
  AttachmentUpdateInput,
} from "@/types/attachments";

type QueryValue = string | number | boolean | undefined | null;

export interface AttachmentsFilters {
  page?: number;
  limit?: number;
  search?: string;
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

function normalizeList(payload: unknown): AttachmentListResponse {
  if (Array.isArray(payload)) {
    return { data: payload as AttachmentRecord[] };
  }

  if (payload && typeof payload === "object") {
    const objectPayload = payload as {
      success?: boolean;
      data?:
        | AttachmentRecord[]
        | { data?: AttachmentRecord[]; meta?: AttachmentListResponse["meta"] };
      results?: AttachmentRecord[];
      meta?: AttachmentListResponse["meta"];
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

function buildFormData(values: AttachmentCreateInput | AttachmentUpdateInput) {
  const formData = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
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

export const attachmentsService = {
  async list(filters: AttachmentsFilters = {}): Promise<AttachmentListResponse> {
    const { data } = await apiClient.get(API_ENDPOINTS.ATTACHMENTS.LIST, {
      params: cleanParams(filters),
    });

    return normalizeList(data);
  },

  async retrieve(id: string | number): Promise<AttachmentRecord> {
    const { data } = await apiClient.get(API_ENDPOINTS.ATTACHMENTS.DETAIL(id));
    return normalizeDetail<AttachmentRecord>(data);
  },

  async create(values: AttachmentCreateInput): Promise<AttachmentRecord> {
    const formData = buildFormData(values);
    const { data } = await apiClient.post(
      API_ENDPOINTS.ATTACHMENTS.CREATE,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return normalizeDetail<AttachmentRecord>(data);
  },

  async update(
    id: string | number,
    values: AttachmentUpdateInput,
  ): Promise<AttachmentRecord> {
    const formData = buildFormData(values);
    const { data } = await apiClient.patch(
      API_ENDPOINTS.ATTACHMENTS.UPDATE(id),
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return normalizeDetail<AttachmentRecord>(data);
  },

  async remove(id: string | number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ATTACHMENTS.DELETE(id));
  },
};
