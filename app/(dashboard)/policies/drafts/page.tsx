'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, ArrowUpDown, FileText, Calendar, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PageContainer } from '@/components/layout'
import { DataTable, StatusBadge } from '@/components/shared'
import { policyApi } from '@/lib/api/client'
import { POLICY_TYPES, POLICY_STATUSES } from '@/lib/constants'
import type { PolicyDocument, PolicyStatus, PolicyType } from '@/lib/types'

const columns: ColumnDef<PolicyDocument>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4"
      >
        Title
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const policy = row.original
      return (
        <div className="max-w-[400px]">
          <Link
            href={`/policies/drafts/${policy.id}`}
            className="font-medium hover:text-primary hover:underline"
          >
            {policy.title}
          </Link>
          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
            {policy.description}
          </p>
        </div>
      )
    },
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('type') as PolicyType
      return (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{POLICY_TYPES[type]?.label}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value === row.getValue(id)
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as PolicyStatus
      return <StatusBadge type="policy" status={status} />
    },
    filterFn: (row, id, value) => {
      return value === row.getValue(id)
    },
  },
  {
    accessorKey: 'version',
    header: 'Version',
    cell: ({ row }) => {
      return <span className="text-sm">v{row.getValue('version')}</span>
    },
  },
  {
    accessorKey: 'assignedReviewers',
    header: 'Reviewers',
    cell: ({ row }) => {
      const reviewers = row.original.assignedReviewers
      if (reviewers.length === 0) {
        return <span className="text-muted-foreground text-sm">None assigned</span>
      }
      return (
        <div className="flex -space-x-2">
          {reviewers.slice(0, 3).map((reviewer) => (
            <Avatar key={reviewer.id} className="h-7 w-7 border-2 border-background">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {reviewer.firstName[0]}
                {reviewer.lastName[0]}
              </AvatarFallback>
            </Avatar>
          ))}
          {reviewers.length > 3 && (
            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
              +{reviewers.length - 3}
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4"
      >
        Updated
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue('updatedAt') as string
      return (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {new Date(date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const policy = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/policies/drafts/${policy.id}`}>View details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/policies/drafts/${policy.id}/review`}>Review</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Assign Reviewers</DropdownMenuItem>
            <DropdownMenuItem>Download Draft</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

const typeOptions = Object.entries(POLICY_TYPES).map(([value, { label }]) => ({
  value,
  label,
}))

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'revision_requested', label: 'Revision Requested' },
]

export default function PolicyDraftsPage() {
  const [policies, setPolicies] = useState<PolicyDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadPolicies() {
      try {
        const response = await policyApi.getPolicies({}, { page: 1, pageSize: 100 })
        // Filter to show only draft/review statuses
        const drafts = response.data.filter((p) =>
          ['draft', 'under_review', 'revision_requested', 'submitted'].includes(p.status)
        )
        setPolicies(drafts)
      } catch (error) {
        console.error('Failed to load policies:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadPolicies()
  }, [])

  return (
    <PageContainer
      title="Draft Reviews"
      description="Review and manage policy draft documents"
    >
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-10 bg-muted animate-pulse rounded" />
          <div className="h-[400px] bg-muted animate-pulse rounded" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={policies}
          searchKey="title"
          searchPlaceholder="Search drafts..."
          filterOptions={[
            { key: 'type', label: 'Type', options: typeOptions },
            { key: 'status', label: 'Status', options: statusOptions },
          ]}
        />
      )}
    </PageContainer>
  )
}
