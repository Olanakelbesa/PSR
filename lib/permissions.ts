// ============================================================================
// RPDMS — Permissions Configuration
// ============================================================================
// Centralized configuration for all permission strings used in the application.
// These map to the permissions returned by the backend user profile API.

export const PERMISSIONS = {
  // ─── Admin & Settings ────────────────────────────────────────────────────────
  ADMIN_VIEW_LOGENTRY: "admin.view_logentry",
  USER_VIEW: "user_managment.view_user",
  SETTING_VIEW_ORGANIZATION: "setting.view_organization",
  SETTING_CHANGE_GRANTSETTING: "setting.change_grantsetting",
  SETTING_CHANGE_RESEARCHSETTING: "setting.change_researchsetting",
  SETTING_VIEW_GRANTCALL: "setting.view_grantcall",
  SETTING_VIEW_GRANTSETTING: "setting.view_grantsetting",

  // ─── Policy Management ───────────────────────────────────────────────────────
  POLICY_VIEW_CONCEPT_NOTE_WORKFLOW: "policy_proposals.view_concept_note_workflow",
  POLICY_REVIEW_CONCEPT_NOTE: "policy_proposals.review_concept_note",
  POLICY_VIEW_DRAFT_WORKFLOW: "policy_development.view_policy_draft_workflow",
  POLICY_REVIEW_DRAFT: "policy_development.review_policy_draft",
  POLICY_VIEW_REPOSITORY: "policy_repository.view_registeredpolicy",

  // ─── Research Management ─────────────────────────────────────────────────────
  RESEARCH_VIEW_SCREENING: "research_review.view_screening",
  RESEARCH_CHANGE_PROPOSAL: "research_proposals.change_proposal",
  RESEARCH_VIEW_INDIVIDUAL_REVIEW: "research_review.view_individualreview",
  RESEARCH_VIEW_READY_FOR_FUNDING: "research_review.view_readyforfunding",
  RESEARCH_VIEW_ETHICAL_CLEARANCE: "research_review.view_ethicalclearance",
  RESEARCH_VIEW_FUNDING_RECOMMENDATION: "research_review.view_fundingrecommendation",
  RESEARCH_VIEW_MINUTES: "research_review.view_minutes",
  RESEARCH_VIEW_FINAL_SUBMISSION: "research_outputs.view_finalsubmission",

  // ─── Research Monitoring ─────────────────────────────────────────────────────
  MONITORING_VIEW_PROJECT_TRACKING: "research_monitoring.view_projecttracking",
  MONITORING_VIEW_PROGRESS_REPORT_APPROVAL: "research_monitoring.view_progressreportapproval",
  MONITORING_VIEW_TERMINAL_REPORT_APPROVAL: "research_monitoring.view_terminalreportapproval",

  // ─── External Research ───────────────────────────────────────────────────────
  EXTERNAL_RESEARCH_VIEW: "external_research.view_externalresearch",
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export type PermissionValue = typeof PERMISSIONS[PermissionKey];
