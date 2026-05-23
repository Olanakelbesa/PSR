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
  screening_id?: number | null;
  referenceNumber?: string | null;
  proposalTitle?: string | null;
  pi?: FundingRecommendationPi | string | null;
  total_award_amount: string | number;
  amount_english_in_words: string;
  has_ethical_clearance_approval: boolean;
  comments: string;
  recommended_at: string;
  terminal_report_status?: string | null;
}

export interface FundingRecommendationCandidate {
  screeningId: number;
  proposalId: number;
  proposalTitle: string | null;
  referenceNumber: string | null;
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
  fundingDecisionId: number | null;
  fundingRemark?: string | null;
  needIrbEthicalClearance?: boolean;
  fundingDecisionStatus?: "pending" | "approved" | "rejected" | "deferred" | null;
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
    page: number;
    limit: number;
    total: number;
    total_pages?: number;
    totalPages?: number;
  };
}

export interface FundingRecommendationCandidateResponse {
  success: boolean;
  data: FundingRecommendationCandidate[];
  meta?: FundingRecommendationListResponse["meta"];
}
