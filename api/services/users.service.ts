// ============================================================================
// RPDMS — Service Layer: Users
// ============================================================================
// Rule ref: NEXTJS_FRONTEND_API_RULES.md §3.3
// Call chain: Hook → Service → apiClient → Proxy → Backend

import { z } from "zod";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

// ─── Zod Schemas ──────────────────────────────────────────────────────────────
export const UserSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  email: z.string().email(),
  firstName: z.string().nullable().optional().default(""),
  middleName: z.string().nullable().optional().default(null),
  lastName: z.string().nullable().optional().default(null),
  fullName: z.string().nullable().optional().default(""),
  phone: z.string().nullable().optional(),
  sex: z.string().nullable().optional(),
  title: z
    .object({
      id: z.union([z.string(), z.number()]).transform(Number),
      name: z.string(),
    })
    .nullable()
    .optional(),
  organizationType: z
    .object({
      id: z.union([z.string(), z.number()]).transform(Number),
      name: z.string(),
    })
    .nullable()
    .optional(),
  organization: z
    .object({
      id: z.union([z.string(), z.number()]).transform(Number),
      name: z.string(),
    })
    .nullable()
    .optional(),
  unit: z
    .object({
      id: z.union([z.string(), z.number()]).transform(Number),
      name: z.string(),
    })
    .nullable()
    .optional(),
  status: z.string().nullable().optional().default("Active"),
  enabled: z.boolean().optional().default(true),
  avatar: z.string().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().nullable().optional(),
  lastLogin: z.string().nullable().optional(),
  roles: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]).transform(Number),
        name: z.string(),
        slug: z.string().nullable().optional(),
      }),
    )
    .optional()
    .default([]),
  permissions: z.array(z.string()).optional().default([]),
  userPermissions: z
    .array(z.union([z.string(), z.number()]).transform(Number))
    .optional()
    .default([]),
});

const PaginatedUsersSchema = z.object({
  data: z.array(UserSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    })
    .optional(),
  pagination: z
    .object({
      page: z.number(),
      pageSize: z.number(),
      total: z.number(),
      totalPages: z.number(),
    })
    .optional(),
});

// ─── Types ────────────────────────────────────────────────────────────────────
export type User = z.infer<typeof UserSchema>;
export type PaginatedUsers = z.infer<typeof PaginatedUsersSchema>;

const ReviewerSelectorItemSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform((value) => Number(value)),
    fullName: z.string().nullable().optional().default(""),
    firstName: z.string().nullable().optional().default(""),
    middleName: z.string().nullable().optional().default(""),
    lastName: z.string().nullable().optional().default(""),
    email: z.string().email().optional().default(""),
    photoUrl: z.string().nullable().optional(),
    organization: z
      .object({
        name: z.string().optional().default(""),
      })
      .optional()
      .nullable(),
    organizationType: z
      .object({
        name: z.string().optional().default(""),
      })
      .optional()
      .nullable(),
    unit: z
      .object({
        name: z.string().optional().default(""),
      })
      .optional()
      .nullable(),
    title: z
      .object({
        name: z.string().optional().default(""),
      })
      .optional()
      .nullable(),
  })
  .passthrough();

const ReviewerSelectorListSchema = z.object({
  data: z.array(ReviewerSelectorItemSchema).optional().default([]),
  meta: z
    .object({
      page: z.number().optional().default(1),
      limit: z.number().optional().default(5),
      total: z.number().optional().default(0),
      totalPages: z.number().optional().default(1),
    })
    .optional()
    .default({ page: 1, limit: 5, total: 0, totalPages: 1 }),
});

export type ReviewerSelectorItem = z.infer<typeof ReviewerSelectorItemSchema>;
export type ReviewerSelectorList = z.infer<typeof ReviewerSelectorListSchema>;

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  limit?: number;
}

export interface AdminCreateUserPayload {
  email: string;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  sex?: string | null;
  title?: number | null;
  organization_type?: number | null;
  organization?: number | null;
  unit?: number | null;
  roles?: number[];
  permissions?: number[];
  password: string;
}

