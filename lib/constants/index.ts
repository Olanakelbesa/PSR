// ============================================================================
// PSR Platform Constants
// ============================================================================

import type {
  UserRole,
  PolicyStatus,
  PolicyType,
  ProposalStatus,
  CallStatus,
} from "@/lib/types";

// Role Configuration
export const ROLES: Record<
  UserRole,
  { label: string; description: string; color: string }
> = {
  system_admin: {
    label: "System Administrator",
    description: "Full system access and configuration",
    color: "bg-red-100 text-red-800",
  },
  psr_officer: {
    label: "PSR Officer",
    description: "Policy & System Reform office staff",
    color: "bg-blue-100 text-blue-800",
  },
  leo_officer: {
    label: "LEO Officer",
    description: "Learning & Evidence Office staff",
    color: "bg-indigo-100 text-indigo-800",
  },
  researcher: {
    label: "Researcher",
    description: "Principal or co-investigator on research projects",
    color: "bg-green-100 text-green-800",
  },
  roc_reviewer: {
    label: "ROC Reviewer",
    description: "Research Oversight Committee member",
    color: "bg-purple-100 text-purple-800",
  },
  director: {
    label: "Director",
    description: "Senior leadership and decision maker",
    color: "bg-amber-100 text-amber-800",
  },
  institutional_partner: {
    label: "Institutional Partner",
    description: "Partner organization representative",
    color: "bg-cyan-100 text-cyan-800",
  },
};

// Policy Status Configuration
export const POLICY_STATUSES: Record<
  PolicyStatus,
  { label: string; color: string }
> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-800" },
  submitted: { label: "Submitted", color: "bg-blue-100 text-blue-800" },
  under_review: {
    label: "Under Review",
    color: "bg-yellow-100 text-yellow-800",
  },
  revision_requested: {
    label: "Revision Requested",
    color: "bg-orange-100 text-orange-800",
  },
  approved: { label: "Approved", color: "bg-green-100 text-green-800" },
  published: { label: "Published", color: "bg-emerald-100 text-emerald-800" },
  archived: { label: "Archived", color: "bg-slate-100 text-slate-800" },
};

// Policy Type Configuration
export const POLICY_TYPES: Record<
  PolicyType,
  { label: string; description: string }
> = {
  policy: { label: "Policy", description: "High-level policy document" },
  strategy: { label: "Strategy", description: "Strategic framework or plan" },
  guideline: { label: "Guideline", description: "Operational guidelines" },
  protocol: { label: "Protocol", description: "Standard operating protocol" },
  standard: { label: "Standard", description: "Technical or quality standard" },
  directive: { label: "Directive", description: "Administrative directive" },
};

// Proposal Status Configuration
export const PROPOSAL_STATUSES: Record<
  ProposalStatus,
  { label: string; color: string }
> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-800" },
  submitted: { label: "Submitted", color: "bg-blue-100 text-blue-800" },
  under_review: {
    label: "Under Review",
    color: "bg-yellow-100 text-yellow-800",
  },
  revision_requested: {
    label: "Revision Requested",
    color: "bg-orange-100 text-orange-800",
  },
  approved: { label: "Approved", color: "bg-green-100 text-green-800" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
  contracted: { label: "Contracted", color: "bg-indigo-100 text-indigo-800" },
  in_progress: { label: "In Progress", color: "bg-cyan-100 text-cyan-800" },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-800" },
  terminated: { label: "Terminated", color: "bg-slate-100 text-slate-800" },
};

// Call Status Configuration
export const CALL_STATUSES: Record<
  CallStatus,
  { label: string; color: string }
> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-800" },
  open: { label: "Open", color: "bg-green-100 text-green-800" },
  closed: { label: "Closed", color: "bg-red-100 text-red-800" },
  cancelled: { label: "Cancelled", color: "bg-slate-100 text-slate-800" },
};

// Navigation Configuration
export interface NavItem {
  title: string;
  href: string;
  icon: string;
  roles?: UserRole[];
  children?: NavItem[];
}

