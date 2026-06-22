"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ClipboardCheck,
  AlertCircle,
  HelpCircle,
  ChevronDown,
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
import { Textarea } from "@/components/ui/textarea";
import { PageContainer } from "@/components/layout";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { useAuth } from "@/hooks/useAuth";
import {
  usePolicyDraftMyReviewDetail,
  usePolicyDraftVersionChecklist,
  useSubmitPolicyDraftChecklistReview,
} from "@/lib/queries/policy-drafts";
import { cn } from "@/lib/utils";

type ChecklistResponse = {
  is_passed: "yes" | "no" | null;
  reviewer_note: string;
};

type ChecklistQuestion = {
  id: string;
  text: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  categoryOrder: number;
  isCritical: boolean;
};

type ChecklistCategoryGroup = {
  id: string;
  name: string;
  order: number;
  questions: ChecklistQuestion[];
};

function decodeQuestionText(text: string) {
  if (typeof document !== "undefined") {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value.replace(/\r\n/g, "\n").trim();
  }

  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\r\n/g, "\n")
    .trim();
}

function formatQuestion(text: string) {
  const decoded = decodeQuestionText(text);
  const lines = decoded
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    title: lines[0] || decoded,
    description: lines.slice(1).join("\n"),
  };
}

function getCategoryProgress(
  questions: ChecklistQuestion[],
  responses: Record<string, ChecklistResponse>,
) {
  const answered = questions.filter(
    (question) => responses[question.id]?.is_passed !== null,
  ).length;
  const passed = questions.filter(
    (question) => responses[question.id]?.is_passed === "yes",
  ).length;

  return { answered, passed, total: questions.length };
}

