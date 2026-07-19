'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Filter,
  X,
  Search,
  ArrowRightLeft,
} from 'lucide-react'
import { format } from 'date-fns'

import apiClient from '@/api/client'
import { API_ENDPOINTS } from '@/api/endpoints'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { PageContainer } from '@/components/layout'

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
} from '@/components/settings/activity-log/activity-log-utils'

// ── Types ──────────────────────────────────────────────────────────────────────

interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ── Filter options ─────────────────────────────────────────────────────────────

const EVENT_TYPE_OPTIONS = [
  { value: 'all', label: 'All Events' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'CREATED', label: 'Created' },
  { value: 'UPDATED', label: 'Updated' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'RESUBMITTED', label: 'Resubmitted' },
  { value: 'REVIEWER_ASSIGNED', label: 'Reviewer Assigned' },
  { value: 'REVIEW_COMPLETED', label: 'Review Completed' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'NOT_ACCEPTED', label: 'Not Accepted' },
  { value: 'REVISION_REQUIRED', label: 'Revision Required' },
  { value: 'STATUS_CHANGED', label: 'Status Changed' },
  { value: 'ARCHIVED', label: 'Archived' },
  { value: 'REPOSITORY_REGISTERED', label: 'Repository Registered' },
  { value: 'USER_REGISTERED', label: 'User Registered' },
  { value: 'PASSWORD_CHANGED', label: 'Password Changed' },
]

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 25, total: 0, totalPages: 0 })

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState<Date | undefined>()
  const [dateTo, setDateTo] = useState<Date | undefined>()
  const [fromOpen, setFromOpen] = useState(false)
  const [toOpen, setToOpen] = useState(false)

  // Debounced search value sent to API
  const [appliedSearch, setAppliedSearch] = useState('')

  // Expandable events
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())

  // Collapsible date groups
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  useEffect(() => {
    const timer = setTimeout(() => setAppliedSearch(searchQuery), 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const hasActiveFilters = eventTypeFilter !== 'all' || !!appliedSearch || !!dateFrom || !!dateTo

  const toggleEvent = (id: string) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const clearFilters = () => {
    setSearchQuery('')
    setEventTypeFilter('all')
    setDateFrom(undefined)
    setDateTo(undefined)
  }

  const loadAuditLogs = useCallback(async (page = 1) => {
    setIsLoading(true)
    setError(null)

    try {
      const params: Record<string, any> = {
        limit: meta.limit,
        page,
        ordering: '-created_at',
      }
      if (eventTypeFilter !== 'all') params.event_type = eventTypeFilter
      if (appliedSearch) params.search = appliedSearch
      if (dateFrom) params.start_date = dateFrom.toISOString()
      if (dateTo) {
        const endOfDay = new Date(dateTo)
        endOfDay.setHours(23, 59, 59, 999)
        params.end_date = endOfDay.toISOString()
      }

      const response = await apiClient.get(API_ENDPOINTS.AUDIT_LOGS.LIST, { params })
      const items = Array.isArray(response.data?.data) ? response.data.data : []
      const pagination = response.data?.meta || {}

      setLogs(items.map(normalizeLog))
      setMeta({
        page: pagination.page ?? page,
        limit: pagination.limit ?? meta.limit,
        total: pagination.total ?? 0,
        totalPages: pagination.total_pages ?? 1,
      })
    } catch {
      setError('Unable to load audit logs. Please refresh or try again later.')
      setLogs([])
    } finally {
      setIsLoading(false)
    }
  }, [meta.limit, eventTypeFilter, appliedSearch, dateFrom, dateTo])

  // Refetch when filters change
  useEffect(() => {
    loadAuditLogs(1)
    setExpandedEvents(new Set())
    setCollapsedGroups(new Set())
  }, [loadAuditLogs])

  // Group logs by date
  const groupedLogs: { label: string; key: string; entries: AuditLog[] }[] = []
  for (const log of logs) {
    const key = getDateGroupKey(log.timestamp)
    const existing = groupedLogs.find((g) => g.key === key)
    if (existing) {
      existing.entries.push(log)
    } else {
      groupedLogs.push({
        label: getDateGroupLabel(log.timestamp),
        key,
        entries: [log],
      })
    }
  }

  return (
    <PageContainer
      title="Audit Logs"
      description="View and search system activity logs"
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Filters card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, action, or resource..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Event type" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Popover open={fromOpen} onOpenChange={setFromOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full lg:w-auto justify-start">
                    {dateFrom ? format(dateFrom, 'MMM d, yyyy') : 'From date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateFrom}
                    onSelect={(d) => {
                      setDateFrom(d)
                      setFromOpen(false)
                    }}
                  />
                </PopoverContent>
              </Popover>
              <Popover open={toOpen} onOpenChange={setToOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full lg:w-auto justify-start">
                    {dateTo ? format(dateTo, 'MMM d, yyyy') : 'To date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateTo}
                    onSelect={(d) => {
                      setDateTo(d)
                      setToOpen(false)
                    }}
                  />
                </PopoverContent>
              </Popover>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0">
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadAuditLogs(1)}
                disabled={isLoading}
                className="shrink-0"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Active filter badges */}
            {hasActiveFilters && (
              <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                {eventTypeFilter !== 'all' && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    {EVENT_TYPE_OPTIONS.find((o) => o.value === eventTypeFilter)?.label}
                    <button
                      onClick={() => setEventTypeFilter('all')}
                      className="ml-0.5 rounded-full hover:bg-muted p-0.5"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                )}
                {appliedSearch && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    Search: &quot;{appliedSearch}&quot;
                    <button
                      onClick={() => setSearchQuery('')}
                      className="ml-0.5 rounded-full hover:bg-muted p-0.5"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                )}
                {dateFrom && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    From {format(dateFrom, 'MMM d, yyyy')}
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
                    To {format(dateTo, 'MMM d, yyyy')}
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
          </CardContent>
        </Card>

        {/* Timeline feed */}
        <Card className="shadow-sm">
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
            ) : logs.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  {hasActiveFilters
                    ? 'No matching activity found.'
                    : 'No audit logs found.'}
                </p>
                {hasActiveFilters && (
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
                  const isCollapsed = collapsedGroups.has(group.key)
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
                        <Badge variant="secondary" className="text-[10px] ml-1">
                          {group.entries.length}
                        </Badge>
                      </button>

                      {/* Entries */}
                      {!isCollapsed && (
                        <div className="relative">
                          {/* Vertical connector line */}
                          {group.entries.length > 1 && (
                            <div className="absolute left-[38px] top-5 bottom-5 w-px bg-border/70" />
                          )}

                          {group.entries.map((log) => {
                            const Icon = actionIcons[log.action] || FileText
                            const colorClass =
                              actionColors[log.action] ||
                              'text-slate-500 bg-slate-500/10'
                            const isExpanded = expandedEvents.has(log.id)

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
                                    {/* Actor + timestamp */}
                                    <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                                      {log.userName && log.userName !== 'System' && (
                                        <>
                                          <span className="text-xs font-semibold text-foreground/80">
                                            {log.userName}
                                          </span>
                                          {log.userRole && (
                                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                                              {log.userRole}
                                            </Badge>
                                          )}
                                          <span className="text-[10px] text-muted-foreground/40">·</span>
                                        </>
                                      )}
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
                                      className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                    />
                                  </div>
                                </button>

                                {/* Expanded details */}
                                {isExpanded && (
                                  <div className="ml-[62px] mr-5 mb-3 rounded-lg border bg-muted/20 p-3">
                                    <div className="grid gap-2 text-xs">
                                      {/* Actor */}
                                      {log.userName && (
                                        <div className="flex items-center gap-2">
                                          <span className="text-muted-foreground w-20 shrink-0">
                                            User
                                          </span>
                                          <span className="font-medium">
                                            {log.userName}
                                          </span>
                                          {log.userRole && (
                                            <Badge variant="secondary" className="text-[10px]">
                                              {log.userRole}
                                            </Badge>
                                          )}
                                        </div>
                                      )}
                                      {/* Status transition */}
                                      {(log.fromStatus || log.toStatus) && (
                                        <div className="flex items-center gap-2">
                                          <span className="text-muted-foreground w-20 shrink-0">
                                            Status
                                          </span>
                                          <span className="font-medium">
                                            {formatStatus(log.fromStatus) || '—'}
                                          </span>
                                          <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                                          <span className="font-medium">
                                            {formatStatus(log.toStatus) || '—'}
                                          </span>
                                        </div>
                                      )}
                                      {/* Actor role */}
                                      {log.actorRole && (
                                        <div className="flex items-center gap-2">
                                          <span className="text-muted-foreground w-20 shrink-0">
                                            Role
                                          </span>
                                          <Badge variant="secondary" className="text-[10px]">
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
                                        <Badge variant="outline" className="text-[10px] font-mono">
                                          {log.eventType}
                                        </Badge>
                                      </div>
                                      {/* Document reference */}
                                      {log.documentType &&
                                        log.documentType !== 'USER' &&
                                        log.resourceId && (
                                          <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground w-20 shrink-0">
                                              Document
                                            </span>
                                            <span className="font-medium">
                                              {formatDocumentType(log.documentType)} #{log.resourceId}
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
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <>
                <Separator />
                <div className="flex items-center justify-between px-5 py-3">
                  <p className="text-xs text-muted-foreground">
                    Page {meta.page} of {meta.totalPages} ({meta.total} total)
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={meta.page <= 1 || isLoading}
                      onClick={() => loadAuditLogs(meta.page - 1)}
                    >
                      <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={meta.page >= meta.totalPages || isLoading}
                      onClick={() => loadAuditLogs(meta.page + 1)}
                    >
                      Next
                      <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
