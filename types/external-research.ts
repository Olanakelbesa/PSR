export type ExternalResearchApprovalStatus =
  | "draft"
  | "submitted"
  | "pending"
  | "under_review"
  | "revision_requested"
  | "approved"
  | "rejected";

export interface ExternalResearchUserDetail {
  id: number;
  full_name: string;
  email: string;
  photo_url?: string | null;
}

export interface ExternalResearchDataCenterDetail {
  id: number;
  name: string;
}

export interface ExternalResearchOutputTypeDetail {
  id: number;
  name: string;
}

export interface ExternalResearchApprovalRecord {
  id: number;
  external_research: number;
  reviewer?: number | null;
  reviewer_name?: string | null;
  policy_brief_comments?: string;
  report_comments?: string;
  technical_comments?: string;
  recommendation?: string;
  grade_checklist_score?: number;
  grade_checklist_completed?: boolean;
  decision: "approved" | "minor_revision" | "major_revision" | "rejected";
  reviewed_at: string;
}

export interface ExternalResearchRecord {
  id: number;
  title: string;
  authors: string;
  institution: string;
  year: number;
  department?: string | null;
  abstract?: string | null;
  executive_summary?: string | null;
  graded_evidence?: "high" | "medium" | "low" | "not_graded";
  research_type?: string | null;
  output_type?: number | null;
  keywords?: string | null;

  file?: string | null;
  full_report?: string | null;
  policy_brief?: string | null;
  supplementary_document?: string | null;
  external_link?: string | null;
  doi?: string | null;

  data_center?: number | null;
  custom_data_center?: string | null;
  data_sharing_checklist_completed?: boolean;
  is_published?: boolean;
  version?: number;
  download_count?: number;

  uploaded_by?: number | null;
  uploaded_by_name?: string | null;
  uploaded_by_detail?: ExternalResearchUserDetail | null;
  uploaded_at?: string | null;

  approval_status: ExternalResearchApprovalStatus;
  approval_remarks?: string | null;
  reviewed_by?: number | null;
  reviewed_by_name?: string | null;
  reviewed_by_detail?: ExternalResearchUserDetail | null;
  reviewed_at?: string | null;

  output_type_detail?: ExternalResearchOutputTypeDetail | null;
  outputTypeDetail?: ExternalResearchOutputTypeDetail | null;
  output_types?: number[] | null;
  outputTypes?: number[] | null;
  output_types_detail?: ExternalResearchOutputTypeDetail[] | null;
  outputTypesDetail?: ExternalResearchOutputTypeDetail[] | null;
  data_center_detail?: ExternalResearchDataCenterDetail | null;
  approvals?: ExternalResearchApprovalRecord[];
}

export interface ExternalResearchFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  approval_status?: string;
  year?: number;
  graded_evidence?: string;
  research_type?: string;
  institution?: string;
  data_center?: number | string;
  output_type?: number | string;
  scope?: "all" | "my";
}

export interface ExternalResearchCreateInput {
  title: string;
  authors: string;
  institution: string;
  year: number;
  department?: string;
  abstract?: string;
  executive_summary?: string;
  graded_evidence?: "high" | "medium" | "low" | "not_graded";
  research_type?: string;
  output_type?: number;
  keywords?: string;

  file?: File | null;
  full_report?: File | null;
  policy_brief?: File | null;
  supplementary_document?: File | null;
  external_link?: string;
  doi?: string;

  data_center?: number;
  custom_data_center?: string;
  data_sharing_checklist_completed?: boolean;
  is_published?: boolean;
  approval_status?: ExternalResearchApprovalStatus;
}

export type ExternalResearchUpdateInput = Partial<ExternalResearchCreateInput>;

export type ExternalResearchDownloadFileType =
  | "file"
  | "full_report"
  | "policy_brief"
  | "supplementary_document";
