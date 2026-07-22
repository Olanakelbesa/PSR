import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import type {
  EthicalClearance,
  EthicalClearanceCreateInput,
  EthicalClearanceDetailResponse,
  EthicalClearanceResponse,
  IRBClearanceStatus,
  IRBClearanceSubmitInput,
  IRBClearanceReviewInput,
  IRBClearanceType,
} from "@/types/ethical-clearance";

export interface EthicalClearanceFilters {
  proposal?: number | string;
  status?: IRBClearanceStatus;
  search?: string;
  ordering?: string;
  clearanceType?: number;
  needIrbEthicalClearance?: boolean;
  mine?: boolean;
}

function cleanParams(filters: EthicalClearanceFilters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => {
      if (value === undefined || value === null) return false;
      if (typeof value === "string") return value.trim().length > 0;
      return true;
    }),
  );
}

function unwrapData<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export async function getEthicalClearances(
  filters: EthicalClearanceFilters = {},
): Promise<EthicalClearanceResponse> {
  const { data } = await apiClient.get(API_ENDPOINTS.ETHICAL_CLEARANCES.LIST, {
    params: cleanParams(filters),
  });
  const raw = data as Record<string, unknown>;
  const response = raw.data as unknown;

  if (Array.isArray(response)) {
    return {
      success: true,
      data: response,
      meta: (raw.meta as EthicalClearanceResponse["meta"]) ?? undefined,
    };
  }
  const nested = response as EthicalClearanceResponse;
  return {
    success: nested.success ?? true,
    data: nested.data ?? [],
    meta: (raw.meta as EthicalClearanceResponse["meta"]) ?? undefined,
  };
}

export async function getEthicalClearance(id: number): Promise<EthicalClearance> {
  const { data } = await apiClient.get(API_ENDPOINTS.ETHICAL_CLEARANCES.DETAIL(id));
  const response = unwrapData<EthicalClearance | EthicalClearanceDetailResponse>(data);
  if (response && typeof response === "object" && "id" in response) {
    return response as EthicalClearance;
  }
  return (response as EthicalClearanceDetailResponse).data;
}

export async function createEthicalClearanceReview(
  input: EthicalClearanceCreateInput,
): Promise<EthicalClearance> {
  const { data } = await apiClient.post(API_ENDPOINTS.ETHICAL_CLEARANCES.CREATE, input);
  const response = unwrapData<EthicalClearance | EthicalClearanceDetailResponse>(data);
  if (response && typeof response === "object" && "id" in response) {
    return response as EthicalClearance;
  }
  return (response as EthicalClearanceDetailResponse).data;
}

export async function updateEthicalClearanceReview(
  id: number,
  input: Partial<EthicalClearanceCreateInput>,
): Promise<EthicalClearance> {
  const { data } = await apiClient.patch(
    API_ENDPOINTS.ETHICAL_CLEARANCES.UPDATE(id),
    input,
  );
  const response = unwrapData<EthicalClearance | EthicalClearanceDetailResponse>(data);
  if (response && typeof response === "object" && "id" in response) {
    return response as EthicalClearance;
  }
  return (response as EthicalClearanceDetailResponse).data;
}

