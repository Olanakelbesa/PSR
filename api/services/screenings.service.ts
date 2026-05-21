// ============================================================================
// PSR Platform — Service Layer: Screenings
// ============================================================================

import { z } from "zod";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

export const ScreeningStatusSchema = z.enum([
  "screening_under_review",
  "screening_approved",
  "screening_rejected",
]);

const ScreeningSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  proposal: z.any(),
  status: ScreeningStatusSchema,
  decision_remarks: z.string().optional().default(""),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

const ScreeningsListSchema = z.object({
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
