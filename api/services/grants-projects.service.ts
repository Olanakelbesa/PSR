// ============================================================================
// RPDMS — Service Layer: Grants & Projects
// ============================================================================
import { z } from "zod";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

// ─── Grants ───────────────────────────────────────────────────────────────────
const GrantSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string(),
  description: z.string().optional(),
  status: z.string().optional(),
  amount: z.number().optional(),
  currency: z.string().optional(),
  deadline: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const GrantsListSchema = z.object({
  data: z.array(GrantSchema),
  meta: z.object({ page: z.number(), limit: z.number(), total: z.number(), totalPages: z.number() }).optional(),
});

export type Grant = z.infer<typeof GrantSchema>;

export async function getGrants(params: Record<string, unknown> = {}): Promise<z.infer<typeof GrantsListSchema>> {
  const res = await apiClient.get(API_ENDPOINTS.GRANTS.LIST, { params });
  return GrantsListSchema.parse(res.data);
}

export async function getGrantById(id: string): Promise<Grant> {
  const res = await apiClient.get(API_ENDPOINTS.GRANTS.DETAIL(id));
  return GrantSchema.parse(res.data?.data ?? res.data);
}

export async function createGrant(data: Partial<Grant>): Promise<Grant> {
  const res = await apiClient.post(API_ENDPOINTS.GRANTS.CREATE, data);
  return GrantSchema.parse(res.data?.data ?? res.data);
}

export async function updateGrant(id: string, data: Partial<Grant>): Promise<Grant> {
  const res = await apiClient.patch(API_ENDPOINTS.GRANTS.UPDATE(id), data);
  return GrantSchema.parse(res.data?.data ?? res.data);
}

// ─── Projects ─────────────────────────────────────────────────────────────────
const ProjectSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string(),
  status: z.string().optional(),
  proposalId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.number().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const ProjectsListSchema = z.object({
  data: z.array(ProjectSchema),
  meta: z.object({ page: z.number(), limit: z.number(), total: z.number(), totalPages: z.number() }).optional(),
});

export type Project = z.infer<typeof ProjectSchema>;

export async function getProjects(params: Record<string, unknown> = {}): Promise<z.infer<typeof ProjectsListSchema>> {
  const res = await apiClient.get(API_ENDPOINTS.PROJECTS.LIST, { params });
  return ProjectsListSchema.parse(res.data);
}

export async function getProjectById(id: string): Promise<Project> {
  const res = await apiClient.get(API_ENDPOINTS.PROJECTS.DETAIL(id));
  return ProjectSchema.parse(res.data?.data ?? res.data);
}

export async function submitProgressReport(projectId: string, data: Record<string, unknown>): Promise<void> {
  await apiClient.post(API_ENDPOINTS.PROJECTS.SUBMIT_PROGRESS_REPORT(projectId), data);
}

export async function approveProgressReport(projectId: string, reportId: string): Promise<void> {
  await apiClient.post(API_ENDPOINTS.PROJECTS.APPROVE_PROGRESS_REPORT(projectId, reportId), {});
}
