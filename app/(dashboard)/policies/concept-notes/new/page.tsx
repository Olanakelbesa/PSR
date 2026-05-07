'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2, Save, Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/layout'
import { conceptNoteApi } from '@/lib/api/client'
import { conceptNoteSchema, type ConceptNoteFormData } from '@/lib/validations'
import { POLICY_TYPES } from '@/lib/constants'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'

export default function NewConceptNotePage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ConceptNoteFormData>({
    resolver: zodResolver(conceptNoteSchema),
    defaultValues: {
      title: '',
      background: '',
      objectives: '',
      scope: '',
      methodology: '',
      expectedOutcomes: '',
      timeline: '',
      policyType: 'guideline',
    },
  })

  async function onSubmit(data: ConceptNoteFormData, submitForReview = false) {
    if (!user) return
    setIsLoading(true)
    try {
      const response = await conceptNoteApi.createConceptNote({
        ...data,
        createdBy: user,
        status: submitForReview ? 'submitted' : 'draft',
      })
      if (response.success) {
        toast.success(
          submitForReview
            ? 'Concept note created and submitted for review'
            : 'Concept note saved as draft'
        )
        router.push('/policies/concept-notes')
      } else {
        toast.error(response.message || 'Failed to create concept note')
      }
    } catch (error) {
      console.error('Failed to create concept note:', error)
      toast.error('An error occurred while creating the concept note')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageContainer
      title="New Concept Note"
      description="Create a new policy concept note"
      actions={
        <Button variant="outline" asChild>
          <Link href="/policies/concept-notes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      }
    >
      <Form {...form}>
        <form className="space-y-6 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Provide the title and type of the concept note</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter concept note title" {...field} />
                    </FormControl>
                    <FormDescription>
                      A clear, descriptive title for the policy concept note
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="policyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policy Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select policy type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(POLICY_TYPES).map(([value, { label, description }]) => (
                          <SelectItem key={value} value={value}>
                            <div>
                              <div>{label}</div>
                              <div className="text-xs text-muted-foreground">{description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
              <CardDescription>Describe the background, objectives, and scope</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="background"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Background</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide the background and context for this policy initiative..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Explain the context, rationale, and need for this policy
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="objectives"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objectives</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="List the main objectives of this policy concept..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scope</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Define the scope and boundaries of this policy..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="methodology"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Methodology (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the approach or methodology for developing this policy..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expectedOutcomes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Outcomes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the expected outcomes and deliverables..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timeline (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Q2 2024 - Q4 2024" {...field} />
                    </FormControl>
                    <FormDescription>
                      Estimated timeline for policy development
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={form.handleSubmit((data) => onSubmit(data, false))}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save as Draft
            </Button>
            <Button
              type="button"
              disabled={isLoading}
              onClick={form.handleSubmit((data) => onSubmit(data, true))}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              Submit for Review
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </PageContainer>
  )
}
