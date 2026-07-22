export type IRBClearanceStatus =
  | "pending_submission"
  | "pending_review"
  | "approved"
  | "rejected"
  | "resubmitted";

export interface IRBClearanceType {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}

export interface IRBClearanceDocument {
  id: number;
  fileUrl: string | null;
  originalFilename: string;
  documentType: "clearance" | "supporting";
  fileSize: number;
  uploadedBy: string | null;
  uploadedAt: string | null;
}

export interface IRBClearanceReview {
  id: number;
  reviewer: string;
  decision: "approved" | "rejected";
  comments: string;
  reviewedAt: string | null;
}

export interface EthicalClearance {
  id: number;
  proposal: number;
  proposalId?: number;
  proposalReadyForFundingId?: number;

  screeningId?: number | null;
  referenceNumber?: string | null;
  reference?: string | null;

  proposalTitle?: string | null;
  proposalShortAbstract?: string | null;
  proposalInstitution?: string | null;

  pi?: {
    id: number;
    fullName: string;
    email: string;
  };

  submittedBy?: {
    id: number;
    fullName: string;
    email: string;
  } | null;

  needIrbEthicalClearance: boolean;

  clearanceTypeId?: number | null;
  clearanceTypeName?: string | null;
  clearanceFile?: string | null;

  submissionNotes?: string;
  status: IRBClearanceStatus;
  applicationDate: string;
  approvalDate?: string | null;
  lastReviewedAt?: string | null;

  supportingDocuments?: IRBClearanceDocument[];
  reviews?: IRBClearanceReview[];
  files?: {
    clearanceFile: string | null;
  };
}

export interface EthicalClearanceStatistics {
  total: number;
  byStatus: Record<IRBClearanceStatus, number>;
}

export interface EthicalClearanceResponse {
  success: boolean;
  data: EthicalClearance[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    statistics: EthicalClearanceStatistics;
  };
}

export interface EthicalClearanceDetailResponse {
  success: boolean;
  data: EthicalClearance;
}

export interface EthicalClearanceCreateInput {
  proposal: number;
  clearanceType?: number | null;
  clearanceFile?: File;
  submissionNotes?: string;
  status?: IRBClearanceStatus;
  applicationDate?: string;
  approvalDate?: string;
}

export interface IRBClearanceSubmitInput {
  clearanceTypeId?: number | null;
  submissionNotes?: string;
  clearanceFile?: File;
  supportingDocuments?: File[];
  removedDocumentIds?: number[];
}

export interface IRBClearanceReviewInput {
  decision: "approved" | "rejected";
  comments?: string;
}
