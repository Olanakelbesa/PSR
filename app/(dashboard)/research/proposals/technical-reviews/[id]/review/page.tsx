"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Send,
  MessageSquare,
  Paperclip,
  Plus,
  Trash2,
  User,
  CalendarClock,
  CheckCircle2,
  XCircle,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageContainer } from "@/components/layout";
import { proposalsApi } from "@/lib/api/client";
import { mockUsers } from "@/lib/api/mock-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Evaluation criteria based on PSR requirements
// ---------------------------------------------------------------------------
const EVALUATION_CRITERIA = [
  { id: "scientific_merit", label: "Scientific Merit & Originality" },
  { id: "methodology", label: "Research Methodology & Design" },
  { id: "feasibility", label: "Feasibility & Team Capacity" },
  { id: "ethical", label: "Ethical Compliance" },
  { id: "budget_justification", label: "Budget Justification & Value for Money" },
  { id: "policy_relevance", label: "Policy Relevance & National Priority Alignment" },
  { id: "expected_outcomes", label: "Expected Outcomes & Dissemination Plan" },
];

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------
const technicalReviewSchema = z.object({
  reviewerName: z.string().min(1, "Reviewer name is required"),
  comments: z.array(
    z.object({
      text: z.string().min(10, "Comment must be at least 10 characters"),
      givenAt: z.string(),
    })
  ).min(1, "At least one comment is required"),
  evaluationCriteria: z.record(z.boolean()),
  recommendation: z.enum(["approve", "revise", "reject"]),
});

type TechnicalReviewFormData = z.infer<typeof technicalReviewSchema>;

