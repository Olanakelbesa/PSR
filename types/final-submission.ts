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
  output_type: number;
  data_center?: number | null;
  submitted_by?: number;
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
