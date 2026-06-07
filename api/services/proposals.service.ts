// ============================================================================
// RPDMS — Service Layer: Proposals
// ============================================================================
import { z } from "zod";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

function toCamelCase(key: string): string {
  return key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

function camelize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(camelize);
  }

  if (value && typeof value === "object" && value.constructor === Object) {
    return Object.entries(value).reduce<Record<string, unknown>>((acc, [key, rawValue]) => {
      const transformedValue = camelize(rawValue);
      acc[toCamelCase(key)] = transformedValue;
      acc[key] = rawValue;
      return acc;
    }, {});
  }

  return value;
}

function normalizeProposalPayload(payload: unknown): unknown {
  const data = payload as unknown;
  if (data === null || data === undefined) {
    return data;
  }
  const camelized = camelize(data);
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return {
      ...(data as Record<string, unknown>),
      ...(camelized as Record<string, unknown>),
    };
  }
  return camelized;
}

export const ProposalStatusSchema = z.enum([
  "draft",
  "submitted",
  "resubmitted",
  "under_review",
  "revision_requested",
  "revision_required",
  "approved",
  "rejected",
  "contracted",
  "in_progress",
  "completed",
  "terminated",
  "screening_under_review",
  "screening_approved",
  "screening_rejected",
]);

export const ScreeningStatusSchema = z.enum([
  "submitted",
  "screening_under_review",
  "screening_approved",
  "screening_rejected",
]);

export const ProposalSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string(),
  status: ProposalStatusSchema.optional(),
  callId: z.union([z.string(), z.number()]).transform(String).optional(),
  abstract: z.string().optional(),
  background: z.string().optional(),
  objectives: z.string().optional(),
  expectedOutcomes: z.string().optional(),
  institution: z.string().optional(),
  researchArea: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  submittedAt: z.string().optional(),
}).passthrough();

const ManagedProposalUserSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  email: z.string().email().optional(),
});

const ManagedProposalQueueItemSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  referenceNumber: z.string(),
  title: z.string(),
  shortAbstract: z.string().optional().default(""),
  thematicAreas: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]).transform(String),
        name: z.string(),
      }),
    )
    .optional()
    .default([]),
  receivingOffice: z
    .object({
      id: z.union([z.string(), z.number()]).transform(String),
      name: z.string(),
    })
    .optional()
    .nullable(),
  status: ProposalStatusSchema,
  call: z
    .object({
      id: z.union([z.string(), z.number()]).transform(String),
      title: z.string(),
    })
    .optional()
    .nullable(),
  Organization: z
    .object({
      id: z.union([z.string(), z.number()]).transform(String),
      name: z.string(),
    })
    .optional()
    .nullable(),
  Unit: z
    .object({
      id: z.union([z.string(), z.number()]).transform(String),
      name: z.string(),
    })
    .optional()
    .nullable(),
  submittedAt: z.string().optional(),
  proposalType: z
    .object({
      id: z.union([z.string(), z.number()]).transform(String),
      name: z.string(),
    })
    .optional()
    .nullable(),
  createdBy: ManagedProposalUserSchema.optional().nullable(),
});

const ManagedProposalTeamMemberSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  memberType: z.string().nullable().optional(),
  userType: z.string().nullable().optional(),
  organizationName: z.string().nullable().optional(),
  stakeholderName: z.string().nullable().optional(),
  position: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  member: z.union([z.string(), z.number()]).nullable().optional(),
  memberName: z.string().nullable().optional(),
  memberEmail: z.string().nullable().optional(),
  role: z.union([z.string(), z.number()]).nullable().optional(),
  roleName: z.string().nullable().optional(),
});

const ManagedProposalDetailSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  screeningId: z.union([z.string(), z.number()]).transform(String).optional(),
  referenceNumber: z.string().optional().default(""),
  title: z.string(),
  abstract: z.string().optional().default(""),
  keywords: z.array(z.string()).optional().default([]),
  thematicAreas: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]).transform(String),
        name: z.string(),
      }),
    )
    .default([]),
  receivingOffice: z
    .object({
      id: z.union([z.string(), z.number()]).transform(String),
      name: z.string(),
    })
    .optional()
    .nullable(),
  call: z
    .object({
      id: z.union([z.string(), z.number()]).transform(String),
      title: z.string(),
    })
    .optional()
    .nullable(),
  Organization: z
    .object({
      id: z.union([z.string(), z.number()]).transform(String),
      name: z.string(),
    })
    .optional()
    .nullable(),
  Unit: z
    .object({
      id: z.union([z.string(), z.number()]).transform(String),
      name: z.string(),
    })
    .optional()
    .nullable(),
  submittedAt: z.string().optional().nullable(),
  proposalType: z
    .object({
      id: z.union([z.string(), z.number()]).transform(String),
      name: z.string(),
    })
    .optional()
    .nullable(),
  subThematicArea: z
    .object({
      id: z.union([z.string(), z.number()]).transform(String),
      name: z.string(),
    })
    .optional()
    .nullable(),
  createdBy: ManagedProposalUserSchema.optional().nullable(),
  teamMembers: z.array(ManagedProposalTeamMemberSchema).optional().default([]),
  reviewHistory: z.unknown().nullable().optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  budgetRequested: z.string().optional().nullable(),
  proposalFile: z.string().nullable().optional(),
  updatedProposal: z.string().nullable().optional(),
  supportingDocs: z.unknown().nullable().optional(),
  version: z.number().optional().nullable(),
  resubmissionCount: z.number().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
  needsIrb: z.boolean().optional().nullable(),
  createdAt: z.string().optional().nullable(),
  firstSubmittedAt: z.string().optional().nullable(),
  lastSubmittedAt: z.string().optional().nullable(),
  signature: z.unknown().nullable().optional(),
  workflowState: z.string().optional().nullable(),
  status: ProposalStatusSchema,
}).passthrough();

