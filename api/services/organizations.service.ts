// ============================================================================
// RPDMS — Service Layer: Organizations & Organization Types
// ============================================================================
// Rule ref: NEXTJS_FRONTEND_API_RULES.md §3.3
// Call chain: Hook → Service → apiClient → Proxy → Backend

import { z } from "zod";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

// ─── Zod Schemas ──────────────────────────────────────────────────────────────
export const OrganizationSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(Number),
  name: z.string(),
  orgType: z.union([z.string(), z.number()]).transform(Number),
  address: z.string().nullable().optional(),
  organizationEmail: z.string().email().nullable().optional(),
  organizationWebsite: z.string().url().nullable().optional(),
  description: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().nullable().optional(),
});

export const OrganizationTypeSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(Number),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable().optional(),
});

const PaginatedOrganizationsSchema = z.object({
  success: z.boolean().optional(),
  data: z.array(OrganizationSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    })
    .optional(),
});

const PaginatedOrganizationTypesSchema = z.object({
  success: z.boolean().optional(),
  data: z.array(OrganizationTypeSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    })
    .optional(),
});

// ─── Types ────────────────────────────────────────────────────────────────────
export type Organization = z.infer<typeof OrganizationSchema>;
export type OrganizationType = z.infer<typeof OrganizationTypeSchema>;
export type PaginatedOrganizations = z.infer<typeof PaginatedOrganizationsSchema>;
export type PaginatedOrganizationTypes = z.infer<typeof PaginatedOrganizationTypesSchema>;

// ─── Form Input Types ─────────────────────────────────────────────────────────
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

// ─── GET /v1/organizations/ ───────────────────────────────────────────────────
export async function getOrganizations(params?: {
  search?: string;
  limit?: number;
  page?: number;
  org_type?: string | number;
}) {
  const res = await apiClient.get(API_ENDPOINTS.REFERENCE.ORGANIZATIONS, {
    params,
  });
  const parsed = PaginatedOrganizationsSchema.safeParse(res.data);
  return {
    data: parsed.success ? parsed.data.data : [],
    meta: parsed.success ? parsed.data.meta : undefined,
  };
}

// ─── GET /v1/organizations/{id}/ ──────────────────────────────────────────────
export async function getOrganization(id: string | number) {
  const res = await apiClient.get(
    `${API_ENDPOINTS.REFERENCE.ORGANIZATIONS}${id}/`,
  );
  const parsed = z
    .object({
      success: z.boolean().optional(),
      data: OrganizationSchema.optional(),
    })
    .safeParse(res.data);

  if (parsed.success && parsed.data.data) {
    return parsed.data.data;
  }

  // Fallback: try direct parse as Organization
  const fallback = OrganizationSchema.safeParse(res.data);
  return fallback.success ? fallback.data : null;
}

// ─── POST /v1/organizations/ ──────────────────────────────────────────────────
export async function createOrganization(
  input: CreateOrganizationInput,
): Promise<Organization> {
  const payload = {
    name: input.name,
    orgType: Number(input.orgType),
    address: input.address || null,
    organizationEmail: input.organizationEmail || null,
    organizationWebsite: input.organizationWebsite || null,
    description: input.description || null,
  };

  const res = await apiClient.post(
    API_ENDPOINTS.REFERENCE.ORGANIZATIONS,
    payload,
  );

  const parsed = z
    .object({
      success: z.boolean().optional(),
      data: OrganizationSchema.optional(),
    })
    .safeParse(res.data);

  if (parsed.success && parsed.data.data) {
    return parsed.data.data;
  }

  const fallback = OrganizationSchema.safeParse(res.data);
  if (fallback.success) {
    return fallback.data;
  }

  throw new Error("Failed to parse create organization response");
}

// ─── PUT /v1/organizations/{id}/ ──────────────────────────────────────────────
export async function updateOrganization(
  id: string | number,
  input: UpdateOrganizationInput,
): Promise<Organization> {
  const payload: any = {};

  if (input.name !== undefined) payload.name = input.name;
  if (input.orgType !== undefined) payload.orgType = Number(input.orgType);
  if (input.address !== undefined) payload.address = input.address;
  if (input.organizationEmail !== undefined)
    payload.organizationEmail = input.organizationEmail;
  if (input.organizationWebsite !== undefined)
    payload.organizationWebsite = input.organizationWebsite;
  if (input.description !== undefined) payload.description = input.description;

  const res = await apiClient.put(
    `${API_ENDPOINTS.REFERENCE.ORGANIZATIONS}${id}/`,
    payload,
  );

  const parsed = z
    .object({
      success: z.boolean().optional(),
      data: OrganizationSchema.optional(),
    })
    .safeParse(res.data);

  if (parsed.success && parsed.data.data) {
    return parsed.data.data;
  }

  const fallback = OrganizationSchema.safeParse(res.data);
  if (fallback.success) {
    return fallback.data;
  }

  throw new Error("Failed to parse update organization response");
}

