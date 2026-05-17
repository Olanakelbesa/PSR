"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
  { id: "scientific_merit", label: "Scientific Merit & Originality", points: 20 },
  { id: "methodology", label: "Research Methodology & Design", points: 20 },
  { id: "feasibility", label: "Feasibility & Team Capacity", points: 15 },
  { id: "ethical", label: "Ethical Compliance", points: 10 },
  { id: "budget_justification", label: "Budget Justification & Value for Money", points: 10 },
  { id: "policy_relevance", label: "Policy Relevance & National Priority Alignment", points: 15 },
  { id: "expected_outcomes", label: "Expected Outcomes & Dissemination Plan", points: 10 },
];

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------
const technicalReviewSchema = z.object({
  reviewerName: z.string().min(1, "Reviewer name is required"),
  comments: z.string().min(10, "Comment must be at least 10 characters"),
  evaluationCriteria: z.record(z.union([z.number(), z.literal("")])),
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

  const defaultCriteria = Object.fromEntries(
    EVALUATION_CRITERIA.map(c => [c.id, ""])
  ) as Record<string, number | "">;

  const form = useForm<TechnicalReviewFormData>({
    resolver: zodResolver(technicalReviewSchema),
    defaultValues: {
      reviewerName: "",
      comments: "",
      evaluationCriteria: defaultCriteria,
      recommendation: "approve",
    },
  });

  const criteria = form.watch("evaluationCriteria");
  const passedCount = EVALUATION_CRITERIA.filter(c => {
    const val = Number(criteria[c.id] || 0);
    return val > 0;
  }).length;
  const totalScore = EVALUATION_CRITERIA.reduce((sum, c) => {
    const val = Number(criteria[c.id] || 0);
    return sum + val;
  }, 0);

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
      const response = await proposalsApi.updateProposal(id as string, {
        status: "approved",
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
                      <p className="text-xs tracking-widest text-muted-foreground mb-1">Proposal Title</p>
                      <h3 className="text-lg font-bold leading-tight text-primary">{proposal?.title}</h3>
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

              {/* Evaluation Criteria Scoring Card */}
              <Card className="shadow-sm border-primary/10">
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base">Evaluation Criteria Scoring</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn(
                        "font-bold",
                        passedCount === EVALUATION_CRITERIA.length
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      )}>
                        {passedCount} / {EVALUATION_CRITERIA.length} Scored
                      </Badge>
                      <Badge className="font-bold bg-primary text-primary-foreground">
                        Total Score: {totalScore} / 100
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>Enter the score achieved for each of the following criteria (Total Score is out of 100)</CardDescription>
                </CardHeader>
                <CardContent className="pt-5 divide-y bg-background/30 rounded-b-xl">
                  {EVALUATION_CRITERIA.map((criterion) => {
                    return (
                      <div key={criterion.id} className="flex items-center justify-between py-4 first:pt-0">
                        <div className="space-y-0.5">
                          <span className="text-sm font-semibold text-foreground">{criterion.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <FormField
                            control={form.control}
                            name={`evaluationCriteria.${criterion.id}`}
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <FormControl>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      placeholder="0"
                                      min={0}
                                      max={criterion.points}
                                      className="w-20 text-center h-10 font-bold border-primary/25 focus:border-primary/50 text-primary bg-background focus:ring-1 focus:ring-primary/30"
                                      value={field.value}
                                      onChange={(e) => {
                                        const rawValue = e.target.value;
                                        if (rawValue === "") {
                                          field.onChange("");
                                          return;
                                        }
                                        let val = parseInt(rawValue, 10);
                                        if (isNaN(val)) val = 0;
                                        if (val < 0) val = 0;
                                        if (val > criterion.points) val = criterion.points;
                                        field.onChange(val);
                                      }}
                                    />
                                    <span className="text-sm font-bold text-muted-foreground">/ {criterion.points}</span>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
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
                  {reviewerFile ? (
                    <div className="flex  items-center justify-between border-2 border border-primary/30 bg-primary/[0.02] rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Paperclip className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-primary line-clamp-1">{reviewerFile.name}</p>
                          <p className="text-xs text-muted-foreground">{(reviewerFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer">
                          <div className="flex items-center justify-center h-9 px-4 text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md transition-colors">
                            Replace
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => setReviewerFile(e.target.files?.[0] || null)}
                          />
                        </label>
                        <Button 
                          type="button"
                          variant="destructive" 
                          size="sm" 
                          className="h-9 text-xs"
                          onClick={() => setReviewerFile(null)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 cursor-pointer hover:border-primary/30 hover:bg-primary/[0.02] transition-all group">
                      <Paperclip className="h-8 w-8 text-muted-foreground/40 group-hover:text-primary/50 mb-3 transition-colors" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground">Click to upload file</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">PDF, DOCX, or images — max 10MB</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => setReviewerFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ------------------------------------------------------------------ */}
            {/* Sidebar — Decision                                                   */}
            {/* ------------------------------------------------------------------ */}
            <aside className="space-y-4 xl:sticky xl:top-2 xl:h-fit ">
              <Card className="shadow-sm border-primary/10 overflow-hidden">
                <CardHeader className="bg-primary text-primary-foreground py-6 text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] mb-1 opacity-80">Decision</p>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <FormField
                    control={form.control}
                    name="comments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">Comments</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter your technical comment or feedback..."
                            className="min-h-[150px] resize-none shadow-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
            </aside>
          </div>
        </form>
      </Form>
    </PageContainer>
  );
}
