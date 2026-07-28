import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import type {
  ProtocolAttachmentRecord,
  ProtocolCreateInput,
  ProtocolFilters,
  ProtocolListResponse,
  ProtocolRecord,
  ProtocolReviewInput,
  ProtocolUpdateInput,
} from "@/types/protocol";

function cleanParams(filters: ProtocolFilters) {
  const mapped: Record<string, unknown> = {};
  if (filters.page !== undefined) mapped.page = filters.page;
  if (filters.limit !== undefined) mapped.limit = filters.limit;
  if (filters.search) mapped.search = filters.search;
  if (filters.proposal !== undefined) mapped.proposal = filters.proposal;
  if (filters.status) mapped.status = filters.status;
  if (filters.hasProtocolFile !== undefined) mapped.has_protocol_file = filters.hasProtocolFile;
  if (filters.hasOtherDocument !== undefined) mapped.has_other_document = filters.hasOtherDocument;
  if (filters.ordering) mapped.ordering = filters.ordering;
  return mapped;
}

function normalizeAttachment(item: Record<string, unknown>): ProtocolAttachmentRecord {
  return {
    id: Number(item.id),
    file: String(item.file || item.file_url || item.fileUrl || ""),
    fileUrl: (item.fileUrl ?? item.file_url ?? item.file) as string | null,
    file_url: (item.file_url ?? item.fileUrl ?? item.file) as string | null,
    filename: String(item.filename || (item.file ? String(item.file).split("/").pop() : "Attachment")),
    fileSize: (item.fileSize ?? item.file_size) as number | null,
    file_size: (item.file_size ?? item.fileSize) as number | null,
    uploadedAt: (item.uploadedAt ?? item.uploaded_at) as string | undefined,
    uploaded_at: (item.uploaded_at ?? item.uploadedAt) as string | undefined,
  };
}

function normalizeProtocol(item: Record<string, unknown>): ProtocolRecord {
  const rawAttachments = Array.isArray(item.attachments) ? item.attachments : [];
  const attachments = rawAttachments.map((a) => normalizeAttachment(a as Record<string, unknown>));

  return {
    id: Number(item.id),
    proposal: Number(item.proposal),
    proposalTitle: (item.proposalTitle ?? item.proposal_title) as string | null,
    proposal_title: (item.proposal_title ?? item.proposalTitle) as string | null,
    referenceNumber: (item.referenceNumber ?? item.reference_number) as string | null,
    reference_number: (item.reference_number ?? item.referenceNumber) as string | null,
    proposalShortAbstract: (item.proposalShortAbstract ?? item.proposal_short_abstract) as string | null,
    proposal_short_abstract: (item.proposal_short_abstract ?? item.proposalShortAbstract) as string | null,
    proposalInstitution: (item.proposalInstitution ?? item.proposal_institution) as string | null,
    proposal_institution: (item.proposal_institution ?? item.proposalInstitution) as string | null,
    proposalFile: (item.proposalFile ?? item.proposal_file) as string | null,
    proposal_file: (item.proposal_file ?? item.proposalFile) as string | null,

    protocolFile: (item.protocolFile ?? item.protocol_file) as string | null,
    protocol_file: (item.protocol_file ?? item.protocolFile) as string | null,
    otherDocument: (item.otherDocument ?? item.other_document) as string | null,
    other_document: (item.other_document ?? item.otherDocument) as string | null,
    attachments,

    uploadedBy: (item.uploadedBy ?? item.uploaded_by) as number | null,
    uploaded_by: (item.uploaded_by ?? item.uploadedBy) as number | null,
    uploadedByName: (item.uploadedByName ?? item.uploaded_by_name) as string | null,
    uploaded_by_name: (item.uploaded_by_name ?? item.uploadedByName) as string | null,

    submittedBy: (item.submittedBy ?? item.submitted_by) as ProtocolRecord["submittedBy"],
    pi: (item.pi) as ProtocolRecord["pi"],

    status: (item.status as ProtocolRecord["status"]) || "pending_review",
    decisionRemarks: (item.decisionRemarks ?? item.decision_remarks) as string | null,
    decision_remarks: (item.decision_remarks ?? item.decisionRemarks) as string | null,

    reviewedBy: (item.reviewedBy ?? item.reviewed_by) as number | null,
    reviewed_by: (item.reviewed_by ?? item.reviewedBy) as number | null,
    reviewedByName: (item.reviewedByName ?? item.reviewed_by_name) as string | null,
    reviewed_by_name: (item.reviewed_by_name ?? item.reviewedByName) as string | null,

    reviewedAt: (item.reviewedAt ?? item.reviewed_at) as string | null,
    reviewed_at: (item.reviewed_at ?? item.reviewedAt) as string | null,

    approvalDate: (item.approvalDate ?? item.approval_date) as string | null,
    approval_date: (item.approval_date ?? item.approvalDate) as string | null,

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

  if (input.protocol_file) {
    formData.append("protocol_file", input.protocol_file);
  }

  if (input.other_document) {
    formData.append("other_document", input.other_document);
  }

  if (input.other_documents && input.other_documents.length > 0) {
    input.other_documents.forEach((file) => {
      formData.append("other_documents", file);
    });
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
  input: ProtocolUpdateInput,
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
  if (input.other_documents && input.other_documents.length > 0) {
    input.other_documents.forEach((file) => {
      formData.append("other_documents", file);
    });
  }
  if (input.remove_protocol_file) {
    formData.append("remove_protocol_file", "true");
  }
  if (input.remove_other_document) {
    formData.append("remove_other_document", "true");
  }
  if (input.remove_attachment_ids && input.remove_attachment_ids.length > 0) {
    formData.append("remove_attachment_ids", input.remove_attachment_ids.join(","));
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

export async function reviewProtocol(
  id: number,
  payload: ProtocolReviewInput,
): Promise<ProtocolRecord> {
  const { data } = await apiClient.post(
    API_ENDPOINTS.PROTOCOLS.REVIEW(id),
    payload,
  );
  const resData =
    data && typeof data === "object" && "data" in data
      ? (data as { data: Record<string, unknown> }).data
      : data;

  return normalizeProtocol(resData as Record<string, unknown>);
}

export async function deleteProtocol(id: string | number): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.PROTOCOLS.DETAIL(id));
}

export const protocolService = {
  list: getProtocols,
  getById: getProtocolById,
  create: createProtocol,
  update: updateProtocol,
  review: reviewProtocol,
  delete: deleteProtocol,
};
