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
  POLICY_DOCUMENT_TYPES: "policy-document-types",
  SUB_THEMATIC_AREAS: "sub-thematic-areas",
  PROPOSAL_TYPES: "proposal-types",
  IRB_CLEARANCE_TYPES: "irb-clearance-types",
  TEAM_MEMBER_ROLES: "team-member-roles",
  TERMINAL_REPORT_GRADES: "terminal-report-grades",
  OUTPUT_TYPES: "output-types",
} as const;

export type TaxonomyKind = (typeof TaxonomyKind)[keyof typeof TaxonomyKind];

const ENDPOINTS: Record<TaxonomyKind, string> = {
  [TaxonomyKind.THEMATIC_AREAS]: API_ENDPOINTS.REFERENCE.THEMATIC_AREAS,
  [TaxonomyKind.RESEARCH_AREAS]: API_ENDPOINTS.REFERENCE.RESEARCH_AREAS,
  [TaxonomyKind.RESEARCH_TYPES]: API_ENDPOINTS.REFERENCE.RESEARCH_TYPES,
  [TaxonomyKind.ORGANIZATION_TYPES]: API_ENDPOINTS.REFERENCE.ORGANIZATION_TYPES,
  [TaxonomyKind.POLICY_DOCUMENT_TYPES]: API_ENDPOINTS.REFERENCE.POLICY_DOCUMENT_TYPES,
  [TaxonomyKind.SUB_THEMATIC_AREAS]: API_ENDPOINTS.REFERENCE.SUB_THEMATIC_AREAS,
  [TaxonomyKind.PROPOSAL_TYPES]: API_ENDPOINTS.REFERENCE.PROPOSAL_TYPES,
  [TaxonomyKind.IRB_CLEARANCE_TYPES]: API_ENDPOINTS.IRB_CLEARANCE_TYPES.LIST,
  [TaxonomyKind.TEAM_MEMBER_ROLES]: API_ENDPOINTS.REFERENCE.TEAM_MEMBER_ROLES,
  [TaxonomyKind.TERMINAL_REPORT_GRADES]: API_ENDPOINTS.TERMINAL_REPORT_GRADES.LIST,
  [TaxonomyKind.OUTPUT_TYPES]: API_ENDPOINTS.OUTPUT_TYPES.LIST,
};

export const TaxonomyItemSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(Number),
    name: z.string(),
    description: z.string().nullable().optional(),
    code: z.string().nullable().optional(),
    score_value: z
      .union([z.string(), z.number()])
      .nullable()
      .optional()
      .transform((v) => (v != null ? Number(v) : undefined)),
    scoreValue: z
      .union([z.string(), z.number()])
      .nullable()
      .optional()
      .transform((v) => (v != null ? Number(v) : undefined)),
    thematic_area: z.union([z.string(), z.number()]).nullable().optional(),
    thematic_area_name: z.string().nullable().optional(),
    proposaltype: z.union([z.string(), z.number()]).nullable().optional(),
    is_active: z.boolean().nullable().optional(),
    isActive: z.boolean().nullable().optional(),
    active: z.boolean().nullable().optional(),
  })
  .transform((item) => ({
    ...item,
    score_value: item.score_value ?? item.scoreValue ?? 0,
    scoreValue: item.scoreValue ?? item.score_value ?? 0,
    is_active: item.is_active ?? item.isActive ?? item.active ?? true,
    isActive: item.isActive ?? item.is_active ?? item.active ?? true,
  }));

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
  score_value?: number;
  thematic_area?: number | null;
  proposaltype?: number | null;
  is_active?: boolean;
  active?: boolean;
}

function normalizeListResponse(payload: unknown) {
  if (Array.isArray(payload)) {
    return {
      data: payload,
      meta: { page: 1, limit: payload.length, total: payload.length, totalPages: 1 },
    };
  }

  const root = (payload ?? {}) as Record<string, unknown>;
  const data = Array.isArray(root.data)
    ? root.data
    : Array.isArray(root.results)
    ? root.results
    : Array.isArray(root)
    ? root
    : [];

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

  if (kind === TaxonomyKind.RESEARCH_TYPES || kind === TaxonomyKind.TEAM_MEMBER_ROLES) {
    return { name: payload.name };
  }

  if (kind === TaxonomyKind.SUB_THEMATIC_AREAS) {
    return {
      name: payload.name,
      description: payload.description ?? "",
      thematic_area: payload.thematic_area ?? null,
    };
  }

  if (kind === TaxonomyKind.TERMINAL_REPORT_GRADES) {
    return {
      name: payload.name,
      description: payload.description ?? "",
      score_value: payload.score_value ?? 0,
      scoreValue: payload.score_value ?? 0,
      is_active: payload.is_active ?? true,
      isActive: payload.is_active ?? true,
    };
  }

  if (kind === TaxonomyKind.OUTPUT_TYPES) {
    return {
      name: payload.name,
      description: payload.description ?? "",
      active: payload.active ?? true,
    };
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
