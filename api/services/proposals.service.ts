// ============================================================================
// PSR Platform — Service Layer: Proposals
// ============================================================================
import { z } from "zod";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

export const ProposalStatusSchema = z.enum([
  "draft", "submitted", "under_review", "revision_requested",
  "approved", "rejected", "contracted", "in_progress", "completed", "terminated",
]);

export const ProposalSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string(),
  status: ProposalStatusSchema.optional(),
  callId: z.union([z.string(), z.number()]).transform(String).optional(),
  abstract: z.string().optional(),
  background: z.string().optional(),
  objectives: z.string().optional(),
  methodology: z.string().optional(),
  expectedOutcomes: z.string().optional(),
  institution: z.string().optional(),
  researchArea: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  submittedAt: z.string().optional(),
});

const ProposalsListSchema = z.object({
  data: z.array(ProposalSchema),
  meta: z.object({ page: z.number(), limit: z.number(), total: z.number(), totalPages: z.number() }).optional(),
  pagination: z.object({ page: z.number(), pageSize: z.number(), total: z.number(), totalPages: z.number() }).optional(),
});

export type Proposal = z.infer<typeof ProposalSchema>;
export type ProposalStatus = z.infer<typeof ProposalStatusSchema>;
export type ProposalsList = z.infer<typeof ProposalsListSchema>;

export interface ProposalFilters {
  page?: number; pageSize?: number; search?: string; status?: ProposalStatus;
}

export async function getProposals(filters: ProposalFilters = {}): Promise<ProposalsList> {
  const res = await apiClient.get(API_ENDPOINTS.PROPOSALS.LIST, { params: filters });
  return ProposalsListSchema.parse(res.data);
}

export async function getProposalById(id: string): Promise<Proposal> {
  const res = await apiClient.get(API_ENDPOINTS.PROPOSALS.DETAIL(id));
  return ProposalSchema.parse(res.data?.data ?? res.data);
}

export async function createProposal(data: Partial<Proposal>): Promise<Proposal> {
  const res = await apiClient.post(API_ENDPOINTS.PROPOSALS.CREATE, data);
  return ProposalSchema.parse(res.data?.data ?? res.data);
}

export async function updateProposal(id: string, data: Partial<Proposal>): Promise<Proposal> {
  const res = await apiClient.patch(API_ENDPOINTS.PROPOSALS.UPDATE(id), data);
  return ProposalSchema.parse(res.data?.data ?? res.data);
}

export async function submitProposal(id: string): Promise<Proposal> {
  const res = await apiClient.post(API_ENDPOINTS.PROPOSALS.SUBMIT(id), {});
  return ProposalSchema.parse(res.data?.data ?? res.data);
}

export async function assignReviewers(id: string, reviewerIds: string[]): Promise<void> {
  await apiClient.post(API_ENDPOINTS.PROPOSALS.ASSIGN_REVIEWERS(id), { reviewerIds });
}

export async function submitReview(id: string, reviewData: Record<string, unknown>): Promise<void> {
  await apiClient.post(API_ENDPOINTS.PROPOSALS.REVIEWS(id), reviewData);
}