export const MAIN_NAV: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
  },
  {
    title: "Users",
    href: "/users",
    icon: "Users",
    roles: ["system_admin", "psr_officer"],
  },
  {
    title: "Policies",
    href: "/policies",
    icon: "FileText",
    children: [
      {
        title: "Concept Notes",
        href: "/policies/concept-notes",
        icon: "FileEdit",
      },
      { title: "Draft Reviews", href: "/policies/drafts", icon: "FileClock" },
      { title: "Repository", href: "/policies/repository", icon: "Library" },
    ],
  },
  {
    title: "Research",
    href: "/research",
    icon: "FlaskConical",
    children: [
      {
        title: "Call for Proposals",
        href: "/research/calls",
        icon: "Megaphone",
      },
      { title: "My Proposals", href: "/research/proposals", icon: "FileStack" },
      {
        title: "Reviews",
        href: "/research/reviews",
        icon: "ClipboardCheck",
        roles: ["roc_reviewer", "psr_officer"],
      },
      { title: "Monitoring", href: "/research/monitoring", icon: "Activity" },
    ],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: "Settings",
    roles: ["system_admin"],
    children: [
      { title: "Taxonomy", href: "/settings/taxonomy", icon: "Tags" },
      { title: "Audit Logs", href: "/settings/audit-logs", icon: "History" },
      { title: "System", href: "/settings/system", icon: "Cog" },
    ],
  },
];

// Priority Areas for Research
export const PRIORITY_AREAS = [
  "Health System Strengthening",
  "Primary Health Care",
  "Maternal & Child Health",
  "Communicable Diseases",
  "Non-Communicable Diseases",
  "Health Workforce",
  "Health Financing",
  "Digital Health",
  "Pharmaceuticals & Medical Devices",
  "Environmental Health",
  "Mental Health",
  "Nutrition",
  "Emergency & Disaster Response",
];

// Thematic Areas for Research (with labels for display)
export const THEMATIC_AREAS = [
  { value: "health-system", label: "Health System Strengthening" },
  { value: "primary-health", label: "Primary Health Care" },
  { value: "maternal-child", label: "Maternal & Child Health" },
  { value: "communicable-disease", label: "Communicable Diseases" },
  { value: "ncd", label: "Non-Communicable Diseases" },
  { value: "workforce", label: "Health Workforce" },
  { value: "financing", label: "Health Financing" },
  { value: "digital-health", label: "Digital Health" },
  { value: "pharmaceuticals", label: "Pharmaceuticals & Medical Devices" },
  { value: "environmental", label: "Environmental Health" },
  { value: "mental-health", label: "Mental Health" },
  { value: "nutrition", label: "Nutrition" },
  { value: "emergency-response", label: "Emergency & Disaster Response" },
];

// Research Categories
export const RESEARCH_CATEGORIES = [
  "Implementation Research",
  "Health Systems Research",
  "Clinical Research",
  "Epidemiological Research",
  "Health Economics Research",
  "Policy Analysis",
  "Program Evaluation",
  "Quality Improvement",
];

// Institution Types
export const INSTITUTION_TYPES = [
  { value: "government", label: "Government" },
  { value: "academic", label: "Academic/University" },
  { value: "ngo", label: "NGO/Civil Society" },
  { value: "private", label: "Private Sector" },
  { value: "international", label: "International Organization" },
];

// Budget Categories
export const BUDGET_CATEGORIES = [
  { key: "personnel", label: "Personnel Costs" },
  { key: "equipment", label: "Equipment" },
  { key: "consumables", label: "Consumables & Supplies" },
  { key: "travel", label: "Travel & Per Diem" },
  { key: "other", label: "Other Direct Costs" },
];

// Review Criteria for Proposals
export const REVIEW_CRITERIA = [
  { key: "technicalMerit", label: "Technical Merit", maxScore: 25 },
  { key: "methodology", label: "Methodology", maxScore: 25 },
  { key: "feasibility", label: "Feasibility", maxScore: 20 },
  { key: "budget", label: "Budget Appropriateness", maxScore: 15 },
  { key: "impact", label: "Potential Impact", maxScore: 15 },
];

// File Upload Configuration
export const ALLOWED_FILE_TYPES = {
  document: [".pdf", ".doc", ".docx", ".odt", ".rtf"],
  spreadsheet: [".xlsx", ".xls", ".csv"],
  image: [".jpg", ".jpeg", ".png", ".gif"],
  all: [
    ".pdf",
    ".doc",
    ".docx",
    ".odt",
    ".rtf",
    ".xlsx",
    ".xls",
    ".csv",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
  ],
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Pagination Defaults
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Date Formats
export const DATE_FORMAT = "MMM dd, yyyy";
export const DATE_TIME_FORMAT = "MMM dd, yyyy HH:mm";
export const API_DATE_FORMAT = "yyyy-MM-dd";
