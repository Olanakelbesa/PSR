'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, Send, ArrowLeft, Upload, X, Plus, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PageContainer } from '@/components/layout'
import { proposalSchema, type ProposalFormData } from '@/lib/validations'
import { proposalsApi } from '@/lib/api/client'
import { THEMATIC_AREAS, STUDY_TYPES } from '@/lib/constants'
import type { ResearchProposal } from '@/lib/types'
import { toast } from 'sonner'

export default function EditProposalPage() {
  const { id } = useParams()
  const router = useRouter()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [coInvestigators, setCoInvestigators] = useState<string[]>([])
  const [newCoInvestigator, setNewCoInvestigator] = useState('')

  const form = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      title: '',
      abstract: '',
      background: '',
      objectives: '',
      methodology: '',
      expectedOutcomes: '',
      thematicArea: '',
      studyType: '',
      studyRegions: [],
      budget: 0,
      duration: 12,
    },
  })

  useEffect(() => {
    async function loadProposal() {
      if (!id) return
      
      setIsLoading(true)
      try {
        const response = await proposalsApi.getById(id as string)
        if (response.success && response.data) {
          const proposal = response.data
          form.reset({
            title: proposal.title,
            abstract: proposal.abstract,
            background: proposal.background,
            objectives: proposal.objectives,
            methodology: proposal.methodology,
            expectedOutcomes: proposal.expectedOutcomes,
            thematicArea: proposal.researchArea,
            studyType: proposal.studyType || '',
            studyRegions: proposal.studyRegions || [],
            budget: proposal.budget.total || 0,
            duration: proposal.duration || 12,
          })
          setCoInvestigators(proposal.coInvestigators.map(ci => ci.email))
        } else {
          toast.error('Proposal not found')
          router.push('/research/proposals/my-proposals')
        }
      } catch (error) {
        console.error('Failed to load proposal:', error)
        toast.error('Failed to load proposal data')
      } finally {
        setIsLoading(false)
      }
    }
    loadProposal()
  }, [id, form, router])

  const addCoInvestigator = () => {
    if (newCoInvestigator.trim() && !coInvestigators.includes(newCoInvestigator.trim())) {
      setCoInvestigators([...coInvestigators, newCoInvestigator.trim()])
      setNewCoInvestigator('')
    }
  }

  const removeCoInvestigator = (email: string) => {
    setCoInvestigators(coInvestigators.filter(e => e !== email))
  }

  const onSubmit = async (data: ProposalFormData, submitType: 'draft' | 'submit') => {
    setIsSubmitting(true)
    try {
      const response = await proposalsApi.updateProposal(id as string, {
        ...data,
        researchArea: data.thematicArea,
        status: submitType === 'submit' ? 'submitted' : 'draft',
        budget: {
          total: data.budget,
          personnel: 0,
          equipment: 0,
          consumables: 0,
          travel: 0,
          other: 0,
        },
        coInvestigators: coInvestigators.map(email => ({
          email,
          name: email.split('@')[0], // Mock name
          role: 'researcher',
          institution: 'Unknown',
          expertise: 'Unknown'
        })) as any
      })
      
      if (response.success) {
        toast.success(submitType === 'submit' ? 'Proposal submitted successfully' : 'Draft saved successfully')
        router.push('/research/proposals/my-proposals')
      } else {
        toast.error(response.message || 'Failed to update proposal')
      }
    } catch (error) {
      console.error('Failed to update proposal:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <PageContainer title="Edit Proposal" description="Loading proposal data...">
        <div className="h-96 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading proposal details...</p>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title="Edit Research Proposal"
      description="Update your research proposal details"
      actions={
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      }
    >
      <Form {...form}>
        <form className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Provide the basic details of your research proposal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proposal Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter proposal title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="thematicArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thematic Area *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select thematic area" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {THEMATIC_AREAS.map((area) => (
                            <SelectItem key={area.value} value={area.value}>
                              {area.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="studyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Study Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select study type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STUDY_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="abstract"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Abstract *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide a brief summary of your research proposal"
                        className="min-h-32"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>Maximum 300 words</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Research Details */}
          <Card>
            <CardHeader>
              <CardTitle>Research Details</CardTitle>
              <CardDescription>
                Describe your research background, objectives, and methodology
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="background"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Background & Rationale *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the background and rationale for this research"
                        className="min-h-32"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="objectives"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Research Objectives *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="List the main objectives of your research"
                        className="min-h-24"
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
                    <FormLabel>Methodology *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the research methodology and approach"
                        className="min-h-32"
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
                    <FormLabel>Expected Outcomes *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the expected outcomes and potential impact"
                        className="min-h-24"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Team & Budget */}
          <Card>
            <CardHeader>
              <CardTitle>Research Team & Budget</CardTitle>
              <CardDescription>
                Add co-investigators and specify budget requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <FormLabel>Co-Investigators</FormLabel>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Enter co-investigator email"
                    value={newCoInvestigator}
                    onChange={(e) => setNewCoInvestigator(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addCoInvestigator()
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addCoInvestigator}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {coInvestigators.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {coInvestigators.map((email) => (
                      <Badge key={email} variant="secondary" className="gap-1">
                        {email}
                        <button
                          type="button"
                          onClick={() => removeCoInvestigator(email)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Budget (ETB) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (months) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="12"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
              <CardDescription>
                Upload supporting documents for your proposal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop files here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOC, DOCX up to 10MB each
                </p>
                <Button variant="outline" className="mt-4" type="button">
                  Browse Files
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button 
              variant="outline" 
              type="button"
              disabled={isSubmitting}
              onClick={form.handleSubmit((data) => onSubmit(data, 'draft'))}
            >
              <Save className="h-4 w-4 mr-2" />
              Update Draft
            </Button>
            <Button 
              type="button"
              disabled={isSubmitting}
              onClick={form.handleSubmit((data) => onSubmit(data, 'submit'))}
            >
              <Send className="h-4 w-4 mr-2" />
              Submit Proposal
            </Button>
          </div>
        </form>
      </Form>
    </PageContainer>
  )
}