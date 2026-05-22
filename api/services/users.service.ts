// ============================================================================
// PSR Platform — Service Layer: Users
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
  firstName: z.string().optional().default(""),
  lastName: z.string().optional().default(""),
  fullName: z.string().optional(),
  role: z.string(),
  status: z.string().optional(),
  phone: z.string().optional(),
  institution: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  avatar: z.string().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  lastLogin: z.string().optional(),
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
  const res = await apiClient.get(API_ENDPOINTS.USERS.LIST, {
    params: filters,
  });
  return PaginatedUsersSchema.parse(res.data);
}

// ─── GET /users/:id ───────────────────────────────────────────────────────────
export async function getUserById(id: string): Promise<User> {
  const res = await apiClient.get(API_ENDPOINTS.USERS.DETAIL(id));
  return UserSchema.parse(res.data?.data ?? res.data);
}

// ─── GET /users/selector ────────────────────────────────────────────────────
export async function getReviewerSelector(
  filters: ReviewerSelectorFilters = {},
): Promise<ReviewerSelectorList> {
  const res = await apiClient.get(API_ENDPOINTS.USERS.SELECTOR, {
    params: filters,
  });
  return ReviewerSelectorListSchema.parse(
    normalizeReviewerSelectorResponse(res.data),
  );
}

// ─── POST /users ──────────────────────────────────────────────────────────────
export async function createUser(data: Partial<User>): Promise<User> {
  const res = await apiClient.post(API_ENDPOINTS.USERS.CREATE, data);
  return UserSchema.parse(res.data?.data ?? res.data);
}

// ─── PATCH /users/:id ─────────────────────────────────────────────────────────
export async function updateUser(
  id: string,
  data: Partial<User>,
): Promise<User> {
  const res = await apiClient.patch(API_ENDPOINTS.USERS.UPDATE(id), data);
  return UserSchema.parse(res.data?.data ?? res.data);
}

// ─── DELETE /users/:id ────────────────────────────────────────────────────────
export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.USERS.DELETE(id));
}
