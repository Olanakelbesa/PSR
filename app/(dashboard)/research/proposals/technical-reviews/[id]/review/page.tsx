"use client"

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, Paperclip, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/layout";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { proposalsApi } from "@/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
// Zod schema for the review form
// ---------------------------------------------------------------------------
const technicalReviewSchema = z.object({
  reviewerName: z.string().min(1, "Reviewer name is required"),
  comments: z.string().min(10, "Comment must be at least 10 characters"),
  evaluationCriteria: z.record(z.union([z.number(), z.literal("")])),
  recommendation: z.enum(["approve", "revise", "reject"]),
});

type TechnicalReviewFormData = z.infer<typeof technicalReviewSchema>;

export default function TechnicalReviewPage() {
  const { id } = useParams(); // proposal id
  const router = useRouter();

  const [proposal, setProposal] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewerFile, setReviewerFile] = useState<File | null>(null);

  // Load proposal details
  useEffect(() => {
    async function load() {
      try {
        const res = await proposalsApi.getProposal(id as string);
        if (res.success) {
          setProposal(res.data);
        } else {
          toast.error(res.message || "Failed to load proposal");
        }
      } catch (e) {
        toast.error("Failed to load proposal");
      } finally {
        setIsLoading(false);
      }
    }
    // Prefill form if review data exists
  useEffect(() => {
    if (proposal?.review) {
      const { reviewerName, comments, evaluationCriteria, recommendation } = proposal.review;
      form.reset({
        reviewerName: reviewerName ?? "",
        comments: comments ?? "",
        evaluationCriteria: evaluationCriteria ?? defaultCriteria,
        recommendation: recommendation ?? "approve",
      });
    }
  }, [proposal]);
  }, [id]);

  const defaultCriteria = Object.fromEntries(
    EVALUATION_CRITERIA.map((c) => [c.id, ""])
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
  const passedCount = EVALUATION_CRITERIA.filter((c) => Number(criteria[c.id] || 0) > 0).length;
  const totalScore = EVALUATION_CRITERIA.reduce((sum, c) => sum + Number(criteria[c.id] || 0), 0);

  async function onSubmit(data: TechnicalReviewFormData) {
    setIsSubmitting(true);
    try {
      // Prepare payload for review submission
      const payload = {
        reviewerName: data.reviewerName,
        comments: data.comments,
        evaluationCriteria: data.evaluationCriteria,
        recommendation: data.recommendation,
        status: data.recommendation === "approve" ? "approved" : "revision_requested",
      };
      const res = await proposalsApi.submitReview(id as string, payload);
      if (res.success) {
        toast.success("Technical review submitted successfully");
        router.push(`/research/proposals/technical-reviews`);
      } else {
        toast.error(res.message || "Failed to submit review");
      }
    } catch (e) {
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
      description={`ROC Evaluation — Proposal Reference: ${proposal?.id ? String(proposal.id).replace("prop-", "PRP-").toUpperCase() : ""}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
          </Button>
        </div>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-primary/5 bg-primary/[0.02] shadow-sm">
            <CardHeader>
              <CardTitle>Proposal Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              <p className="font-medium text-lg">{proposal?.title}</p>
              <p className="text-sm text-muted-foreground">Reference: {proposal?.id ? String(proposal.id).replace("prop-", "PRP-").toUpperCase() : ""}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evaluation Criteria Scoring</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 divide-y">
              {EVALUATION_CRITERIA.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">{c.label}</span>
                  <FormField
                    control={form.control}
                    name={`evaluationCriteria.${c.id}`}
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              max={c.points}
                              className="w-20 text-center"
                              value={field.value as any}
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === "") { field.onChange(""); return; }
                                let v = parseInt(raw, 10);
                                if (isNaN(v)) v = 0;
                                if (v < 0) v = 0;
                                if (v > c.points) v = c.points;
                                field.onChange(v);
                              }}
                            />
                            <span className="text-xs text-muted-foreground">/ {c.points}</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
              <div className="flex justify-between pt-2">
                <Badge variant="outline" className={cn(passedCount === EVALUATION_CRITERIA.length ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                  Scored: {passedCount} / {EVALUATION_CRITERIA.length}
                </Badge>
                <Badge className="bg-primary text-primary-foreground">Total Score: {totalScore} / 100</Badge>
              </div>
            </CardContent>
          </Card>

          <FormField
            control={form.control}
            name="reviewerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reviewer Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="comments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comments</FormLabel>
                <FormControl>
                  <Textarea placeholder="Technical comments..." className="min-h-[150px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* File attachment */}
          <Card>
            <CardHeader>
              <CardTitle>Reviewer Attachment</CardTitle>
              <CardDescription>Optional — attach supporting documentation</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {reviewerFile ? (
                <div className="flex items-center justify-between border p-4 rounded">
                  <div>
                    <p className="font-medium">{reviewerFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(reviewerFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => setReviewerFile(null)}>
                    <Trash2 className="mr-1 h-3 w-3" /> Remove
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed rounded p-8 cursor-pointer hover:border-primary">
                  <Paperclip className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium text-muted-foreground">Click to upload file</span>
                  <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => setReviewerFile(e.target.files?.[0] ?? null)} />
                </label>
              )}
            </CardContent>
          </Card>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </Form>
    </PageContainer>
  );
}
