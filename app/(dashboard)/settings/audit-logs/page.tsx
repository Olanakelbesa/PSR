'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Search,
  Filter,
  Download,
  Calendar,
  FileText,
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
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { format } from 'date-fns'

import apiClient from '@/api/client'
import { API_ENDPOINTS } from '@/api/endpoints'
import { Card, CardContent } from '@/components/ui/card'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { PageContainer } from '@/components/layout'

// ── Types ──────────────────────────────────────────────────────────────────────

interface AuditLog {
  id: string
  action: string
  eventType: string
  userId: string
  userName: string
  userRole: string
  documentType: string
  resourceId: string
  description: string
  ipAddress: string
  timestamp: string
}

interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ── Action normalization (shared with user-detail-activity) ─────────────────────

const ACTION_MAP: Record<string, string> = {
  CREATED: 'created',
  UPDATED: 'updated',
  SUBMITTED: 'submitted',
  RESUBMITTED: 'resubmitted',
  REVIEWER_ASSIGNED: 'reviewer_assigned',
  REVIEW_STARTED: 'review_started',
  REVIEW_COMPLETED: 'review_completed',
  PARTIALLY_ACCEPTED: 'partially_accepted',
  NOT_ACCEPTED: 'not_accepted',
  ACCEPTED: 'accepted',
  REVISION_REQUIRED: 'revision_required',
  VERSION_CREATED: 'version_created',
  STATUS_CHANGED: 'status_changed',
  ARCHIVED: 'archived',
  REPOSITORY_REGISTERED: 'repository_registered',
  LOGIN: 'login',
  LOGOUT: 'logout',
  USER_REGISTERED: 'user_registered',
  PASSWORD_RESET: 'password_reset',
  PASSWORD_CHANGED: 'password_changed',
}

function normalizeAction(eventType: string): string {
  const direct = ACTION_MAP[eventType]
  if (direct) return direct

  const t = eventType.toLowerCase()
  if (t.includes('submit')) return 'submitted'
  if (t.includes('create')) return 'created'
  if (t.includes('update')) return 'updated'
  if (t.includes('delete')) return 'updated'
  if (t.includes('login')) return 'login'
  if (t.includes('logout')) return 'logout'
  if (t.includes('review')) return 'review_completed'
  if (t.includes('assign')) return 'reviewer_assigned'
  if (t.includes('accept')) return 'accepted'
  if (t.includes('reject') || t.includes('not_accept')) return 'not_accepted'
  if (t.includes('revision')) return 'revision_required'
  if (t.includes('archive')) return 'archived'
  if (t.includes('register')) return 'user_registered'
  if (t.includes('password')) return 'password_changed'
  return 'updated'
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
}

const actionColors: Record<string, string> = {
  created: 'text-blue-500 bg-blue-500/10',
  updated: 'text-amber-500 bg-amber-500/10',
  submitted: 'text-blue-600 bg-blue-600/10',
  resubmitted: 'text-blue-400 bg-blue-400/10',
  reviewer_assigned: 'text-indigo-500 bg-indigo-500/10',
  review_started: 'text-violet-500 bg-violet-500/10',
  review_completed: 'text-green-500 bg-green-500/10',
  accepted: 'text-green-600 bg-green-600/10',
  not_accepted: 'text-red-500 bg-red-500/10',
  partially_accepted: 'text-orange-500 bg-orange-500/10',
  revision_required: 'text-yellow-600 bg-yellow-600/10',
  version_created: 'text-purple-500 bg-purple-500/10',
  status_changed: 'text-teal-500 bg-teal-500/10',
  archived: 'text-slate-400 bg-slate-400/10',
  repository_registered: 'text-emerald-500 bg-emerald-500/10',
  login: 'text-green-500 bg-green-500/10',
  logout: 'text-slate-500 bg-slate-500/10',
  user_registered: 'text-cyan-500 bg-cyan-500/10',
  password_reset: 'text-orange-400 bg-orange-400/10',
  password_changed: 'text-amber-500 bg-amber-500/10',
}

// ── Display helpers ────────────────────────────────────────────────────────────

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  CONCEPT_NOTE: 'Concept Note',
  POLICY_DRAFT: 'Policy Draft',
  POLICY_REPOSITORY: 'Policy Repository',
  PROPOSAL: 'Proposal',
  SCREENING: 'Screening',
  USER: 'User',
  GRANT_CALL: 'Grant Call',
  PROGRESS_REPORT: 'Progress Report',
  TERMINAL_REPORT: 'Terminal Report',
}

