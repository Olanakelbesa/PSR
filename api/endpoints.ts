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
    POLICY_DOCUMENT_TYPES: "/v1/policydocumenttypes/",
    THEMATIC_AREAS: "/v1/thematicareas",
    SUB_THEMATIC_AREAS: "/v1/subthematicareas",
    TEAM_MEMBER_ROLES: "/v1/team-member-roles",
    PROPOSAL_TYPES: "/v1/proposal-types",
    SUB_CALL_TYPES: "/v1/subcalltypes",
    OFFICE_LEVELS: "/v1/office-levels",
    OFFICES: "/v1/offices",
    INTERNAL_USERS: "/v1/internal-users",
  },

  // ── Concept Notes ─────────────────────────────────────────────────────────
  CONCEPT_NOTES: {
    LIST: "/v1/concept-notes/",
    DETAIL: (id: string | number) => `/v1/concept-notes/${id}/`,
    CREATE: "/v1/concept-notes/",
    UPDATE: (id: string | number) => `/v1/concept-notes/${id}/`,
    SUBMIT: (id: string | number) => `/v1/concept-notes/${id}/submit/`,
    REVIEW: (id: string | number) => `/v1/concept-notes/${id}/reviews/`,
  },

  // ── Policy Documents ──────────────────────────────────────────────────────
  POLICIES: {
    LIST: "/policies",
    DETAIL: (id: string) => `/policies/${id}`,
    CREATE: "/policies",
    UPDATE: (id: string) => `/policies/${id}`,
    PUBLISH: (id: string) => `/policies/${id}/publish`,
  },

  // ── Calls for Proposals ───────────────────────────────────────────────────
  CALLS: {
    LIST: "/calls",
    DETAIL: (id: string) => `/calls/${id}`,
    CREATE: "/calls",
    UPDATE: (id: string) => `/calls/${id}`,
    PUBLISH: (id: string) => `/calls/${id}/publish`,
  },

  // ── Research Proposals ────────────────────────────────────────────────────
  PROPOSALS: {
    LIST: "/proposals",
    DETAIL: (id: string) => `/proposals/${id}`,
    CREATE: "/proposals",
    UPDATE: (id: string) => `/proposals/${id}`,
    SUBMIT: (id: string) => `/proposals/${id}/submit`,
    ASSIGN_REVIEWERS: (id: string) => `/proposals/${id}/assign-reviewers`,
    REVIEWS: (id: string) => `/proposals/${id}/reviews`,
    OPTIONS: "/proposals/options",
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
