// ============================================================================
// RPDMS — Service Layer: Checklist Templates & Evaluation Criteria CRUD
// ============================================================================

import { z } from "zod";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

function extractId(val: any): number | string | null {
  if (val == null || val === "") return null;
  if (typeof val === "object" && val.id != null) return val.id;
  return val;
}

export const ChecklistTemplateSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(Number),
    name: z.string(),
    doc_type: z.any().optional(),
    docType: z.any().optional(),
    doc_type_name: z.string().optional(),
    pass_rule_type: z.string().optional(),
    passRuleType: z.string().optional(),
    threshold: z.union([z.string(), z.number()]).optional(),
    is_active: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .transform((item) => ({
    ...item,
    doc_type: extractId(item.doc_type ?? item.docType),
    pass_rule_type: item.pass_rule_type ?? item.passRuleType ?? "threshold",
    is_active: item.is_active ?? item.isActive ?? true,
  }));

export type ChecklistTemplateItem = z.infer<typeof ChecklistTemplateSchema>;

export const ChecklistCategorySchema = z.object({
  id: z.union([z.string(), z.number()]).transform(Number),
  name: z.string(),
  description: z.string().nullable().optional(),
  order: z.number().optional(),
});

export type ChecklistCategoryItem = z.infer<typeof ChecklistCategorySchema>;

export const ChecklistQuestionItemSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(Number),
    question_text: z.string().optional(),
    questionText: z.string().optional(),
    template: z.any().optional(),
    doc_type: z.any().optional(),
    docType: z.any().optional(),
    category: z.any().optional(),
    category_name: z.string().nullable().optional(),
    is_critical: z.boolean().optional(),
    isCritical: z.boolean().optional(),
    weight: z.union([z.string(), z.number()]).optional(),
    is_active: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .transform((item) => ({
    ...item,
    question_text: item.question_text ?? item.questionText ?? "",
    template: extractId(item.template),
    doc_type: extractId(item.doc_type ?? item.docType),
    category: extractId(item.category),
    is_critical: item.is_critical ?? item.isCritical ?? false,
    is_active: item.is_active ?? item.isActive ?? true,
  }));

export type ChecklistQuestionItem = z.infer<typeof ChecklistQuestionItemSchema>;

export async function listChecklistTemplates(params: any = {}) {
  const res = await apiClient.get(API_ENDPOINTS.REFERENCE.CHECKLIST_TEMPLATES, { params });
  const raw = res.data?.data ?? res.data?.results ?? res.data ?? [];
  return z.array(ChecklistTemplateSchema).parse(Array.isArray(raw) ? raw : []);
}

export async function createChecklistTemplate(data: any) {
  const payload = {
    ...data,
    docType: data.doc_type ?? data.docType,
    passRuleType: data.pass_rule_type ?? data.passRuleType,
    isActive: data.is_active ?? data.isActive,
  };
  const res = await apiClient.post(API_ENDPOINTS.REFERENCE.CHECKLIST_TEMPLATES, payload);
  return ChecklistTemplateSchema.parse(res.data?.data ?? res.data);
}

export async function updateChecklistTemplate(id: number, data: any) {
  const payload = {
    ...data,
    docType: data.doc_type ?? data.docType,
    passRuleType: data.pass_rule_type ?? data.passRuleType,
    isActive: data.is_active ?? data.isActive,
  };
  const res = await apiClient.patch(`${API_ENDPOINTS.REFERENCE.CHECKLIST_TEMPLATES}${id}/`, payload);
  return ChecklistTemplateSchema.parse(res.data?.data ?? res.data);
}

export async function deleteChecklistTemplate(id: number) {
  await apiClient.delete(`${API_ENDPOINTS.REFERENCE.CHECKLIST_TEMPLATES}${id}/`);
}

export async function listChecklistQuestions(params: any = {}) {
  const res = await apiClient.get("/v1/policydocumentchecklistitems/", { params });
  const raw = res.data?.data ?? res.data?.results ?? res.data ?? [];
  return z.array(ChecklistQuestionItemSchema).parse(Array.isArray(raw) ? raw : []);
}

export async function createChecklistQuestion(data: any) {
  const payload = {
    ...data,
    questionText: data.question_text ?? data.questionText,
    isCritical: data.is_critical ?? data.isCritical,
    isActive: data.is_active ?? data.isActive,
    docType: data.doc_type ?? data.docType,
  };
  const res = await apiClient.post("/v1/policydocumentchecklistitems/", payload);
  return ChecklistQuestionItemSchema.parse(res.data?.data ?? res.data);
}

export async function updateChecklistQuestion(id: number, data: any) {
  const payload = {
    ...data,
    questionText: data.question_text ?? data.questionText,
    isCritical: data.is_critical ?? data.isCritical,
    isActive: data.is_active ?? data.isActive,
    docType: data.doc_type ?? data.docType,
  };
  const res = await apiClient.patch(`/v1/policydocumentchecklistitems/${id}/`, payload);
  return ChecklistQuestionItemSchema.parse(res.data?.data ?? res.data);
}

export async function deleteChecklistQuestion(id: number) {
  await apiClient.delete(`/v1/policydocumentchecklistitems/${id}/`);
}
