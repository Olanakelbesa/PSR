// ============================================================================
// PSR Platform — Canonical API Endpoint Registry
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
    REQUEST_OTP: "/auth/request-otp",
    VERIFY_OTP: "/auth/verify-otp",
  },

  // ── Users ─────────────────────────────────────────────────────────────────
  USERS: {
    LIST: "/users",
    SELECTOR: "/v1/users/selector/",
    DETAIL: (id: string) => `/users/${id}`,
    CREATE: "/users",
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
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
    LIST: "/v1/policy-repository/",
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
    ASSIGN_REVIEWERS: (id: string | number) =>
      `/v1/screenings/${id}/assign-reviewers/`,
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

  // ── Grants ────────────────────────────────────────────────────────────────
  GRANTS: {
    LIST: "/grants",
    DETAIL: (id: string) => `/grants/${id}`,
    CREATE: "/grants",
    UPDATE: (id: string) => `/grants/${id}`,
  },

  // ── External Research ─────────────────────────────────────────────────────
  EXTERNAL_RESEARCH: {
    LIST: "/external-research",
    DETAIL: (id: string) => `/external-research/${id}`,
    CREATE: "/external-research",
    UPDATE: (id: string) => `/external-research/${id}`,
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────
  DASHBOARD: {
    STATS: (role: string) => `/dashboard/stats?role=${role}`,
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  NOTIFICATIONS: {
    LIST: (userId: string) => `/notifications?userId=${userId}`,
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: "/notifications/mark-all-read",
  },

  // ── Audit Logs ────────────────────────────────────────────────────────────
  AUDIT_LOGS: {
    LIST: "/audit-logs",
  },
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;