function ChecklistQuestionRow({
  question,
  index,
  response,
  onResponseChange,
}: {
  question: ChecklistQuestion;
  index: number;
  response?: ChecklistResponse;
  onResponseChange: (
    id: string,
    field: "is_passed" | "reviewer_note",
    value: string,
  ) => void;
}) {
  const isAnswered = response?.is_passed !== null && response?.is_passed !== undefined;

  return (
    <div
      className={cn(
        "space-y-4 border-b border-border/60 p-5 last:border-b-0",
        isAnswered ? "bg-background" : "bg-muted/10",
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {index + 1}
          </div>
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-semibold leading-relaxed text-foreground">
              {question.title}
            </p>
            {question.description ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {question.description}
              </p>
            ) : null}
            {question.isCritical ? (
              <Badge
                variant="destructive"
                className="px-2 py-0 text-[10px] font-bold uppercase tracking-wider"
              >
                Critical requirement
              </Badge>
            ) : null}
          </div>
        </div>

        <RadioGroup
          className="flex shrink-0 items-center gap-4 lg:mt-1"
          value={response?.is_passed || ""}
          onValueChange={(value) =>
            onResponseChange(question.id, "is_passed", value)
          }
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="yes"
              id={`yes-${question.id}`}
              className="border-green-600 text-green-600 focus:border-green-600"
            />
            <Label
              htmlFor={`yes-${question.id}`}
              className="cursor-pointer text-sm font-bold text-green-700"
            >
              Yes
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="no"
              id={`no-${question.id}`}
              className="border-red-600 text-red-600 focus:border-red-600"
            />
            <Label
              htmlFor={`no-${question.id}`}
              className="cursor-pointer text-sm font-bold text-red-700"
            >
              No
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2 pl-10">
        <Label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <HelpCircle className="h-3 w-3 text-primary" />
          Justification note (optional but recommended)
        </Label>
        <Textarea
          placeholder="Explain your rating..."
          className="h-20 resize-none text-sm focus-visible:ring-primary/20"
          value={response?.reviewer_note || ""}
          onChange={(event) =>
            onResponseChange(question.id, "reviewer_note", event.target.value)
          }
        />
      </div>
    </div>
  );
}

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
  const [responses, setResponses] = useState<Record<string, ChecklistResponse>>({});
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const responsesInitializedRef = useRef(false);
  const responsesDirtyRef = useRef(false);

  const checklistQuestions = useMemo<ChecklistQuestion[]>(() => {
    if (!checklistData?.items) return [];

    return checklistData.items.map((item: any) => {
      const formatted = formatQuestion(item.question || "");

      return {
        id: String(item.id),
        text: formatted.title,
        title: formatted.title,
        description: formatted.description,
        categoryId: String(item.category?.id ?? "uncategorized"),
        categoryName: item.category?.name || "General Requirements",
        categoryOrder: item.category?.order ?? 999,
        isCritical: Boolean(item.isCritical),
      };
    });
  }, [checklistData]);

  const categoryGroups = useMemo<ChecklistCategoryGroup[]>(() => {
    const grouped = new Map<string, ChecklistCategoryGroup>();

    checklistQuestions.forEach((question) => {
      const existing = grouped.get(question.categoryId);

      if (existing) {
        existing.questions.push(question);
        return;
      }

      grouped.set(question.categoryId, {
        id: question.categoryId,
        name: question.categoryName,
        order: question.categoryOrder,
        questions: [question],
      });
    });

    return Array.from(grouped.values()).sort((left, right) => left.order - right.order);
  }, [checklistQuestions]);

  const initializeOpenCategories = useCallback(
    (groups: ChecklistCategoryGroup[], currentResponses: Record<string, ChecklistResponse>) => {
      const firstIncomplete = groups.find((group) =>
        group.questions.some(
          (question) => currentResponses[question.id]?.is_passed == null,
        ),
      );

      if (firstIncomplete) {
        setOpenCategories(new Set([firstIncomplete.id]));
        return;
      }

      if (groups[0]) {
        setOpenCategories(new Set([groups[0].id]));
      }
    },
    [],
  );

  // Pre-populate from saved answers once; do not overwrite while the user is editing.
  useEffect(() => {
    responsesInitializedRef.current = false;
    responsesDirtyRef.current = false;
    setResponses({});
    setOpenCategories(new Set());
  }, [draftId, versionId]);

  useEffect(() => {
    if (!checklistData?.items || responsesDirtyRef.current || responsesInitializedRef.current) {
      return;
    }

    const initialResponses: Record<string, ChecklistResponse> = {};

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
    initializeOpenCategories(categoryGroups, initialResponses);
  }, [checklistData, categoryGroups, initializeOpenCategories]);

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

  const toggleCategory = (categoryId: string, open: boolean) => {
    setOpenCategories((previous) => {
      const next = new Set(previous);
      if (open) {
        next.add(categoryId);
      } else {
        next.delete(categoryId);
      }
      return next;
    });
  };

  const expandAllCategories = () => {
    setOpenCategories(new Set(categoryGroups.map((group) => group.id)));
  };

  const collapseAllCategories = () => {
    setOpenCategories(new Set());
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
      (question) => !responses[question.id] || responses[question.id].is_passed === null,
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
          <Card className="border-primary/10 shadow-sm">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">
                      Standardized Evaluation Checklist
                    </CardTitle>
                  </div>
                  <CardDescription>
                    {checklistData?.checklistTemplate
                      ? `Template: ${checklistData.checklistTemplate}`
                      : "Provide a Yes/No rating for each requirement."}
                  </CardDescription>
                  {checklistData?.draftVersion ? (
                    <Badge variant="outline" className="font-mono text-[11px]">
                      {checklistData.draftVersion}
                    </Badge>
                  ) : null}
                </div>

                {categoryGroups.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={expandAllCategories}
                    >
                      Expand all
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={collapseAllCategories}
                    >
                      Collapse all
                    </Button>
                  </div>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {checklistQuestions.length === 0 ? (
                <div className="p-12 text-center">
                  <AlertCircle className="mx-auto mb-3 h-8 w-8 text-orange-400" />
                  <p className="text-sm font-semibold text-muted-foreground">
                    No active checklist template found for this document type.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Please contact your system administrator to assign templates to document types.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {categoryGroups.map((group) => {
                    const progress = getCategoryProgress(group.questions, responses);
                    const isOpen = openCategories.has(group.id);
                    const isComplete = progress.answered === progress.total;

                    return (
                      <Collapsible
                        key={group.id}
                        open={isOpen}
                        onOpenChange={(open) => toggleCategory(group.id, open)}
                      >
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              "flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/20",
                              isOpen && "bg-muted/10",
                            )}
                          >
                            <div className="min-w-0 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-bold text-foreground">
                                  {group.name}
                                </p>
                                <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">
                                  {progress.total} questions
                                </Badge>
                                {isComplete ? (
                                  <Badge className="bg-emerald-100 text-[10px] font-bold uppercase tracking-wider text-emerald-700 hover:bg-emerald-100">
                                    Complete
                                  </Badge>
                                ) : null}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {progress.answered} of {progress.total} answered
                                {progress.answered > 0
                                  ? ` · ${progress.passed} marked Yes`
                                  : ""}
                              </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-3">
                              <div className="hidden min-w-[88px] sm:block">
                                <div className="h-2 overflow-hidden rounded-full bg-muted">
                                  <div
                                    className="h-full rounded-full bg-primary transition-all"
                                    style={{
                                      width: `${progress.total ? (progress.answered / progress.total) * 100 : 0}%`,
                                    }}
                                  />
                                </div>
                              </div>
                              <ChevronDown
                                className={cn(
                                  "h-5 w-5 text-muted-foreground transition-transform",
                                  isOpen && "rotate-180",
                                )}
                              />
                            </div>
                          </button>
                        </CollapsibleTrigger>

                        <CollapsibleContent className="border-t bg-background">
                          {group.questions.map((question, index) => (
                            <ChecklistQuestionRow
                              key={question.id}
                              question={question}
                              index={index}
                              response={responses[question.id]}
                              onResponseChange={handleResponseChange}
                            />
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
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
