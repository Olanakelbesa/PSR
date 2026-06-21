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
  photo?: File | null;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const res = await apiClient.get(API_ENDPOINTS.USERS.ME);
  return UserSchema.parse(res.data?.data ?? res.data);
}

export async function updateCurrentUser(
  payload: UpdateProfilePayload,
): Promise<CurrentUser> {
  let isMultipart = false;
  
  if (payload.photo instanceof File) {
    isMultipart = true;
  }

  let dataToSend: any = payload;

  if (isMultipart) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined && value !== null) {
        formData.append(key, value instanceof File ? value : String(value));
      }
    }
    dataToSend = formData;
  }

  const res = await apiClient.patch(API_ENDPOINTS.USERS.ME, dataToSend);
  return UserSchema.parse(res.data?.data ?? res.data);
}

export async function changePassword(
  payload: ChangePasswordPayload,
): Promise<void> {
  await apiClient.post(API_ENDPOINTS.USERS.CHANGE_PASSWORD, payload);
}
