// ============================================================================
// PSR Platform — Zod Domain Schemas
// ============================================================================
// Runtime validation schemas mirroring lib/types/index.ts interfaces.
// These guard API responses and form submissions against schema drift.

import { z } from "zod";

// ─── Shared primitives ────────────────────────────────────────────────────────

export const AttachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  size: z.number(),
  url: z.string().url(),
  uploadedAt: z.string(),
});

// ─── User ─────────────────────────────────────────────────────────────────────

export const UserRoleSchema = z.enum([
  "system_admin",
  "psr_officer",
  "leo_officer",
  "researcher",
  "roc_reviewer",
  "director",
  "institutional_partner",
]);

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  firstName: z.string(),
  lastName: z.string(),
  role: UserRoleSchema,
  institution: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  status: z.enum(["active", "inactive", "pending"]),
  avatar: z.string().url().optional(),
  image: z.union([z.string(), z.instanceof(Blob), z.undefined()]).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastLogin: z.string().optional(),
});

export const UsersResponseSchema = z.object({
  data: z.array(UserSchema),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const LoginResponseSchema = z.object({
  user: UserSchema,
  token: z.string(),
  refreshToken: z.string().optional(),
});

export const MeResponseSchema = z.object({
  user: UserSchema,
});

// ─── Proposals ────────────────────────────────────────────────────────────────

export const ProposalStatusSchema = z.enum([
  "draft",
  "submitted",
  "under_review",
  "revision_requested",
  "approved",
  "rejected",
  "contracted",
  "in_progress",
  "completed",
  "terminated",
]);

export const ProposalSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  status: ProposalStatusSchema,
  researchArea: z.string(),
  institution: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ProposalsListResponseSchema = z.object({
  data: z.array(ProposalSummarySchema),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

// ─── Calls for Proposals ──────────────────────────────────────────────────────

export const CallStatusSchema = z.enum([
  "draft",
  "open",
  "closing_soon",
  "closed",
  "cancelled",
]);

export const CallSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  status: CallStatusSchema,
  submissionDeadline: z.string(),
  createdAt: z.string(),
});

export const CallsListResponseSchema = z.object({
  data: z.array(CallSummarySchema),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

// ─── Notifications ────────────────────────────────────────────────────────────

export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  message: z.string(),
  type: z.enum(["info", "success", "warning", "error"]),
  link: z.string().optional(),
  read: z.boolean(),
  createdAt: z.string(),
});

export const NotificationsResponseSchema = z.object({
  data: z.array(NotificationSchema),
});

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export const DashboardStatsSchema = z.record(z.string(), z.unknown());

// ─── Export inferred types ────────────────────────────────────────────────────
export type UserSchemaType = z.infer<typeof UserSchema>;
export type ProposalSummaryType = z.infer<typeof ProposalSummarySchema>;
export type CallSummaryType = z.infer<typeof CallSummarySchema>;
export type NotificationSchemaType = z.infer<typeof NotificationSchema>;
export type LoginResponseType = z.infer<typeof LoginResponseSchema>;
