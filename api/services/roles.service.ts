// ============================================================================
// RPDMS — Service Layer: Roles & Permissions
// ============================================================================

import { z } from "zod";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

export const PermissionCategorySchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  order: z.number().optional(),
  isSystem: z.boolean().optional(),
  is_system: z.boolean().optional(),
});

const permissionIdSchema = z.union([
  z.number(),
  z.string().transform(Number),
  z.object({ id: z.union([z.string(), z.number()]).transform(Number) }).transform((o) => o.id),
]);

export const RoleSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(Number),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional().default(true),
  hasAllPermissions: z.boolean().optional().default(false),
  permissions: z.array(permissionIdSchema).optional().default([]),
  groups: z
    .array(z.union([z.string(), z.number()]).transform(Number))
    .optional()
    .default([]),
});

export const PermissionCatalogItemSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(Number),
  codename: z.string(),
  name: z.string(),
  appLabel: z.string().optional(),
  app_label: z.string().optional(),
});

export const PermissionCatalogSchema = z.object({
  categories: z.array(PermissionCategorySchema),
  permissionsByCategory: z.record(z.string(), z.array(PermissionCatalogItemSchema)),
});

const PaginatedRolesSchema = z.object({
  data: z.array(RoleSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number().optional(),
      total_pages: z.number().optional(),
    })
    .optional(),
});

export type Role = z.infer<typeof RoleSchema>;
export type PermissionCatalogItem = z.infer<typeof PermissionCatalogItemSchema>;
export type PermissionCategory = z.infer<typeof PermissionCategorySchema>;
export type PermissionCatalog = z.infer<typeof PermissionCatalogSchema>;

export interface RoleFilters {
  search?: string;
  page?: number;
  limit?: number;
  is_active?: boolean;
}

export interface CreateRolePayload {
  name: string;
  slug: string;
  description?: string | null;
  is_active?: boolean;
  has_all_permissions?: boolean;
  permissions?: number[];
}

export interface UpdateRolePayload {
  name?: string;
  slug?: string;
  description?: string | null;
  is_active?: boolean;
  has_all_permissions?: boolean;
  permissions?: number[];
}

function normalizeRolesResponse(payload: unknown) {
  const root = (payload ?? {}) as Record<string, unknown>;
  const data = Array.isArray(root.data) ? root.data : [];
  const rawMeta = (root.meta as Record<string, unknown> | undefined) ?? {};
  const totalPages =
    Number(rawMeta.totalPages ?? rawMeta.total_pages) ||
    (Number(rawMeta.total) && Number(rawMeta.limit)
      ? Math.ceil(Number(rawMeta.total) / Number(rawMeta.limit))
      : 1);

  return {
    data,
    meta: {
      page: Number(rawMeta.page ?? 1),
      limit: Number(rawMeta.limit ?? (data.length || 25)),
      total: Number(rawMeta.total ?? data.length),
      totalPages,
    },
  };
}

export async function getRoles(filters: RoleFilters = {}) {
  const res = await apiClient.get(API_ENDPOINTS.ROLES.LIST, { params: filters });
  const normalized = normalizeRolesResponse(res.data);
  return PaginatedRolesSchema.parse(normalized);
}

export async function getRoleById(id: string | number): Promise<Role> {
  const res = await apiClient.get(API_ENDPOINTS.ROLES.DETAIL(id));
  return RoleSchema.parse(res.data?.data ?? res.data);
}

export async function createRole(payload: CreateRolePayload): Promise<Role> {
  const res = await apiClient.post(API_ENDPOINTS.ROLES.CREATE, payload);
  return RoleSchema.parse(res.data?.data ?? res.data);
}

export async function updateRole(
  id: string | number,
  payload: UpdateRolePayload,
): Promise<Role> {
  const res = await apiClient.patch(API_ENDPOINTS.ROLES.UPDATE(id), payload);
  return RoleSchema.parse(res.data?.data ?? res.data);
}

export async function deleteRole(id: string | number): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.ROLES.DELETE(id));
}

export async function getPermissionCatalog(): Promise<PermissionCatalog> {
  const res = await apiClient.get(API_ENDPOINTS.PERMISSIONS.CATALOG);
  const raw = (res.data?.data ?? res.data) as Record<string, unknown>;
  const permissionsByCategory =
    raw.permissionsByCategory ??
    raw.permissions_by_category ??
    {};

  return PermissionCatalogSchema.parse({
    categories: raw.categories ?? [],
    permissionsByCategory,
  });
}
