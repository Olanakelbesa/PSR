// ============================================================================
// RPDMS — Permissions Configuration
// ============================================================================
// Django permission codenames returned by GET /v1/users/me/ (data.permissions).
// Format: "<app_label>.<action>_<model>" or custom codenames on model Meta.

export const PERMISSIONS = {
  // ─── Admin & Audit ─────────────────────────────────────────────────────────
  ADMIN_VIEW_LOGENTRY: "admin.view_logentry",
  AUDIT_VIEW_DOCUMENT_EVENT: "audit_logs.view_documentauditevent",

  // ─── User Management ───────────────────────────────────────────────────────
  USER_VIEW: "user_managment.view_user",
  USER_CHANGE: "user_managment.change_user",
  USER_ADD: "user_managment.add_user",
  USER_DELETE: "user_managment.delete_user",
  ROLE_VIEW: "user_managment.view_role",

  REPORTS_VIEW: "user_managment.view_reports",
  REPORTS_GENERATE: "user_managment.generate_reports",

  // ─── Settings & Reference Data ─────────────────────────────────────────────
  SETTING_VIEW_ORGANIZATION: "setting.view_organization",
  SETTING_CHANGE_ORGANIZATION: "setting.change_organization",
  SETTING_VIEW_GRANTCALL: "setting.view_grantcall",
  SETTING_CHANGE_GRANTCALL: "setting.change_grantcall",
  SETTING_VIEW_GRANTSETTING: "setting.view_grantsetting",
  SETTING_CHANGE_GRANTSETTING: "setting.change_grantsetting",
  SETTING_VIEW_ATTACHMENT: "setting.view_attachment",
  SETTING_ADD_ATTACHMENT: "setting.add_attachment",
  SETTING_CHANGE_ATTACHMENT: "setting.change_attachment",
  SETTING_DELETE_ATTACHMENT: "setting.delete_attachment",
  SETTING_VIEW_RESEARCHSETTING: "setting.view_researchsetting",
  SETTING_CHANGE_RESEARCHSETTING: "setting.change_researchsetting",

  // ─── Policy — Concept Notes ──────────────────────────────────────────────────
  POLICY_VIEW_CONCEPTNOTE: "policy_proposals.view_conceptnote",
  POLICY_ADD_CONCEPTNOTE: "policy_proposals.add_conceptnote",
  POLICY_VIEW_CONCEPT_NOTE_SUBMITTED_QUEUE:
    "policy_proposals.view_concept_note_submitted_queue",
  POLICY_VIEW_CONCEPT_SUBMITTED_QUEUE: "policy_proposals.view_submitted_queue",
  POLICY_REVIEW_CONCEPT_NOTE: "policy_proposals.review_concept_note",
  POLICY_VIEW_ASSIGNED_CONCEPT_REVIEWS:
    "policy_proposals.view_assigned_reviews",
  POLICY_ASSIGN_CONCEPT_REVIEWER: "policy_proposals.assign_reviewer",
  POLICY_APPROVE_CONCEPT_NOTE: "policy_proposals.approve_concept_note",

  // ─── Policy — Drafts ─────────────────────────────────────────────────────────
  POLICY_VIEW_POLICYDRAFT: "policy_development.view_policydraft",
  POLICY_VIEW_DRAFT_SUBMITTED_QUEUE:
    "policy_development.view_policy_draft_submitted_queue",
  POLICY_VIEW_DRAFT_SUBMITTED_QUEUE_ALT:
    "policy_development.view_submitted_queue",
  POLICY_REVIEW_DRAFT: "policy_development.review_policy_draft",
  POLICY_VIEW_ASSIGNED_DRAFT_REVIEWS:
    "policy_development.view_assigned_reviews",
  POLICY_ASSIGN_DRAFT_REVIEWER: "policy_development.assign_reviewer",
  POLICY_PSR_DECISION: "policy_development.psr_decision",

  // ─── Policy — Repository ─────────────────────────────────────────────────────
  POLICY_VIEW_REPOSITORY: "policy_repository.view_registeredpolicy",
  POLICY_ADD_REPOSITORY: "policy_repository.add_registeredpolicy",
  POLICY_DELETE_REPOSITORY: "policy_repository.delete_registeredpolicy",

  // ─── Research — Proposals ────────────────────────────────────────────────────
  RESEARCH_VIEW_PROPOSAL: "research_proposals.view_proposal",
  RESEARCH_ADD_PROPOSAL: "research_proposals.add_proposal",
  RESEARCH_CHANGE_PROPOSAL: "research_proposals.change_proposal",

  // ─── Research — Review & Screening ─────────────────────────────────────────
  RESEARCH_VIEW_SCREENING: "research_review.view_screening",
  RESEARCH_CHANGE_SCREENING: "research_review.change_screening",
  RESEARCH_VIEW_INDIVIDUAL_REVIEW: "research_review.view_individualreview",
  RESEARCH_VIEW_READY_FOR_FUNDING: "research_review.view_readyforfunding",
  RESEARCH_VIEW_ETHICAL_CLEARANCE: "research_review.view_ethicalclearance",
  RESEARCH_CHANGE_ETHICAL_CLEARANCE: "research_review.change_ethicalclearance",
  RESEARCH_ADD_ETHICAL_CLEARANCE: "research_review.add_ethicalclearance",
  RESEARCH_VIEW_FUNDING_RECOMMENDATION:
    "research_review.view_fundingrecommendation",
  RESEARCH_VIEW_MINUTES: "research_review.view_minutes",
  RESEARCH_VIEW_ATTACHMENTS: "setting.view_attachment",

  // ─── Research — Compliance / Protocol ────────────────────────────────────────
  RESEARCH_VIEW_PROTOCOL: "research_compliance.view_protocol",
  RESEARCH_ADD_PROTOCOL: "research_compliance.add_protocol",

  // ─── Research — Outputs ──────────────────────────────────────────────────────
  RESEARCH_VIEW_FINAL_SUBMISSION: "research_outputs.view_finalsubmission",
  RESEARCH_ADD_FINAL_SUBMISSION: "research_outputs.add_finalsubmission",
  RESEARCH_CHANGE_FINAL_SUBMISSION: "research_outputs.change_finalsubmission",

  // ─── Research — Monitoring ───────────────────────────────────────────────────
  MONITORING_VIEW_PROJECT_TRACKING: "research_monitoring.view_projecttracking",
  MONITORING_VIEW_PROGRESS_REPORT: "research_monitoring.view_progressreport",
  MONITORING_SUBMIT_PROGRESS_REPORT:
    "research_monitoring.submit_progress_report",
  MONITORING_VIEW_PROGRESS_REPORT_APPROVAL:
    "research_monitoring.view_progressreportapproval",
  MONITORING_VIEW_TERMINAL_REPORT: "research_monitoring.view_terminalreport",
  MONITORING_SUBMIT_TERMINAL_REPORT:
    "research_monitoring.submit_terminal_report",
  MONITORING_VIEW_TERMINAL_REPORT_APPROVAL:
    "research_monitoring.view_terminalreportapproval",

  // ─── External Research ───────────────────────────────────────────────────────
  EXTERNAL_RESEARCH_VIEW: "external_research.view_externalresearch",
  EXTERNAL_RESEARCH_ADD: "external_research.add_externalresearch",
  RESEARCH_VIEW_EXTERNAL_RESEARCH_APPROVAL:
    "external_research.change_externalresearch",
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export type PermissionValue = (typeof PERMISSIONS)[PermissionKey];

/** Sidebar / UI permission groups (any match grants access). */
export const PERMISSION_GROUPS = {
  CONCEPT_NOTE_MANAGE: [
    PERMISSIONS.POLICY_VIEW_CONCEPT_NOTE_SUBMITTED_QUEUE,
    PERMISSIONS.POLICY_VIEW_CONCEPT_SUBMITTED_QUEUE,
    PERMISSIONS.POLICY_ASSIGN_CONCEPT_REVIEWER,
    PERMISSIONS.POLICY_APPROVE_CONCEPT_NOTE,
  ],
  CONCEPT_NOTE_REVIEW: [
    PERMISSIONS.POLICY_REVIEW_CONCEPT_NOTE,
    PERMISSIONS.POLICY_VIEW_ASSIGNED_CONCEPT_REVIEWS,
  ],
  DRAFT_MANAGE: [
    PERMISSIONS.POLICY_VIEW_DRAFT_SUBMITTED_QUEUE,
    PERMISSIONS.POLICY_VIEW_DRAFT_SUBMITTED_QUEUE_ALT,
    PERMISSIONS.POLICY_PSR_DECISION,
  ],
  DRAFT_REVIEW: [
    PERMISSIONS.POLICY_REVIEW_DRAFT,
    PERMISSIONS.POLICY_VIEW_ASSIGNED_DRAFT_REVIEWS,
  ],
  PROPOSAL_ASSIGN_REVIEWERS: [
    PERMISSIONS.RESEARCH_CHANGE_SCREENING,
    PERMISSIONS.RESEARCH_VIEW_SCREENING,
  ],
  SETTINGS_ACCESS: [
    PERMISSIONS.SETTING_CHANGE_GRANTSETTING,
    PERMISSIONS.SETTING_CHANGE_RESEARCHSETTING,
    PERMISSIONS.SETTING_VIEW_GRANTSETTING,
    PERMISSIONS.SETTING_VIEW_RESEARCHSETTING,
    PERMISSIONS.USER_VIEW,
  ],
  USER_MANAGEMENT: [
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_ADD,
    PERMISSIONS.USER_CHANGE,
    PERMISSIONS.USER_DELETE,
  ],

  AUDIT_LOGS: [
    PERMISSIONS.AUDIT_VIEW_DOCUMENT_EVENT,
    PERMISSIONS.ADMIN_VIEW_LOGENTRY,
  ],
} as const satisfies Record<string, readonly PermissionValue[]>;

export function hasAnyPermission(
  userPermissions: readonly string[] | Set<string> | undefined,
  required: readonly PermissionValue[],
): boolean {
  if (!required.length) return true;
  if (!userPermissions) return false;

  if (userPermissions instanceof Set) {
    if (userPermissions.size === 0) return false;
    return required.some((perm) => userPermissions.has(perm));
  }

  if (!userPermissions.length) return false;
  return required.some((perm) => userPermissions.includes(perm));
}

export function hasAllPermissions(
  userPermissions: readonly string[] | Set<string> | undefined,
  required: readonly PermissionValue[],
): boolean {
  if (!required.length) return true;
  if (!userPermissions) return false;

  if (userPermissions instanceof Set) {
    if (userPermissions.size === 0) return false;
    return required.every((perm) => userPermissions.has(perm));
  }

  if (!userPermissions.length) return false;
  return required.every((perm) => userPermissions.includes(perm));
}
