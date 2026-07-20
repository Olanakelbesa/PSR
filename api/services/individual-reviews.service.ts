import { z } from "zod";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

const OrganizationSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(Number),
    name: z.string().optional().default(""),
  })
  .nullable()
  .optional();

const UnitSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(Number),
    name: z.string().optional().default(""),
  })
  .nullable()
  .optional();

const ProposalOwnerSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(Number),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    email: z.string().email().optional(),
  })
  .passthrough();

const ProposalDetailSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(Number),
    referenceNumber: z.string().optional().default(""),
    title: z.string().optional().default(""),
    shortAbstract: z.string().optional().default(""),
    thematicAreas: z
      .array(
        z.object({
          id: z.union([z.string(), z.number()]).transform(Number),
          name: z.string().optional().default(""),
        }),
      )
      .optional()
      .default([]),
    receivingOffice: OrganizationSchema,
    status: z.string().optional().default(""),
    call: z
      .object({
        id: z.union([z.string(), z.number()]).transform(Number),
        title: z.string().optional().default(""),
      })
      .nullable()
      .optional(),
    Organization: OrganizationSchema,
    Unit: UnitSchema,
    submittedAt: z.string().nullable().optional(),
    proposalType: z
      .object({
        id: z.union([z.string(), z.number()]).transform(Number),
        name: z.string().optional().default(""),
      })
      .nullable()
      .optional(),
    createdBy: ProposalOwnerSchema.nullable().optional(),
  })
  .passthrough();

const ScreeningDetailSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(Number),
    proposal: ProposalDetailSchema,
    status: z.string().optional().default(""),
    decisionRemarks: z.string().optional().default(""),
    createdAt: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
  })
  .passthrough();

const ReviewResponseSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(Number),
    question_id: z
      .union([z.string(), z.number()])
      .transform(Number)
      .nullable()
      .optional(),
    question: z
      .object({
        id: z.union([z.string(), z.number()]).transform(Number),
        text: z.string().optional().default(""),
        maxPoints: z.union([z.string(), z.number()]).transform(Number),
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
    points_earned: z.union([z.string(), z.number()]).transform(Number),
  })
  .passthrough();

const IndividualReviewDetailSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(Number),
    screening: ScreeningDetailSchema,
    comments: z.string().optional().default(""),
    attachment: z.string().nullable().optional(),
    responses: z.array(ReviewResponseSchema).optional().default([]),
    totalScore: z
      .union([z.string(), z.number()])
      .transform(Number)
      .optional()
      .default(0),
    reviewStatus: z.string().optional().default("pending_review"),
  })
  .passthrough();

const IndividualReviewSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(Number),
    screeningId: z.union([z.string(), z.number()]).transform(Number),
    proposalTypeId: z
      .union([z.string(), z.number()])
      .transform(Number)
      .nullable()
      .optional(),
    referenceNumber: z.string().optional().default(""),
    proposalTitle: z.string().optional().default(""),
    principalInvestigator: z.string().optional().default(""),
    organization: OrganizationSchema,
    unit: UnitSchema,
    proposalStatus: z.string().optional().default(""),
    submittedDate: z.string().nullable().optional(),
    reviewStatus: z.string().optional().default("pending_review"),
    comments: z.string().optional().default(""),
    attachment: z.string().nullable().optional(),
    totalScore: z.number().optional().default(0),
  })
  .passthrough();

const IndividualReviewsListSchema = z.object({
  success: z.boolean().optional(),
  data: z.array(IndividualReviewSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    })
    .optional(),
});

export type IndividualReview = z.infer<typeof IndividualReviewSchema>;
export type IndividualReviewsList = z.infer<typeof IndividualReviewsListSchema>;
export type IndividualReviewDetail = z.infer<
  typeof IndividualReviewDetailSchema
>;

export interface IndividualReviewFilters {
  all?: string;
  limit?: number;
  ordering?: string;
  page?: number;
  reviewer?: string | number;
  screening?: string | number;
  search?: string;
}

function normalizeListResponse(payload: unknown) {
  const fallbackMeta = { page: 1, limit: 10, total: 0, totalPages: 1 };

  if (Array.isArray(payload)) {
    return {
      data: payload,
      meta: {
        ...fallbackMeta,
        total: payload.length,
      },
    };
  }

  const obj = (payload ?? {}) as Record<string, unknown>;
  const data = Array.isArray(obj.data)
    ? obj.data
    : Array.isArray(obj.results)
      ? obj.results
      : [];
  const rawMeta =
    (obj.meta as Record<string, unknown> | undefined) ??
    (obj.pagination as Record<string, unknown> | undefined) ??
    {};

  const page = Number(rawMeta.page ?? 1);
  const limit = Number(rawMeta.limit ?? rawMeta.pageSize ?? 10);
  const total = Number(rawMeta.total ?? data.length);
  const totalPages = Number(
    rawMeta.totalPages ??
      rawMeta.total_pages ??
      (limit > 0 ? Math.max(Math.ceil(total / limit), 1) : 1),
  );

  return {
    data,
    meta: {
      page: Number.isFinite(page) ? page : 1,
      limit: Number.isFinite(limit) ? limit : 10,
      total: Number.isFinite(total) ? total : data.length,
      totalPages: Number.isFinite(totalPages) ? totalPages : 1,
    },
  };
}

export async function getIndividualReviews(
  filters: IndividualReviewFilters = {},
): Promise<IndividualReviewsList> {
  const res = await apiClient.get(API_ENDPOINTS.INDIVIDUAL_REVIEWS.LIST, {
    params: filters,
  });
  return IndividualReviewsListSchema.parse(normalizeListResponse(res.data));
}

export async function getIndividualReviewById(
  id: string | number,
): Promise<IndividualReviewDetail> {
  const res = await apiClient.get(API_ENDPOINTS.INDIVIDUAL_REVIEWS.DETAIL(id));
  const raw = res.data?.data ?? res.data;

  const safe = {
    ...raw,
    responses: (raw.responses ?? []).map((r: any) => ({
      id: r.id,
      question: r.question,
      // normalize backend field → frontend field
      question_id: r.question?.id,
      points_earned: r.pointsEarned ?? 0,
    })),
  };

  return IndividualReviewDetailSchema.parse(safe);
}

export interface ReviewQuestion {
  id: number;
  text: string;
  maxPoints: number;
  isActive: boolean;
  order: number;
  category: {
    id: number;
    name: string;
    proposalType: number;
  } | null;
  proposalType: {
    id: number;
    name: string;
    description: string;
  } | null;
}

export interface ReviewQuestionsResponse {
  success: boolean;
  data: ReviewQuestion[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IndividualReviewPayload {
  comments: string;
  attachment?: string | null;
  responses: Array<{
    question_id: number;
    points_earned: number;
  }>;
  screening?: number;
}

export async function getReviewQuestions(
  params?: Record<string, any>,
): Promise<ReviewQuestionsResponse> {
  const res = await apiClient.get(API_ENDPOINTS.REVIEW_QUESTIONS.LIST, {
    params,
  });
  return res.data;
}

export async function createIndividualReview(
  payload: IndividualReviewPayload,
): Promise<any> {
  const res = await apiClient.post(
    API_ENDPOINTS.INDIVIDUAL_REVIEWS.LIST,
    payload,
  );
  return res.data;
}

export async function updateIndividualReview(
  id: string | number,
  payload: Partial<IndividualReviewPayload>,
): Promise<any> {
  const res = await apiClient.patch(
    API_ENDPOINTS.INDIVIDUAL_REVIEWS.DETAIL(id),
    payload,
  );
  return res.data;
}
