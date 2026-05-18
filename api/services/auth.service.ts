// ============================================================================
// PSR Platform — Service Layer: Auth
// ============================================================================
// Rule ref: NEXTJS_FRONTEND_API_RULES.md §3.3
// Call chain: Hook → Service → apiClient → Proxy → Backend
// This file contains ONLY data-fetching logic — no UI, no hooks, no state.

import { z } from "zod";
import apiClient, { tokenStorage } from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

// ─── Zod Schemas ──────────────────────────────────────────────────────────────
const UserSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  fullName: z.string().optional(),
  role: z.string(),
  status: z.string().optional(),
  photoUrl: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const LoginResponseSchema = z.object({
  token: z.string(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  user: UserSchema,
});

// ─── Types ────────────────────────────────────────────────────────────────────
export type AuthUser = z.infer<typeof UserSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface OTPVerification {
  email: string;
  otp: string;
}

// ─── POST /auth/login ─────────────────────────────────────────────────────────
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const res = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
  const parsed = LoginResponseSchema.parse(res.data);
  const token = parsed.token ?? parsed.accessToken ?? "";
  tokenStorage.set(token);
  if (parsed.refreshToken) tokenStorage.setRefresh(parsed.refreshToken);
  return parsed;
}

// ─── POST /auth/logout ────────────────────────────────────────────────────────
export async function logout(): Promise<void> {
  try {
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
  } finally {
    tokenStorage.clear();
  }
}

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
export async function getMe(): Promise<AuthUser> {
  const res = await apiClient.get(API_ENDPOINTS.AUTH.ME);
  const data = res.data?.user ?? res.data;
  return UserSchema.parse(data);
}

// ─── POST /auth/request-otp ───────────────────────────────────────────────────
export async function requestOtp(email: string): Promise<void> {
  await apiClient.post(API_ENDPOINTS.AUTH.REQUEST_OTP, { email });
}

// ─── POST /auth/verify-otp ────────────────────────────────────────────────────
export async function verifyOtp(data: OTPVerification): Promise<LoginResponse> {
  const res = await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_OTP, data);
  const parsed = LoginResponseSchema.parse(res.data);
  const token = parsed.token ?? parsed.accessToken ?? "";
  tokenStorage.set(token);
  if (parsed.refreshToken) tokenStorage.setRefresh(parsed.refreshToken);
  return parsed;
}
