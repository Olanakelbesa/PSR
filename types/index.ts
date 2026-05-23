export type {
  User,
  PolicyDocument,
  ConceptNote,
  Review,
  ReviewCriteria,
  ProposalStatus,
  CallStatus,
  CallForProposal,
  ResearchProposal,
  TeamMember,
  Budget,
  TimelineItem,
  ProposalReview,
  ResearchProject,
  ProgressReport,
  Milestone,
  ResearchOutput,
  AuditLog,
  Notification,
  TaxonomyItem,
  Institution,
  ApiResponse,
  PaginatedResponse,
  FilterOptions,
  PaginationOptions,
} from "@/lib/types";

export type {
  FinalSubmission,
  FinalSubmissionCreateInput,
  FinalSubmissionLookupOption,
  FinalSubmissionStatus,
  ReadyForFinalSubmissionFundingRecommendation,
} from "@/types/final-submission";

export type {
  MinuteRecord,
  MinuteCreateInput,
  MinuteListResponse,
} from "@/types/minutes";

export interface GrantCallProposalType {
  id: number | string;
  name: string;
}

export interface GrantCallSettings {
  id: number | string;
  allowedSubmissionOffices: Array<number | string>;
  revieweeStartDate?: string | null;
  revieweeClosingDate?: string | null;
  requirePeerReview?: boolean;
  requireCommitteeReview?: boolean;
  firstLevelScreeningResultCheck?: boolean;
  reviewResultCheck?: boolean;
}

export interface GrantCallInstallmentPlan {
  id: number | string;
  installmentNumber: number;
  percentage: string;
  installmentAmount?: number | string | null;
}

export interface GrantCallSettingsInput {
  allowed_submission_offices?: Array<number | string>;
  reviewee_start_date?: string | null;
  reviewee_closing_date?: string | null;
  require_peer_review?: boolean;
  require_committee_review?: boolean;
  first_level_screening_result_check?: boolean;
  review_result_check?: boolean;
}

export interface GrantCallInstallmentPlanInput {
  installment_number: number;
  percentage: number | string;
}

export interface GrantCallWriteInput {
  title: string;
  budget?: number | string | null;
  proposal_types?: Array<number | string>;
  current_year?: string | null;
  thumbnail_image?: File | Blob | string | null;
  banner_image?: File | Blob | string | null;
  description?: string | null;
  eligibility_criteria?: string | null;
  open_date?: string | null;
  close_date?: string | null;
  status?: string;
  settings?: GrantCallSettingsInput | null;
  installment_plans?: GrantCallInstallmentPlanInput[];
}

export interface GrantCall {
  id: number | string;
  title: string;
  shortDescription?: string | null;
  description?: string | null;
  eligibilityCriteria?: string | null;
  currentYear?: string | null;
  budget?: number | string | null;
  status?: string;
  openDate?: string | null;
  closeDate?: string | null;
  thumbnailImage?: string | null;
  bannerImage?: string | null;
  proposalTypes?: GrantCallProposalType[];
  settings?: GrantCallSettings | null;
  installmentPlans?: GrantCallInstallmentPlan[];
  createdAt?: string;
  updatedAt?: string;
}

export interface GrantCallListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  statistics?: {
    totalCalls: number;
    openCalls: number;
    closedCalls: number;
  };
}

export interface GrantCallListResponse {
  data: GrantCall[];
  meta?: GrantCallListMeta;
}

export type ProposalDetail = any;
