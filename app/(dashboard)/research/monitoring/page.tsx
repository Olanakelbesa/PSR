'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  MoreHorizontal,
  Eye,
  Upload,
  AlertCircle,
  TrendingUp,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PageContainer } from '@/components/layout'
import { monitoringApi } from '@/lib/api/client'
import type { MonitoringProject } from '@/lib/types'

const statusConfig: Record<string, { label: string; color: string }> = {
  on_track: { label: 'On Track', color: 'bg-green-500' },
  at_risk: { label: 'At Risk', color: 'bg-amber-500' },
  delayed: { label: 'Delayed', color: 'bg-red-500' },
  completed: { label: 'Completed', color: 'bg-blue-500' },
}

function ProjectCard({ project }: { project: MonitoringProject }) {
  const status = statusConfig[project.status] || statusConfig.on_track
  const progress = project.progress || 0
  const completedMilestones = project.milestones?.filter(m => m.status === 'completed').length || 0
  const totalMilestones = project.milestones?.length || 0

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-base leading-tight line-clamp-2">
              {project.title}
            </CardTitle>
            <CardDescription className="line-clamp-1">
              {project.principalInvestigator}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status.color}`} />
            <span className="text-sm font-medium">{status.label}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-muted/50 rounded-lg">
            <p className="text-lg font-bold">{completedMilestones}/{totalMilestones}</p>
            <p className="text-xs text-muted-foreground">Milestones</p>
          </div>
          <div className="p-2 bg-muted/50 rounded-lg">
            <p className="text-lg font-bold">{project.reportsSubmitted || 0}</p>
            <p className="text-xs text-muted-foreground">Reports</p>
          </div>
          <div className="p-2 bg-muted/50 rounded-lg">
            <p className="text-lg font-bold">{project.daysRemaining || '-'}</p>
            <p className="text-xs text-muted-foreground">Days Left</p>
          </div>
        </div>

        {/* Upcoming Deadline */}
        {project.nextDeadline && (
          <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span className="text-muted-foreground">Next:</span>
            <span className="font-medium">{project.nextDeadline.title}</span>
            <span className="text-muted-foreground ml-auto">
              {new Date(project.nextDeadline.date).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" asChild>
            <Link href={`/research/monitoring/${project.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Upload className="h-4 w-4 mr-2" />
                Submit Report
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Activity className="h-4 w-4 mr-2" />
                Update Progress
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

export default function MonitoringPage() {
  const [projects, setProjects] = useState<MonitoringProject[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadProjects() {
      try {
        const response = await monitoringApi.getProjects()
        if (response.success && response.data) {
          setProjects(response.data)
        }
      } catch (error) {
        console.error('Failed to load projects:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadProjects()
  }, [])

  const onTrack = projects.filter(p => p.status === 'on_track').length
  const atRisk = projects.filter(p => p.status === 'at_risk').length
  const delayed = projects.filter(p => p.status === 'delayed').length

  return (
    <PageContainer
      title="Project Monitoring"
      description="Track progress and milestones for approved research projects"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold">{projects.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">On Track</p>
                <p className="text-2xl font-bold">{onTrack}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">At Risk</p>
                <p className="text-2xl font-bold">{atRisk}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/10">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delayed</p>
                <p className="text-2xl font-bold">{delayed}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Grid */}
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
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No active projects</h3>
              <p className="text-muted-foreground">
                Projects will appear here once proposals are approved and research begins
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  )
}
