'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Filter,
  ClipboardCheck,
  Clock,
  CheckCircle2,
  Eye,
  FileText,
  Star,
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
import { proposalsApi } from '@/lib/api/client'
import { mockProposals } from '@/lib/api/mock-data'
import { THEMATIC_AREAS } from '@/lib/constants'
import type { ResearchProposal } from '@/lib/types'

type EvaluationRow = {
  id: string;
  proposalTitle: string;
  proposalReference: string;
  principalInvestigator: string;
  thematicArea: string;
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed';
  score?: number;
  recommendation?: 'approve' | 'revise' | 'reject';
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline'; icon: typeof Clock }> = {
  pending: { label: 'Pending', variant: 'outline', icon: Clock },
  in_progress: { label: 'In Progress', variant: 'secondary', icon: FileText },
  completed: { label: 'Completed', variant: 'default', icon: CheckCircle2 },
}

function EvaluationCard({ evaluation }: { evaluation: EvaluationRow }) {
  const status = statusConfig[evaluation.status] || statusConfig.pending
  const StatusIcon = status.icon
  const deadline = new Date(evaluation.deadline)
  const daysRemaining = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-base leading-tight line-clamp-2">
              {evaluation.proposalTitle}
            </CardTitle>
            <CardDescription>
              Ref: {evaluation.proposalReference}
            </CardDescription>
          </div>
          <Badge variant={status.variant} className="gap-1 shrink-0">
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Principal Investigator</span>
            <span className="font-medium">{evaluation.principalInvestigator}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Thematic Area</span>
            <Badge variant="outline" className="text-xs">
              {THEMATIC_AREAS.find(t => t.value === evaluation.thematicArea)?.label || evaluation.thematicArea}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Review Deadline</span>
            <span className={`font-medium ${daysRemaining <= 3 ? 'text-red-500' : daysRemaining <= 7 ? 'text-amber-500' : ''}`}>
              {deadline.toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Score (if completed) */}
        {evaluation.status === 'completed' && evaluation.score && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
            <span className="font-semibold">Score: {evaluation.score}/100</span>
            <span className="text-sm text-muted-foreground ml-auto">
              {evaluation.recommendation}
            </span>
          </div>
        )}

        {/* Warning for approaching deadline */}
        {evaluation.status !== 'completed' && daysRemaining <= 7 && daysRemaining > 0 && (
          <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-sm">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-amber-700 dark:text-amber-400">
              {daysRemaining} day{daysRemaining > 1 ? 's' : ''} remaining
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant={evaluation.status === 'completed' ? 'outline' : 'default'} 
            className="flex-1" 
            asChild
          >
            <Link href={`/research/evaluations/${evaluation.id}`}>
              {evaluation.status === 'completed' ? (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  View Review
                </>
              ) : (
                <>
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  {evaluation.status === 'pending' ? 'Start Review' : 'Continue Review'}
                </>
              )}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<EvaluationRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function loadEvaluations() {
      try {
        const response = await proposalsApi.getProposals(
          { status: 'under_review' },
          { page: 1, pageSize: 100 },
        )

        const sourceProposals =
          response.data.length > 0
            ? response.data
            : mockProposals.filter(
                (proposal) =>
                  proposal.status === 'under_review' ||
                  proposal.status === 'completed' ||
                  proposal.reviews.length > 0,
              )

        setEvaluations(
          sourceProposals.map((proposal: ResearchProposal) => {
            const latestReview = proposal.reviews?.[0];

            return {
              id: proposal.id,
              proposalTitle: proposal.title,
              proposalReference: proposal.id.replace('prop-', 'PRP-').toUpperCase(),
              principalInvestigator: `${proposal.principalInvestigator.firstName} ${proposal.principalInvestigator.lastName}`,
              thematicArea: proposal.researchArea,
              deadline:
                proposal.submittedAt || proposal.updatedAt || proposal.createdAt,
              status:
                proposal.status === 'completed'
                  ? 'completed'
                  : proposal.status === 'under_review'
                    ? 'in_progress'
                    : 'pending',
              score: latestReview?.overallScore,
              recommendation: latestReview?.recommendation,
            }
          }),
        )
        }
      } catch (error) {
        console.error('Failed to load evaluations:', error)
        const fallbackRows = mockProposals
          .filter((proposal) => proposal.status === 'under_review')
          .map((proposal) => ({
            id: proposal.id,
            proposalTitle: proposal.title,
            proposalReference: proposal.id.replace('prop-', 'PRP-').toUpperCase(),
            principalInvestigator: `${proposal.principalInvestigator.firstName} ${proposal.principalInvestigator.lastName}`,
            thematicArea: proposal.researchArea,
            deadline: proposal.submittedAt || proposal.updatedAt || proposal.createdAt,
            status: 'in_progress' as const,
            score: proposal.reviews?.[0]?.overallScore,
            recommendation: proposal.reviews?.[0]?.recommendation,
          }))
        setEvaluations(fallbackRows)
      } finally {
        setIsLoading(false)
      }
    }
    loadEvaluations()
  }, [])

  const filteredEvaluations = evaluations.filter(evaluation => {
    if (statusFilter !== 'all' && evaluation.status !== statusFilter) return false
    if (searchQuery && !evaluation.proposalTitle.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const pending = evaluations.filter(e => e.status === 'pending').length
  const inProgress = evaluations.filter(e => e.status === 'in_progress').length
  const completed = evaluations.filter(e => e.status === 'completed').length

  return (
    <PageContainer
      title="My Evaluations"
      description="Review and evaluate assigned research proposals"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <ClipboardCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Assigned</p>
                <p className="text-2xl font-bold">{evaluations.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pending}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{inProgress}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completed}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search evaluations..."
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Evaluations Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-24 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredEvaluations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvaluations.map((evaluation) => (
              <EvaluationCard key={evaluation.id} evaluation={evaluation} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No evaluations found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'You have no assigned evaluations at this time'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  )
}
