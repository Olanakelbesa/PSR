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
  reference_number?: string | null;
  proposal_title?: string | null;
  pi?: FundingRecommendationPi | string | null;
  total_award_amount: string | number;
  amount_english_in_words: string;
  has_ethical_clearance_approval: boolean;
  comments: string;
  recommended_at: string;
  terminal_report_status?: string | null;
}

export interface FundingRecommendationCandidate {
  screening_id: number;
  proposal_id: number;
  proposal_title: string | null;
  reference_number: string | null;
  proposal_type?: { id: number; name: string } | null;
  principal_investigator?: FundingRecommendationPi | null;
  organization?: { id: number; name: string } | null;
  unit?: { id: number; name: string } | null;
  thematic_areas?: { id: number; name: string }[];
  budget_requested?: string | number | null;
  submitted_date?: string | null;
  decision_remarks?: string | null;
  reviewers_completed_count?: number;
  average_score?: number;
  average_score_percentage?: number;
  funding_decision_id: number | null;
  funding_remark?: string | null;
  need_irb_ethical_clearance?: boolean;
  funding_decision_status?: "pending" | "approved" | "rejected" | "deferred" | null;
  ethical_clearance_id?: number | null;
  ethical_clearance_status?:
    | "pending"
    | "approved"
    | "rejected"
    | "additional_info_required"
    | null;
  ethical_clearance_type?: string | null;
  ethical_clearance_application_date?: string | null;
  ethical_clearance_approval_date?: string | null;
  funding_recommendations_count?: number;
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
