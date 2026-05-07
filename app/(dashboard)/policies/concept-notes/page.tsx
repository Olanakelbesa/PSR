'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Plus, ArrowUpDown, FileText, Calendar, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PageContainer } from '@/components/layout'
import { DataTable, StatusBadge } from '@/components/shared'
import { conceptNoteApi } from '@/lib/api/client'
import { POLICY_TYPES, POLICY_STATUSES } from '@/lib/constants'
import type { ConceptNote, PolicyStatus, PolicyType } from '@/lib/types'

const columns: ColumnDef<ConceptNote>[] = [
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
      const note = row.original
      return (
        <div className="max-w-[400px]">
          <Link
            href={`/policies/concept-notes/${note.id}`}
            className="font-medium hover:text-primary hover:underline"
          >
            {note.title}
          </Link>
          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
            {note.background.slice(0, 100)}...
          </p>
        </div>
      )
    },
  },
  {
    accessorKey: 'policyType',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('policyType') as PolicyType
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
    accessorKey: 'createdBy',
    header: 'Author',
    cell: ({ row }) => {
      const author = row.original.createdBy
      return (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {author.firstName} {author.lastName}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4"
      >
        Created
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as string
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
      const note = row.original

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
              <Link href={`/policies/concept-notes/${note.id}`}>View details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/policies/concept-notes/${note.id}/edit`}>Edit</Link>
            </DropdownMenuItem>
            {note.status === 'draft' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Submit for Review</DropdownMenuItem>
              </>
            )}
            {(note.status === 'submitted' || note.status === 'under_review') && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/policies/concept-notes/${note.id}/review`}>
                    Review
                  </Link>
                </DropdownMenuItem>
              </>
            )}
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

const statusOptions = Object.entries(POLICY_STATUSES).map(([value, { label }]) => ({
  value,
  label,
}))

export default function ConceptNotesPage() {
  const [notes, setNotes] = useState<ConceptNote[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadNotes() {
      try {
        const response = await conceptNoteApi.getConceptNotes({}, { page: 1, pageSize: 100 })
        setNotes(response.data)
      } catch (error) {
        console.error('Failed to load concept notes:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadNotes()
  }, [])

  return (
    <PageContainer
      title="Concept Notes"
      description="Manage policy concept notes and initiation documents"
      actions={
        <Button asChild>
          <Link href="/policies/concept-notes/new">
            <Plus className="mr-2 h-4 w-4" />
            New Concept Note
          </Link>
        </Button>
      }
    >
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-10 bg-muted animate-pulse rounded" />
          <div className="h-[400px] bg-muted animate-pulse rounded" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={notes}
          searchKey="title"
          searchPlaceholder="Search concept notes..."
          filterOptions={[
            { key: 'policyType', label: 'Type', options: typeOptions },
            { key: 'status', label: 'Status', options: statusOptions },
          ]}
        />
      )}
    </PageContainer>
  )
}
