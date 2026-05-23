// ============================================================================
// PSR Platform Type Definitions
// ============================================================================

// User & Authentication Types
export type UserRole =
  | "system_admin"
  | "psr_officer"
  | "leo_officer"
  | "researcher"
  | "roc_reviewer"
  | "director"
  | "institutional_partner";

export type UserStatus = "active" | "inactive" | "pending";

export interface User {
  image: string | Blob | undefined;
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  institution?: string;
  department?: string;
  position?: string;
  status: UserStatus;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface OTPVerification {
  email: string;
  otp: string;
}

// Policy Document Types
export type PolicyStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "revision_requested"
  | "approved"
  | "published"
  | "archived";

export type PolicyType =
  | "policy"
  | "strategy"
  | "guideline"
  | "protocol"
  | "standard"
  | "directive";

export interface PolicyDocument {
  id: string;
  title: string;
  description: string;
  type: PolicyType;
  status: PolicyStatus;
  category: string;
  version: number;
  content?: string;
  createdBy: User;
  assignedReviewers: User[];
  currentVersion: number;
  attachments: Attachment[];
  reviews: Review[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface ConceptNote {
  id: string;
  title: string;
  background: string;
  objectives: string;
  scope: string;
  methodology?: string;
  expectedOutcomes: string;
  timeline?: string;
  status: PolicyStatus;
  policyType: PolicyType;
  createdBy: User;
  attachments: Attachment[];
  reviews: Review[];
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewer: User;
  comments: string;
  recommendation: "approve" | "revise" | "reject";
  decision?: "Accepted" | "Partially Accepted" | "Rejected";
  supportingDocument?: {
    name: string;
    url: string;
  };
  score?: number;
  criteria?: ReviewCriteria[];
  createdAt: string;
}

export interface ReviewCriteria {
  name: string;
  score: number;
  maxScore: number;
  comments?: string;
}

// Research Management Types
export type ProposalStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "revision_requested"
  | "approved"
  | "rejected"
  | "contracted"
  | "in_progress"
  | "completed"
  | "terminated";

export type CallStatus =
  | "draft"
  | "open"
  | "closing_soon"
  | "closed"
  | "cancelled";

export interface CallForProposal {
  id: string;
  title: string;
  description: string;
  eligibilityCriteria: string;
  priorityAreas: string[];
  budgetRange: {
    min: number;
    max: number;
  };
  submissionDeadline: string;
  reviewDeadline?: string;
  status: CallStatus;
  attachments: Attachment[];
  createdBy: User;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface ResearchProposal {
  id: string;
  callId: string;
  call?: CallForProposal;
  title: string;
  abstract: string;
  background: string;
  objectives: string;
  methodology: string;
  expectedOutcomes: string;
  ethicalConsiderations: string;
  principalInvestigator: User;
  coInvestigators: TeamMember[];
  institution: string;
  researchArea: string;
  studyType?: string;
  studyRegions?: string[];
  duration?: number;
  budget: Budget;
  timeline: TimelineItem[];
  status: ProposalStatus;
  attachments: Attachment[];
  reviews: ProposalReview[];
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  userId?: string;
  name: string;
  email: string;
  role: "co_pi" | "researcher" | "assistant";
  institution: string;
  expertise: string;
}

export interface Budget {
  personnel: number;
  equipment: number;
  consumables: number;
  travel: number;
  other: number;
  total: number;
  justification?: string;
}

export interface TimelineItem {
  id: string;
  activity: string;
  startMonth: number;
  endMonth: number;
  deliverables: string;
}

export interface ProposalReview {
  id: string;
  proposalId: string;
  reviewerId: string;
  reviewer: User;
  technicalMerit: number;
  methodology: number;
  feasibility: number;
  budget: number;
  impact: number;
  overallScore: number;
  strengths: string;
  weaknesses: string;
  recommendation: "approve" | "revise" | "reject";
  comments: string;
  createdAt: string;
}

// Research Monitoring Types
export interface ResearchProject {
  id: string;
  proposalId: string;
  proposal: ResearchProposal;
  contractNumber: string;
  startDate: string;
  endDate: string;
  status: "active" | "on_track" | "at_risk" | "delayed" | "completed" | "suspended" | "terminated";
  milestones: Milestone[];
  progressReports: ProgressReport[];
  budgetUtilization: BudgetUtilization;
  outputs: ResearchOutput[];
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: "pending" | "in_progress" | "completed" | "delayed";
  completedAt?: string;
  notes?: string;
}

export interface ProgressReport {
  id: string;
  projectId: string;
  reportingPeriod: string;
  activitiesCompleted: string;
  challenges: string;
  nextSteps: string;
  budgetSpent: number;
  attachments: Attachment[];
  status: "draft" | "submitted" | "approved";
  submittedAt?: string;
  createdAt: string;
}

export interface BudgetUtilization {
  allocated: number;
  spent: number;
  remaining: number;
  breakdown: {
    category: string;
    allocated: number;
    spent: number;
  }[];
}

export interface ResearchOutput {
  id: string;
  type: "publication" | "report" | "dataset" | "presentation" | "other";
  title: string;
  description: string;
  url?: string;
  attachment?: Attachment;
  createdAt: string;
}

// Common Types
export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  user: User;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

// Taxonomy Types
export interface TaxonomyItem {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Institution {
  id: string;
  name: string;
  type: "government" | "academic" | "ngo" | "private" | "international";
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Filter & Sort Types
export interface FilterOptions {
  search?: string;
  status?: string;
  role?: string;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: string | undefined;
}

export interface SortOptions {
  field: string;
  direction: "asc" | "desc";
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}
