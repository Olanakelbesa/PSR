"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { PageContainer } from "@/components/layout";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import { useAuth } from "@/hooks/useAuth";
import {
  usePolicyDraftMyReviewDetail,
  usePolicyDraftVersionChecklist,
  useSubmitPolicyDraftChecklistReview,
} from "@/lib/queries/policy-drafts";

export default function ScoreDraftPage() {
  const params = useParams();
  const router = useRouter();
  const draftId = (params as any)?.id;

  const { user } = useAuth();
  
  // 1. Fetch policy draft detail to get the latest version ID
  const { data: detailResponse, isLoading: isLoadingDetail } = usePolicyDraftMyReviewDetail(draftId);
  const detailData = detailResponse?.data;

  const latestVersion = useMemo(() => {
    if (!detailData?.versions) return null;
    return detailData.versions.find((v: any) => v.isLatest) || detailData.versions[0];
  }, [detailData]);

  const versionId = latestVersion?.id;

  // 2. Fetch the checklist template & items for this version
  const { data: checklistResponse, isLoading: isLoadingChecklist } = usePolicyDraftVersionChecklist(draftId, versionId);
  const checklistData = checklistResponse?.data;

  // State for the checklist responses
  const [responses, setResponses] = useState<
    Record<string, { is_passed: "yes" | "no" | null; reviewer_note: string }>
  >({});
  const responsesInitializedRef = useRef(false);
  const responsesDirtyRef = useRef(false);

  // Convert API items to the component's expected format
  const checklistQuestions = useMemo(() => {
    if (!checklistData?.items) return [];
    return checklistData.items.map((item: any) => ({
      id: String(item.id),
      text: item.question,
      category: item.category?.name || "Requirement",
      required: true,
      isCritical: item.isCritical,
    }));
  }, [checklistData]);

  // Pre-populate from saved answers once; do not overwrite while the user is editing.
  useEffect(() => {
    responsesInitializedRef.current = false;
    responsesDirtyRef.current = false;
    setResponses({});
  }, [draftId, versionId]);

  useEffect(() => {
    if (!checklistData?.items || responsesDirtyRef.current || responsesInitializedRef.current) {
      return;
    }

    const initialResponses: Record<
      string,
      { is_passed: "yes" | "no" | null; reviewer_note: string }
    > = {};

    checklistData.items.forEach((item: any) => {
      let isPassedValue: "yes" | "no" | null = null;
      if (item.reviewerAnswer === true) {
        isPassedValue = "yes";
      } else if (item.reviewerAnswer === false) {
        isPassedValue = "no";
      }

      initialResponses[String(item.id)] = {
        is_passed: isPassedValue,
        reviewer_note: item.reviewerNote || "",
      };
    });

    setResponses(initialResponses);
    responsesInitializedRef.current = true;
  }, [checklistData]);

  const submitMutation = useSubmitPolicyDraftChecklistReview();

  const handleResponseChange = (
    id: string,
    field: "is_passed" | "reviewer_note",
    value: string,
  ) => {
    responsesDirtyRef.current = true;
    setResponses((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const calculateScore = (source: typeof responses) => {
    if (checklistQuestions.length === 0) return 0;
    let passedCount = 0;
    checklistQuestions.forEach((question: any) => {
      if (source[question.id]?.is_passed === "yes") {
        passedCount++;
      }
    });
    return Math.round((passedCount / checklistQuestions.length) * 100);
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("Authentication required to submit review.");
      return;
    }

    const unanswered = checklistQuestions.filter(
      (q: any) => !responses[q.id] || responses[q.id].is_passed === null
    );
    if (unanswered.length > 0) {
      toast.error(
        `Please answer all ${unanswered.length} remaining Yes/No questions before submitting.`
      );
      return;
    }

    const payloadResponses = Object.entries(responses).map(([questionId, res]) => ({
      checklistItemId: Number(questionId),
      answer: res.is_passed === "yes",
      comment: res.reviewer_note || "",
    }));

    try {
      const result = await submitMutation.mutateAsync({
        id: Number(draftId),
        versionId: Number(versionId),
        reviewerId: Number(user.id),
        responses: payloadResponses,
      });

      const serverScores = result?.data?.checklistScores ?? result?.data?.checklist_scores;
      const serverScore =
        typeof serverScores?.[String(user.id)] === "number"
          ? Math.round(serverScores[String(user.id)])
          : calculateScore(responses);

      toast.success(
        `Draft successfully scored at ${serverScore}%. Evaluation submitted to the committee.`,
      );
      router.push(`/policies/drafts/review-draft/${draftId}`);
    } catch (error: any) {
      const serverMessage = error?.errors?.review?.[0] || error?.message || "Failed to submit checklist review. Please try again.";
      toast.error(serverMessage);
    }
  };

  const isLoading = isLoadingDetail || isLoadingChecklist;

  if (isLoading) {
    return (
      <PageContainer title="Loading Evaluation Engine...">
        <div className="space-y-6">
          <div className="h-32 bg-muted animate-pulse rounded-xl" />
          <div className="h-96 bg-muted animate-pulse rounded-xl" />
        </div>
      </PageContainer>
    );
  }

  const currentScore =
    typeof checklistData?.reviewerScore === "number" && !responsesDirtyRef.current
      ? Math.round(checklistData.reviewerScore)
      : calculateScore(responses);

  return (
    <PageContainer
      title="Score Draft (Granular Evaluation)"
      description={`Completing checklist evaluation for Draft: ${detailData?.title || draftId}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="shadow-sm border-primary/20 hover:bg-primary/5">
            <Link href={`/policies/drafts/review-draft/${draftId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel Evaluation
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-4 items-start">
        {/* Left Column: Form */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="bg-muted/30 border-b">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  Standardized Evaluation Checklist
                </CardTitle>
              </div>
              <CardDescription>
                Provide a Yes/No rating for each of the core requirements. Add
                justification notes where appropriate.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 divide-y">
              {checklistQuestions.length === 0 ? (
                <div className="p-12 text-center">
                  <AlertCircle className="h-8 w-8 text-orange-400 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-muted-foreground">
                    No active checklist template found for this document type.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Please contact your system administrator to assign templates to document types.
                  </p>
                </div>
              ) : (
                checklistQuestions.map((q: any, index: number) => (
                  <div
                    key={q.id}
                    className="p-6 space-y-4 hover:bg-muted/10 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3">
                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold leading-relaxed">
                            {q.text}
                          </p>
                          {q.isCritical && (
                            <Badge variant="destructive" className="text-[10px] py-0 px-2 font-bold uppercase tracking-wider">
                              Critical requirement
                            </Badge>
                          )}
                        </div>
                      </div>

                      <RadioGroup
                        className="flex items-center gap-4 shrink-0 mt-1"
                        value={responses[q.id]?.is_passed || ""}
                        onValueChange={(val) =>
                          handleResponseChange(q.id, "is_passed", val)
                        }
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="yes"
                            id={`yes-${q.id}`}
                            className="text-green-600 border-green-600 focus:border-green-600"
                          />
                          <Label
                            htmlFor={`yes-${q.id}`}
                            className="font-bold text-sm cursor-pointer text-green-700"
                          >
                            Yes
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="no"
                            id={`no-${q.id}`}
                            className="text-red-600 border-red-600 focus:border-red-600"
                          />
                          <Label
                            htmlFor={`no-${q.id}`}
                            className="font-bold text-sm cursor-pointer text-red-700"
                          >
                            No
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="pl-9 space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                        <HelpCircle className="h-3 w-3 text-primary" /> Justification Note
                        (Optional but recommended)
                      </Label>
                      <Textarea
                        placeholder="Explain your rating..."
                        className="resize-none h-20 text-sm focus-visible:ring-primary/20"
                        value={responses[q.id]?.reviewer_note || ""}
                        onChange={(e) =>
                          handleResponseChange(
                            q.id,
                            "reviewer_note",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Score Summary & Submit */}
        <div className="space-y-6 lg:sticky lg:top-20">
          <Card className="shadow-sm border-primary/20">
            <CardHeader className="text-center pb-2 border-b bg-primary/5">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">
                Live Score Tracker
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
              <div className="relative flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    className="text-muted/30"
                    strokeWidth="12"
                    stroke="currentColor"
                    fill="transparent"
                    r="56"
                    cx="64"
                    cy="64"
                  />
                  <circle
                    className={
                      currentScore >= 75
                        ? "text-green-500"
                        : currentScore >= 40
                          ? "text-orange-500"
                          : "text-red-500"
                    }
                    strokeWidth="12"
                    strokeDasharray={351.8}
                    strokeDashoffset={351.8 - (351.8 * currentScore) / 100}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="56"
                    cx="64"
                    cy="64"
                    style={{ transition: "stroke-dashoffset 0.5s ease-in-out" }}
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-black">{currentScore}%</span>
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">Evaluation Progress</p>
                <p className="text-xs text-muted-foreground font-semibold">
                  {
                    Object.values(responses).filter((r) => r.is_passed !== null)
                      .length
                  }{" "}
                  of {checklistQuestions.length} answered
                </p>
              </div>
            </CardContent>
            <CardFooter className="pt-0 p-4">
              <Button
                onClick={handleSubmit}
                disabled={submitMutation.isPending || checklistQuestions.length === 0}
                className="w-full h-12 text-md font-semibold bg-primary hover:bg-primary/90 text-white shadow-md transition-all duration-200"
              >
                {submitMutation.isPending ? "Locking Evaluation..." : "Submit Final Score"}
              </Button>
            </CardFooter>
          </Card>

          <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground border border-dashed flex items-start gap-3 border-primary/10">
            <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              By submitting this evaluation, you finalize your expert review.
              The score will be recorded and aggregated with other reviewers for
              the PSR committee's ratification process.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
