// ============================================================================
// RPDMS — Service Layer: Auth
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

export type OtpPurpose = "registration" | "password_reset";

export type OtpUiIntent = "registration" | "password-reset";

/** Matches backend resend cooldown (OTPService.RESEND_COOLDOWN_SECONDS). */
export const RESEND_OTP_COOLDOWN_SECONDS = 60;

export interface ResendOtpResult {
  email: string;
  purpose: OtpPurpose;
  expiresInMinutes: number;
}

function unwrapEnvelope<T extends Record<string, unknown>>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    const inner = (payload as { data: unknown }).data;
    if (inner && typeof inner === "object") {
      return inner as T;
    }
  }
  return (payload ?? {}) as T;
}

export function toOtpPurpose(intent: OtpUiIntent): OtpPurpose {
  return intent === "password-reset" ? "password_reset" : "registration";
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

// ─── POST /register/verify ────────────────────────────────────────────────────
export async function verifyRegistrationOtp(
  data: OTPVerification,
): Promise<void> {
  await apiClient.post(API_ENDPOINTS.AUTH.REGISTER_VERIFY, data);
}

// ─── POST /password-reset/verify ──────────────────────────────────────────────
export async function verifyPasswordResetOtp(
  data: OTPVerification,
): Promise<void> {
  await apiClient.post(API_ENDPOINTS.AUTH.PASSWORD_RESET_VERIFY, data);
}

// ─── POST /otp/resend ─────────────────────────────────────────────────────────
export async function resendOtp(
  email: string,
  purpose: OtpPurpose,
): Promise<ResendOtpResult> {
  const res = await apiClient.post(API_ENDPOINTS.AUTH.RESEND_OTP, {
    email,
    purpose,
  });
  const payload = unwrapEnvelope<{
    email?: string;
    purpose?: OtpPurpose;
    expiresInMinutes?: number;
  }>(res.data);

  return {
    email: payload.email ?? email,
    purpose: payload.purpose ?? purpose,
    expiresInMinutes: payload.expiresInMinutes ?? 10,
  };
}

// ─── POST /auth/request-otp ───────────────────────────────────────────────────
export async function requestOtp(email: string): Promise<void> {
  await apiClient.post(API_ENDPOINTS.AUTH.REQUEST_OTP, { email });
}

// ─── POST /auth/verify-otp (legacy alias for password-reset verify) ───────────
export async function verifyOtp(data: OTPVerification): Promise<LoginResponse> {
  const res = await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_OTP, data);
  const parsed = LoginResponseSchema.parse(res.data);
  const token = parsed.token ?? parsed.accessToken ?? "";
  tokenStorage.set(token);
  if (parsed.refreshToken) tokenStorage.setRefresh(parsed.refreshToken);
  return parsed;
}
