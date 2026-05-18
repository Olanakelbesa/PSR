// ============================================================================
// PSR Platform — Service Layer: Reference Data
// ============================================================================
// Rule ref: NEXTJS_FRONTEND_API_RULES.md §3.3
// Call chain: Hook → Service → apiClient → Proxy → Backend
// All lookup / dropdown data lives here.

import { z } from "zod";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

// ─── Shared Schema ────────────────────────────────────────────────────────────
const LookupItemSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  name: z.string(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

const LookupListSchema = z.object({
  data: z.array(LookupItemSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    })
    .optional(),
});

// ─── Thematic Area Schema ─────────────────────────────────────────────────────
const ThematicAreaSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  name: z.string(),
  description: z.string().optional(),
});

const ThematicAreasResponseSchema = z.object({
  success: z.boolean().optional(),
  data: z.array(ThematicAreaSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    })
    .optional(),
});

// ─── Types ────────────────────────────────────────────────────────────────────
export type LookupItem = z.infer<typeof LookupItemSchema>;
export type ThematicArea = z.infer<typeof ThematicAreaSchema>;

// ─── GET /v1/titles/ ──────────────────────────────────────────────────────────
export async function getTitles(): Promise<LookupItem[]> {
  const res = await apiClient.get(API_ENDPOINTS.REFERENCE.TITLES);
  const parsed = LookupListSchema.safeParse(res.data);
  return parsed.success ? parsed.data.data : [];
}

// ─── GET /v1/organizationtypes/ ───────────────────────────────────────────────
export async function getOrganizationTypes(): Promise<LookupItem[]> {
  const res = await apiClient.get(API_ENDPOINTS.REFERENCE.ORGANIZATION_TYPES);
  const parsed = LookupListSchema.safeParse(res.data);
  return parsed.success ? parsed.data.data : [];
}

// ─── GET /v1/units/ ───────────────────────────────────────────────────────────
export async function getUnits(): Promise<LookupItem[]> {
  const res = await apiClient.get(API_ENDPOINTS.REFERENCE.UNITS);
  const parsed = LookupListSchema.safeParse(res.data);
  return parsed.success ? parsed.data.data : [];
}

// ─── GET /v1/organizations/ ───────────────────────────────────────────────────
export async function getOrganizations(): Promise<LookupItem[]> {
  const res = await apiClient.get(API_ENDPOINTS.REFERENCE.ORGANIZATIONS);
  const parsed = LookupListSchema.safeParse(res.data);
  return parsed.success ? parsed.data.data : [];
}

// ─── GET /v1/policydocumenttypes/ ─────────────────────────────────────────────
export async function getPolicyDocumentTypes(): Promise<LookupItem[]> {
  const res = await apiClient.get(API_ENDPOINTS.REFERENCE.POLICY_DOCUMENT_TYPES);
  const parsed = LookupListSchema.safeParse(res.data);
  return parsed.success ? parsed.data.data : [];
}

// ─── GET /v1/thematicareas ────────────────────────────────────────────────────
export async function getThematicAreas(): Promise<ThematicArea[]> {
  const res = await apiClient.get(API_ENDPOINTS.REFERENCE.THEMATIC_AREAS);
  const parsed = ThematicAreasResponseSchema.safeParse(res.data);
  return parsed.success ? parsed.data.data : [];
}

// ─── GET /v1/team-member-roles ────────────────────────────────────────────────
export async function getTeamMemberRoles(): Promise<LookupItem[]> {
  const res = await apiClient.get(API_ENDPOINTS.REFERENCE.TEAM_MEMBER_ROLES);
  const parsed = LookupListSchema.safeParse(res.data);
  return parsed.success ? parsed.data.data : [];
}

// ─── GET /v1/proposal-types ───────────────────────────────────────────────────
export async function getProposalTypes(): Promise<LookupItem[]> {
  const res = await apiClient.get(API_ENDPOINTS.REFERENCE.PROPOSAL_TYPES);
  const parsed = LookupListSchema.safeParse(res.data);
  return parsed.success ? parsed.data.data : [];
}

// ─── GET /v1/subcalltypes ─────────────────────────────────────────────────────
export async function getSubCallTypes(): Promise<LookupItem[]> {
  const res = await apiClient.get(API_ENDPOINTS.REFERENCE.SUB_CALL_TYPES);
  const parsed = LookupListSchema.safeParse(res.data);
  return parsed.success ? parsed.data.data : [];
}

// ─── GET /v1/internal-users ───────────────────────────────────────────────────
export async function getInternalUsers(): Promise<LookupItem[]> {
  const res = await apiClient.get(API_ENDPOINTS.REFERENCE.INTERNAL_USERS);
  const parsed = LookupListSchema.safeParse(res.data);
  return parsed.success ? parsed.data.data : [];
}
