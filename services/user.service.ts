// ============================================================================
// PSR Platform — Service Layer: Users
// ============================================================================
// Contains ONLY data-fetching logic — no UI, no hooks, no state.
// Called by TanStack Query hooks in /hooks/.

import api from "@/lib/axios";
import { API_CONFIG } from "@/lib/config/api";
import { safeParse } from "@/utils/safe-parse";
import { UserSchema, UsersResponseSchema } from "@/schemas";
import type { User, FilterOptions, PaginatedResponse } from "@/lib/types";

// ─── GET /users ───────────────────────────────────────────────────────────────
export const getUsers = async (
  filters: FilterOptions = {},
  page = 1,
  pageSize = 10,
): Promise<PaginatedResponse<User>> => {
  const params = { ...filters, page, pageSize };
  const res = await api.get(API_CONFIG.endpoints.users.list, { params });
  return safeParse(UsersResponseSchema, res.data) as PaginatedResponse<User>;
};

// ─── GET /users/:id ───────────────────────────────────────────────────────────
export const getUserById = async (id: string): Promise<User> => {
  const res = await api.get(API_CONFIG.endpoints.users.detail(id));
  return safeParse(UserSchema, res.data.data ?? res.data) as User;
};

// ─── POST /users ──────────────────────────────────────────────────────────────
export const createUser = async (data: Partial<User>): Promise<User> => {
  const res = await api.post(API_CONFIG.endpoints.users.create, data);
  return safeParse(UserSchema, res.data.data ?? res.data) as User;
};

// ─── PATCH /users/:id ────────────────────────────────────────────────────────
export const updateUser = async (
  id: string,
  data: Partial<User>,
): Promise<User> => {
  const res = await api.patch(API_CONFIG.endpoints.users.update(id), data);
  return safeParse(UserSchema, res.data.data ?? res.data) as User;
};

// ─── DELETE /users/:id ───────────────────────────────────────────────────────
export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(API_CONFIG.endpoints.users.delete(id));
};
