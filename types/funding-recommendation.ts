export interface FundingRecommendationPi {
  id?: number;
  full_name?: string;
  fullName?: string;
  email?: string;
}

export interface FundingRecommendation {
  id: number;
  proposal: number;
  ready_for_funding_id?: number;
  readyForFundingId?: number;
  screening_id?: number | null;
  screeningId?: number | null;
  referenceNumber?: string | null;
  reference_number?: string | null;
  proposalTitle?: string | null;
  proposal_title?: string | null;
  pi?: FundingRecommendationPi | string | null;
  budgetRequested?: string | number | null;
  budget_requested?: string | number | null;
  total_award_amount: string | number;
  totalAwardAmount?: string | number;
  amount_english_in_words: string;
  amountEnglishInWords?: string;
  has_ethical_clearance_approval: boolean;
  hasEthicalClearanceApproval?: boolean;
  comments: string;
  recommended_at: string;
  recommendedAt?: string;
  terminal_report_status?: string | null;
  terminalReportStatus?: string | null;
  funding_decision_status?: string | null;
  fundingDecisionStatus?: string | null;
  screening_status?: string | null;
  screeningStatus?: string | null;
}

export interface FundingRecommendationCandidate {
  screeningId: number;
  proposalId: number;
  proposalTitle: string | null;
  referenceNumber: string | null;
  proposalWorkflowState?: string | null;
  proposal_workflow_state?: string | null;
  call?: { id: number; title: string } | null;
  proposalType?: { id: number; name: string } | null;
  principalInvestigator?: FundingRecommendationPi | null;
  organization?: { id: number; name: string } | null;
  unit?: { id: number; name: string } | null;
  thematicAreas?: { id: number; name: string }[];
  budgetRequested?: string | number | null;
  submittedAt?: string | null;
  decisionRemarks?: string | null;
  reviewersCompletedCount?: number;
  averageScore?: number;
  averageScorePercentage?: number;
  maxPossiblePoints?: number;
  fundingDecisionId: number | null;
  fundingRemark?: string | null;
  needIrbEthicalClearance?: boolean;
  fundingDecisionStatus?:
    | "pending"
    | "approved"
    | "rejected"
    | "deferred"
    | null;
  ethicalClearanceId?: number | null;
  ethicalClearanceStatus?:
    | "pending"
    | "approved"
    | "rejected"
    | "additional_info_required"
    | null;
  ethicalClearanceType?: string | null;
  ethicalClearanceApplicationDate?: string | null;
  ethicalClearanceApprovalDate?: string | null;
  fundingRecommendationsCount?: number;
}

export interface FundingRecommendationCreateInput {
  proposal: number;
  total_award_amount: number;
  amount_english_in_words: string;
  has_ethical_clearance_approval: boolean;
  comments: string;
}

export interface FundingRecommendationListResponse {
  success: boolean;
  data: FundingRecommendation[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    total_pages?: number;
    totalPages?: number;
    statistics?: {
      total_awarded?: number;
      totalAwarded?: number;
      total_requested?: number;
      totalRequested?: number;
      recommendations_count?: number;
      recommendationsCount?: number;
      ethical_clearance_approved_count?: number;
      ethicalClearanceApprovedCount?: number;
    };
  };
}

export interface FundingRecommendationCandidateResponse {
  success: boolean;
  data: FundingRecommendationCandidate[];
  meta?: FundingRecommendationListResponse["meta"];
}
