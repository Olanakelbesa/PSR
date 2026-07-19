import {
  LogIn,
  LogOut,
  Plus,
  Pencil,
  Send,
  RotateCcw,
  UserPlus,
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CircleAlert,
  Copy,
  ArrowRightLeft,
  Archive,
  BookMarked,
  KeyRound,
  FileText,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  action: string;
  eventType: string;
  description: string;
  documentType: string;
  resourceId: string;
  fromStatus: string;
  toStatus: string;
  actorRole: string;
  ipAddress: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  userRole?: string;
}

// ── Action normalization ───────────────────────────────────────────────────────

const ACTION_MAP: Record<string, string> = {
  CREATED: "created",
  UPDATED: "updated",
  SUBMITTED: "submitted",
  RESUBMITTED: "resubmitted",
  REVIEWER_ASSIGNED: "reviewer_assigned",
  REVIEW_STARTED: "review_started",
  REVIEW_COMPLETED: "review_completed",
  PARTIALLY_ACCEPTED: "partially_accepted",
  NOT_ACCEPTED: "not_accepted",
  ACCEPTED: "accepted",
  REVISION_REQUIRED: "revision_required",
  VERSION_CREATED: "version_created",
  STATUS_CHANGED: "status_changed",
  ARCHIVED: "archived",
  REPOSITORY_REGISTERED: "repository_registered",
  LOGIN: "login",
  LOGOUT: "logout",
  USER_REGISTERED: "user_registered",
  PASSWORD_RESET: "password_reset",
  PASSWORD_CHANGED: "password_changed",
};

export function normalizeAction(eventType: string): string {
  const direct = ACTION_MAP[eventType];
  if (direct) return direct;
  const t = eventType.toLowerCase();
  if (t.includes("submit")) return "submitted";
  if (t.includes("create")) return "created";
  if (t.includes("update")) return "updated";
  if (t.includes("delete")) return "updated";
  if (t.includes("login")) return "login";
  if (t.includes("logout")) return "logout";
  if (t.includes("review")) return "review_completed";
  if (t.includes("assign")) return "reviewer_assigned";
  if (t.includes("accept")) return "accepted";
  if (t.includes("reject") || t.includes("not_accept")) return "not_accepted";
  if (t.includes("revision")) return "revision_required";
  if (t.includes("archive")) return "archived";
  if (t.includes("register")) return "user_registered";
  if (t.includes("password")) return "password_changed";
  return "updated";
}

// ── Icons & Colors ─────────────────────────────────────────────────────────────

export const actionIcons: Record<string, typeof FileText> = {
  created: Plus,
  updated: Pencil,
  submitted: Send,
  resubmitted: RotateCcw,
  reviewer_assigned: UserPlus,
  review_started: BookOpen,
  review_completed: CheckCircle2,
  accepted: CheckCircle2,
  not_accepted: XCircle,
  partially_accepted: AlertCircle,
  revision_required: CircleAlert,
  version_created: Copy,
  status_changed: ArrowRightLeft,
  archived: Archive,
  repository_registered: BookMarked,
  login: LogIn,
  logout: LogOut,
  user_registered: UserPlus,
  password_reset: KeyRound,
  password_changed: KeyRound,
};

export const actionColors: Record<string, string> = {
  created: "text-blue-500 bg-blue-500/10",
  updated: "text-amber-500 bg-amber-500/10",
  submitted: "text-blue-600 bg-blue-600/10",
  resubmitted: "text-blue-400 bg-blue-400/10",
  reviewer_assigned: "text-indigo-500 bg-indigo-500/10",
  review_started: "text-violet-500 bg-violet-500/10",
  review_completed: "text-green-500 bg-green-500/10",
  accepted: "text-green-600 bg-green-600/10",
  not_accepted: "text-red-500 bg-red-500/10",
  partially_accepted: "text-orange-500 bg-orange-500/10",
  revision_required: "text-yellow-600 bg-yellow-600/10",
  version_created: "text-purple-500 bg-purple-500/10",
  status_changed: "text-teal-500 bg-teal-500/10",
  archived: "text-slate-400 bg-slate-400/10",
  repository_registered: "text-emerald-500 bg-emerald-500/10",
  login: "text-green-500 bg-green-500/10",
  logout: "text-slate-500 bg-slate-500/10",
  user_registered: "text-cyan-500 bg-cyan-500/10",
  password_reset: "text-orange-400 bg-orange-400/10",
  password_changed: "text-amber-500 bg-amber-500/10",
};

// ── Display helpers ────────────────────────────────────────────────────────────

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  CONCEPT_NOTE: "Concept Note",
  POLICY_DRAFT: "Policy Draft",
  POLICY_REPOSITORY: "Policy Repository",
  PROPOSAL: "Proposal",
  SCREENING: "Screening",
  USER: "User",
  GRANT_CALL: "Grant Call",
  PROGRESS_REPORT: "Progress Report",
  TERMINAL_REPORT: "Terminal Report",
};

