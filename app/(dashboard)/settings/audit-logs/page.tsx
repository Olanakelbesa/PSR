'use client'

import { useEffect, useState } from 'react'
import {
  Search,
  Filter,
  Download,
  Calendar,
  User,
  FileText,
  Settings,
  Shield,
  LogIn,
  LogOut,
  Edit,
  Trash2,
  Plus,
  Eye,
  RefreshCw,
} from 'lucide-react'
import { format } from 'date-fns'

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
import { auditApi } from '@/lib/api/client'
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

// Mock data
const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    action: 'login',
    userId: 'user-1',
    userName: 'Dr. Sarah Johnson',
    userRole: 'PSR Officer',
    resource: 'Authentication',
    resourceId: '',
    details: 'User logged in successfully',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    action: 'create',
    userId: 'user-2',
    userName: 'Prof. Michael Chen',
    userRole: 'Researcher',
    resource: 'Proposal',
    resourceId: 'PROP-2024-001',
    details: 'Created new research proposal: "Health Systems Strengthening in Rural Areas"',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    action: 'update',
    userId: 'user-3',
    userName: 'Admin User',
    userRole: 'System Admin',
    resource: 'User',
    resourceId: 'user-15',
    details: 'Updated user role from "Researcher" to "ROC Reviewer"',
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    action: 'delete',
    userId: 'user-1',
    userName: 'Dr. Sarah Johnson',
    userRole: 'PSR Officer',
    resource: 'Draft',
    resourceId: 'DRAFT-2024-003',
    details: 'Deleted draft policy document: "Healthcare Financing Reform"',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    action: 'view',
    userId: 'user-4',
    userName: 'Dr. Amina Hassan',
    userRole: 'ROC Reviewer',
    resource: 'Proposal',
    resourceId: 'PROP-2024-002',
    details: 'Viewed proposal details for evaluation',
    ipAddress: '192.168.1.103',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    action: 'export',
    userId: 'user-3',
    userName: 'Admin User',
    userRole: 'System Admin',
    resource: 'Report',
    resourceId: '',
    details: 'Exported annual research report to PDF',
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '7',
    action: 'settings',
    userId: 'user-3',
    userName: 'Admin User',
    userRole: 'System Admin',
    resource: 'Taxonomy',
    resourceId: 'thematic-areas',
    details: 'Added new thematic area: "Digital Health"',
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '8',
    action: 'logout',
    userId: 'user-2',
    userName: 'Prof. Michael Chen',
    userRole: 'Researcher',
    resource: 'Authentication',
    resourceId: '',
    details: 'User logged out',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
  },
]

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>(mockAuditLogs)
  const [isLoading, setIsLoading] = useState(false)
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState<Date | undefined>()
  const [dateTo, setDateTo] = useState<Date | undefined>()

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
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1000)
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
