"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Filter,
  X,
  Loader2,
  Search,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { User } from "@/api/services/users.service";

// ── Types ──────────────────────────────────────────────────────────────────────

interface AuditLog {
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
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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

function normalizeAction(eventType: string): string {
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

const actionIcons: Record<string, typeof FileText> = {
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

const actionColors: Record<string, string> = {
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

function formatDocumentType(raw: string): string {
  if (!raw) return "";
  return (
    DOCUMENT_TYPE_LABELS[raw] ||
    raw
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function formatStatus(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getRelativeTime(timestamp: string): string {
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

function getDateGroupLabel(timestamp: string): string {
  const date = new Date(timestamp);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

function getDateGroupKey(timestamp: string): string {
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

function buildDescription(log: AuditLog): string {
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

function normalizeLog(event: any): AuditLog {
  const metadata = event.metadata || {};
  const eventType = event.eventType || event.event_type || "UPDATED";

  const log: AuditLog = {
    id: event.eventId || event.event_id || String(event.id ?? ""),
    action: normalizeAction(eventType),
    eventType,
    description: metadata.title || metadata.description || metadata.message || "",
    documentType: event.documentType || event.document_type || "",
    resourceId: event.documentId ? String(event.documentId) : event.document_id ? String(event.document_id) : "",
    fromStatus: event.fromStatus || event.from_status || "",
    toStatus: event.toStatus || event.to_status || "",
    actorRole: event.actorRole || event.actor_role || "",
    ipAddress: event.ipAddress || event.ip_address || metadata.ipAddress || metadata.ip_address || "",
    timestamp: event.timestamp || event.created_at || new Date().toISOString(),
  };

  log.description = buildDescription(log);
  return log;
}

// ── Component ──────────────────────────────────────────────────────────────────

interface UserDetailActivityProps {
  user: User;
}

export function UserDetailActivity({ user }: UserDetailActivityProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  // Expandable events
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  // Collapsible date groups
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Client-side search
  const [searchQuery, setSearchQuery] = useState("");

  // Date range filter
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [filterOpen, setFilterOpen] = useState(false);
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const hasActiveFilter = !!dateFrom || !!dateTo || !!searchQuery;

  const toggleEvent = (id: string) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setSearchQuery("");
  };

  const fetchLogs = useCallback(
    async (page = 1, append = false) => {
      if (append) setIsLoadingMore(true);
      else setIsLoading(true);

      try {
        const params: Record<string, any> = {
          actor_id: user.id,
          limit: meta.limit,
          page,
          ordering: "-created_at",
        };
        if (dateFrom) params.start_date = dateFrom.toISOString();
        if (dateTo) {
          const endOfDay = new Date(dateTo);
          endOfDay.setHours(23, 59, 59, 999);
          params.end_date = endOfDay.toISOString();
        }

        const response = await apiClient.get(API_ENDPOINTS.AUDIT_LOGS.LIST, {
          params,
        });
        const items = Array.isArray(response.data?.data)
          ? response.data.data
          : [];
        const pagination = response.data?.meta || {};

        const normalized = items.map(normalizeLog);

        if (append) {
          setLogs((prev) => [...prev, ...normalized]);
        } else {
          setLogs(normalized);
        }

        setMeta({
          page: pagination.page ?? page,
          limit: pagination.limit ?? meta.limit,
          total: pagination.total ?? 0,
          totalPages: pagination.total_pages ?? 1,
        });
      } catch {
        if (!append) setLogs([]);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [user.id, meta.limit, dateFrom, dateTo],
  );

  // Refetch when date filters change (reset to page 1)
  useEffect(() => {
    fetchLogs(1, false);
    setExpandedEvents(new Set());
    setCollapsedGroups(new Set());
  }, [fetchLogs]);

  const handleLoadMore = () => {
    fetchLogs(meta.page + 1, true);
  };

  // Client-side search filter
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    const q = searchQuery.toLowerCase();
    return logs.filter(
      (log) =>
        log.description.toLowerCase().includes(q) ||
        log.eventType.toLowerCase().includes(q) ||
        log.documentType.toLowerCase().includes(q) ||
        log.fromStatus.toLowerCase().includes(q) ||
        log.toStatus.toLowerCase().includes(q),
    );
  }, [logs, searchQuery]);

  // Group logs by date
  const groupedLogs: { label: string; key: string; entries: AuditLog[] }[] = [];
  for (const log of filteredLogs) {
    const key = getDateGroupKey(log.timestamp);
    const existing = groupedLogs.find((g) => g.key === key);
    if (existing) {
      existing.entries.push(log);
    } else {
      groupedLogs.push({
        label: getDateGroupLabel(log.timestamp),
        key,
        entries: [log],
      });
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b bg-muted/20 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">
            Activity Log
          </h3>
          <div className="ml-auto flex items-center gap-1.5">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-36 pl-8 text-xs"
              />
            </div>
            {/* Date filter */}
            <Popover open={fromOpen} onOpenChange={setFromOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={dateFrom ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs"
                >
                  From{dateFrom ? `: ${format(dateFrom, "MMM d")}` : ""}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={dateFrom}
                  onSelect={(d) => {
                    setDateFrom(d);
                    setFromOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
            <Popover open={toOpen} onOpenChange={setToOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={dateTo ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs"
                >
                  To{dateTo ? `: ${format(dateTo, "MMM d")}` : ""}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={dateTo}
                  onSelect={(d) => {
                    setDateTo(d);
                    setToOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
            {hasActiveFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={clearFilters}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchLogs(1, false)}
              disabled={isLoading}
              className="h-8"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* Active filter badges */}
        {hasActiveFilter && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {searchQuery && (
              <Badge variant="secondary" className="text-[10px] gap-1">
                Search: "{searchQuery}"
                <button
                  onClick={() => setSearchQuery("")}
                  className="ml-0.5 rounded-full hover:bg-muted p-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            )}
            {dateFrom && (
              <Badge variant="secondary" className="text-[10px] gap-1">
                From {format(dateFrom, "MMM d, yyyy")}
                <button
                  onClick={() => setDateFrom(undefined)}
                  className="ml-0.5 rounded-full hover:bg-muted p-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            )}
            {dateTo && (
              <Badge variant="secondary" className="text-[10px] gap-1">
                To {format(dateTo, "MMM d, yyyy")}
                <button
                  onClick={() => setDateTo(undefined)}
                  className="ml-0.5 rounded-full hover:bg-muted p-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3 px-5 py-4">
                <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3.5 w-64 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-3 w-12 shrink-0 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {searchQuery || hasActiveFilter
                ? "No matching activity found."
                : "No activity recorded yet."}
            </p>
            {(searchQuery || hasActiveFilter) && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs"
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {groupedLogs.map((group) => {
              const isCollapsed = collapsedGroups.has(group.key);
              return (
                <div key={group.key}>
                  {/* Date group header — clickable */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    className="flex w-full items-center gap-2 bg-muted/30 px-5 py-2.5 text-left transition-colors hover:bg-muted/50"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </p>
                  </button>

                  {/* Entries */}
                  {!isCollapsed && (
                    <div className="relative">
                      {/* Vertical connector line */}
                      {group.entries.length > 1 && (
                        <div className="absolute left-[38px] top-5 bottom-5 w-px bg-border/70" />
                      )}

                      {group.entries.map((log) => {
                        const Icon = actionIcons[log.action] || FileText;
                        const colorClass =
                          actionColors[log.action] ||
                          "text-slate-500 bg-slate-500/10";
                        const isExpanded = expandedEvents.has(log.id);

                        return (
                          <div key={log.id}>
                            {/* Event row — clickable to expand */}
                            <button
                              type="button"
                              onClick={() => toggleEvent(log.id)}
                              className="group flex w-full gap-3 px-5 py-3 text-left transition-colors hover:bg-muted/30"
                            >
                              {/* Icon bubble — bg-background covers the line */}
                              <div className="relative z-10 shrink-0 pt-0.5">
                                <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-card">
                                  <div className={`absolute inset-0 rounded-full ${colorClass}`} />
                                  <Icon className="relative h-4 w-4" />
                                </div>
                              </div>

                              {/* Content */}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium leading-snug text-foreground">
                                  {log.description}
                                </p>
                                {/* Timestamps */}
                                <div className="mt-0.5 flex items-center gap-2">
                                  <span className="text-[11px] text-muted-foreground">
                                    {getRelativeTime(log.timestamp)}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground/60">
                                    {format(
                                      new Date(log.timestamp),
                                      "MMM d, yyyy 'at' HH:mm:ss",
                                    )}
                                  </span>
                                </div>
                              </div>

                              {/* Expand chevron */}
                              <div className="shrink-0 pt-1">
                                <ChevronDown
                                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                                />
                              </div>
                            </button>

                            {/* Expanded details */}
                            {isExpanded && (
                              <div className="ml-[62px] mr-5 mb-3 rounded-lg border bg-muted/20 p-3">
                                <div className="grid gap-2 text-xs">
                                  {/* Status transition */}
                                  {(log.fromStatus || log.toStatus) && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground w-20 shrink-0">
                                        Status
                                      </span>
                                      <span className="font-medium">
                                        {formatStatus(log.fromStatus) || "—"}
                                      </span>
                                      <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                                      <span className="font-medium">
                                        {formatStatus(log.toStatus) || "—"}
                                      </span>
                                    </div>
                                  )}
                                  {/* Actor role */}
                                  {log.actorRole && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground w-20 shrink-0">
                                        Role
                                      </span>
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px]"
                                      >
                                        {log.actorRole}
                                      </Badge>
                                    </div>
                                  )}
                                  {/* IP address */}
                                  {log.ipAddress && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground w-20 shrink-0">
                                        IP
                                      </span>
                                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                                        {log.ipAddress}
                                      </code>
                                    </div>
                                  )}
                                  {/* Event type */}
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground w-20 shrink-0">
                                      Event
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] font-mono"
                                    >
                                      {log.eventType}
                                    </Badge>
                                  </div>
                                  {/* Document reference */}
                                  {log.documentType &&
                                    log.documentType !== "USER" &&
                                    log.resourceId && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground w-20 shrink-0">
                                          Document
                                        </span>
                                        <span className="font-medium">
                                          {formatDocumentType(
                                            log.documentType,
                                          )}{" "}
                                          #{log.resourceId}
                                        </span>
                                      </div>
                                    )}
                                  {/* Full timestamp */}
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground w-20 shrink-0">
                                      Time
                                    </span>
                                    <span className="font-mono text-[11px]">
                                      {format(
                                        new Date(log.timestamp),
                                        "EEE, MMM d, yyyy 'at' HH:mm:ss",
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Load More */}
        {meta.page < meta.totalPages && !isLoading && (
          <>
            <Separator />
            <div className="flex justify-center py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="text-xs"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Loading…
                  </>
                ) : (
                  "Load more"
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