export async function submitIRBClearance(
  id: number,
  input: IRBClearanceSubmitInput,
): Promise<EthicalClearance> {
  const formData = new FormData();
  if (input.clearanceTypeId !== undefined && input.clearanceTypeId !== null) {
    formData.append("clearance_type_id", input.clearanceTypeId.toString());
  }
  if (input.submissionNotes) {
    formData.append("submission_notes", input.submissionNotes);
  }
  if (input.clearanceFile) {
    formData.append("clearance_file", input.clearanceFile);
  }
  if (input.supportingDocuments && input.supportingDocuments.length > 0) {
    for (const file of input.supportingDocuments) {
      formData.append("supporting_documents", file);
    }
  }
  if (input.removedDocumentIds && input.removedDocumentIds.length > 0) {
    for (const docId of input.removedDocumentIds) {
      formData.append("removed_document_ids", docId.toString());
    }
  }
  const { data } = await apiClient.post(
    API_ENDPOINTS.ETHICAL_CLEARANCES.SUBMIT(id),
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  const response = unwrapData<EthicalClearance | EthicalClearanceDetailResponse>(data);
  if (response && typeof response === "object" && "id" in response) {
    return response as EthicalClearance;
  }
  return (response as EthicalClearanceDetailResponse).data;
}

export async function resubmitIRBClearance(
  id: number,
  input: IRBClearanceSubmitInput,
): Promise<EthicalClearance> {
  const formData = new FormData();
  if (input.clearanceTypeId !== undefined && input.clearanceTypeId !== null) {
    formData.append("clearance_type_id", input.clearanceTypeId.toString());
  }
  if (input.submissionNotes) {
    formData.append("submission_notes", input.submissionNotes);
  }
  if (input.clearanceFile) {
    formData.append("clearance_file", input.clearanceFile);
  }
  if (input.supportingDocuments && input.supportingDocuments.length > 0) {
    for (const file of input.supportingDocuments) {
      formData.append("supporting_documents", file);
    }
  }
  if (input.removedDocumentIds && input.removedDocumentIds.length > 0) {
    for (const docId of input.removedDocumentIds) {
      formData.append("removed_document_ids", docId.toString());
    }
  }
  const { data } = await apiClient.post(
    API_ENDPOINTS.ETHICAL_CLEARANCES.RESUBMIT(id),
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  const response = unwrapData<EthicalClearance | EthicalClearanceDetailResponse>(data);
  if (response && typeof response === "object" && "id" in response) {
    return response as EthicalClearance;
  }
  return (response as EthicalClearanceDetailResponse).data;
}

export async function updateDraftIRBClearance(
  id: number,
  input: IRBClearanceSubmitInput,
): Promise<EthicalClearance> {
  const formData = new FormData();
  if (input.clearanceTypeId !== undefined && input.clearanceTypeId !== null) {
    formData.append("clearance_type_id", input.clearanceTypeId.toString());
  }
  if (input.submissionNotes !== undefined) {
    formData.append("submission_notes", input.submissionNotes);
  }
  if (input.clearanceFile) {
    formData.append("clearance_file", input.clearanceFile);
  }
  if (input.supportingDocuments && input.supportingDocuments.length > 0) {
    for (const file of input.supportingDocuments) {
      formData.append("supporting_documents", file);
    }
  }
  if (input.removedDocumentIds && input.removedDocumentIds.length > 0) {
    for (const docId of input.removedDocumentIds) {
      formData.append("removed_document_ids", docId.toString());
    }
  }
  const { data } = await apiClient.post(
    API_ENDPOINTS.ETHICAL_CLEARANCES.UPDATE_DRAFT(id),
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  const response = unwrapData<EthicalClearance | EthicalClearanceDetailResponse>(data);
  if (response && typeof response === "object" && "id" in response) {
    return response as EthicalClearance;
  }
  return (response as EthicalClearanceDetailResponse).data;
}

export async function reviewIRBClearance(
  id: number,
  input: IRBClearanceReviewInput,
): Promise<EthicalClearance> {
  const { data } = await apiClient.post(
    API_ENDPOINTS.ETHICAL_CLEARANCES.REVIEW(id),
    input,
  );
  const response = unwrapData<EthicalClearance | EthicalClearanceDetailResponse>(data);
  if (response && typeof response === "object" && "id" in response) {
    return response as EthicalClearance;
  }
  return (response as EthicalClearanceDetailResponse).data;
}

export async function getIRBClearanceTypes(): Promise<IRBClearanceType[]> {
  const { data } = await apiClient.get(API_ENDPOINTS.IRB_CLEARANCE_TYPES.LIST);
  return unwrapData<IRBClearanceType[]>(data);
}
