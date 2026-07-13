"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  X,
  Loader2,
  Search,
  ArrowRightLeft,
} from "lucide-react";
import { format } from "date-fns";

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

import {
  type AuditLog,
  normalizeLog,
  actionIcons,
  actionColors,
  formatDocumentType,
  formatStatus,
  getRelativeTime,
  getDateGroupLabel,
  getDateGroupKey,
} from "@/components/settings/activity-log/activity-log-utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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
                Search: &quot;{searchQuery}&quot;
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
                              {/* Icon bubble — bg-card backing + color overlay */}
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