export function formatDocumentType(raw: string): string {
  if (!raw) return "";
  return (
    DOCUMENT_TYPE_LABELS[raw] ||
    raw
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function formatStatus(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  if (Number.isNaN(diff)) return "";
  const seconds = Math.round(diff / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return format(new Date(timestamp), "MMM d");
}

export function getDateGroupLabel(timestamp: string): string {
  const date = new Date(timestamp);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

export function getDateGroupKey(timestamp: string): string {
  return format(new Date(timestamp), "yyyy-MM-dd");
}

// ── Description builder (Option A: docType + #id) ─────────────────────────────

function extractVersionLabel(title: string): string {
  const match = title.match(/\(([^)]+)\)\s*$/);
  return match ? ` (${match[1]})` : "";
}

function extractReviewerName(title: string): string {
  const match = title.match(/Assigned to\s+(.+)/i);
  return match ? match[1] : "";
}

function extractDecision(title: string): string {
  const match = title.match(
    /(?:Review Completed\s*[-:]\s*|PSR Decision\s*[-:]\s*)(.+)/i,
  );
  return match ? formatStatus(match[1]) : "";
}

export function buildDescription(log: AuditLog): string {
  const docLabel = formatDocumentType(log.documentType);
  const docRef = log.resourceId ? ` #${log.resourceId}` : "";
  const ref = docLabel ? `${docLabel}${docRef}` : "";
  const sep = ref ? " — " : "";

  switch (log.action) {
    case "submitted": {
      const v = extractVersionLabel(log.description);
      return `Submitted ${ref}${v}`;
    }
    case "resubmitted": {
      const v = extractVersionLabel(log.description);
      return `Resubmitted ${ref}${v}`;
    }
    case "reviewer_assigned": {
      const name = extractReviewerName(log.description);
      return name
        ? `Assigned reviewer to ${ref}${sep}${name}`
        : `Assigned reviewer to ${ref}`;
    }
    case "review_started":
      return `Review started for ${ref}`;
    case "review_completed": {
      const decision = extractDecision(log.description);
      const titleLower = log.description.toLowerCase();
      if (titleLower.includes("all reviewer checklists completed")) {
        return `All checklists completed${sep}${ref}`;
      }
      if (titleLower.includes("sent to repository")) {
        const bypass = titleLower.includes("bypass") ? " (bypass)" : "";
        return `Sent to repository${bypass}${sep}${ref}`;
      }
      return decision
        ? `Review completed: ${decision}${sep}${ref}`
        : `Review completed${sep}${ref}`;
    }
    case "accepted": {
      const decision = extractDecision(log.description);
      return decision
        ? `PSR decision: ${decision}${sep}${ref}`
        : `Accepted ${ref}`;
    }
    case "not_accepted": {
      const decision = extractDecision(log.description);
      return decision
        ? `PSR decision: ${decision}${sep}${ref}`
        : `Not accepted ${ref}`;
    }
    case "partially_accepted":
      return `Partially accepted ${ref}`;
    case "revision_required": {
      const decision = extractDecision(log.description);
      return decision
        ? `PSR decision: ${decision}${sep}${ref}`
        : `Revision required for ${ref}`;
    }
    case "version_created":
      return `New version created for ${ref}`;
    case "status_changed":
      return `Status changed: ${formatStatus(log.fromStatus)} → ${formatStatus(log.toStatus)}${sep}${ref}`;
    case "archived":
      return `${ref} archived`;
    case "repository_registered":
      return `Registered in repository${sep}${ref}`;
    case "created":
      return `${ref} created`;
    case "updated":
      return `${ref} updated`;
    case "login":
      return "Logged in";
    case "logout":
      return "Logged out";
    case "user_registered":
      return "Registered";
    case "password_reset":
      return "Password reset requested";
    case "password_changed":
      return "Changed password";
    default:
      return ref ? `${ref} — ${formatStatus(log.eventType)}` : formatStatus(log.eventType);
  }
}

// ── Normalize log entry ────────────────────────────────────────────────────────

export function normalizeLog(event: any): AuditLog {
  const metadata = event.metadata || {};
  const eventType = event.eventType || event.event_type || "UPDATED";

  const log: AuditLog = {
    id: (event.eventId ?? event.event_id ?? event.id ?? "").toString(),
    action: normalizeAction(eventType),
    eventType,
    description: metadata.title || metadata.description || metadata.message || "",
    documentType: event.documentType || event.document_type || "",
    resourceId: (event.documentId ?? event.document_id) ? String(event.documentId ?? event.document_id) : "",
    fromStatus: event.fromStatus || event.from_status || "",
    toStatus: event.toStatus || event.to_status || "",
    actorRole: event.actorRole || event.actor_role || "",
    ipAddress: event.ipAddress || event.ip_address || metadata.ipAddress || metadata.ip_address || "",
    timestamp: event.timestamp || event.createdAt || event.created_at || new Date().toISOString(),
    userId: String(event.actor?.id ?? metadata.actorId ?? metadata.actor_id ?? ""),
    userName: event.actor?.name || metadata.email || metadata.actorName || metadata.actor_name || "System",
    userRole: metadata.role || "",
  };

  log.description = buildDescription(log);
  return log;
}
