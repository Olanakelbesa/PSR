// ============================================================================
// RPDMS — Service Layer: Organizations & Organization Types
// ============================================================================

import { z } from "zod";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

function normalizeListResponse(payload: unknown) {
  const root = (payload ?? {}) as Record<string, unknown>;
  const data = Array.isArray(root.data) ? root.data : [];
  const rawMeta = (root.meta as Record<string, unknown> | undefined) ?? {};

  return {
    data,
    meta: {
      page: Number(rawMeta.page ?? 1),
      limit: Number(rawMeta.limit ?? (data.length || 25)),
      total: Number(rawMeta.total ?? data.length),
      totalPages: Number(
        rawMeta.totalPages ??
          rawMeta.total_pages ??
          (Number(rawMeta.limit) > 0
            ? Math.ceil(Number(rawMeta.total ?? data.length) / Number(rawMeta.limit))
            : 1),
      ),
    },
  };
}

function parseOrgType(value: unknown): number {
  if (value == null || value === "") return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (typeof value === "object" && value !== null && "id" in value) {
    return Number((value as { id: unknown }).id);
  }
  return 0;
}

function normalizeOrganization(raw: Record<string, unknown>) {
  return {
    id: Number(raw.id),
    name: String(raw.name ?? ""),
    orgType: parseOrgType(raw.orgType ?? raw.org_type),
    address: (raw.address as string | null | undefined) ?? null,
    organizationEmail:
      (raw.organizationEmail ?? raw.organization_email ?? null) as string | null,
    organizationWebsite:
      (raw.organizationWebsite ?? raw.organization_website ?? null) as string | null,
    description: (raw.description as string | null | undefined) ?? null,
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
    updatedAt: (raw.updatedAt ?? raw.updated_at ?? null) as string | null,
  };
}

function normalizeOrganizationType(raw: Record<string, unknown>) {
  return {
    id: Number(raw.id),
    name: String(raw.name ?? ""),
    code: String(raw.code ?? ""),
    description: (raw.description as string | null | undefined) ?? null,
  };
}

function parseOrganizationPayload(payload: unknown) {
  const root = (payload ?? {}) as Record<string, unknown>;
  const item = (root.data ?? payload) as Record<string, unknown>;
  return normalizeOrganization(item);
}

function parseOrganizationTypePayload(payload: unknown) {
  const root = (payload ?? {}) as Record<string, unknown>;
  const item = (root.data ?? payload) as Record<string, unknown>;
  return normalizeOrganizationType(item);
}

function toOrganizationWritePayload(
  input: CreateOrganizationInput | UpdateOrganizationInput,
) {
  const payload: Record<string, unknown> = {};

  if (input.name !== undefined) payload.name = input.name;
  if (input.orgType !== undefined) payload.org_type = Number(input.orgType);
  if (input.address !== undefined) payload.address = input.address || null;
  if (input.organizationEmail !== undefined) {
    payload.organization_email = input.organizationEmail || null;
  }
  if (input.organizationWebsite !== undefined) {
    payload.organization_website = input.organizationWebsite || null;
  }
  if (input.description !== undefined) payload.description = input.description || null;

  return payload;
}

function toOrganizationTypeWritePayload(
  input: CreateOrganizationTypeInput | UpdateOrganizationTypeInput,
) {
  const payload: Record<string, unknown> = {};

  if ("name" in input && input.name !== undefined) payload.name = input.name;
  if ("code" in input && input.code !== undefined) payload.code = input.code;
  if (input.description !== undefined) payload.description = input.description || null;

  return payload;
}

export const OrganizationSchema = z.object({
  id: z.number(),
  name: z.string(),
  orgType: z.number(),
  address: z.string().nullable().optional(),
  organizationEmail: z.string().nullable().optional(),
  organizationWebsite: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().nullable().optional(),
});

export const OrganizationTypeSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable().optional(),
});

export type Organization = z.infer<typeof OrganizationSchema>;
export type OrganizationType = z.infer<typeof OrganizationTypeSchema>;

export interface CreateOrganizationInput {
  name: string;
  orgType: number | string;
  address?: string;
  organizationEmail?: string;
  organizationWebsite?: string;
  description?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  orgType?: number | string;
  address?: string;
  organizationEmail?: string;
  organizationWebsite?: string;
  description?: string;
}

