"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  ClipboardCheck,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  useIndividualReview,
  useReviewQuestions,
  useUpdateIndividualReview,
} from "@/lib/queries/individual-review";
import type { ReviewQuestion } from "@/api/services/individual-reviews.service";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PageContainer } from "@/components/layout";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  comments: z.string().optional(),
  responses: z.record(z.number()).default({}),
});

type FormValues = z.infer<typeof formSchema>;

type FormattedQuestion = ReviewQuestion & {
  title: string;
  description: string;
  weightLabel: string | null;
};

type QuestionCategoryGroup = {
  id: string;
  name: string;
  order: number;
  questions: FormattedQuestion[];
};

function decodeQuestionText(text: string) {
  if (typeof document !== "undefined") {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value.trim();
  }

  return text
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

function formatReviewQuestion(text: string) {
  const decoded = decodeQuestionText(text);
  const weightMatch = decoded.match(/\(Weight:\s*(\d+)%\)/);

  const title = weightMatch
    ? decoded.slice(0, weightMatch.index).trim()
    : decoded;
  const description = weightMatch
    ? decoded
        .slice(weightMatch.index! + weightMatch[0].length)
        .replace(/^[-\s]+/, "")
        .trim()
    : "";
  const weightLabel = weightMatch ? `${weightMatch[1]}%` : null;

  return { title, description, weightLabel };
}

function hasScore(
  responses: Record<string, number> | undefined,
  questionId: number,
) {
  const value = responses?.[questionId] ?? responses?.[String(questionId)];
  return value !== undefined && value !== null && !Number.isNaN(Number(value));
}

function getCategoryProgress(
  questions: FormattedQuestion[],
  responses: Record<string, number> | undefined,
) {
  const scored = questions.filter((question) =>
    hasScore(responses, question.id),
  ).length;
  const pointsEarned = questions.reduce((sum, question) => {
    const value = responses?.[question.id] ?? responses?.[String(question.id)];
    return sum + Number(value || 0);
  }, 0);
  const maxPoints = questions.reduce((sum, question) => sum + question.maxPoints, 0);

  return { scored, pointsEarned, maxPoints, total: questions.length };
}

function ReviewQuestionRow({
  question,
  index,
  control,
}: {
  question: FormattedQuestion;
  index: number;
  control: ReturnType<typeof useForm<FormValues>>["control"];
}) {
  return (
    <div className="space-y-4 border-b border-border/60 p-5 last:border-b-0">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {index + 1}
          </div>
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold leading-relaxed text-foreground">
                {question.title}
              </p>
              {question.weightLabel ? (
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
                  Weight {question.weightLabel}
                </Badge>
              ) : null}
            </div>
            {question.description ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {question.description}
              </p>
            ) : null}
          </div>
        </div>

        <FormField
          control={control}
          name={`responses.${question.id}`}
          render={({ field }) => (
            <FormItem className="shrink-0">
              <FormControl>
                <div className="flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2">
                  <Input
                    type="number"
                    min={0}
                    max={question.maxPoints}
                    className="h-9 w-20 border-0 bg-transparent px-0 text-right font-semibold shadow-none focus-visible:ring-0"
                    value={field.value ?? ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      field.onChange(
                        value === ""
                          ? undefined
                          : Math.max(
                              0,
                              Math.min(question.maxPoints, Number(value)),
                            ),
                      );
                    }}
                  />
                  <span className="text-sm font-medium text-muted-foreground">
                    / {question.maxPoints}
                  </span>
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

export default function TechnicalReviewPage() {
  const { id } = useParams();
  const router = useRouter();

  const { data: questionsRes, isLoading: qLoading } = useReviewQuestions();
  const { data: existingReview } = useIndividualReview(id as string);
  const review = useUpdateIndividualReview();

  const rawQuestions = questionsRes?.data ?? [];
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  const questions = useMemo<FormattedQuestion[]>(() => {
    return rawQuestions
      .filter((question) => question.isActive)
      .map((question) => {
        const formatted = formatReviewQuestion(question.text);
        return {
          ...question,
          title: formatted.title,
          description: formatted.description,
          weightLabel: formatted.weightLabel,
        };
      })
      .sort((left, right) => left.order - right.order);
  }, [rawQuestions]);

  const categoryGroups = useMemo<QuestionCategoryGroup[]>(() => {
    const grouped = new Map<string, QuestionCategoryGroup>();

    questions.forEach((question) => {
      const categoryId = String(question.category?.id ?? "uncategorized");
      const existing = grouped.get(categoryId);

      if (existing) {
        existing.questions.push(question);
        return;
      }

      grouped.set(categoryId, {
        id: categoryId,
        name: question.category?.name || "Evaluation Criteria",
        order: question.category?.id ?? 999,
        questions: [question],
      });
    });

    return Array.from(grouped.values()).sort((left, right) => left.order - right.order);
  }, [questions]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      comments: "",
      responses: {},
    },
  });

  const initializeOpenCategories = useCallback(
    (
      groups: QuestionCategoryGroup[],
      responses: Record<string, number> | undefined,
    ) => {
      const firstIncomplete = groups.find((group) =>
        group.questions.some((question) => !hasScore(responses, question.id)),
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

  useEffect(() => {
    if (!existingReview) return;

    const mapped = Object.fromEntries(
      (existingReview.responses ?? [])
        .filter((response) => response.question_id != null)
        .map((response) => [
          String(response.question_id),
          Number(response.points_earned),
        ]),
    );

    form.reset({
      comments: existingReview.comments ?? "",
      responses: mapped,
    });

    initializeOpenCategories(categoryGroups, mapped);
  }, [existingReview, form, categoryGroups, initializeOpenCategories]);

  useEffect(() => {
    if (existingReview || categoryGroups.length === 0) return;
    initializeOpenCategories(categoryGroups, {});
  }, [existingReview, categoryGroups, initializeOpenCategories]);

  const responses = useWatch({
    control: form.control,
    name: "responses",
  });

  const maxTotalScore = useMemo(() => {
    return questions.reduce((sum, question) => sum + question.maxPoints, 0);
  }, [questions]);

  const totalScore = useMemo(() => {
    return Object.values(responses || {}).reduce(
      (sum, value) => sum + Number(value || 0),
      0,
    );
  }, [responses]);

  const completedCount = useMemo(() => {
    return questions.filter((question) => hasScore(responses, question.id)).length;
  }, [responses, questions]);

  const checklistTemplateName =
    questions[0]?.category?.name ||
    questions[0]?.proposalType?.name ||
    "Technical Review Checklist";

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

  function onSubmit(data: FormValues) {
    if (!id) return;

    const unanswered = questions.filter(
      (question) => !hasScore(data.responses, question.id),
    );

    if (unanswered.length > 0) {
      form.setError("responses", {
        type: "manual",
        message: `Please score all ${unanswered.length} remaining criteria before submitting.`,
      });
      const firstIncompleteGroup = categoryGroups.find((group) =>
        group.questions.some((question) => !hasScore(data.responses, question.id)),
      );
      if (firstIncompleteGroup) {
        setOpenCategories(new Set([firstIncompleteGroup.id]));
      }
      return;
    }

    const payload = {
      comments: data.comments ?? "",
      responses: Object.entries(data.responses || {}).map(
        ([questionId, score]) => ({
          question_id: Number(questionId),
          points_earned: Number(score),
        }),
      ),
      attachment: null,
    };

    review.mutate(
      { id: Number(id), payload },
      {
        onSuccess: () => {
          router.back();
        },
      },
    );
  }

  if (qLoading) {
    return (
      <PageContainer title="Loading">
        <div className="space-y-6">
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
        </div>
      </PageContainer>
    );
  }

  const scorePercent =
    maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0;

  return (
    <PageContainer
      title="Technical Review"
      description={
        existingReview?.screening?.proposal?.title
          ? `Scoring proposal: ${existingReview.screening.proposal.title}`
          : undefined
      }
      actions={
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid items-start gap-6 lg:grid-cols-4">
            <div className="space-y-6 lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Proposal Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="font-semibold">
                    {existingReview?.screening?.proposal?.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {existingReview?.screening?.proposal?.referenceNumber}
                  </p>
                  {questions[0]?.proposalType?.description ? (
                    <p className="pt-2 text-xs text-muted-foreground">
                      {questions[0].proposalType.description}
                    </p>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="border-primary/10 shadow-sm">
                <CardHeader className="border-b bg-muted/30">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Evaluation Criteria</CardTitle>
                      </div>
                      <CardDescription>
                        Template: {checklistTemplateName}
                      </CardDescription>
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
                  {questions.length === 0 ? (
                    <div className="p-12 text-center">
                      <AlertCircle className="mx-auto mb-3 h-8 w-8 text-orange-400" />
                      <p className="text-sm font-semibold text-muted-foreground">
                        No active review questions found for this proposal type.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {categoryGroups.map((group) => {
                        const progress = getCategoryProgress(
                          group.questions,
                          responses,
                        );
                        const isOpen = openCategories.has(group.id);
                        const isComplete = progress.scored === progress.total;

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
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] font-bold uppercase tracking-wider"
                                    >
                                      {progress.total} criteria
                                    </Badge>
                                    {isComplete ? (
                                      <Badge className="bg-emerald-100 text-[10px] font-bold uppercase tracking-wider text-emerald-700 hover:bg-emerald-100">
                                        Complete
                                      </Badge>
                                    ) : null}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {progress.scored} of {progress.total} scored
                                    {progress.scored > 0
                                      ? ` · ${progress.pointsEarned}/${progress.maxPoints} pts`
                                      : ` · ${progress.maxPoints} pts available`}
                                  </p>
                                </div>

                                <div className="flex shrink-0 items-center gap-3">
                                  <div className="hidden min-w-[88px] sm:block">
                                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                                      <div
                                        className="h-full rounded-full bg-primary transition-all"
                                        style={{
                                          width: `${progress.total ? (progress.scored / progress.total) * 100 : 0}%`,
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
                                <ReviewQuestionRow
                                  key={question.id}
                                  question={question}
                                  index={index}
                                  control={form.control}
                                />
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
                    </div>
                  )}

                  {form.formState.errors.responses?.message ? (
                    <p className="border-t px-5 py-3 text-sm text-destructive">
                      {form.formState.errors.responses.message.toString()}
                    </p>
                  ) : null}
                </CardContent>
              </Card>

              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comments</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="min-h-[150px]"
                        placeholder="Write your technical review..."
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-6 lg:sticky lg:top-20">
              <Card className="border-primary/20 shadow-sm">
                <CardHeader className="border-b bg-primary/5 pb-2 text-center">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">
                    Live Score Tracker
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center space-y-4 p-8">
                  <div className="relative flex items-center justify-center">
                    <svg className="h-32 w-32 -rotate-90 transform">
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
                          scorePercent >= 75
                            ? "text-green-500"
                            : scorePercent >= 40
                              ? "text-orange-500"
                              : "text-red-500"
                        }
                        strokeWidth="12"
                        strokeDasharray={351.8}
                        strokeDashoffset={351.8 - (351.8 * scorePercent) / 100}
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
                      <span className="text-3xl font-black">{totalScore}</span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        / {maxTotalScore}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="text-sm font-medium">Evaluation Progress</p>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {completedCount} of {questions.length} criteria scored
                    </p>
                    <Badge variant="outline" className="mt-2">
                      {scorePercent}% of max score
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button
                    type="submit"
                    disabled={review.isPending || questions.length === 0}
                    className="h-12 w-full text-md font-semibold"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {review.isPending ? "Submitting..." : "Submit Review"}
                  </Button>
                </CardFooter>
              </Card>

              <div className="flex items-start gap-3 rounded-lg border border-dashed border-primary/10 bg-muted/50 p-4 text-xs text-muted-foreground">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p className="leading-relaxed">
                  Assign points for each pillar based on scientific merit and
                  alignment. All criteria must be scored before submission.
                </p>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </PageContainer>
  );
}
