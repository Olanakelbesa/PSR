// ============================================================================
// RPDMS — Service Layer: System Document Templates & Attachments CRUD
// ============================================================================

import { z } from "zod";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

export const SystemAttachmentSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(Number),
    title: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    attachment: z.string().nullable().optional(),
    document_type: z.string().nullable().optional(),
    documentType: z.string().nullable().optional(),
    date_of_upload: z.string().nullable().optional(),
    dateOfUpload: z.string().nullable().optional(),
  })
  .transform((item) => ({
    ...item,
    title: item.title ?? item.description ?? "System Attachment",
    document_type: item.document_type ?? item.documentType ?? "pdf",
    date_of_upload: item.date_of_upload ?? item.dateOfUpload ?? "",
  }));

export type SystemAttachmentItem = z.infer<typeof SystemAttachmentSchema>;

export async function listSystemAttachments(params: any = {}) {
  const res = await apiClient.get(API_ENDPOINTS.ATTACHMENTS.LIST, { params });
  const raw = res.data?.data ?? res.data?.results ?? res.data ?? [];
  return z.array(SystemAttachmentSchema).parse(Array.isArray(raw) ? raw : []);
}

export async function uploadSystemAttachment(formData: FormData) {
  const res = await apiClient.post(API_ENDPOINTS.ATTACHMENTS.LIST, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return SystemAttachmentSchema.parse(res.data?.data ?? res.data);
}

export async function updateSystemAttachment(id: number, formData: FormData) {
  const res = await apiClient.patch(`${API_ENDPOINTS.ATTACHMENTS.LIST}${id}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return SystemAttachmentSchema.parse(res.data?.data ?? res.data);
}

export async function deleteSystemAttachment(id: number) {
  await apiClient.delete(`${API_ENDPOINTS.ATTACHMENTS.LIST}${id}/`);
}