export interface AdminUpdateUserPayload {
  email?: string;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  sex?: string | null;
  title?: number | null;
  organization?: number | null;
  unit?: number | null;
  status?: string;
  enabled?: boolean;
  roles?: number[];
  permissions?: number[];
}

export interface ReviewerSelectorFilters {
  search?: string;
  page?: number;
  limit?: number;
  organization?: string | number;
  title?: string | number;
  unit?: string | number;
  organization_type?: string | number;
}

function normalizeReviewerSelectorResponse(payload: unknown) {
  const fallbackMeta = { page: 1, limit: 5, total: 0, totalPages: 1 };

  // Case 1: endpoint returns a raw array of reviewers
  if (Array.isArray(payload)) {
    return {
      data: payload,
      meta: {
        ...fallbackMeta,
        total: payload.length,
      },
    };
  }

  const obj = (payload ?? {}) as Record<string, unknown>;

  // Case 2: common shapes { data: [...] } or { results: [...] }
  const list = Array.isArray(obj.data)
    ? obj.data
    : Array.isArray(obj.results)
      ? obj.results
      : [];

  const rawMeta =
    (obj.meta as Record<string, unknown> | undefined) ??
    (obj.pagination as Record<string, unknown> | undefined) ??
    {};

  const page = Number(rawMeta.page ?? 1);
  const limit = Number(rawMeta.limit ?? rawMeta.pageSize ?? 5);
  const total = Number(rawMeta.total ?? list.length);
  const totalPages = Number(
    rawMeta.totalPages ??
      (limit > 0 ? Math.max(Math.ceil(total / limit), 1) : 1),
  );

  return {
    data: list,
    meta: {
      page: Number.isFinite(page) ? page : 1,
      limit: Number.isFinite(limit) ? limit : 5,
      total: Number.isFinite(total) ? total : list.length,
      totalPages: Number.isFinite(totalPages) ? totalPages : 1,
    },
  };
}

// ─── GET /users ───────────────────────────────────────────────────────────────
export async function getUsers(
  filters: UserFilters = {},
): Promise<PaginatedUsers> {
  const res = await apiClient.get(API_ENDPOINTS.USERS.ADMIN.LIST, {
    params: filters,
  });
  return PaginatedUsersSchema.parse(res.data?.data ? res.data : { data: [] });
}

// ─── GET /users/:id ───────────────────────────────────────────────────────────
export async function getUserById(id: string): Promise<User> {
  const res = await apiClient.get(API_ENDPOINTS.USERS.ADMIN.DETAIL(id));
  return UserSchema.parse(res.data?.data ?? res.data);
}

// ─── GET /users/selector ────────────────────────────────────────────────────
export async function getReviewerSelector(
  filters: ReviewerSelectorFilters = {},
): Promise<ReviewerSelectorList> {
  const cleanedParams: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      cleanedParams[key] = value;
    }
  }
  const res = await apiClient.get(API_ENDPOINTS.USERS.SELECTOR, {
    params: cleanedParams,
  });
  return ReviewerSelectorListSchema.parse(
    normalizeReviewerSelectorResponse(res.data),
  );
}

// ─── POST /users ──────────────────────────────────────────────────────────────
export async function createUser(data: AdminCreateUserPayload): Promise<User> {
  const res = await apiClient.post(API_ENDPOINTS.USERS.ADMIN.CREATE, data);
  return UserSchema.parse(res.data?.data ?? res.data);
}

// ─── PATCH /users/:id ─────────────────────────────────────────────────────────
export async function updateUser(
  id: string,
  data: AdminUpdateUserPayload,
): Promise<User> {
  const res = await apiClient.patch(API_ENDPOINTS.USERS.ADMIN.UPDATE(id), data);
  return UserSchema.parse(res.data?.data ?? res.data);
}

// ─── DELETE /users/:id ────────────────────────────────────────────────────────
export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.USERS.ADMIN.DELETE(id));
}