// ─── PATCH /v1/organizations/{id}/ ────────────────────────────────────────────
export async function patchOrganization(
  id: string | number,
  input: Partial<UpdateOrganizationInput>,
): Promise<Organization> {
  const payload: any = {};

  if (input.name !== undefined) payload.name = input.name;
  if (input.orgType !== undefined) payload.orgType = Number(input.orgType);
  if (input.address !== undefined) payload.address = input.address;
  if (input.organizationEmail !== undefined)
    payload.organizationEmail = input.organizationEmail;
  if (input.organizationWebsite !== undefined)
    payload.organizationWebsite = input.organizationWebsite;
  if (input.description !== undefined) payload.description = input.description;

  const res = await apiClient.patch(
    `${API_ENDPOINTS.REFERENCE.ORGANIZATIONS}${id}/`,
    payload,
  );

  const parsed = z
    .object({
      success: z.boolean().optional(),
      data: OrganizationSchema.optional(),
    })
    .safeParse(res.data);

  if (parsed.success && parsed.data.data) {
    return parsed.data.data;
  }

  const fallback = OrganizationSchema.safeParse(res.data);
  if (fallback.success) {
    return fallback.data;
  }

  throw new Error("Failed to parse patch organization response");
}

// ─── DELETE /v1/organizations/{id}/ ───────────────────────────────────────────
export async function deleteOrganization(id: string | number): Promise<void> {
  await apiClient.delete(`${API_ENDPOINTS.REFERENCE.ORGANIZATIONS}${id}/`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── ORGANIZATION TYPES ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET /v1/organizationtypes/ ───────────────────────────────────────────────
export async function getOrganizationTypes(params?: {
  search?: string;
  limit?: number;
  page?: number;
}) {
  const res = await apiClient.get(
    API_ENDPOINTS.REFERENCE.ORGANIZATION_TYPES,
    { params },
  );
  const parsed = PaginatedOrganizationTypesSchema.safeParse(res.data);
  return {
    data: parsed.success ? parsed.data.data : [],
    meta: parsed.success ? parsed.data.meta : undefined,
  };
}

// ─── GET /v1/organizationtypes/{id}/ ──────────────────────────────────────────
export async function getOrganizationType(id: string | number) {
  const res = await apiClient.get(
    `${API_ENDPOINTS.REFERENCE.ORGANIZATION_TYPES}${id}/`,
  );
  const parsed = z
    .object({
      success: z.boolean().optional(),
      data: OrganizationTypeSchema.optional(),
    })
    .safeParse(res.data);

  if (parsed.success && parsed.data.data) {
    return parsed.data.data;
  }

  const fallback = OrganizationTypeSchema.safeParse(res.data);
  return fallback.success ? fallback.data : null;
}

// ─── POST /v1/organizationtypes/ ──────────────────────────────────────────────
export async function createOrganizationType(
  input: CreateOrganizationTypeInput,
): Promise<OrganizationType> {
  const payload = {
    name: input.name,
    code: input.code,
    description: input.description || null,
  };

  const res = await apiClient.post(
    API_ENDPOINTS.REFERENCE.ORGANIZATION_TYPES,
    payload,
  );

  const parsed = z
    .object({
      success: z.boolean().optional(),
      data: OrganizationTypeSchema.optional(),
    })
    .safeParse(res.data);

  if (parsed.success && parsed.data.data) {
    return parsed.data.data;
  }

  const fallback = OrganizationTypeSchema.safeParse(res.data);
  if (fallback.success) {
    return fallback.data;
  }

  throw new Error("Failed to parse create organization type response");
}

// ─── PUT /v1/organizationtypes/{id}/ ──────────────────────────────────────────
export async function updateOrganizationType(
  id: string | number,
  input: UpdateOrganizationTypeInput,
): Promise<OrganizationType> {
  const payload: any = {};

  if (input.name !== undefined) payload.name = input.name;
  if (input.code !== undefined) payload.code = input.code;
  if (input.description !== undefined) payload.description = input.description;

  const res = await apiClient.put(
    `${API_ENDPOINTS.REFERENCE.ORGANIZATION_TYPES}${id}/`,
    payload,
  );

  const parsed = z
    .object({
      success: z.boolean().optional(),
      data: OrganizationTypeSchema.optional(),
    })
    .safeParse(res.data);

  if (parsed.success && parsed.data.data) {
    return parsed.data.data;
  }

  const fallback = OrganizationTypeSchema.safeParse(res.data);
  if (fallback.success) {
    return fallback.data;
  }

  throw new Error("Failed to parse update organization type response");
}

// ─── PATCH /v1/organizationtypes/{id}/ ────────────────────────────────────────
export async function patchOrganizationType(
  id: string | number,
  input: Partial<UpdateOrganizationTypeInput>,
): Promise<OrganizationType> {
  const payload: any = {};

  if (input.name !== undefined) payload.name = input.name;
  if (input.code !== undefined) payload.code = input.code;
  if (input.description !== undefined) payload.description = input.description;

  const res = await apiClient.patch(
    `${API_ENDPOINTS.REFERENCE.ORGANIZATION_TYPES}${id}/`,
    payload,
  );

  const parsed = z
    .object({
      success: z.boolean().optional(),
      data: OrganizationTypeSchema.optional(),
    })
    .safeParse(res.data);

  if (parsed.success && parsed.data.data) {
    return parsed.data.data;
  }

  const fallback = OrganizationTypeSchema.safeParse(res.data);
  if (fallback.success) {
    return fallback.data;
  }

  throw new Error("Failed to parse patch organization type response");
}

// ─── DELETE /v1/organizationtypes/{id}/ ───────────────────────────────────────
export async function deleteOrganizationType(id: string | number): Promise<void> {
  await apiClient.delete(
    `${API_ENDPOINTS.REFERENCE.ORGANIZATION_TYPES}${id}/`,
  );
}
