export type ProtocolStatus =
  | "pending_submission"
  | "pending_review"
  | "approved"
  | "rejected"
  | "resubmitted";

export interface ProtocolAttachmentRecord {
  id: number;
  file: string;
  fileUrl?: string | null;
  file_url?: string | null;
  filename: string;
  fileSize?: number | null;
  file_size?: number | null;
  uploadedAt?: string;
  uploaded_at?: string;
}

export interface ProtocolRecord {
  id: number;
  proposal: number;
  proposalTitle?: string | null;
  proposal_title?: string | null;
  referenceNumber?: string | null;
  reference_number?: string | null;
  proposalShortAbstract?: string | null;
  proposal_short_abstract?: string | null;
  proposalInstitution?: string | null;
  proposal_institution?: string | null;
  proposalFile?: string | null;
  proposal_file?: string | null;

  protocolFile?: string | null;
  protocol_file?: string | null;
  otherDocument?: string | null;
  other_document?: string | null;
  attachments?: ProtocolAttachmentRecord[];

  uploadedBy?: number | null;
  uploaded_by?: number | null;
  uploadedByName?: string | null;
  uploaded_by_name?: string | null;

  submittedBy?: {
    id: number;
    fullName: string;
    email: string;
    photoUrl?: string | null;
    photo_url?: string | null;
  } | null;

  pi?: {
    id: number;
    fullName: string;
    email: string;
    photoUrl?: string | null;
    photo_url?: string | null;
  } | null;

  status: ProtocolStatus;
  decisionRemarks?: string | null;
  decision_remarks?: string | null;

  reviewedBy?: number | null;
  reviewed_by?: number | null;
  reviewedByName?: string | null;
  reviewed_by_name?: string | null;
  reviewedAt?: string | null;
  reviewed_at?: string | null;

  approvalDate?: string | null;
  approval_date?: string | null;

  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface ProtocolStatistics {
  total: number;
  byStatus?: Record<string, number>;
  by_status?: Record<string, number>;
  withProtocolFile?: number;
  with_protocol_file?: number;
  withOtherDocument?: number;
  with_other_document?: number;
}

export interface ProtocolListResponse {
  success: boolean;
  data: ProtocolRecord[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    statistics?: ProtocolStatistics;
  };
}

export interface ProtocolCreateInput {
  proposal: number;
  protocol_file: File;
  other_document?: File | null;
  other_documents?: File[];
}

export interface ProtocolUpdateInput {
  proposal?: number;
  protocol_file?: File | null;
  other_document?: File | null;
  other_documents?: File[];
  remove_protocol_file?: boolean;
  remove_other_document?: boolean;
  remove_attachment_ids?: number[];
}

export interface ProtocolReviewInput {
  decision: "approved" | "rejected";
  comments: string;
}

export interface ProtocolFilters {
  page?: number;
  limit?: number;
  search?: string;
  proposal?: number;
  status?: ProtocolStatus | string;
  hasProtocolFile?: boolean;
  hasOtherDocument?: boolean;
  ordering?: string;
}
export interface ProtocolReviewInput {
  decision: "approved" | "rejected";
  comments: string;
}

export interface ProtocolFilters {
  page?: number;
  limit?: number;
  search?: string;
  proposal?: number;
  status?: ProtocolStatus | string;
  mine?: boolean;
  hasProtocolFile?: boolean;
  hasOtherDocument?: boolean;
  ordering?: string;
}
