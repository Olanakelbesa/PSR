// ============================================================================
// PSR Platform — Central API Configuration
// ============================================================================
// All endpoint definitions are centralized here.
// Services import from this file — never hardcode URLs in components.

export const API_CONFIG = {
  // Routes through the Next.js BFF proxy (hides real backend URL)
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api",

  endpoints: {
    // ── Auth ──────────────────────────────────────────────────────────────
    auth: {
      login: "/auth/login",
      logout: "/auth/logout",
      refresh: "/auth/refresh",
      me: "/auth/me",
      requestOtp: "/auth/request-otp",
      verifyOtp: "/auth/verify-otp",
    },

    // ── Reference Data ────────────────────────────────────────────────────
    reference: {
      titles: "/v1/titles/",
      organizationTypes: "/v1/organizationtypes/",
      units: "/v1/units/",
      organizations: "/v1/organizations/",
      policyDocumentTypes: "/v1/policydocumenttypes/",
    },

    // ── Users ─────────────────────────────────────────────────────────────
    users: {
      list: "/users",
      detail: (id: string) => `/users/${id}`,
      create: "/users",
      update: (id: string) => `/users/${id}`,
      delete: (id: string) => `/users/${id}`,
    },

    // ── Policy Management ─────────────────────────────────────────────────
    conceptNotes: {
      list: "/v1/concept-notes/",
      detail: (id: string | number) => `/v1/concept-notes/${id}/`,
      create: "/v1/concept-notes/",
      update: (id: string | number) => `/v1/concept-notes/${id}/`,
      submit: (id: string | number) => `/v1/concept-notes/${id}/submit/`,
      review: (id: string | number) => `/v1/concept-notes/${id}/reviews/`,
    },
    policies: {
      list: "/policies",
      detail: (id: string) => `/policies/${id}`,
      create: "/policies",
      update: (id: string) => `/policies/${id}`,
      publish: (id: string) => `/policies/${id}/publish`,
    },

    // ── Research Management ───────────────────────────────────────────────
    calls: {
      list: "/calls",
      detail: (id: string) => `/calls/${id}`,
      create: "/calls",
      update: (id: string) => `/calls/${id}`,
      publish: (id: string) => `/calls/${id}/publish`,
    },
    proposals: {
      list: "/proposals",
      detail: (id: string) => `/proposals/${id}`,
      create: "/proposals",
      update: (id: string) => `/proposals/${id}`,
      submit: (id: string) => `/proposals/${id}/submit`,
      assignReviewers: (id: string) => `/proposals/${id}/assign-reviewers`,
      reviews: (id: string) => `/proposals/${id}/reviews`,
      submitReview: (id: string) => `/proposals/${id}/reviews`,
    },

    // ── Monitoring ────────────────────────────────────────────────────────
    projects: {
      list: "/projects",
      detail: (id: string) => `/projects/${id}`,
      progressReports: (id: string) => `/projects/${id}/progress-reports`,
      submitProgressReport: (id: string) => `/projects/${id}/progress-reports`,
      approveProgressReport: (projectId: string, reportId: string) =>
        `/projects/${projectId}/progress-reports/${reportId}/approve`,
    },

    // ── Grants ────────────────────────────────────────────────────────────
    grants: {
      list: "/grants",
      detail: (id: string) => `/grants/${id}`,
      create: "/grants",
      update: (id: string) => `/grants/${id}`,
    },

    // ── External Research ─────────────────────────────────────────────────
    externalResearch: {
      list: "/external-research",
      detail: (id: string) => `/external-research/${id}`,
      create: "/external-research",
      update: (id: string) => `/external-research/${id}`,
    },

    // ── Administration ────────────────────────────────────────────────────
    organizations: {
      list: "/organizations",
      detail: (id: string) => `/organizations/${id}`,
      create: "/organizations",
    },
    auditLogs: {
      list: "/audit-logs",
    },
    thematicArea: {
      list: "/v1/thematicareas"
    },
    notifications: {
      list: (userId: string) => `/notifications?userId=${userId}`,
      markRead: (id: string) => `/notifications/${id}/read`,
      markAllRead: "/notifications/mark-all-read",
    },
    dashboard: {
      stats: (role: string) => `/dashboard/stats?role=${role}`,
    },
  },
} as const;

export type ApiConfig = typeof API_CONFIG;
