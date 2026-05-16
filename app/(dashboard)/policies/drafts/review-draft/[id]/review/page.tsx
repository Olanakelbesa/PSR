"use client";

import { useState, useEffect } from "react";
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

const checklistQuestions = [
  {
    id: "q1",
    text: "Does the comprehensive draft strictly align with the original approved concept note?",
    required: true,
  },
  {
    id: "q2",
    text: "Are the financial and budget estimates realistic and adequately justified?",
    required: true,
  },
  {
    id: "q3",
    text: "Is the methodology or implementation strategy sound and practically feasible?",
    required: true,
  },
  {
    id: "q4",
    text: "Are the key performance indicators (KPIs) and expected outcomes measurable?",
    required: true,
  },
  {
    id: "q5",
    text: "Does the draft include a reasonable timeline spanning the operational period?",
    required: true,
  },
];

export default function ScoreDraftPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for the checklist
  const [responses, setResponses] = useState<
    Record<string, { is_passed: "yes" | "no" | null; reviewer_note: string }>
  >({});
  const [overallComment, setOverallComment] = useState("");

  useEffect(() => {
    // Initialize state
    const initialResponses: Record<string, any> = {};
    checklistQuestions.forEach((q) => {
      initialResponses[q.id] = { is_passed: null, reviewer_note: "" };
    });
    setResponses(initialResponses);

    // Simulate API Load
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleResponseChange = (
    id: string,
    field: "is_passed" | "reviewer_note",
    value: string,
  ) => {
    setResponses((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const calculateScore = () => {
    let passedCount = 0;
    let answeredCount = 0;
    Object.values(responses).forEach((res) => {
      if (res.is_passed !== null) {
        answeredCount++;
        if (res.is_passed === "yes") passedCount++;
      }
    });
    return answeredCount === 0
      ? 0
      : Math.round((passedCount / checklistQuestions.length) * 100);
  };

  const handleSubmit = async () => {
    // Validation
    const unanswered = checklistQuestions.filter(
      (q) => responses[q.id].is_passed === null,
    );
    if (unanswered.length > 0) {
      toast.error(
        `Please answer all ${unanswered.length} remaining Yes/No questions before submitting.`,
      );
      return;
    }

    if (!overallComment.trim()) {
      toast.error(
        "An overall summary comment is required to complete this evaluation.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const finalScore = calculateScore();
      toast.success(
        `Draft successfully scored at ${finalScore}%. Evaluation submitted to the committee.`,
      );
      router.push(`/policies/drafts/${params.id}`);
    } catch (error) {
      toast.error("Failed to submit score. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const currentScore = calculateScore();

  return (
    <PageContainer
      title="Score Draft (Granular Evaluation)"
      description={`Completing checklist evaluation for Draft: ${params.id}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="shadow-sm">
            <Link href={`/policies/drafts/review-draft/${params.id}`}>
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
              {checklistQuestions.map((q, index) => (
                <div
                  key={q.id}
                  className="p-6 space-y-4 hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-sm font-medium leading-relaxed">
                        {q.text}
                      </p>
                    </div>

                    <RadioGroup
                      className="flex items-center gap-4 shrink-0"
                      value={responses[q.id]?.is_passed || ""}
                      onValueChange={(val) =>
                        handleResponseChange(q.id, "is_passed", val)
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="yes"
                          id={`yes-${q.id}`}
                          className="text-green-600 border-green-600"
                        />
                        <Label
                          htmlFor={`yes-${q.id}`}
                          className="font-semibold cursor-pointer"
                        >
                          Yes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="no"
                          id={`no-${q.id}`}
                          className="text-red-600 border-red-600"
                        />
                        <Label
                          htmlFor={`no-${q.id}`}
                          className="font-semibold cursor-pointer"
                        >
                          No
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="pl-9 space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <HelpCircle className="h-3 w-3" /> Justification Note
                      (Optional but recommended)
                    </Label>
                    <Textarea
                      placeholder="Explain your rating..."
                      className="resize-none h-20 text-sm"
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
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Overall Assessment
              </CardTitle>
              <CardDescription>
                Summarize your findings for the PSR committee.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Write your comprehensive review conclusion here. This will be visible to the ratification committee."
                className="resize-none min-h-[150px]"
                value={overallComment}
                onChange={(e) => setOverallComment(e.target.value)}
              />
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
                      currentScore >= 70
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
                <p className="text-xs text-muted-foreground">
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
                disabled={isSubmitting}
                className="w-full h-12 text-md font-semibold bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? "Locking Evaluation..." : "Submit Final Score"}
              </Button>
            </CardFooter>
          </Card>

          <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground border border-dashed flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary shrink-0" />
            <p>
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
