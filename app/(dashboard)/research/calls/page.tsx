'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  FileText,
  Plus,
  Search,
  Filter,
  ExternalLink,
} from 'lucide-react'

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
import { PageContainer } from '@/components/layout'
import { callsApi } from '@/lib/api/client'
import type { CallForProposal } from '@/lib/types'
import { THEMATIC_AREAS } from '@/lib/constants'

function CallCard({ call }: { call: CallForProposal }) {
  const isOpen = call.status === 'open'
  const deadline = new Date(call.deadline)
  const daysRemaining = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg leading-tight line-clamp-2">
              {call.title}
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {call.description}
            </CardDescription>
          </div>
          <Badge variant={isOpen ? 'default' : 'secondary'}>
            {isOpen ? 'Open' : call.status.charAt(0).toUpperCase() + call.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2 mb-4">
          {call.thematicAreas.slice(0, 3).map((area) => (
            <Badge key={area} variant="outline" className="text-xs">
              {THEMATIC_AREAS.find(t => t.value === area)?.label || area}
            </Badge>
          ))}
          {call.thematicAreas.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{call.thematicAreas.length - 3} more
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Deadline: {deadline.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{call.submissionsCount || 0} submissions</span>
          </div>
        </div>

        {isOpen && daysRemaining > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Clock className={`h-4 w-4 ${daysRemaining <= 7 ? 'text-amber-500' : 'text-muted-foreground'}`} />
            <span className={daysRemaining <= 7 ? 'text-amber-500 font-medium' : 'text-muted-foreground'}>
              {daysRemaining} days remaining
            </span>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" asChild>
            <Link href={`/research/calls/${call.id}`}>
              View Details
              <ExternalLink className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          {isOpen && (
            <Button className="flex-1" asChild>
              <Link href={`/research/proposals/new?callId=${call.id}`}>
                Apply Now
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function CallsForProposalsPage() {
  const [calls, setCalls] = useState<CallForProposal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function loadCalls() {
      try {
        const response = await callsApi.getAll()
        if (response.success && response.data) {
          setCalls(response.data)
        }
      } catch (error) {
        console.error('Failed to load calls:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadCalls()
  }, [])

  const filteredCalls = calls.filter(call => {
    if (statusFilter !== 'all' && call.status !== statusFilter) return false
    if (searchQuery && !call.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const openCalls = calls.filter(c => c.status === 'open').length
  const closedCalls = calls.filter(c => c.status === 'closed').length

  return (
    <PageContainer
      title="Calls for Proposals"
      description="Browse and apply to open research funding opportunities"
      actions={
        <Button asChild>
          <Link href="/research/calls/new">
            <Plus className="h-4 w-4 mr-2" />
            Create New Call
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Calls</p>
                <p className="text-2xl font-bold">{calls.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <Clock className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Open Calls</p>
                <p className="text-2xl font-bold">{openCalls}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-muted">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Closed Calls</p>
                <p className="text-2xl font-bold">{closedCalls}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search calls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Calls Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCalls.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCalls.map((call) => (
              <CallCard key={call.id} call={call} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No calls found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'There are no calls for proposals at this time'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  )
}
