import { z } from "zod";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import type {
  GrantCall,
  GrantCallListResponse,
  GrantCallWriteInput,
} from "@/types/grant-call";

const GrantCallProposalTypeSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  name: z.string(),
});

const GrantCallSettingsSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  allowedSubmissionOffices: z.array(z.union([z.string(), z.number()])),
  revieweeStartDate: z.string().nullable().optional(),
  revieweeClosingDate: z.string().nullable().optional(),
  requirePeerReview: z.boolean().optional(),
  requireCommitteeReview: z.boolean().optional(),
  firstLevelScreeningResultCheck: z.boolean().optional(),
  reviewResultCheck: z.boolean().optional(),
});

const GrantCallInstallmentPlanSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  installmentNumber: z.number(),
  percentage: z.string(),
  installmentAmount: z.union([z.number(), z.string()]).nullable().optional(),
});

const GrantCallSchema: z.ZodType<GrantCall> = z
  .object({
    id: z.union([z.string(), z.number()]).transform(String),
    title: z.string(),
    shortDescription: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    eligibilityCriteria: z.string().nullable().optional(),
    currentYear: z.string().nullable().optional(),
    budget: z.union([z.number(), z.string()]).nullable().optional(),
    status: z.string().optional(),
    openDate: z.string().nullable().optional(),
    closeDate: z.string().nullable().optional(),
    thumbnailImage: z.string().nullable().optional(),
    bannerImage: z.string().nullable().optional(),
    proposalTypes: z.array(GrantCallProposalTypeSchema).optional(),
    settings: GrantCallSettingsSchema.nullable().optional(),
    installmentPlans: z.array(GrantCallInstallmentPlanSchema).optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

const GrantCallListMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
  statistics: z
    .object({
      totalCalls: z.number(),
      openCalls: z.number(),
      closedCalls: z.number(),
    })
    .optional(),
});

const GrantCallListResponseSchema: z.ZodType<GrantCallListResponse> = z
  .object({
    data: z.array(GrantCallSchema),
    meta: GrantCallListMetaSchema.optional(),
  })
  .passthrough();

export type GrantCallListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  current_year?: string;
  proposal_types?: number;
  ordering?: string;
};

function appendFormData(formData: FormData, key: string, value: unknown): void {
  if (value === undefined || value === null) return;

  if (value instanceof File || value instanceof Blob) {
    formData.append(key, value);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      appendFormData(formData, `${key}[${index}]`, item);
    });
    return;
  }

  if (typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(
      ([nestedKey, nestedValue]) => {
        const nextKey = key.endsWith("]")
          ? `${key}${nestedKey}`
          : `${key}.${nestedKey}`;
        appendFormData(formData, nextKey, nestedValue);
      },
    );
    return;
  }

  formData.append(key, String(value));
}


function buildGrantCallPayload(payload: GrantCallWriteInput) {
  const hasFiles =
    payload.thumbnail_image instanceof File ||
    payload.banner_image instanceof File;

  if (!hasFiles) {
    return {
      body: payload,
      headers: undefined as Record<string, string> | undefined,
    };
  }

  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    appendFormData(formData, key, value);
  });

  return {
    body: formData,
    headers: { "Content-Type": "multipart/form-data" },
  };
}

export async function getGrantCalls(
  params: GrantCallListParams = {},
): Promise<GrantCallListResponse> {
  const { data } = await apiClient.get(API_ENDPOINTS.GRANT_CALLS.LIST, {
    params,
  });
  return GrantCallListResponseSchema.parse(data);
}

export async function getGrantCallById(
  id: string | number,
): Promise<GrantCall> {
  try {
    const { data } = await apiClient.get(API_ENDPOINTS.GRANT_CALLS.DETAIL(id));
    console.log("getGrantCallById response raw:", data);
    const parsed = GrantCallSchema.parse(data?.data ?? data);
    console.log("getGrantCallById parsed:", parsed);
    return parsed;
  } catch (err) {
    console.error("getGrantCallById error:", err);
    throw err;
  }
}

export async function createGrantCall(payload: GrantCallWriteInput) {
  const { budget: _budget, ...createPayload } = payload;
  const request = buildGrantCallPayload(createPayload as GrantCallWriteInput);
  const { data } = await apiClient.post(
    API_ENDPOINTS.GRANT_CALLS.LIST,
    request.body,
    request.headers ? { headers: request.headers } : undefined,
  );
  return GrantCallSchema.parse(data?.data ?? data);
}

export async function updateGrantCall(
  id: string | number,
  payload: Partial<GrantCallWriteInput>,
) {
  const request = buildGrantCallPayload(payload as GrantCallWriteInput);
  const { data } = await apiClient.patch(
    API_ENDPOINTS.GRANT_CALLS.DETAIL(id),
    request.body,
    request.headers ? { headers: request.headers } : undefined,
  );
  return GrantCallSchema.parse(data?.data ?? data);
}

export async function publishGrantCall(id: string | number) {
  const { data } = await apiClient.post(API_ENDPOINTS.GRANT_CALLS.PUBLISH(id));
  return GrantCallSchema.parse(data?.data ?? data);
}
