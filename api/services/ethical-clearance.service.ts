import { z } from "zod";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import type {
  EthicalClearance,
  EthicalClearanceCreateInput,
  EthicalClearanceDetailResponse,
  EthicalClearanceResponse,
} from "@/types/ethical-clearance";

export interface EthicalClearanceFilters {
  proposal?: number | string;
  status?: EthicalClearance["status"];
  search?: string;
  ordering?: string;
  clearance_type?: string;
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

  const response = unwrapData<EthicalClearanceResponse | EthicalClearance[]>(
    data,
  );

  if (Array.isArray(response)) {
    return { success: true, data: response };
  }

  return {
    success: response.success ?? true,
    data: response.data ?? [],
  };
}

export async function getEthicalClearance(
  id: number,
): Promise<EthicalClearance> {
  const { data } = await apiClient.get(API_ENDPOINTS.ETHICAL_CLEARANCES.DETAIL(id));
  const response = unwrapData<
    EthicalClearance | EthicalClearanceDetailResponse
  >(data);

  if (response && typeof response === "object" && "id" in response) {
    return response as EthicalClearance;
  }

  return (response as EthicalClearanceDetailResponse).data;
}

export async function createEthicalClearanceReview(
  input: EthicalClearanceCreateInput,
): Promise<EthicalClearance> {
  const formData = new FormData();

  formData.append("proposal", input.proposal.toString());
  formData.append("request_file", input.request_file);
  formData.append("clearance_type", input.clearance_type);
  formData.append("application_date", input.application_date);

  if (input.status) {
    formData.append("status", input.status);
  }

  if (input.clearance_file) {
    formData.append("clearance_file", input.clearance_file);
  }

  if (input.approval_date) {
    formData.append("approval_date", input.approval_date);
  }

  const { data } = await apiClient.post(API_ENDPOINTS.ETHICAL_CLEARANCES.CREATE, formData);
  const response = unwrapData<
    EthicalClearance | EthicalClearanceDetailResponse
  >(data);

  if (response && typeof response === "object" && "id" in response) {
    return response as EthicalClearance;
  }

  return (response as EthicalClearanceDetailResponse).data;
}
