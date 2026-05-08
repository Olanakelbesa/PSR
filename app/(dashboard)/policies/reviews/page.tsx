'use client'

import { Activity, useState } from 'react'
import { 
  FileCheck, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  User,
  Calendar
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageContainer } from '@/components/layout'

interface PolicyReview {
  id: string
  title: string
  type: string
  submitter: string
  institution: string
  submissionDate: string
  deadline: string
  status: 'pending' | 'in_review' | 'approved' | 'rejected'
  priority: 'low' | 'medium' | 'high'
}

const mockReviews: PolicyReview[] = [
  {
    id: 'PR-2024-001',
    title: 'National Digital Education Strategy 2024-2030',
    type: 'Strategy',
    submitter: 'Dr. Solomon Ayele',
    institution: 'MoE - ICT Directorate',
    submissionDate: '2024-05-01',
    deadline: '2024-05-15',
    status: 'pending',
    priority: 'high',
  },
  {
    id: 'PR-2024-002',
    title: 'Standard Operating Procedures for Rural Schools',
    type: 'SOP',
    submitter: 'W/ro Tigist G/Michael',
    institution: 'Regional Education Bureau',
    submissionDate: '2024-04-28',
    deadline: '2024-05-12',
    status: 'in_review',
    priority: 'medium',
  },
  {
    id: 'PR-2024-003',
    title: 'Teacher Professional Development Framework',
    type: 'Framework',
    submitter: 'Kebede Kassaye',
    institution: 'AAU - College of Education',
    submissionDate: '2024-04-25',
    deadline: '2024-05-10',
    status: 'approved',
    priority: 'medium',
  },
  {
    id: 'PR-2024-004',
    title: 'Inclusive Education Policy Amendment',
    type: 'Policy',
    submitter: 'Sara Mohammed',
    institution: 'Special Needs Department',
    submissionDate: '2024-04-20',
    deadline: '2024-05-05',
    status: 'rejected',
    priority: 'high',
  },
]

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-200', icon: Clock },
  in_review: { label: 'In Review', color: 'bg-blue-500/10 text-blue-600 border-blue-200', icon: Activity },
  approved: { label: 'Approved', color: 'bg-green-500/10 text-green-600 border-green-200', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-500/10 text-red-600 border-red-200', icon: AlertCircle },
}

const priorityConfig = {
  low: { label: 'Low', color: 'bg-slate-100 text-slate-600' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-600' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-600' },
}

export default function PolicyReviewsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredReviews = mockReviews.filter(review => {
    if (activeTab !== 'all' && review.status !== activeTab) return false
    if (searchQuery && !review.title.toLowerCase().includes(searchQuery.toLowerCase()) && !review.id.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <PageContainer
      title="Policy Reviews"
      description="Manage and evaluate submitted policy documents and drafts"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="in_review">In Review</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-muted/30 border-muted focus:bg-background transition-all"
            />
          </div>
        </div>

        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-muted/50">
                <TableHead className="w-[120px]">ID</TableHead>
                <TableHead>Policy Document</TableHead>
                <TableHead>Submitter</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReviews.map((review) => {
                const status = statusConfig[review.status]
                const StatusIcon = status.icon
                
                return (
                  <TableRow key={review.id} className="group hover:bg-muted/30 border-muted/50 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                      {review.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-sm leading-none group-hover:text-primary transition-colors">
                          {review.title}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-medium bg-muted/50">
                            {review.type}
                          </Badge>
                          <div className={cn("text-[10px] px-1.5 py-0 rounded-full font-semibold uppercase tracking-wider", priorityConfig[review.priority].color)}>
                            {review.priority}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{review.submitter}</span>
                        <span className="text-xs text-muted-foreground">{review.institution}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Submitted: {review.submissionDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-orange-600 font-medium">
                          <Clock className="h-3 w-3" />
                          <span>Due: {review.deadline}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("flex w-fit items-center gap-1.5 px-2.5 py-0.5 rounded-full border shadow-none", status.color)}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        <span className="text-xs font-semibold uppercase tracking-tight">{status.label}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem className="cursor-pointer">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <FileText className="h-4 w-4 mr-2" />
                            Start Review
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-primary">
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Fast Track
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          
          {filteredReviews.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <FileCheck className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No reviews found</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                No policy documents match your current filter or search criteria.
              </p>
            </div>
          )}
        </Card>
      </div>
    </PageContainer>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}
