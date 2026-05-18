// ============================================================================
// PSR Platform — RBAC Utilities
// ============================================================================
// Centralized role-based access control logic.
// Use these helpers throughout UI instead of inline role checks.

import type { UserRole } from "@/lib/types";

// ─── Role hierarchy (higher = more privileges) ────────────────────────────────
const ROLE_WEIGHT: Record<UserRole, number> = {
  system_admin: 100,
  director: 80,
  psr_officer: 70,
  leo_officer: 60,
  roc_reviewer: 50,
  institutional_partner: 30,
  researcher: 20,
};

// ─── Permission map ───────────────────────────────────────────────────────────
// Defines which roles can perform which actions across the system.
// Add new permissions here — never scatter checks across components.

export const PERMISSIONS = {
  // Auth & Profile
  VIEW_PROFILE: ["system_admin", "psr_officer", "leo_officer", "roc_reviewer", "director", "researcher", "institutional_partner"],
  EDIT_PROFILE: ["system_admin", "psr_officer", "leo_officer", "roc_reviewer", "director", "researcher", "institutional_partner"],

  // Users
  VIEW_USERS: ["system_admin", "psr_officer"],
  CREATE_USER: ["system_admin"],
  DELETE_USER: ["system_admin"],

  // Policy
  CREATE_CONCEPT_NOTE: ["psr_officer", "researcher"],
  REVIEW_CONCEPT_NOTE: ["psr_officer", "leo_officer", "roc_reviewer"],
  PUBLISH_POLICY: ["psr_officer", "director"],

  // Calls
  CREATE_CALL: ["psr_officer", "system_admin"],
  PUBLISH_CALL: ["psr_officer", "director"],

  // Proposals
  SUBMIT_PROPOSAL: ["researcher", "institutional_partner"],
  SCREEN_PROPOSALS: ["psr_officer"],
  ASSIGN_REVIEWERS: ["psr_officer"],
  REVIEW_PROPOSAL: ["roc_reviewer"],
  APPROVE_PROPOSAL: ["director", "psr_officer"],

  // Monitoring
  VIEW_PROJECTS: ["system_admin", "psr_officer", "leo_officer", "director"],
  APPROVE_PROGRESS_REPORT: ["psr_officer", "director"],

  // Grants
  CREATE_GRANT: ["psr_officer"],
  APPROVE_FUNDING: ["director"],

  // Admin
  VIEW_AUDIT_LOGS: ["system_admin"],
  MANAGE_TAXONOMY: ["system_admin"],
  VIEW_SETTINGS: ["system_admin"],
} satisfies Record<string, UserRole[]>;

export type Permission = keyof typeof PERMISSIONS;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true if the given role has permission to perform `action`.
 */
export function can(role: UserRole | null | undefined, action: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[action] as UserRole[]).includes(role);
}

/**
 * Returns true if the role has at least one of the given actions.
 */
export function canAny(role: UserRole | null | undefined, actions: Permission[]): boolean {
  return actions.some((action) => can(role, action));
}

/**
 * Returns true if the role has ALL of the given actions.
 */
export function canAll(role: UserRole | null | undefined, actions: Permission[]): boolean {
  return actions.every((action) => can(role, action));
}

/**
 * Returns the weight/level of a role (higher = more privileged).
 */
export function getRoleWeight(role: UserRole): number {
  return ROLE_WEIGHT[role] ?? 0;
}

/**
 * Returns true if `role` is at least as privileged as `minRole`.
 */
export function hasMinRole(role: UserRole | null | undefined, minRole: UserRole): boolean {
  if (!role) return false;
  return getRoleWeight(role) >= getRoleWeight(minRole);
}
