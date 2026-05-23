import type { FundingRecommendation } from "@/types/funding-recommendation";

export type FinalSubmissionStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "revision_requested"
  | "approved"
  | "rejected";

export interface FinalSubmissionLookupOption {
  id: number;
  name: string;
  description?: string;
  active?: boolean;
}

export interface FinalSubmissionFundingProposalDetail {
  funding_recommendation_id?: number;
  proposal_id?: number;
  reference_number?: string | null;
  title?: string | null;
  total_award_amount?: string | number | null;
}

export interface FinalSubmissionOutputTypeDetail {
  id?: number;
  name?: string | null;
}

export interface FinalSubmissionDataCenterDetail {
  id?: number;
  name?: string | null;
}

export interface FinalSubmissionSubmitterDetail {
  id?: number;
  full_name?: string | null;
  email?: string | null;
}

export interface FinalSubmission {
  id: number;
  submitted_by_name?: string;
  title: string;
  abstract?: string | null;
  executive_summary?: string | null;
  full_report?: string | null;
  policy_brief?: string | null;
  supplementary_document?: string | null;
  external_link?: string | null;
  doi?: string | null;
  ndmc_submission_reference?: string | null;
  data_sharing_checklist_completed?: boolean;
  submission_date?: string | null;
  status: FinalSubmissionStatus;
  version?: number;
  fundedproposal: number;
  fundedproposal_detail?: FinalSubmissionFundingProposalDetail | null;
  output_type: number;
  output_type_detail?: FinalSubmissionOutputTypeDetail | null;
  data_center?: number | null;
  data_center_detail?: FinalSubmissionDataCenterDetail | null;
  submitted_by?: number;
  submitted_by_detail?: FinalSubmissionSubmitterDetail | null;
}

export interface FinalSubmissionCreateInput {
  title: string;
  abstract?: string;
  executive_summary?: string;
  full_report?: File | null;
  policy_brief?: File | null;
  supplementary_document?: File | null;
  external_link?: string;
  doi?: string;
  ndmc_submission_reference?: string;
  data_sharing_checklist_completed?: boolean;
  status?: FinalSubmissionStatus;
  fundedproposal: number;
  output_type: number;
  data_center?: number | null;
}

export type ReadyForFinalSubmissionFundingRecommendation =
  FundingRecommendation;