function formatDocumentType(raw: string): string {
  if (!raw) return ''
  return DOCUMENT_TYPE_LABELS[raw] || raw.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatStatus(raw: string): string {
  if (!raw) return ''
  return raw.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Normalize log entry ────────────────────────────────────────────────────────

function normalizeAuditLog(event: any): AuditLog {
  const metadata = event.metadata || {}
  const eventType = event.eventType || event.event_type || 'UPDATED'
  const docType = event.documentType || event.document_type || metadata.documentType || metadata.document_type || ''
  const docId = (event.documentId ?? event.document_id) ? String(event.documentId ?? event.document_id) : ''

  const log: AuditLog = {
    id: (event.eventId ?? event.event_id ?? event.id ?? '').toString(),
    action: normalizeAction(eventType),
    eventType,
    userId: String(event.actor?.id ?? metadata.actorId ?? metadata.actor_id ?? ''),
    userName: event.actor?.name || metadata.email || metadata.actorName || metadata.actor_name || 'System',
    userRole: metadata.role || '',
    documentType: docType,
    resourceId: docId,
    description: metadata.title || metadata.description || metadata.message || '',
    ipAddress: event.ipAddress || event.ip_address || '',
    timestamp: event.timestamp || event.createdAt || event.created_at || new Date().toISOString(),
  }

  if (!log.description) {
    const docLabel = formatDocumentType(docType)
    const docRef = docId ? ` #${docId}` : ''
    const fromStatus = event.fromStatus || event.from_status || ''
    const toStatus = event.toStatus || event.to_status || ''
    switch (log.action) {
      case 'submitted': log.description = `Submitted ${docLabel}${docRef}`; break
      case 'resubmitted': log.description = `Resubmitted ${docLabel}${docRef}`; break
      case 'reviewer_assigned': log.description = metadata.reviewerName || metadata.reviewer_name ? `Assigned to ${metadata.reviewerName || metadata.reviewer_name}` : `Assigned reviewer to ${docLabel}${docRef}`; break
      case 'review_completed': log.description = metadata.decision ? `Review completed — ${formatStatus(metadata.decision)}` : `Review completed for ${docLabel}${docRef}`; break
      case 'accepted': log.description = `Accepted ${docLabel}${docRef}`; break
      case 'not_accepted': log.description = `Not accepted ${docLabel}${docRef}`; break
      case 'partially_accepted': log.description = `Partially accepted ${docLabel}${docRef}`; break
      case 'revision_required': log.description = `Revision required for ${docLabel}${docRef}`; break
      case 'version_created': log.description = `New version created for ${docLabel}${docRef}`; break
      case 'status_changed': log.description = `Status changed: ${formatStatus(fromStatus)} → ${formatStatus(toStatus)}`; break
      case 'archived': log.description = `Archived ${docLabel}${docRef}`; break
      case 'repository_registered': log.description = `Registered in repository ${docLabel}${docRef}`; break
      case 'created': log.description = `Created ${docLabel}${docRef}`; break
      case 'updated': log.description = `Updated ${docLabel}${docRef}`; break
      case 'login': log.description = 'Logged in'; break
      case 'logout': log.description = 'Logged out'; break
      case 'user_registered': log.description = 'Registered'; break
      case 'password_reset': log.description = 'Password reset requested'; break
      case 'password_changed': log.description = 'Changed password'; break
      default: log.description = `${formatStatus(eventType)} ${docLabel}${docRef}`.trim()
    }
  }

  return log
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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 25, total: 0, totalPages: 0 })

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState<Date | undefined>()
  const [dateTo, setDateTo] = useState<Date | undefined>()

  // Debounced search value sent to API
  const [appliedSearch, setAppliedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setAppliedSearch(searchQuery), 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

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
      if (dateTo) params.end_date = dateTo.toISOString()

      const response = await apiClient.get(API_ENDPOINTS.AUDIT_LOGS.LIST, { params })
      const items = Array.isArray(response.data?.data) ? response.data.data : []
      const pagination = response.data?.meta || {}

      setLogs(items.map(normalizeAuditLog))
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
  }, [loadAuditLogs])

  const hasActiveFilters = eventTypeFilter !== 'all' || !!appliedSearch || !!dateFrom || !!dateTo

  const clearFilters = () => {
    setSearchQuery('')
    setEventTypeFilter('all')
    setDateFrom(undefined)
    setDateTo(undefined)
  }

  return (
    <PageContainer
      title="Audit Logs"
      description="View and search system activity logs"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadAuditLogs(meta.page)} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Filters */}
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full lg:w-auto justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    {dateFrom ? format(dateFrom, 'MMM d') : 'From date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full lg:w-auto justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    {dateTo ? format(dateTo, 'MMM d') : 'To date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                  />
                </PopoverContent>
              </Popover>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0">
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="hidden lg:table-cell">IP</TableHead>
                  <TableHead className="text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell><div className="h-8 w-8 animate-pulse rounded-lg bg-muted" /></TableCell>
                      <TableCell><div className="h-4 w-24 animate-pulse rounded bg-muted" /></TableCell>
                      <TableCell><div className="h-4 w-64 animate-pulse rounded bg-muted" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><div className="h-4 w-20 animate-pulse rounded bg-muted" /></TableCell>
                      <TableCell className="text-right"><div className="h-4 w-20 animate-pulse rounded bg-muted ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No audit logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const Icon = actionIcons[log.action] || FileText
                    const colorClass = actionColors[log.action] || 'text-slate-500 bg-slate-500/10'

                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className={`p-2 rounded-lg w-fit ${colorClass}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{log.userName}</p>
                            {log.userRole && (
                              <p className="text-xs text-muted-foreground">{log.userRole}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{log.description}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {log.documentType && (
                                <Badge variant="secondary" className="text-[10px] font-normal">
                                  {formatDocumentType(log.documentType)}
                                </Badge>
                              )}
                              {log.resourceId && (
                                <span className="text-xs text-muted-foreground">#{log.resourceId}</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {log.ipAddress ? (
                            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                              {log.ipAddress}
                            </code>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <p className="text-sm">
                            {format(new Date(log.timestamp), 'MMM d, yyyy')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(log.timestamp), 'HH:mm:ss')}
                          </p>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
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
      </div>
    </PageContainer>
  )
}
