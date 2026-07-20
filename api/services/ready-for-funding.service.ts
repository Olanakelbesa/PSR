import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

// ============================================================================
// Types
// ============================================================================

export interface ReadyForFundingItem {
  screeningId: number;
  proposalId: number;
  readyForFundingId: number | null;
  screeningStatus: string;
  proposalTitle: string;
  referenceNumber: string;
  proposalType: string;
  call: string | null;
  organization: string;
  unit: string;
  thematicAreas: string[];
  budgetRequested: number;
  totalFundedAmount?: number | null;
  submittedAt: string;
  screeningDecisionRemarks: string;
  hasFundingDecision: boolean;
  fundingDecisionStatus: string | null;
  needIrbEthicalClearance: boolean;
  averageScore: number;
  averageScorePercentage: number;
  pi: {
    id: number;
    fullName: string;
    email: string;
  } | null;
}

export interface ReadyForFundingListResponse {
  success: boolean;
  data: ReadyForFundingItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    statistics?: {
      totalProposals: number;
      pendingDecisions: number;
      decisionsCreated: number;
      totalRequested: number;
      totalFundedAmount: number;
      averageScore: number;
      averageScorePercentage: number;
    };
  };
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Transforms API response from snake_case to camelCase
 */
function transformApiResponse(data: any): ReadyForFundingItem {
  const screeningId = data.screening_id ?? data.screeningId;
  const proposalId = data.proposal_id ?? data.proposalId;
  const readyForFundingId = data.ready_for_funding_id ?? data.readyForFundingId ?? null;
  const screeningStatus = data.screening_status ?? data.screeningStatus ?? "screening_under_review";
  const proposalTitle = data.proposal_title ?? data.proposalTitle ?? "Untitled Proposal";
  const referenceNumber = data.reference_number ?? data.referenceNumber ?? "";
  const proposalType = data.proposal_type ?? data.proposalType ?? "";
  const call = data.call ?? null;
  const organization = data.organization ?? data.organizationName ?? "";
  const unit = data.unit ?? data.unitName ?? "";
  const thematicAreas = data.thematic_areas ?? data.thematicAreas ?? [];
  const budgetRequested = data.budget_requested ?? data.budgetRequested ?? 0;
  const totalFundedAmount = data.total_funded_amount ?? data.totalFundedAmount ?? null;
  const submittedAt = data.submitted_at ?? data.submittedAt ?? "";
  const screeningDecisionRemarks =
    data.screening_decision_remarks ?? data.screeningDecisionRemarks ?? "";
  const hasFundingDecision =
    data.has_funding_decision ?? data.hasFundingDecision ?? false;
  const fundingDecisionStatus =
    data.funding_decision_status ?? data.fundingDecisionStatus ?? null;
  const needIrbEthicalClearance =
    data.need_irb_ethical_clearance ?? data.needIrbEthicalClearance ?? false;
  const averageScore = data.average_score ?? data.averageScore ?? 0;
  const averageScorePercentage =
    data.average_score_percentage ?? data.averageScorePercentage ?? 0;

  return {
    screeningId: Number(screeningId),
    proposalId: Number(proposalId),
    readyForFundingId:
      readyForFundingId === null || readyForFundingId === undefined
        ? null
        : Number(readyForFundingId),
    screeningStatus,
    proposalTitle,
    referenceNumber,
    proposalType,
    call,
    organization,
    unit,
    thematicAreas,
    budgetRequested: Number(budgetRequested),
    totalFundedAmount,
    submittedAt,
    screeningDecisionRemarks,
    hasFundingDecision,
    fundingDecisionStatus,
    needIrbEthicalClearance,
    averageScore: Number(averageScore),
    averageScorePercentage: Number(averageScorePercentage),
    pi: data.pi
      ? {
          id: Number(data.pi.id),
          fullName: data.pi.full_name ?? data.pi.fullName ?? "",
          email: data.pi.email ?? "",
        }
      : null,
  };
}

function transformStatistics(meta: any) {
  const statistics = meta?.statistics;
  if (!statistics) return undefined;

  return {
    totalProposals: Number(statistics.total_proposals ?? statistics.totalProposals ?? 0),
    pendingDecisions: Number(statistics.pending_decisions ?? statistics.pendingDecisions ?? 0),
    decisionsCreated: Number(statistics.decisions_created ?? statistics.decisionsCreated ?? 0),
    totalRequested: Number(statistics.total_requested ?? statistics.totalRequested ?? 0),
    totalFundedAmount: Number(statistics.total_funded_amount ?? statistics.totalFundedAmount ?? 0),
    averageScore: Number(statistics.average_score ?? statistics.averageScore ?? 0),
    averageScorePercentage: Number(
      statistics.average_score_percentage ?? statistics.averageScorePercentage ?? 0,
    ),
  };
}

// ============================================================================
// Service
// ============================================================================

export const readyForFundingService = {
  /**
   * GET: approved + pending funding queue
   */
  async list(params?: {
    page?: number;
    limit?: number;
    search?: string;
    organization?: number;
    unit?: number;
    proposal_type?: number;
    call?: number | string;
    has_funding_decision?: boolean;
    funding_decision_status?: "pending" | "approved" | "rejected" | "deferred";
    min_score?: number;
    max_score?: number;
    ordering?: string;
  }): Promise<ReadyForFundingListResponse> {
    const res = await apiClient.get(API_ENDPOINTS.READY_FOR_FUNDING.LIST, {
      params,
    });

    // Transform snake_case response to camelCase
    return {
      success: res.data.success,
      data: (res.data.data || []).map(transformApiResponse),
      meta: {
        ...res.data.meta,
        statistics: transformStatistics(res.data.meta),
      },
    };
  },

  /**
   * POST: create funding decision for screening
   */
  async createDecision(
    screeningId: string | number,
    payload: {
      Remark: string;
      need_irb_ethical_clearance?: boolean;
      decision_status?: "pending" | "approved" | "rejected" | "deferred";
    },
  ) {
    const res = await apiClient.post(
      API_ENDPOINTS.READY_FOR_FUNDING.CREATE_DECISION(screeningId),
      payload,
    );

    return res.data;
  },

  async updateDecision(
    screeningId: string | number,
    payload: {
      Remark: string;
      need_irb_ethical_clearance?: boolean;
      decision_status?: "pending" | "approved" | "rejected" | "deferred";
      status?: string;
    },
  ) {
    const res = await apiClient.patch(
      API_ENDPOINTS.READY_FOR_FUNDING.CREATE_DECISION(screeningId),
      payload,
    );

    return res.data;
  },
};
