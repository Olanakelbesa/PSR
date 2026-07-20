// ============================================================================
// RPDMS — Service Layer: Screenings
// ============================================================================

import { z } from "zod";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import { ProposalStatusSchema } from "./proposals.service";

export const ScreeningStatusSchema = z.enum([
  "screening_under_review",
  "screening_approved",
  "screening_rejected",
]);

const ScreeningUserSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  email: z.string().email().optional(),
});

const ScreeningAssignedReviewerSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(Number),
    fullName: z.string().optional().default(""),
    email: z.string().email().optional().default(""),
    role: z.string().optional().default(""),
  })
  .passthrough();

const ScreeningTechnicalReviewResponseSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(Number),
    question: z
      .object({
        id: z.union([z.string(), z.number()]).transform(Number),
        text: z.string().optional().default(""),
        maxPoints: z
          .union([z.string(), z.number()])
          .transform(Number),
        category: z
          .object({
            id: z.union([z.string(), z.number()]).transform(Number),
            name: z.string().optional().default(""),
          })
          .nullable()
          .optional(),
      })
      .nullable()
      .optional(),
    pointsEarned: z
      .union([z.string(), z.number()])
      .transform(Number),
  })
  .passthrough();

const ScreeningTechnicalReviewSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(Number),
  reviewer: z
    .object({
      id: z.union([z.string(), z.number()]).transform(Number),
      fullName: z.string().nullable().optional(),
      email: z.string().nullable().optional(),
      photoUrl: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  comments: z.string().nullable().optional(),
  totalScore: z.number().nullable().optional(),
  attachment: z.string().nullable().optional(),
  hasResponses: z.boolean().optional().default(false),
  responses: z
    .array(ScreeningTechnicalReviewResponseSchema)
    .optional()
    .default([]),
  createdAt: z.string().nullable().optional(),
});

const ScreeningReviewHistorySchema = z.object({
  status: z.string().nullable().optional(),
  decisionRemarks: z.string().nullable().optional(),
  reviewedAt: z.string().nullable().optional(),
  technicalReviews: z
    .array(ScreeningTechnicalReviewSchema)
    .optional()
    .default([]),
});

const ScreeningProposalSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(String),
    referenceNumber: z.string().optional().default(""),
    title: z.string().optional().default("Untitled Proposal"),
    shortAbstract: z.string().optional().default(""),
    abstract: z.string().optional().default(""),
    keywords: z.array(z.string()).optional().default([]),
    statusDisplay: z.string().nullable().optional(),
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
    status: ProposalStatusSchema.optional(),
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
    createdBy: ScreeningUserSchema.optional().nullable(),
    teamMembers: z.array(z.record(z.string(), z.unknown())).optional().default([]),
    reviewHistory: ScreeningReviewHistorySchema.nullable().optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    budgetRequested: z.string().nullable().optional(),
    proposalFile: z.string().nullable().optional(),
    updatedProposal: z.string().nullable().optional(),
    supportingDocs: z.string().nullable().optional(),
    signature: z.string().nullable().optional(),
    version: z.number().nullable().optional(),
    resubmissionCount: z.number().nullable().optional(),
    workflowState: z.string().nullable().optional(),
    firstSubmittedAt: z.string().nullable().optional(),
    lastSubmittedAt: z.string().nullable().optional(),
    needsIrb: z.boolean().nullable().optional(),
    createdAt: z.string().nullable().optional(),
  })
  .passthrough();

const ScreeningProposalValueSchema = z
  .union([ScreeningProposalSchema, z.string(), z.number()])
  .transform((value) => {
    if (typeof value === "string" || typeof value === "number") {
      return {
        id: String(value),
        referenceNumber: "",
        title: "Untitled Proposal",
        shortAbstract: "",
        thematicAreas: [],
      };
    }

    return value;
  });

const ScreeningSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(String),
    individualReviewId: z
      .union([z.string(), z.number()])
      .transform(String)
      .nullable()
      .optional(),
    proposal: ScreeningProposalValueSchema,
    status: ScreeningStatusSchema,
    decisionRemarks: z.string().optional().default(""),
    assignedReviewersPresent: z.boolean().optional().default(false),
    assignedReviewersCount: z.number().optional().default(0),
    assignedReviewerIds: z
      .array(z.union([z.string(), z.number()]).transform(String))
      .optional()
      .default([]),
    assignedReviewers: z
      .array(ScreeningAssignedReviewerSchema)
      .optional()
      .default([]),
    reviewsCompletedCount: z.number().optional().default(0),
    averageScorePercentage: z.number().nullable().optional().default(null),
    maxPossiblePoints: z.number().optional().default(0),
    createdAt: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
  })
  .passthrough();

