import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

// ============================================================================
// Types
// ============================================================================

export interface ReadyForFundingItem {
  screeningId: number;
  proposalId: number;
  proposalTitle: string;
  referenceNumber: string;
  proposalType: string;
  organization: string;
  unit: string;
  thematicAreas: string[];
  budgetRequested: number;
  submittedAt: string;
  screeningDecisionRemarks: string;
  averageScore: number;
  averageScorePercentage: number;
  pi: {
    id: number;
    fullName: string;
    email: string;
  };
}

export interface ReadyForFundingListResponse {
  success: boolean;
  data: ReadyForFundingItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
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
  }): Promise<ReadyForFundingListResponse> {
    const res = await apiClient.get(API_ENDPOINTS.READY_FOR_FUNDING.LIST, {
      params,
    });

    return res.data;
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
};
