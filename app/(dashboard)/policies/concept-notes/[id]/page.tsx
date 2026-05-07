'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Send, FileText, User, Calendar, Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { PageContainer } from '@/components/layout'
import { StatusBadge } from '@/components/shared'
import { conceptNoteApi } from '@/lib/api/client'
import { POLICY_TYPES } from '@/lib/constants'
import type { ConceptNote } from '@/lib/types'
import { toast } from 'sonner'

export default function ConceptNoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [note, setNote] = useState<ConceptNote | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function loadNote() {
      try {
        const response = await conceptNoteApi.getConceptNote(params.id as string)
        if (response.success && response.data) {
          setNote(response.data)
        } else {
          router.push('/policies/concept-notes')
        }
      } catch (error) {
        console.error('Failed to load concept note:', error)
        router.push('/policies/concept-notes')
      } finally {
        setIsLoading(false)
      }
    }
    loadNote()
  }, [params.id, router])

  const handleSubmit = async () => {
    if (!note) return
    setIsSubmitting(true)
    try {
      const response = await conceptNoteApi.submitConceptNote(note.id)
      if (response.success) {
        toast.success('Concept note submitted for review')
        setNote(response.data!)
      }
    } catch (error) {
      toast.error('Failed to submit concept note')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <PageContainer title="Loading...">
        <div className="space-y-6">
          <div className="h-32 bg-muted animate-pulse rounded-lg" />
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
      </PageContainer>
    )
  }

  if (!note) {
    return null
  }

  return (
    <PageContainer
      title="Concept Note"
      description="View concept note details"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/policies/concept-notes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          {note.status === 'draft' && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/policies/concept-notes/${note.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                <Send className="mr-2 h-4 w-4" />
                Submit for Review
              </Button>
            </>
          )}
          {(note.status === 'submitted' || note.status === 'under_review') && (
            <Button asChild>
              <Link href={`/policies/concept-notes/${note.id}/review`}>
                Review
              </Link>
            </Button>
          )}
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{note.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      <FileText className="mr-1 h-3 w-3" />
                      {POLICY_TYPES[note.policyType]?.label}
                    </Badge>
                    <StatusBadge type="policy" status={note.status} />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Background</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{note.background}</p>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Objectives</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{note.objectives}</p>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Scope</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{note.scope}</p>
              </div>
              {note.methodology && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Methodology</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{note.methodology}</p>
                  </div>
                </>
              )}
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Expected Outcomes</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{note.expectedOutcomes}</p>
              </div>
              {note.timeline && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Timeline</h3>
                    <p className="text-muted-foreground">{note.timeline}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Reviews Section */}
          {note.reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Reviews</CardTitle>
                <CardDescription>Feedback from reviewers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {note.reviews.map((review) => (
                  <div key={review.id} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {review.reviewer.firstName} {review.reviewer.lastName}
                        </span>
                      </div>
                      <Badge
                        variant={
                          review.recommendation === 'approve'
                            ? 'default'
                            : review.recommendation === 'revise'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {review.recommendation === 'approve'
                          ? 'Approved'
                          : review.recommendation === 'revise'
                          ? 'Revision Requested'
                          : 'Rejected'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comments}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Author</p>
                  <p className="text-sm font-medium">
                    {note.createdBy.firstName} {note.createdBy.lastName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">
                    {new Date(note.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="text-sm font-medium">
                    {new Date(note.updatedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {note.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {note.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-2 p-2 bg-muted/50 rounded"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm truncate flex-1">{attachment.name}</span>
                      <Button variant="ghost" size="sm">
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  )
}
