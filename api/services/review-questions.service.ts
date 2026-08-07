// ============================================================================
// RPDMS — Service Layer: Proposal Review Evaluation Rubrics CRUD
// ============================================================================

import { z } from "zod";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

function extractObjId(val: any): number | string | null {
  if (val == null || val === "") return null;
  if (typeof val === "object" && val.id != null) return val.id;
  return val;
}

function extractObjName(val: any): string | null {
  if (val != null && typeof val === "object" && val.name != null) return val.name;
  return null;
}

export const ReviewQuestionCategorySchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(Number),
    name: z.string(),
    proposal_type: z.any().optional(),
    proposalType: z.any().optional(),
  })
  .transform((item) => ({
    ...item,
    proposal_type_id: extractObjId(item.proposal_type ?? item.proposalType),
    proposal_type_name: extractObjName(item.proposalType ?? item.proposal_type),
  }));

export type ReviewQuestionCategoryItem = z.infer<typeof ReviewQuestionCategorySchema>;

export const ReviewQuestionItemSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(Number),
    text: z.string(),
    category: z.any().optional(),
    category_name: z.string().nullable().optional(),
    proposal_type: z.any().optional(),
    proposalType: z.any().optional(),
    max_points: z.union([z.string(), z.number()]).nullable().optional(),
    maxPoints: z.union([z.string(), z.number()]).nullable().optional(),
    order: z.number().optional(),
    is_active: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .transform((item) => ({
    ...item,
    category_id: extractObjId(item.category),
    category_name: item.category_name ?? extractObjName(item.category),
    proposal_type_id: extractObjId(item.proposal_type ?? item.proposalType),
    proposal_type_name: extractObjName(item.proposalType ?? item.proposal_type),
    max_points: Number(item.max_points ?? item.maxPoints ?? 10),
    is_active: item.is_active ?? item.isActive ?? true,
  }));

export type ReviewQuestionItem = z.infer<typeof ReviewQuestionItemSchema>;

export async function listReviewQuestionCategories(params: any = {}) {
  const res = await apiClient.get("/v1/reviewquestioncategories/", { params });
  const raw = res.data?.data ?? res.data?.results ?? res.data ?? [];
  return z.array(ReviewQuestionCategorySchema).parse(Array.isArray(raw) ? raw : []);
}

export async function createReviewQuestionCategory(data: any) {
  const payload = {
    name: data.name,
    proposalType: data.proposal_type ?? data.proposalType,
  };
  const res = await apiClient.post("/v1/reviewquestioncategories/", payload);
  return ReviewQuestionCategorySchema.parse(res.data?.data ?? res.data);
}

export async function updateReviewQuestionCategory(id: number, data: any) {
  const payload = {
    name: data.name,
    proposalType: data.proposal_type ?? data.proposalType,
  };
  const res = await apiClient.patch(`/v1/reviewquestioncategories/${id}/`, payload);
  return ReviewQuestionCategorySchema.parse(res.data?.data ?? res.data);
}

export async function deleteReviewQuestionCategory(id: number) {
  await apiClient.delete(`/v1/reviewquestioncategories/${id}/`);
}

export async function listReviewQuestions(params: any = {}) {
  const res = await apiClient.get(API_ENDPOINTS.REVIEW_QUESTIONS.LIST, { params });
  const raw = res.data?.data ?? res.data?.results ?? res.data ?? [];
  return z.array(ReviewQuestionItemSchema).parse(Array.isArray(raw) ? raw : []);
}

export async function createReviewQuestion(data: any) {
  const payload = {
    ...data,
    maxPoints: data.max_points ?? data.maxPoints,
    isActive: data.is_active ?? data.isActive,
    proposalType: data.proposal_type ?? data.proposalType,
  };
  const res = await apiClient.post(API_ENDPOINTS.REVIEW_QUESTIONS.LIST, payload);
  return ReviewQuestionItemSchema.parse(res.data?.data ?? res.data);
}

export async function updateReviewQuestion(id: number, data: any) {
  const payload = {
    ...data,
    maxPoints: data.max_points ?? data.maxPoints,
    isActive: data.is_active ?? data.isActive,
    proposalType: data.proposal_type ?? data.proposalType,
  };
  const res = await apiClient.patch(`${API_ENDPOINTS.REVIEW_QUESTIONS.LIST}${id}/`, payload);
  return ReviewQuestionItemSchema.parse(res.data?.data ?? res.data);
}

export async function deleteReviewQuestion(id: number) {
  await apiClient.delete(`${API_ENDPOINTS.REVIEW_QUESTIONS.LIST}${id}/`);
}
