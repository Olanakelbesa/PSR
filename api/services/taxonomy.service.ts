// ============================================================================
// RPDMS — Service Layer: Reference Taxonomy CRUD
// ============================================================================

import { z } from "zod";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

export const TaxonomyKind = {
  THEMATIC_AREAS: "thematic-areas",
  RESEARCH_AREAS: "research-areas",
  RESEARCH_TYPES: "research-types",
  ORGANIZATION_TYPES: "organization-types",
} as const;

export type TaxonomyKind = (typeof TaxonomyKind)[keyof typeof TaxonomyKind];

const ENDPOINTS: Record<TaxonomyKind, string> = {
  [TaxonomyKind.THEMATIC_AREAS]: API_ENDPOINTS.REFERENCE.THEMATIC_AREAS,
  [TaxonomyKind.RESEARCH_AREAS]: API_ENDPOINTS.REFERENCE.RESEARCH_AREAS,
  [TaxonomyKind.RESEARCH_TYPES]: API_ENDPOINTS.REFERENCE.RESEARCH_TYPES,
  [TaxonomyKind.ORGANIZATION_TYPES]: API_ENDPOINTS.REFERENCE.ORGANIZATION_TYPES,
};

export const TaxonomyItemSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(Number),
  name: z.string(),
  description: z.string().nullable().optional(),
  code: z.string().optional(),
});

export type TaxonomyItem = z.infer<typeof TaxonomyItemSchema>;

export interface TaxonomyListParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface TaxonomyWritePayload {
  name: string;
  description?: string | null;
  code?: string;
}

function normalizeListResponse(payload: unknown) {
  const root = (payload ?? {}) as Record<string, unknown>;
  const data = Array.isArray(root.data) ? root.data : [];
  const rawMeta = (root.meta as Record<string, unknown> | undefined) ?? {};

  return {
    data,
    meta: {
      page: Number(rawMeta.page ?? 1),
      limit: Number(rawMeta.limit ?? (data.length || 25)),
      total: Number(rawMeta.total ?? data.length),
      totalPages: Number(
        rawMeta.totalPages ??
          rawMeta.total_pages ??
          (Number(rawMeta.limit) > 0
            ? Math.ceil(Number(rawMeta.total ?? data.length) / Number(rawMeta.limit))
            : 1),
      ),
    },
  };
}

function toBackendPayload(kind: TaxonomyKind, payload: TaxonomyWritePayload) {
  if (kind === TaxonomyKind.ORGANIZATION_TYPES) {
    return {
      name: payload.name,
      code: payload.code,
      description: payload.description ?? null,
    };
  }

  if (kind === TaxonomyKind.RESEARCH_TYPES) {
    return { name: payload.name };
  }

  return {
    name: payload.name,
    description: payload.description ?? "",
  };
}

export async function listTaxonomyItems(
  kind: TaxonomyKind,
  params: TaxonomyListParams = {},
) {
  const res = await apiClient.get(ENDPOINTS[kind], { params });
  const normalized = normalizeListResponse(res.data);
  return {
    data: z.array(TaxonomyItemSchema).parse(normalized.data),
    meta: normalized.meta,
  };
}

export async function createTaxonomyItem(
  kind: TaxonomyKind,
  payload: TaxonomyWritePayload,
): Promise<TaxonomyItem> {
  const res = await apiClient.post(ENDPOINTS[kind], toBackendPayload(kind, payload));
  return TaxonomyItemSchema.parse(res.data?.data ?? res.data);
}

export async function updateTaxonomyItem(
  kind: TaxonomyKind,
  id: number,
  payload: TaxonomyWritePayload,
): Promise<TaxonomyItem> {
  const res = await apiClient.patch(
    `${ENDPOINTS[kind]}${id}/`,
    toBackendPayload(kind, payload),
  );
  return TaxonomyItemSchema.parse(res.data?.data ?? res.data);
}

export async function deleteTaxonomyItem(kind: TaxonomyKind, id: number): Promise<void> {
  await apiClient.delete(`${ENDPOINTS[kind]}${id}/`);
}
