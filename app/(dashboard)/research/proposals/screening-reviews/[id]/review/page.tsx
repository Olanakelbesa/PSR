"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Send,
  MessageSquare,
  Users,
  Search,
  Check,
  ClipboardCheck,
  Clock,
  UserCheck,
  FileCheck
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { PageContainer } from "@/components/layout";
import { proposalScreeningSchema, type ProposalScreeningFormData } from "@/lib/validations";
import { proposalsApi } from "@/lib/api/client";
import { mockUsers } from "@/lib/api/mock-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export default function ProposalScreeningPage() {
  const { id } = useParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposal, setProposal] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reviewers = mockUsers.filter(u => u.role === 'roc_reviewer');

  const form = useForm<ProposalScreeningFormData>({
    resolver: zodResolver(proposalScreeningSchema),
    defaultValues: {
      comments: "",
      recommendation: "approve",
      assignedReviewers: [],
    },
  });

  const recommendation = form.watch("recommendation");

  useEffect(() => {
    async function loadProposal() {
      try {
        const response = await proposalsApi.getById(id as string);
        if (response.success && response.data) {
          setProposal(response.data);
        } else {
          toast.error("Proposal not found");
          router.back();
        }
      } catch (error) {
        console.error("Error loading proposal:", error);
        toast.error("Failed to load proposal details");
      } finally {
        setIsLoading(false);
      }
    }
    loadProposal();
  }, [id, router]);

  async function onSubmit(data: ProposalScreeningFormData) {
    setIsSubmitting(true);
    try {
      // In a real app, this would call a specific screening API
      const response = await proposalsApi.updateProposal(id as string, {
        status: data.recommendation === 'approve' ? 'under_review' : 
                data.recommendation === 'reject' ? 'rejected' : 'revision_requested',
        // In a real backend, we'd also save the comments and assignedReviewers
      });

      if (response.success) {
        toast.success("Screening completed");
        router.push(`/research/proposals/screening-reviews`);
      } else {
        toast.error(response.message || "Failed to submit screening");
      }
    } catch (error) {
      console.error("Error submitting screening:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <PageContainer title="Loading Screening Form...">
        <div className="h-96 flex flex-col items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground animate-pulse">Initializing administrative workflow...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Screening Review" 
      description={`Initial check for Proposal Reference: ${proposal?.id.replace('prop-', 'PRP-').toUpperCase()}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
            <div className="space-y-6">
              {/* Proposal Info Summary */}
              <Card className="shadow-sm border-primary/5 bg-primary/[0.02]">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px]  tracking-widest text-muted-foreground mb-1">Proposal Title</p>
                      <h3 className="text-lg font-bold leading-tight text-primary uppercase">{proposal?.title}</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-primary/5">
                      <div>
                        <p className="text-[10px] tracking-widest text-muted-foreground mb-1">Proposal Reference</p>
                        <p className="text-sm font-bold">{proposal?.id.replace('prop-', 'PRP-').toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] tracking-widest text-muted-foreground mb-1">Current Status</p>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                           {proposal?.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-[10px] tracking-widest text-muted-foreground mb-1">Institution</p>
                        <p className="text-sm font-bold truncate">{proposal?.institution}</p>
                      </div>
                      <div>
                        <p className="text-[10px] tracking-widest text-muted-foreground mb-1">Submission Date</p>
                        <p className="text-sm font-bold">{new Date(proposal?.submittedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Screening Comments */}
              <Card className="shadow-sm border-primary/10">
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">Administrative Comments</CardTitle>
                  </div>
                  <CardDescription>Document compliance checks, missing information, or general notes</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <FormField
                    control={form.control}
                    name="comments"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            placeholder="Type your screening notes here..." 
                            className="min-h-[200px] resize-none shadow-sm focus-visible:ring-primary/20" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                           Summarize the findings of your administrative review.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Decision */}
            <aside className="space-y-4">
              <Card className="shadow-sm border-primary/10 overflow-hidden ">
                <CardHeader className="bg-primary text-primary-foreground py-6 text-center">
                   <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1 opacity-80">Screening Decision</p>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                   <FormField
                      control={form.control}
                      name="recommendation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">Administrative Decision</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11 shadow-sm border-primary/20">
                                <SelectValue placeholder="Select outcome" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="approve">
                                 <div className="flex items-center gap-2 text-emerald-600">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Approve for Review
                                 </div>
                              </SelectItem>
                              <SelectItem value="revise">
                                 <div className="flex items-center gap-2 text-amber-600">
                                    <Clock className="h-4 w-4" />
                                    Request Revision
                                 </div>
                              </SelectItem>
                              <SelectItem value="reject">
                                 <div className="flex items-center gap-2 text-rose-600">
                                    <AlertCircle className="h-4 w-4" />
                                    Reject Proposal
                                 </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                   />

                   <div className="space-y-4 pt-2">
                      <div className="p-4 rounded-xl bg-muted/30 border border-muted-foreground/10">
                         <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                            <ShieldCheck className="h-3 w-3" /> Decision Impact
                         </h4>
                         <p className="text-xs leading-relaxed text-muted-foreground">
                            {recommendation === 'approve' 
                               ? "Approving will move this proposal to 'Under Review' and notify assigned reviewers." 
                               : recommendation === 'reject'
                               ? "Rejecting will notify the researcher and archive the proposal."
                               : "Requesting revision will send the proposal back to the researcher's draft folder."}
                         </p>
                      </div>

                      <Button 
                        type="submit"
                        className="w-full h-12 shadow-lg shadow-primary/10" 
                        disabled={isSubmitting}
                      >
                        <FileCheck className="mr-2 h-4 w-4" />
                        Submit
                      </Button>
                   </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </form>
      </Form>
    </PageContainer>
  );
}
