// ============================================================================
// PSR Platform — Service Layer: Auth
// ============================================================================

import api from "@/lib/axios";
import { tokenStorage } from "@/lib/axios";
import { API_CONFIG } from "@/lib/config/api";
import { safeParse } from "@/utils/safe-parse";
import { LoginResponseSchema, MeResponseSchema } from "@/schemas";
import type { User, LoginCredentials, OTPVerification } from "@/lib/types";
import type { LoginResponseType } from "@/schemas";

// ─── POST /auth/login ────────────────────────────────────────────────────────
export const login = async (
  credentials: LoginCredentials,
): Promise<LoginResponseType> => {
  const res = await api.post(API_CONFIG.endpoints.auth.login, credentials);
  const parsed = safeParse(LoginResponseSchema, res.data);
  // Persist tokens
  tokenStorage.set(parsed.token);
  if (parsed.refreshToken) tokenStorage.setRefresh(parsed.refreshToken);
  return parsed;
};

// ─── POST /auth/logout ───────────────────────────────────────────────────────
export const logout = async (): Promise<void> => {
  try {
    await api.post(API_CONFIG.endpoints.auth.logout);
  } finally {
    tokenStorage.clear();
  }
};

// ─── GET /auth/me ────────────────────────────────────────────────────────────
export const getMe = async (): Promise<User> => {
  const res = await api.get(API_CONFIG.endpoints.auth.me);
  const parsed = safeParse(MeResponseSchema, res.data);
  return parsed.user as User;
};

// ─── POST /auth/request-otp ──────────────────────────────────────────────────
export const requestOtp = async (email: string): Promise<void> => {
  await api.post(API_CONFIG.endpoints.auth.requestOtp, { email });
};

// ─── POST /auth/verify-otp ───────────────────────────────────────────────────
export const verifyOtp = async (
  data: OTPVerification,
): Promise<LoginResponseType> => {
  const res = await api.post(API_CONFIG.endpoints.auth.verifyOtp, data);
  const parsed = safeParse(LoginResponseSchema, res.data);
  tokenStorage.set(parsed.token);
  if (parsed.refreshToken) tokenStorage.setRefresh(parsed.refreshToken);
  return parsed;
};
