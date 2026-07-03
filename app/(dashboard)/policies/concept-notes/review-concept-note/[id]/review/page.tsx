"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MessageSquare,
  ShieldAlert,
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
import { MAX_FILE_SIZE, MAX_FILE_SIZE_MB } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import {
  useMyReviewDetail,
  useReviewConceptNote,
} from "@/lib/queries/concept-notes";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";

export default function ConceptNoteReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useAuth();

  const { data: note, isLoading } = useMyReviewDetail(id);
  const reviewMutation = useReviewConceptNote();

  const [comments, setComments] = useState("");
  const [decision, setDecision] = useState<"approve" | "revise" | "reject" | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!note || !user) return;

    const feedbackBlocks = note.expertFeedback || [];

    for (const block of feedbackBlocks) {
      const details = block?.feedbackDetail || [];
      const found = details.find((d: any) => {
        const reviewerId = d?.expertReviewer?.id ?? d?.reviewerId ?? d?.reviewer?.id;
        return reviewerId && String(reviewerId) === String(user.id);
      }) as any;

      if (!found) continue;

      setComments(found.comment || found.comments || "");

      const statusValue =
        found.finalDecisionStatus ||
        found.final_decision ||
        found.final_decision_status ||
        found.finalDecision ||
        found.decision ||
        found.recommendation ||
        null;

      if (statusValue) {
        const normalized = String(statusValue).toLowerCase();
        if (normalized === "accepted" || normalized === "approve") {
          setDecision("approve");
        } else if (
          normalized === "partially_accepted" ||
          normalized === "revise" ||
          normalized === "revision"
        ) {
          setDecision("revise");
        } else if (normalized === "not_accepted" || normalized === "reject") {
          setDecision("reject");
        }
      }

      const reviewFile =
        found.reviewFile ||
        found.supportingDocument?.url ||
        found.review_file ||
        found.reviewUrl ||
        null;
      if (reviewFile) setExistingFileUrl(resolveFileUrl(reviewFile));

      break;
    }
  }, [note, user]);

  const handleSubmit = async () => {
    if (!decision) {
      toast.error("Please select an expert decision before submitting.");
      return;
    }
    if (!comments.trim()) {
      toast.error("Please provide review comments justifying your decision.");
      return;
    }

    const backendDecision =
      decision === "revise"
        ? "partially_accepted"
        : decision === "reject"
          ? "not_accepted"
          : "accepted";

    try {
      const formData = new FormData();
      formData.append("reviewer", user?.id ? String(user.id) : "1");
      formData.append("final_decision", backendDecision);
      formData.append("comment", comments);
      formData.append("recommendation", comments);
      formData.append("comment_addressed", "true");
      if (selectedFile) {
        formData.append("review_file", selectedFile);
      }

      await reviewMutation.mutateAsync({ id, payload: formData });
      toast.success("Review successfully submitted and recorded.");
      router.push(`/policies/concept-notes/review-concept-note/${id}`);
    } catch {
      toast.error("Failed to submit review. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Loading Review Workspace...">
        <div className="grid gap-6 lg:grid-cols-3 items-start">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-72 animate-pulse rounded-xl bg-muted" />
            <div className="h-64 animate-pulse rounded-xl bg-muted" />
          </div>
          <div className="h-80 animate-pulse rounded-xl bg-muted" />
        </div>
      </PageContainer>
    );
  }

  if (!note) {
    return (
      <PageContainer title="Error Loading Concept Note">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
          <h3 className="text-lg font-semibold">Failed to load concept note</h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            There was a problem retrieving this concept note. Please verify the URL or try again.
          </p>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/policies/concept-notes/review-concept-note">
                Go to Reviews Queue
              </Link>
            </Button>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  const decisionOptions = [
    {
      value: "approve" as const,
      id: "approve",
      label: "Accepted",
      icon: CheckCircle2,
      iconClass: "text-green-500",
      labelClass: "text-green-700",
      selectedClass: "border-green-500 bg-green-50 ring-green-500/25",
    },
    {
      value: "revise" as const,
      id: "revise",
      label: "Partial Accepted",
      icon: AlertCircle,
      iconClass: "text-orange-500",
      labelClass: "text-orange-700",
      selectedClass: "border-orange-500 bg-orange-50 ring-orange-500/25",
    },
    {
      value: "reject" as const,
      id: "reject",
      label: "Not Accepted",
      icon: XCircle,
      iconClass: "text-red-500",
      labelClass: "text-red-700",
      selectedClass: "border-red-500 bg-red-50 ring-red-500/25",
    },
  ];

  const fileUploadMinHeight = "min-h-[9.5rem]";
  const decisionCardHeight = "h-[7.5rem]";

  return (
    <PageContainer
      title="Expert Review Workspace"
      description={`Stage 2: Evaluating Concept Note - ${note.id}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="shadow-sm">
            <Link href={`/policies/concept-notes/review-concept-note/${note.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel Review
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="bg-muted/30 border-b">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Expert Assessment</CardTitle>
              </div>
              <CardDescription>
                Provide detailed feedback on the concept note. This will be shared with the proposer.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  1. Comprehensive Feedback
                </Label>
                <Textarea
                  placeholder="Detail your findings, methodological critiques, and alignment with national strategies..."
                  className="resize-none min-h-[200px] text-sm"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  2. Supporting Documents (Optional)
                </Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    if (file.size > MAX_FILE_SIZE) {
                      toast.error(`File size must be under ${MAX_FILE_SIZE_MB}MB`);
                      return;
                    }

                    setSelectedFile(file);
                    setExistingFileUrl(null);
                  }}
                />

                {!selectedFile && !existingFileUrl ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer",
                      fileUploadMinHeight,
                    )}
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mb-3" />
                    <p className="text-sm font-medium text-foreground">Click to upload annotated files</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOCX up to {MAX_FILE_SIZE_MB}MB</p>
                  </div>
                ) : selectedFile ? (
                  <div
                    className={cn(
                      "flex items-center justify-between rounded-lg border bg-emerald-50/50 border-emerald-100 p-3",
                      fileUploadMinHeight,
                    )}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <FileText className="h-5 w-5 text-emerald-600 shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-xs font-semibold text-emerald-800 truncate">
                          {selectedFile.name}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-medium">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 font-medium text-xs px-2"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "flex items-center justify-between rounded-lg border bg-emerald-50/50 border-emerald-100 p-3",
                      fileUploadMinHeight,
                    )}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <FileText className="h-5 w-5 text-emerald-600 shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-xs font-semibold text-emerald-800 truncate">
                          {existingFileUrl?.split("/").pop()}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-medium">
                          Existing uploaded file
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(existingFileUrl!, "_blank")}
                        className="h-8 font-medium text-xs px-2"
                      >
                        Open
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setExistingFileUrl(null)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 font-medium text-xs px-2"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" /> 3. Final Expert Decision
              </CardTitle>
              <CardDescription>Select the outcome of this evaluation phase.</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="grid gap-4 sm:grid-cols-3"
                role="radiogroup"
                aria-label="Final expert decision"
              >
                {decisionOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = decision === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setDecision(option.value)}
                      className={cn(
                        "flex w-full flex-col items-center justify-center rounded-md border-2 p-4 ring-2 transition-colors",
                        decisionCardHeight,
                        isSelected
                          ? option.selectedClass
                          : "border-muted bg-popover ring-transparent hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <Icon
                        className={cn("mb-3 h-6 w-6 shrink-0", option.iconClass)}
                      />
                      <span
                        className={cn(
                          "text-center text-sm font-semibold leading-tight",
                          option.labelClass,
                        )}
                      >
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 pt-6 border-t">
              <Button
                onClick={handleSubmit}
                disabled={reviewMutation.isPending}
                className="w-full h-12 text-md font-semibold bg-primary hover:bg-primary/90"
              >
                {reviewMutation.isPending ? "Submitting..." : "Submit"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-6">
          <Card className="shadow-sm">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Document Reference
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <p className="font-bold text-sm leading-tight text-foreground">{note.title}</p>
                <span className="text-xs text-primary font-mono mt-1 block">{note.id}</span>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground leading-relaxed line-clamp-6">
                {note.overview?.executiveSummary || "No summary provided."}
              </div>

              {note.overview?.file && (
                <div className="pt-2">
                  <p className="text-xs font-semibold mb-2">Original File</p>
                  <div
                    className="flex items-center gap-2 p-2 border rounded hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() =>
                      window.open(
                        resolveFileUrl(note.overview.file!) ?? "#",
                        "_blank",
                      )
                    }
                  >
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs truncate">{note.overview.file.split("/").pop()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="bg-blue-50/50 rounded-lg p-4 text-xs text-blue-800 border border-blue-100 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-500 shrink-0" />
            <p>
              Your review timestamp and decision will be permanently recorded in the system audit log and the proposer will be notified immediately.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
