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

export const RoleSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(Number),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    is_active: z.boolean().optional(),
    hasAllPermissions: z.boolean().optional(),
    has_all_permissions: z.boolean().optional(),
    permissions: z.array(permissionIdSchema).optional().default([]),
    groups: z
      .array(z.union([z.string(), z.number()]).transform(Number))
      .optional()
      .default([]),
    groupsDetail: z
      .array(
        z.object({
          id: z.number(),
          name: z.string(),
          permissions: z.array(permissionIdSchema).optional().default([]),
        })
      )
      .optional()
      .default([]),
  })
  .transform((val) => ({
    ...val,
    isActive: val.isActive ?? val.is_active ?? true,
    hasAllPermissions: val.hasAllPermissions ?? val.has_all_permissions ?? false,
  }));

export const GroupSchema = z.object({
  id: z.number(),
  name: z.string(),
  permissions: z.array(permissionIdSchema).optional().default([]),
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
export type Group = z.infer<typeof GroupSchema>;
export type PermissionCatalogItem = z.infer<typeof PermissionCatalogItemSchema>;
export type PermissionCategory = z.infer<typeof PermissionCategorySchema>;
export type PermissionCatalog = z.infer<typeof PermissionCatalogSchema>;

export interface GroupFilters {
  search?: string;
  page?: number;
  limit?: number;
}

const PaginatedGroupsSchema = z.object({
  data: z.array(GroupSchema),
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
  groups?: number[];
}

export interface UpdateRolePayload {
  name?: string;
  slug?: string;
  description?: string | null;
  is_active?: boolean;
  has_all_permissions?: boolean;
  permissions?: number[];
  groups?: number[];
}

export interface CreateGroupPayload {
  name: string;
  permissions?: number[];
}

export interface UpdateGroupPayload {
  name?: string;
  permissions?: number[];
}

function normalizeRolesResponse(payload: unknown) {
  const root = (payload ?? {}) as Record<string, unknown>;
  const list = Array.isArray(root.data)
    ? root.data
    : Array.isArray(root.results)
      ? root.results
      : [];
  
  const rawMeta = (root.meta as Record<string, unknown> | undefined) ?? root ?? {};
  
  const limit = Number(rawMeta.limit ?? 25);
  const total = Number(rawMeta.total ?? rawMeta.count ?? list.length);
  
  const totalPages =
    Number(rawMeta.totalPages ?? rawMeta.total_pages) ||
    (limit > 0 ? Math.ceil(total / limit) : 1);

  return {
    data: list,
    meta: {
      page: Number(rawMeta.page ?? 1),
      limit,
      total,
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

export async function getGroups(filters: GroupFilters = {}): Promise<{ data: Group[]; meta?: { page: number; limit: number; total: number; totalPages?: number; total_pages?: number } }> {
  const res = await apiClient.get(API_ENDPOINTS.GROUPS.LIST, { params: filters });
  // Since GroupViewSet is a DRF ModelViewSet, it's paginated
  const normalized = normalizeRolesResponse(res.data);
  return PaginatedGroupsSchema.parse(normalized);
}

export async function getGroupById(id: string | number): Promise<Group> {
  const res = await apiClient.get(API_ENDPOINTS.GROUPS.DETAIL(id));
  return GroupSchema.parse(res.data?.data ?? res.data);
}

export async function createGroup(payload: CreateGroupPayload): Promise<Group> {
  const res = await apiClient.post(API_ENDPOINTS.GROUPS.CREATE, payload);
  return GroupSchema.parse(res.data?.data ?? res.data);
}

export async function updateGroup(
  id: string | number,
  payload: UpdateGroupPayload,
): Promise<Group> {
  const res = await apiClient.patch(API_ENDPOINTS.GROUPS.UPDATE(id), payload);
  return GroupSchema.parse(res.data?.data ?? res.data);
}

export async function deleteGroup(id: string | number): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.GROUPS.DELETE(id));
}

