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
  proposal_file?: string | null;
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
  photo_url?: string | null;
}

export interface FinalSubmissionPIDetail {
  id?: number;
  full_name?: string | null;
  email?: string | null;
  photo_url?: string | null;
}

export interface FinalSubmissionExternalResearchDetail {
  id?: number;
  title?: string | null;
  authors?: string | null;
  institution?: string | null;
  department?: string | null;
  year?: number | null;
  graded_evidence?: string | null;
  doi?: string | null;
  external_link?: string | null;
  approval_status?: string | null;
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
  is_published?: boolean;
  submission_date?: string | null;
  status: FinalSubmissionStatus;
  version?: number;
  fundedproposal?: number | null;
  fundedproposal_detail?: FinalSubmissionFundingProposalDetail | null;
  external_research?: number | null;
  external_research_detail?: FinalSubmissionExternalResearchDetail | null;
  output_type: number;
  output_type_detail?: FinalSubmissionOutputTypeDetail | null;
  data_center?: number | null;
  data_center_detail?: FinalSubmissionDataCenterDetail | null;
  submitted_by?: number;
  submitted_by_detail?: FinalSubmissionSubmitterDetail | null;
  pi?: FinalSubmissionPIDetail | null;
  download_count?: number;
  items?: any[];
  terminal_report_attachment?: string | null;
}

export type FinalSubmissionDownloadFileType =
  | "full_report"
  | "policy_brief"
  | "supplementary_document";

export interface FinalSubmissionDownloadResult {
  id: number;
  downloadCount: number;
  fileType: FinalSubmissionDownloadFileType;
  fileUrl: string;
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
  fundedproposal?: number | null;
  external_research?: number | null;
  output_type: number;
  data_center?: number | null;
}

export type FinalSubmissionUpdateInput = Partial<
  Omit<FinalSubmissionCreateInput, "fundedproposal" | "external_research">
> & {
  fundedproposal?: number | null;
  external_research?: number | null;
};

const EDITABLE_FINAL_SUBMISSION_STATUSES: FinalSubmissionStatus[] = [
  "draft",
  "revision_requested",
  "submitted",
  "under_review",
  "approved",
  "rejected",
];

export function canEditFinalSubmission(status: FinalSubmissionStatus) {
  return EDITABLE_FINAL_SUBMISSION_STATUSES.includes(status);
}

export type ReadyForFinalSubmissionFundingRecommendation =
  FundingRecommendation;

export interface GradedForRepositoryItem {
  proposalId: number;
  projectTrackingId: number;
  title: string;
  referenceNumber: string | null;
  dataCenterName: string | null;
  terminalReportId: number;
  itemsCount: number;
}