const ScreeningsListSchema = z.object({
  success: z.boolean().optional(),
  data: z.array(ScreeningSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    })
    .optional(),
});

const ApprovedPendingFundingPrincipalInvestigatorSchema = z.object({
  firstName: z.string().optional().default(""),
  lastName: z.string().optional().default(""),
  email: z.string().optional().default(""),
  phone: z.string().optional().default(""),
});

const ApprovedPendingFundingAttachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().nullable().optional().default(""),
  size: z.preprocess(
    (value) => (value == null || value === "" ? 0 : value),
    z.number(),
  ),
});

const FundingRecommendationSchema = z.object({
  id: z.number(),
  amount: z.number().nullable().optional(),
  amountInWords: z.string().nullable().optional(),
  hasEthicalClearanceApproval: z.boolean().nullable().optional(),
  comments: z.string().nullable().optional(),
  recommendedAt: z.string().nullable().optional(),
});

const ApprovedPendingFundingSchema = z
  .object({
    id: z.string(),
    title: z.string().optional().default("Untitled Proposal"),
    status: ScreeningStatusSchema,
    institution: z.string().optional().default(""),
    researchArea: z.string().optional().default(""),
    abstract: z.string().optional().default(""),
    background: z.string().optional().default(""),
    objectives: z.string().optional().default(""),
    methodology: z.string().optional().default(""),
    ethicalConsiderations: z.string().optional().default(""),
    principalInvestigator: ApprovedPendingFundingPrincipalInvestigatorSchema,
    coInvestigators: z
      .array(z.record(z.string(), z.unknown()))
      .optional()
      .default([]),
    budget: z
      .object({
        total: z.number().optional().default(0),
        currency: z.string().optional().default("ETB"),
      })
      .optional()
      .default({ total: 0, currency: "ETB" }),
    attachments: z.array(ApprovedPendingFundingAttachmentSchema).optional().default([]),
    submittedAt: z.string().optional().default(""),
    createdAt: z.string().optional().default(""),
    reviewStatus: z
      .object({
        technicalReview: z.string().optional().default(""),
        ethicsReview: z.string().nullable().optional().default(null),
        financialReview: z.string().optional().default(""),
      })
      .optional()
      .default({ technicalReview: "", ethicsReview: null, financialReview: "" }),
    fundingStatus: z
      .object({
        state: z.string().optional().default(""),
        decision: z.string().optional().default(""),
        approvedAmount: z.number().nullable().optional().default(null),
        remark: z.string().optional().default(""),
        id: z.number().optional(),
        needIrbEthicalClearance: z.boolean().optional().default(false),
        recommendations: z.array(FundingRecommendationSchema).optional().default([]),
        ethicalClearanceStatus: z.string().nullable().optional().default(null),
      })
      .optional()
      .default({
        state: "",
        decision: "",
        approvedAmount: null,
        remark: "",
        needIrbEthicalClearance: false,
        recommendations: [],
        ethicalClearanceStatus: null,
      }),
  })
  .passthrough();

export type ApprovedPendingFundingScreening = z.infer<
  typeof ApprovedPendingFundingSchema
>;

export type ScreeningProposalDetail = z.infer<typeof ScreeningProposalSchema>;
export type ScreeningTechnicalReviewResponse = z.infer<
  typeof ScreeningTechnicalReviewResponseSchema
>;
export type ScreeningTechnicalReview = z.infer<
  typeof ScreeningTechnicalReviewSchema
>;
export type ScreeningReviewHistory = z.infer<typeof ScreeningReviewHistorySchema>;
export type Screening = z.infer<typeof ScreeningSchema>;
export type ScreeningsList = z.infer<typeof ScreeningsListSchema>;
export type ScreeningStatus = z.infer<typeof ScreeningStatusSchema>;

export interface ScreeningFilters {
  proposal?: string | number;
  status?: ScreeningStatus;
  page?: number;
  limit?: number;
  ordering?: string;
  search?: string;
}

export interface ScreeningWritePayload {
  proposal: string | number;
  status: ScreeningStatus;
  decision_remarks?: string;
}

export interface AssignReviewersPayload {
  reviewer_ids: Array<string | number>;
}

