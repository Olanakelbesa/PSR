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

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

// ─── GET /users ───────────────────────────────────────────────────────────────
export async function getUsers(filters: UserFilters = {}): Promise<PaginatedUsers> {
  const res = await apiClient.get(API_ENDPOINTS.USERS.LIST, { params: filters });
  return PaginatedUsersSchema.parse(res.data);
}

// ─── GET /users/:id ───────────────────────────────────────────────────────────
export async function getUserById(id: string): Promise<User> {
  const res = await apiClient.get(API_ENDPOINTS.USERS.DETAIL(id));
  return UserSchema.parse(res.data?.data ?? res.data);
}

// ─── POST /users ──────────────────────────────────────────────────────────────
export async function createUser(data: Partial<User>): Promise<User> {
  const res = await apiClient.post(API_ENDPOINTS.USERS.CREATE, data);
  return UserSchema.parse(res.data?.data ?? res.data);
}

// ─── PATCH /users/:id ─────────────────────────────────────────────────────────
export async function updateUser(id: string, data: Partial<User>): Promise<User> {
  const res = await apiClient.patch(API_ENDPOINTS.USERS.UPDATE(id), data);
  return UserSchema.parse(res.data?.data ?? res.data);
}

// ─── DELETE /users/:id ────────────────────────────────────────────────────────
export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.USERS.DELETE(id));
}