export default function TechnicalReviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposal, setProposal] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewerFile, setReviewerFile] = useState<File | null>(null);

  const rocReviewers = mockUsers.filter(u => u.role === "roc_reviewer");

  const defaultCriteria = Object.fromEntries(
    EVALUATION_CRITERIA.map(c => [c.id, false])
  );

  const form = useForm<TechnicalReviewFormData>({
    resolver: zodResolver(technicalReviewSchema),
    defaultValues: {
      reviewerName: "",
      comments: [{ text: "", givenAt: new Date().toISOString() }],
      evaluationCriteria: defaultCriteria,
      recommendation: "approve",
    },
  });

  const { fields: commentFields, append: appendComment, remove: removeComment } = useFieldArray({
    control: form.control,
    name: "comments",
  });

  const recommendation = form.watch("recommendation");
  const criteria = form.watch("evaluationCriteria");
  const passedCount = Object.values(criteria).filter(Boolean).length;

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
      } catch {
        toast.error("Failed to load proposal details");
      } finally {
        setIsLoading(false);
      }
    }
    loadProposal();
  }, [id, router]);

  async function onSubmit(data: TechnicalReviewFormData) {
    setIsSubmitting(true);
    try {
      const newStatus =
        data.recommendation === "approve"
          ? "approved"
          : data.recommendation === "reject"
          ? "rejected"
          : "revision_requested";

      const response = await proposalsApi.updateProposal(id as string, {
        status: newStatus as any,
      });

      if (response.success) {
        toast.success("Technical review submitted successfully");
        router.push(`/research/proposals/technical-reviews`);
      } else {
        toast.error(response.message || "Failed to submit review");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <PageContainer title="Loading Review Form...">
        <div className="h-96 flex flex-col items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Preparing technical review form...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Detailed Technical Review"
      description={`ROC Evaluation — Proposal Reference: ${proposal?.id.replace("prop-", "PRP-").toUpperCase()}`}
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
          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            {/* ------------------------------------------------------------------ */}
            {/* Main Column                                                          */}
            {/* ------------------------------------------------------------------ */}
            <div className="space-y-6">

              {/* Proposal Summary */}
              <Card className="shadow-sm border-primary/5 bg-primary/[0.02]">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] tracking-widest text-muted-foreground mb-1">Proposal Title</p>
                      <h3 className="text-lg font-black leading-tight text-primary">{proposal?.title}</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t border-primary/5">
                      <div>
                        <p className="text-[10px] tracking-widest text-muted-foreground mb-1">Reference No.</p>
                        <p className="text-sm font-bold">{proposal?.id.replace("prop-", "PRP-").toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] tracking-widest text-muted-foreground mb-1">Status</p>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-bold">
                          UNDER REVIEW
                        </Badge>
                      </div>
                      <div>
                        <p className="text-[10px] tracking-widest text-muted-foreground mb-1">Institution</p>
                        <p className="text-sm font-bold truncate">{proposal?.institution}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Version-Controlled Comments */}
              <Card className="shadow-sm border-primary/10">
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base">Review Comments</CardTitle>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => appendComment({ text: "", givenAt: new Date().toISOString() })}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Comment
                    </Button>
                  </div>
                  <CardDescription>Version-controlled — each comment records time of entry and can be addressed separately</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {commentFields.map((field, index) => (
                    <div key={field.id} className="space-y-3 p-4 rounded-xl border border-muted/60 bg-muted/10 relative">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-[9px] font-black text-primary">{index + 1}</span>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Comment #{index + 1}</span>
                        </div>
                        {commentFields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => removeComment(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>

                      <FormField
                        control={form.control}
                        name={`comments.${index}.text`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="Enter your technical comment or feedback..."
                                className="min-h-[120px] resize-none shadow-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center gap-6 pt-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <CalendarClock className="h-3 w-3" />
                          <span className="text-[10px] font-bold">
                            Given: {new Date(field.givenAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground/50">
                          <CalendarClock className="h-3 w-3" />
                          <span className="text-[10px] font-bold">Addressed: —</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Evaluation Criteria Checklist */}
              <Card className="shadow-sm border-primary/10">
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base">Evaluation Criteria Checklist</CardTitle>
                    </div>
                    <Badge variant="outline" className={cn(
                      "font-bold",
                      passedCount === EVALUATION_CRITERIA.length
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    )}>
                      {passedCount} / {EVALUATION_CRITERIA.length} Met
                    </Badge>
                  </div>
                  <CardDescription>Indicate whether each criterion has been satisfactorily addressed</CardDescription>
                </CardHeader>
                <CardContent className="pt-5 divide-y">
                  {EVALUATION_CRITERIA.map((criterion) => {
                    const value = form.watch(`evaluationCriteria.${criterion.id}`);
                    return (
                      <div key={criterion.id} className="flex items-center justify-between py-4 first:pt-0">
                        <span className="text-sm font-medium text-foreground">{criterion.label}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => form.setValue(`evaluationCriteria.${criterion.id}`, true)}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all",
                              value === true
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                : "border-muted-foreground/20 text-muted-foreground hover:border-emerald-400 hover:text-emerald-600"
                            )}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => form.setValue(`evaluationCriteria.${criterion.id}`, false)}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all",
                              value === false && Object.keys(form.formState.touchedFields).length > 0
                                ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                                : "border-muted-foreground/20 text-muted-foreground hover:border-rose-400 hover:text-rose-600"
                            )}
                          >
                            <XCircle className="h-3 w-3" />
                            No
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* File Attachment */}
              <Card className="shadow-sm border-primary/10">
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">Reviewer Attachment</CardTitle>
                  </div>
                  <CardDescription>Optional — attach annotated proposal or supporting documentation</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 cursor-pointer hover:border-primary/30 hover:bg-primary/[0.02] transition-all group">
                    <Paperclip className="h-8 w-8 text-muted-foreground/40 group-hover:text-primary/50 mb-3 transition-colors" />
                    {reviewerFile ? (
                      <div className="text-center">
                        <p className="text-sm font-bold text-primary">{reviewerFile.name}</p>
                        <p className="text-xs text-muted-foreground">{(reviewerFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground">Click to upload file</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">PDF, DOCX, or images — max 10MB</p>
                      </div>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => setReviewerFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </CardContent>
              </Card>
            </div>

            {/* ------------------------------------------------------------------ */}
            {/* Sidebar — Decision                                                   */}
            {/* ------------------------------------------------------------------ */}
            <aside className="space-y-4 sticky">
              <Card className="shadow-sm border-primary/10 overflow-hidden">
                <CardHeader className="bg-primary text-primary-foreground py-6 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1 opacity-80">ROC Decision</p>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <FormField
                    control={form.control}
                    name="recommendation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">Technical Recommendation</FormLabel>
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
                                Approve for Funding
                              </div>
                            </SelectItem>
                            <SelectItem value="revise">
                              <div className="flex items-center gap-2 text-amber-600">
                                <MessageSquare className="h-4 w-4" />
                                Request Major Revisions
                              </div>
                            </SelectItem>
                            <SelectItem value="reject">
                              <div className="flex items-center gap-2 text-rose-600">
                                <XCircle className="h-4 w-4" />
                                Reject Proposal
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="p-4 rounded-xl bg-muted/30 border border-muted-foreground/10">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <ShieldCheck className="h-3 w-3" /> Decision Impact
                    </h4>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {recommendation === "approve"
                        ? "Approving will move this proposal to 'Approved' status and initiate the contracting process."
                        : recommendation === "reject"
                        ? "Rejecting will notify the researcher and archive the proposal."
                        : "Requesting revisions will send the proposal back to the researcher with your comments."}
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="w-full h-12 shadow-lg shadow-primary/10"
                      disabled={isSubmitting}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Submitting..." : "Submit Evaluation"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Criteria Summary */}
              <Card className="shadow-sm border-primary/5">
                <CardHeader className="py-3 border-b">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Criteria Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                  {EVALUATION_CRITERIA.map(c => {
                    const met = form.watch(`evaluationCriteria.${c.id}`);
                    return (
                      <div key={c.id} className="flex items-center justify-between text-[11px] gap-2">
                        <span className="text-muted-foreground truncate flex-1">{c.label}</span>
                        {met ? (
                          <Badge variant="outline" className="h-4 px-1 text-[8px] bg-emerald-50 text-emerald-600 border-emerald-100 shrink-0">YES</Badge>
                        ) : (
                          <Badge variant="outline" className="h-4 px-1 text-[8px] bg-rose-50 text-rose-600 border-rose-100 shrink-0">NO</Badge>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </aside>
          </div>
        </form>
      </Form>
    </PageContainer>
  );
}
