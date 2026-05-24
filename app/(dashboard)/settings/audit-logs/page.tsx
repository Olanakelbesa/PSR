'use client'

import { useEffect, useState } from 'react'
import {
  Search,
  Filter,
  Download,
  Calendar,
  FileText,
  LogIn,
  LogOut,
  Edit,
  Trash2,
  Plus,
  Eye,
  Settings,
  RefreshCw,
} from 'lucide-react'
import { format } from 'date-fns'

import apiClient from '@/api/client'
import { API_ENDPOINTS } from '@/api/endpoints'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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

interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userName: string;
  userRole: string;
  resource: string;
  resourceId: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

const actionIcons: Record<string, typeof FileText> = {
  login: LogIn,
  logout: LogOut,
  create: Plus,
  update: Edit,
  delete: Trash2,
  view: Eye,
  export: Download,
  settings: Settings,
}

const actionColors: Record<string, string> = {
  login: 'text-green-500 bg-green-500/10',
  logout: 'text-slate-500 bg-slate-500/10',
  create: 'text-blue-500 bg-blue-500/10',
  update: 'text-amber-500 bg-amber-500/10',
  delete: 'text-red-500 bg-red-500/10',
  view: 'text-purple-500 bg-purple-500/10',
  export: 'text-cyan-500 bg-cyan-500/10',
  settings: 'text-slate-500 bg-slate-500/10',
}

function normalizeAuditLog(event: any): AuditLog {
  const actionType = String(event.eventType || 'audit').toLowerCase()
  const action = (
    actionType === 'login' ||
    actionType === 'logout' ||
    actionType === 'create' ||
    actionType === 'update' ||
    actionType === 'delete' ||
    actionType === 'view' ||
    actionType === 'export' ||
    actionType === 'settings'
  )
    ? actionType
    : actionType.includes('create')
    ? 'create'
    : actionType.includes('update')
    ? 'update'
    : actionType.includes('delete')
    ? 'delete'
    : actionType.includes('login')
    ? 'login'
    : actionType.includes('logout')
    ? 'logout'
    : actionType.includes('submit')
    ? 'view'
    : 'settings'

  const metadata = event.metadata || {}
  const documentType = event.document_type
  const documentId = event.document_id ? String(event.document_id) : ''
  const resource =
    documentType || metadata.title || metadata.action || event.eventType || 'Audit Event'
  const resourceId = documentId || event.relatedVersion || ''

  return {
    id: event.eventId ?? String(event.event_id ?? ''),
    action,
    userId: String(event.actor?.id ?? metadata.actor_id ?? ''),
    userName:
      event.actor?.name || metadata.email || metadata.actor_name || 'System',
    userRole: metadata.role || '',
    resource,
    resourceId,
    details:
      metadata.title || metadata.description || metadata.message || event.eventType || '',
    ipAddress: event.ipAddress || metadata.ip_address || '',
    userAgent: metadata.user_agent || '',
    timestamp: event.timestamp || event.created_at || new Date().toISOString(),
  }
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState<Date | undefined>()
  const [dateTo, setDateTo] = useState<Date | undefined>()

  const loadAuditLogs = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.get(API_ENDPOINTS.AUDIT_LOGS.LIST)
      const items = Array.isArray(response.data?.data)
        ? response.data.data
        : []
      setLogs(items.map(normalizeAuditLog))
    } catch (err) {
      setError('Unable to load audit logs. Please refresh or try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAuditLogs()
  }, [])

  const filteredLogs = logs.filter(log => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!log.userName.toLowerCase().includes(query) && 
          !log.details.toLowerCase().includes(query) &&
          !log.resource.toLowerCase().includes(query)) {
        return false
      }
    }
    return true
  })

  const handleExport = () => {
    console.log('Exporting audit logs...')
  }

  const handleRefresh = () => {
    loadAuditLogs()
  }

  return (
    <PageContainer
      title="Audit Logs"
      description="View and search system activity logs"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
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
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, action, or resource..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full lg:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Action type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="export">Export</SelectItem>
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
                  <TableHead>Resource</TableHead>
                  <TableHead className="hidden lg:table-cell">Details</TableHead>
                  <TableHead className="hidden md:table-cell">IP Address</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
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
                          <p className="font-medium">{log.userName}</p>
                          <p className="text-xs text-muted-foreground">{log.userRole}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{log.resource}</p>
                          {log.resourceId && (
                            <p className="text-xs text-muted-foreground">{log.resourceId}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell max-w-xs">
                        <p className="text-sm text-muted-foreground truncate">{log.details}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {log.ipAddress}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{format(new Date(log.timestamp), 'MMM d, yyyy')}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(log.timestamp), 'HH:mm:ss')}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination would go here */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredLogs.length} of {logs.length} entries
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