const ScreeningAssignedReviewersSchema = z.object({
  screeningId: z.union([z.string(), z.number()]).transform(Number),
  status: ScreeningStatusSchema,
  reviewerIds: z
    .array(z.union([z.string(), z.number()]).transform(Number))
    .optional()
    .default([]),
  reviewers: z.array(ScreeningAssignedReviewerSchema).optional().default([]),
});

export type ScreeningAssignedReviewer = z.infer<
  typeof ScreeningAssignedReviewerSchema
>;
export type ScreeningAssignedReviewers = z.infer<
  typeof ScreeningAssignedReviewersSchema
>;

export async function getScreenings(
  filters: ScreeningFilters = {},
): Promise<ScreeningsList> {
  const res = await apiClient.get(API_ENDPOINTS.SCREENINGS.LIST, {
    params: filters,
  });
  return ScreeningsListSchema.parse(res.data);
}

export async function getScreeningById(
  id: string | number,
): Promise<Screening> {
  const res = await apiClient.get(API_ENDPOINTS.SCREENINGS.DETAIL(id));
  return ScreeningSchema.parse(res.data?.data ?? res.data);
}

export async function assignReviewers(
  screeningId: string | number,
  reviewerIds: Array<string | number>,
): Promise<unknown> {
  const res = await apiClient.post(
    API_ENDPOINTS.SCREENINGS.ASSIGN_REVIEWERS(screeningId),
    {
      reviewer_ids: reviewerIds,
    } satisfies AssignReviewersPayload,
  );
  return res.data?.data ?? res.data;
}

export async function getAssignedReviewers(
  screeningId: string | number,
): Promise<ScreeningAssignedReviewers> {
  const res = await apiClient.get(
    API_ENDPOINTS.SCREENINGS.ASSIGN_REVIEWERS(screeningId),
  );
  return ScreeningAssignedReviewersSchema.parse(res.data?.data ?? res.data);
}

export async function findScreeningByProposal(
  proposalId: string | number,
): Promise<Screening | null> {
  const res = await getScreenings({ proposal: proposalId, limit: 1 });
  return res.data[0] ?? null;
}

export async function createScreening(
  payload: ScreeningWritePayload,
): Promise<Screening> {
  const res = await apiClient.post(API_ENDPOINTS.SCREENINGS.LIST, payload);
  return ScreeningSchema.parse(res.data?.data ?? res.data);
}

export async function updateScreening(
  id: string | number,
  payload: ScreeningWritePayload,
): Promise<Screening> {
  const res = await apiClient.patch(
    API_ENDPOINTS.SCREENINGS.DETAIL(id),
    payload,
  );
  return ScreeningSchema.parse(res.data?.data ?? res.data);
}

export async function ensureScreeningForProposal(
  proposalId: string | number,
  payload: ScreeningWritePayload,
): Promise<Screening> {
  const existing = await findScreeningByProposal(proposalId);
  if (existing) {
    return updateScreening(existing.id, payload);
  }
  return createScreening(payload);
}

export async function getApprovedPendingFundingScreening(
  id: string | number,
): Promise<ApprovedPendingFundingScreening> {
  const res = await apiClient.get(
    API_ENDPOINTS.SCREENINGS.APPROVED_PENDING_FUNDING(id),
  );

  return ApprovedPendingFundingSchema.parse(res.data?.data ?? res.data);
}

export interface ReviewedWithMarksFilters {
  page?: number;
  limit?: number;
  ordering?: string;
  search?: string;
  proposal?: string | number;
  need_irb_ethical_clearance?: boolean;
  ethical_clearance_status?: string | null;
}

export async function getReviewedWithMarks(
  filters: ReviewedWithMarksFilters = {},
): Promise<unknown> {
  const res = await apiClient.get(API_ENDPOINTS.SCREENINGS.REVIEWED_WITH_MARKS, {
    params: filters,
  });

  // Return the raw response payload (contains success, data, meta)
  return res.data;
}

export interface ReviewHistoryEvent {
  action: string;
  timestamp: string;
  status: string;
  comment: string | null;
}

export interface ReviewHistory {
  review_timeline: ReviewHistoryEvent[];
}

export async function getReviewHistory(
  screeningId: string | number,
): Promise<ReviewHistory> {
  const res = await apiClient.get(
    API_ENDPOINTS.SCREENINGS.REVIEW_HISTORY(screeningId),
  );

  return res.data?.data ?? res.data;
}