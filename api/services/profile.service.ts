// ============================================================================
// RPDMS — Service Layer: Current User Profile
// ============================================================================

import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import { UserSchema, type User } from "@/api/services/users.service";

export type CurrentUser = User;

export interface UpdateProfilePayload {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  sex?: string | null;
  title?: number | null;
  organizationType?: number | null;
  organization?: number | null;
  unit?: number | null;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const res = await apiClient.get(API_ENDPOINTS.USERS.ME);
  return UserSchema.parse(res.data?.data ?? res.data);
}

export async function updateCurrentUser(
  payload: UpdateProfilePayload,
): Promise<CurrentUser> {
  const res = await apiClient.patch(API_ENDPOINTS.USERS.ME, payload);
  return UserSchema.parse(res.data?.data ?? res.data);
}
