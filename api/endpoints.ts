// ============================================================================
// RPDMS — Canonical API Endpoint Registry
// ============================================================================
// Rule ref: NEXTJS_FRONTEND_API_RULES.md §3.2
//
// ALL endpoint paths live here. No hardcoded URLs anywhere else in the app.
// Naming: UPPER_SNAKE_CASE for keys, as per the doc conventions.
//
// Usage:
//   import { API_ENDPOINTS } from "@/api/endpoints";
//   apiClient.get(API_ENDPOINTS.CONCEPT_NOTES.LIST)

export const API_ENDPOINTS = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    ME: "/auth/me",
    REGISTER: "/register/",
    REGISTER_VERIFY: "/register/verify/",
    PASSWORD_RESET_REQUEST: "/password-reset/request/",
    PASSWORD_RESET_VERIFY: "/password-reset/verify/",
    PASSWORD_RESET_COMPLETE: "/password-reset/complete/",
    REQUEST_OTP: "/password-reset/request/",
    VERIFY_OTP: "/password-reset/verify/",
  },

  // ── Users ─────────────────────────────────────────────────────────────────
  USERS: {
    LIST: "/users",
    SELECTOR: "/v1/users/selector/",
    ME: "/v1/users/me/",
    ADMIN: {
      LIST: "/v1/admin/users/",
      DETAIL: (id: string | number) => `/v1/admin/users/${id}/`,
      CREATE: "/v1/admin/users/",
      UPDATE: (id: string | number) => `/v1/admin/users/${id}/`,
      DELETE: (id: string | number) => `/v1/admin/users/${id}/`,
    },
    DETAIL: (id: string) => `/users/${id}`,
    CREATE: "/users",
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
  },

  // ── Contact Us ───────────────────────────────────────────────────────────
  CONTACT_US: {
    LIST: "/v1/contact-us/",
    DETAIL: (id: string | number) => `/v1/contact-us/${id}/`,
    CREATE: "/v1/contact-us/",
    UPDATE: (id: string | number) => `/v1/contact-us/${id}/`,
    DELETE: (id: string | number) => `/v1/contact-us/${id}/`,
  },

  // ── Reference Data ────────────────────────────────────────────────────────
  REFERENCE: {
    TITLES: "/v1/titles/",
    ORGANIZATION_TYPES: "/v1/organizationtypes/",
    UNITS: "/v1/units/",
    ORGANIZATIONS: "/v1/organizations/",
    STRATEGIC_OBJECTIVES: "/v1/strategicobjectives",
    POLICY_DOCUMENT_TYPES: "/v1/policydocumenttypes/",
    THEMATIC_AREAS: "/v1/thematicareas",
    SUB_THEMATIC_AREAS: "/v1/subthematicareas",
    TEAM_MEMBER_ROLES: "/v1/teammemberroles/",
    PROPOSAL_TYPES: "/v1/proposaltypes/",
    SUB_CALL_TYPES: "/v1/subcalltypes",
    OFFICE_LEVELS: "/v1/office-levels",
    OFFICES: "/v1/offices",
    INTERNAL_USERS: "/v1/users/selector/",
    CHECKLIST_TEMPLATES: "/v1/checklisttemplates/",
  },

  // ── Concept Notes ─────────────────────────────────────────────────────────
  CONCEPT_NOTES: {
    LIST: "/v1/concept-notes/",
    MANAGE: "/v1/concept-notes/manage/",
    DETAIL: (id: string | number) => `/v1/concept-notes/${id}/`,
    MANAGE_DETAIL: (id: string | number) => `/v1/concept-notes/${id}/manage/`,
    CREATE: "/v1/concept-notes/",
    UPDATE: (id: string | number) => `/v1/concept-notes/${id}/`,
    SUBMIT: (id: string | number) => `/v1/concept-notes/${id}/submit/`,
    RESUBMIT: (id: string | number) => `/v1/concept-notes/${id}/resubmit/`,
    REVIEW: (id: string | number) => `/v1/concept-notes/${id}/review/`,
    ASSIGN_REVIEWER: (id: string | number) =>
      `/v1/concept-notes/${id}/assign-reviewer/`,
    ASSIGNED_REVIEWERS: (id: string | number) =>
      `/v1/concept-notes/${id}/assigned-reviewers/`,
    APPROVAL: (id: string | number) => `/v1/concept-notes/${id}/psr-approval/`,
    MY_REVIEWS: "/v1/concept-notes/my-reviews/",
    MY_REVIEW_DETAIL: (id: string | number) =>
      `/v1/concept-notes/${id}/my-reviews/`,
  },

  // ── Policy Drafts ─────────────────────────────────────────────────────────
  POLICY_DRAFTS: {
    LIST: "/v1/policy-drafts/",
    MANAGE: "/v1/policy-drafts/manage/",
    DETAIL: (id: string | number) => `/v1/policy-drafts/${id}/`,
    CREATE: "/v1/policy-drafts/",
    UPDATE: (id: string | number) => `/v1/policy-drafts/${id}/`,
    SUBMIT: (id: string | number) => `/v1/policy-drafts/${id}/submit/`,
    ASSIGN_REVIEWERS: (id: string | number) =>
      `/v1/policy-drafts/${id}/assign-reviewers/`,
    ASSIGNED_REVIEWERS: (id: string | number) =>
      `/v1/policy-drafts/${id}/assigned-reviewers/`,
    PSR_DECISION: (id: string | number) =>
      `/v1/policy-drafts/${id}/psr-decision/`,
    MY_REVIEWS: "/v1/policy-drafts/my-reviews/",
    MY_REVIEW_DETAIL: (id: string | number) =>
      `/v1/policy-drafts/${id}/my-reviews/`,
    GET_CHECKLIST: (id: string | number, versionId: string | number) =>
      `/v1/policy-drafts/${id}/versions/${versionId}/checklist/`,
    SUBMIT_CHECKLIST_REVIEW: (
      id: string | number,
      versionId: string | number,
    ) => `/v1/policy-drafts/${id}/versions/${versionId}/checklist-review/`,
  },

  // ── Policy Documents ──────────────────────────────────────────────────────
  POLICIES: {
    LIST: "/policies",
    DETAIL: (id: string) => `/policies/${id}`,
    CREATE: "/policies",
    UPDATE: (id: string) => `/policies/${id}`,
    PUBLISH: (id: string) => `/policies/${id}/publish`,
  },

  POLICY_REPOSITORY: {
    LIST: "/v1/policy-repository",
    DETAIL: (id: string | number) => `/v1/policy-repository/${id}/`,
    REGISTER: "/v1/policy-repository/register/",
  },

  // ── Calls for Proposals ───────────────────────────────────────────────────
  CALLS: {
    LIST: "/calls",
    DETAIL: (id: string) => `/calls/${id}`,
    CREATE: "/calls",
    UPDATE: (id: string) => `/calls/${id}`,
    PUBLISH: (id: string) => `/calls/${id}/publish`,
  },

  // ── Grant Calls ──────────────────────────────────────────────────────────
  GRANT_CALLS: {
    LIST: "/v1/grant-calls/",
    DETAIL: (id: string | number) => `/v1/grant-calls/${id}/`,
    PUBLISH: (id: string | number) => `/v1/grant-calls/${id}/publish/`,
  },

  // ── Research Proposals ────────────────────────────────────────────────────
  PROPOSALS: {
    LIST: "/v1/proposals",
    MANAGE: "/v1/proposals/manage/",
    DETAIL: (id: string) => `/v1/proposals/${id}/`,
    MANAGE_DETAIL: (id: string | number) => `/v1/proposals/${id}/manage/`,
    CREATE: "/v1/proposals/",
    UPDATE: (id: string) => `/v1/proposals/${id}/`,
    SUBMIT: (id: string) => `/v1/proposals/${id}/submit/`,
    ASSIGN_REVIEWERS: (id: string) => `/v1/proposals/${id}/assign-reviewers/`,
    REVIEWS: (id: string) => `/v1/proposals/${id}/reviews/`,
    OPTIONS: "/v1/proposals/options/",
  },

  // ── Screenings ───────────────────────────────────────────────────────────
  SCREENINGS: {
    LIST: "/v1/screenings/",
    DETAIL: (id: string | number) => `/v1/screenings/${id}/`,
    REVIEWED_WITH_MARKS: "/v1/screenings/reviewed-with-marks/",
    ASSIGN_REVIEWERS: (id: string | number) =>
      `/v1/screenings/${id}/assign-reviewers/`,
    REVIEW_HISTORY: (id: string | number) =>
      `/v1/screenings/${id}/review-history/`,
    APPROVED_PENDING_FUNDING: (id: string | number) =>
      `/v1/screenings/${id}/approved-pending-funding/`,
  },

  // ── Individual Reviews ───────────────────────────────────────────────────
  INDIVIDUAL_REVIEWS: {
    LIST: "/v1/individual-reviews/",
    DETAIL: (id: string | number) => `/v1/individual-reviews/${id}/`,
  },

  // ── Review Questions ──────────────────────────────────────────────────────
  REVIEW_QUESTIONS: {
    LIST: "/v1/reviewquestions/",
  },

  PROPOSAL_TEAM_MEMBERS: {
    LIST: "/v1/proposalteammembers/",
    CREATE: "/v1/proposalteammembers/",
    DETAIL: (id: string | number) => `/v1/proposalteammembers/${id}/`,
    UPDATE: (id: string | number) => `/v1/proposalteammembers/${id}/`,
    DELETE: (id: string | number) => `/v1/proposalteammembers/${id}/`,
  },

  // ── Proposal Template Sections ────────────────────────────────────────────
  PROPOSAL_TEMPLATE_SECTION: {
    LIST: "/proposal-template-sections",
  },

  // ── Projects / Monitoring ─────────────────────────────────────────────────
  PROJECTS: {
    LIST: "/projects",
    DETAIL: (id: string) => `/projects/${id}`,
    PROGRESS_REPORTS: (id: string) => `/projects/${id}/progress-reports`,
    SUBMIT_PROGRESS_REPORT: (id: string) => `/projects/${id}/progress-reports`,
    APPROVE_PROGRESS_REPORT: (projectId: string, reportId: string) =>
      `/projects/${projectId}/progress-reports/${reportId}/approve`,
  },

  // ── Monitoring v1 Reports ────────────────────────────────────────────────
  PROGRESS_REPORTS: {
    LIST: "/v1/progress-reports/",
    DETAIL: (id: string | number) => `/v1/progress-reports/${id}/`,
    CREATE: "/v1/progress-reports/",
  },

  PROGRESS_REPORT_APPROVALS: {
    LIST: "/v1/progress-report-approvals/",
    DETAIL: (id: string | number) => `/v1/progress-report-approvals/${id}/`,
    UPDATE: (id: string | number) => `/v1/progress-report-approvals/${id}/`,
  },

  TERMINAL_REPORT_APPROVALS: {
    LIST: "/v1/terminal-report-approvals/",
    DETAIL: (id: string | number) => `/v1/terminal-report-approvals/${id}/`,
    UPDATE: (id: string | number) => `/v1/terminal-report-approvals/${id}/`,
  },

  TERMINAL_REPORTS: {
    LIST: "/v1/terminal-reports/",
    DETAIL: (id: string | number) => `/v1/terminal-reports/${id}/`,
    CREATE: "/v1/terminal-reports/",
  },

  TERMINAL_REPORT_TYPES: {
    LIST: "/v1/terminalreporttypes/",
  },

  // ── Grants ────────────────────────────────────────────────────────────────
  GRANTS: {
    LIST: "/grants",
    DETAIL: (id: string) => `/grants/${id}`,
    CREATE: "/grants",
    UPDATE: (id: string) => `/grants/${id}`,
  },

  // ── External Research ─────────────────────────────────────────────────────
  EXTERNAL_RESEARCH: {
    LIST: "/v1/external-research/",
    DETAIL: (id: string | number) => `/v1/external-research/${id}/`,
    CREATE: "/v1/external-research/",
    UPDATE: (id: string | number) => `/v1/external-research/${id}/`,
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────
  DASHBOARD: {
    ANALYTICS: "/v1/dashboard/analytics/",
    PUBLIC_OVERVIEW: "/v1/public/overview/",
    STATS: (role: string) => `/dashboard/stats?role=${role}`,
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  NOTIFICATIONS: {
    LIST: "/v1/notifications/",
    MARK_READ: (id: string | number) => `/v1/notifications/${id}/mark-read/`,
  },

  // ── Audit Logs ────────────────────────────────────────────────────────────
  AUDIT_LOGS: {
    LIST: "/v1/audit-logs/",
  },

  // ── Ready For Funding ─────────────────────────────────────────────
  READY_FOR_FUNDING: {
    LIST: "/v1/screenings/approved-pending-funding/",
    DETAIL: (id: string | number) => `/v1/screenings/${id}/`,
    CREATE_DECISION: (id: string | number) =>
      `/v1/screenings/${id}/ready-for-funding/`,
  },

  PROJECT_TRACKING: {
    LIST: "/v1/project-tracking/",
    CREATE: "/v1/project-tracking/",
    DETAIL: (id: string | number) => `/v1/project-tracking/${id}/`,
    READY_FOR_TRACKING: "/v1/project-tracking/ready-for-tracking/",
  },

  // ── Funding Recommendations ───────────────────────────────────────────────
  FUNDING_RECOMMENDATIONS: {
    LIST: "/v1/funding-recommendations/",
    DETAIL: (id: string | number) => `/v1/funding-recommendations/${id}/`,
    READY_FOR_FINAL_SUBMISSION:
      "/v1/funding-recommendations/ready-for-final-submission/",
  },

  FINAL_SUBMISSIONS: {
    LIST: "/v1/final-submissions/",
    CREATE: "/v1/final-submissions/",
    DETAIL: (id: string | number) => `/v1/final-submissions/${id}/`,
  },

  OUTPUT_TYPES: {
    LIST: "/v1/outputtypes/",
  },

  DATA_CENTERS: {
    LIST: "/v1/datacenters/",
  },

  MINUTES: {
    LIST: "/v1/minutes/",
    CREATE: "/v1/minutes/",
    DETAIL: (id: string | number) => `/v1/minutes/${id}/`,
  },

  ETHICAL_CLEARANCES: {
    LIST: "/v1/ethical-clearances/",
    DETAIL: (id: number) => `/v1/ethical-clearances/${id}/`,
    CREATE: "/v1/ethical-clearances/",
    UPDATE: (id: number) => `/v1/ethical-clearances/${id}/`,
  },
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;