const ProposalsListSchema = z.object({
  data: z.array(ProposalSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    })
    .optional(),
  pagination: z
    .object({
      page: z.number(),
      pageSize: z.number(),
      total: z.number(),
      totalPages: z.number(),
    })
    .optional(),
});

const ManagedProposalsListSchema = z.object({
  success: z.boolean().optional(),
  data: z.array(ManagedProposalQueueItemSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
      statistics: z
        .object({
          totalProposals: z.number(),
          approved: z.number(),
          underReview: z.number(),
          drafts: z.number(),
        })
        .optional(),
    })
    .optional(),
});

export type Proposal = z.infer<typeof ProposalSchema>;
export type ProposalStatus = z.infer<typeof ProposalStatusSchema>;
export type ScreeningStatus = z.infer<typeof ScreeningStatusSchema>;
export type ProposalsList = z.infer<typeof ProposalsListSchema>;
export type ManagedProposalQueueItem = z.infer<
  typeof ManagedProposalQueueItemSchema
>;
export type ManagedProposalDetail = z.infer<typeof ManagedProposalDetailSchema>;
export type ManagedProposalsList = z.infer<typeof ManagedProposalsListSchema>;

export interface ProposalFilters {
  page?: number;
  pageSize?: number;
  limit?: number;
  search?: string;
  status?: ProposalStatus;
  ordering?: string;
  Organization?: number;
  Unit?: number;
  call?: number;
  receiving_office?: number;
}

export async function getProposals(
  filters: ProposalFilters = {},
): Promise<ProposalsList> {
  const res = await apiClient.get(API_ENDPOINTS.PROPOSALS.LIST, {
    params: filters,
  });
  return ProposalsListSchema.parse(normalizeProposalPayload(res.data));
}

export async function getManagedProposals(
  filters: ProposalFilters = {},
): Promise<ManagedProposalsList> {
  const res = await apiClient.get(API_ENDPOINTS.PROPOSALS.MANAGE, {
    params: filters,
  });
  return ManagedProposalsListSchema.parse(normalizeProposalPayload(res.data));
}

export async function getProposalById(id: string): Promise<Proposal> {
  const res = await apiClient.get(API_ENDPOINTS.PROPOSALS.DETAIL(id));
  const payload = normalizeProposalPayload(res.data?.data ?? res.data);
  return ProposalSchema.parse(payload);
}

export async function getManagedProposalById(
  id: string | number,
): Promise<ManagedProposalDetail> {
  const res = await apiClient.get(API_ENDPOINTS.PROPOSALS.MANAGE_DETAIL(id));
  const payload = normalizeProposalPayload(res.data?.data ?? res.data);
  return ManagedProposalDetailSchema.parse(payload);
}

export async function createProposal(
  data: Partial<Proposal>,
): Promise<Proposal> {
  const res = await apiClient.post(API_ENDPOINTS.PROPOSALS.CREATE, data);
  return ProposalSchema.parse(normalizeProposalPayload(res.data?.data ?? res.data));
}

export async function updateProposal(
  id: string,
  data: Partial<Proposal>,
): Promise<Proposal> {
  const res = await apiClient.patch(API_ENDPOINTS.PROPOSALS.UPDATE(id), data);
  return ProposalSchema.parse(normalizeProposalPayload(res.data?.data ?? res.data));
}

export async function submitProposal(id: string): Promise<Proposal> {
  const res = await apiClient.post(API_ENDPOINTS.PROPOSALS.SUBMIT(id), {});
  return ProposalSchema.parse(normalizeProposalPayload(res.data?.data ?? res.data));
}

export async function assignReviewers(
  id: string,
  reviewerIds: string[],
): Promise<void> {
  await apiClient.post(API_ENDPOINTS.PROPOSALS.ASSIGN_REVIEWERS(id), {
    reviewerIds,
  });
}

export async function submitReview(
  id: string,
  reviewData: Record<string, unknown>,
): Promise<void> {
  await apiClient.post(API_ENDPOINTS.PROPOSALS.REVIEWS(id), reviewData);
}
