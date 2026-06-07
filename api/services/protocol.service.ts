import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import type {
  ProtocolCreateInput,
  ProtocolFilters,
  ProtocolListResponse,
  ProtocolRecord,
} from "@/types/protocol";

function cleanParams(filters: ProtocolFilters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => {
      if (value === undefined || value === null) return false;
      if (typeof value === "string") return value.trim().length > 0;
      return true;
    }),
  );
}

function normalizeProtocol(item: Record<string, unknown>): ProtocolRecord {
  return {
    id: Number(item.id),
    proposal: Number(item.proposal),
    proposalTitle: (item.proposalTitle ?? item.proposal_title) as string | null,
    proposal_title: (item.proposal_title ?? item.proposalTitle) as string | null,
    referenceNumber: (item.referenceNumber ?? item.reference_number) as
      | string
      | null,
    reference_number: (item.reference_number ?? item.referenceNumber) as
      | string
      | null,
    protocolFile: (item.protocolFile ?? item.protocol_file) as string | null,
    protocol_file: (item.protocol_file ?? item.protocolFile) as string | null,
    otherDocument: (item.otherDocument ?? item.other_document) as string | null,
    other_document: (item.other_document ?? item.otherDocument) as string | null,
    uploadedBy: (item.uploadedBy ?? item.uploaded_by) as number | null,
    uploaded_by: (item.uploaded_by ?? item.uploadedBy) as number | null,
    uploadedByName: (item.uploadedByName ?? item.uploaded_by_name) as
      | string
      | null,
    uploaded_by_name: (item.uploaded_by_name ?? item.uploadedByName) as
      | string
      | null,
    createdAt: (item.createdAt ?? item.created_at) as string | undefined,
    created_at: (item.created_at ?? item.createdAt) as string | undefined,
    updatedAt: (item.updatedAt ?? item.updated_at) as string | undefined,
    updated_at: (item.updated_at ?? item.updatedAt) as string | undefined,
  };
}

function unwrapList(payload: unknown): ProtocolListResponse {
  if (payload && typeof payload === "object" && "data" in payload) {
    const envelope = payload as {
      success?: boolean;
      data: unknown;
      meta?: ProtocolListResponse["meta"];
    };

    const rows = Array.isArray(envelope.data)
      ? envelope.data.map((item) =>
          normalizeProtocol(item as Record<string, unknown>),
        )
      : [];

    return {
      success: envelope.success ?? true,
      data: rows,
      meta: envelope.meta,
    };
  }

  if (Array.isArray(payload)) {
    return {
      success: true,
      data: payload.map((item) =>
        normalizeProtocol(item as Record<string, unknown>),
      ),
    };
  }

  return { success: true, data: [] };
}

export async function getProtocols(
  filters: ProtocolFilters = {},
): Promise<ProtocolListResponse> {
  const { data } = await apiClient.get(API_ENDPOINTS.PROTOCOLS.LIST, {
    params: cleanParams(filters),
  });

  return unwrapList(data);
}

export async function getProtocolById(id: number): Promise<ProtocolRecord> {
  const { data } = await apiClient.get(API_ENDPOINTS.PROTOCOLS.DETAIL(id));
  const payload =
    data && typeof data === "object" && "data" in data
      ? (data as { data: Record<string, unknown> }).data
      : data;

  return normalizeProtocol(payload as Record<string, unknown>);
}

export async function createProtocol(
  input: ProtocolCreateInput,
): Promise<ProtocolRecord> {
  const formData = new FormData();
  formData.append("proposal", String(input.proposal));
  formData.append("protocol_file", input.protocol_file);

  if (input.other_document) {
    formData.append("other_document", input.other_document);
  }

  const { data } = await apiClient.post(
    API_ENDPOINTS.PROTOCOLS.CREATE,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  const payload =
    data && typeof data === "object" && "data" in data
      ? (data as { data: Record<string, unknown> }).data
      : data;

  return normalizeProtocol(payload as Record<string, unknown>);
}

export async function updateProtocol(
  id: number,
  input: Partial<ProtocolCreateInput>,
): Promise<ProtocolRecord> {
  const formData = new FormData();

  if (input.proposal !== undefined) {
    formData.append("proposal", String(input.proposal));
  }
  if (input.protocol_file) {
    formData.append("protocol_file", input.protocol_file);
  }
  if (input.other_document) {
    formData.append("other_document", input.other_document);
  }

  const { data } = await apiClient.patch(
    API_ENDPOINTS.PROTOCOLS.UPDATE(id),
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  const payload =
    data && typeof data === "object" && "data" in data
      ? (data as { data: Record<string, unknown> }).data
      : data;

  return normalizeProtocol(payload as Record<string, unknown>);
}

export const protocolService = {
  list: getProtocols,
  getById: getProtocolById,
  create: createProtocol,
  update: updateProtocol,
};
