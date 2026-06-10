export type ExternalResearchApprovalStatus =
  | "pending"
  | "approved"
  | "rejected";

export interface ExternalResearchRecord {
  id: string | number;
  title: string;
  authors?: string | null;
  institution?: string | null;
  year?: number | string | null;
  abstract?: string | null;
  methodology?: string | null;
  citation?: string | null;
  grade?: string | null;
  type?: string | null;
  keywords?: string | null;
  file?: string | null;
  uploaded_at?: string | null;
  uploaded_by?: string | number | null;
  uploaded_by_name?: string | null;
  approval_status?: ExternalResearchApprovalStatus;
  approval_remarks?: string | null;
  reviewed_by?: string | number | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
}