export interface CreateOrganizationTypeInput {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateOrganizationTypeInput {
  name?: string;
  code?: string;
  description?: string;
}

export async function getOrganizations(params?: {
  search?: string;
  limit?: number;
  page?: number;
  org_type?: string | number;
}) {
  const res = await apiClient.get(API_ENDPOINTS.REFERENCE.ORGANIZATIONS, {
    params,
  });
  const normalized = normalizeListResponse(res.data);
  return {
    data: z.array(OrganizationSchema).parse(
      normalized.data.map((item) =>
        normalizeOrganization(item as Record<string, unknown>),
      ),
    ),
    meta: normalized.meta,
  };
}

export async function getOrganization(id: string | number) {
  const res = await apiClient.get(
    `${API_ENDPOINTS.REFERENCE.ORGANIZATIONS}${id}/`,
  );
  return OrganizationSchema.parse(parseOrganizationPayload(res.data));
}

export async function createOrganization(
  input: CreateOrganizationInput,
): Promise<Organization> {
  const res = await apiClient.post(
    API_ENDPOINTS.REFERENCE.ORGANIZATIONS,
    toOrganizationWritePayload(input),
  );
  return OrganizationSchema.parse(parseOrganizationPayload(res.data));
}

export async function updateOrganization(
  id: string | number,
  input: UpdateOrganizationInput,
): Promise<Organization> {
  const res = await apiClient.patch(
    `${API_ENDPOINTS.REFERENCE.ORGANIZATIONS}${id}/`,
    toOrganizationWritePayload(input),
  );
  return OrganizationSchema.parse(parseOrganizationPayload(res.data));
}

export async function patchOrganization(
  id: string | number,
  input: Partial<UpdateOrganizationInput>,
): Promise<Organization> {
  return updateOrganization(id, input);
}

export async function deleteOrganization(id: string | number): Promise<void> {
  await apiClient.delete(`${API_ENDPOINTS.REFERENCE.ORGANIZATIONS}${id}/`);
}

export async function getOrganizationTypes(params?: {
  search?: string;
  limit?: number;
  page?: number;
}) {
  const res = await apiClient.get(
    API_ENDPOINTS.REFERENCE.ORGANIZATION_TYPES,
    { params },
  );
  const normalized = normalizeListResponse(res.data);
  return {
    data: z.array(OrganizationTypeSchema).parse(
      normalized.data.map((item) =>
        normalizeOrganizationType(item as Record<string, unknown>),
      ),
    ),
    meta: normalized.meta,
  };
}

export async function getOrganizationType(id: string | number) {
  const res = await apiClient.get(
    `${API_ENDPOINTS.REFERENCE.ORGANIZATION_TYPES}${id}/`,
  );
  return OrganizationTypeSchema.parse(parseOrganizationTypePayload(res.data));
}

export async function createOrganizationType(
  input: CreateOrganizationTypeInput,
): Promise<OrganizationType> {
  const res = await apiClient.post(
    API_ENDPOINTS.REFERENCE.ORGANIZATION_TYPES,
    toOrganizationTypeWritePayload(input),
  );
  return OrganizationTypeSchema.parse(parseOrganizationTypePayload(res.data));
}

export async function updateOrganizationType(
  id: string | number,
  input: UpdateOrganizationTypeInput,
): Promise<OrganizationType> {
  const res = await apiClient.patch(
    `${API_ENDPOINTS.REFERENCE.ORGANIZATION_TYPES}${id}/`,
    toOrganizationTypeWritePayload(input),
  );
  return OrganizationTypeSchema.parse(parseOrganizationTypePayload(res.data));
}

export async function patchOrganizationType(
  id: string | number,
  input: Partial<UpdateOrganizationTypeInput>,
): Promise<OrganizationType> {
  return updateOrganizationType(id, input);
}

export async function deleteOrganizationType(id: string | number): Promise<void> {
  await apiClient.delete(
    `${API_ENDPOINTS.REFERENCE.ORGANIZATION_TYPES}${id}/`,
  );
}
