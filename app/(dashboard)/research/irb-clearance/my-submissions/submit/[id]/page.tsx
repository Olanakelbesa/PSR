"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Loader2,
  Paperclip,
  Save,
  Send,
  ShieldAlert,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import {
  useEthicalClearance,
  useIRBClearanceTypes,
} from "@/lib/queries/ethical-clearance";
import {
  submitIRBClearance,
  updateDraftIRBClearance,
} from "@/api/services/ethical-clearance.service";
import type { IRBClearanceSubmitInput } from "@/types/ethical-clearance";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(filename: string): string {
  const ext = filename.split(".").pop()?.toUpperCase();
  return ext || "FILE";
}

const READINESS_STEPS = [
  { key: "type", label: "Clearance type selected" },
  { key: "document", label: "Clearance document uploaded" },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  pending_submission: {
    label: "Pending Submission",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200",
  },
  pending_review: {
    label: "Pending Review",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200",
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200",
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200",
  },
  resubmitted: {
    label: "Resubmitted",
    className: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-violet-200",
  },
};

export default function RecreatedIRBSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearanceId = Number(params.id);

  const supportingInputRef = useRef<HTMLInputElement>(null);

  const { data: clearance, isLoading: isLoadingClearance } =
    useEthicalClearance(clearanceId);
  const { data: clearanceTypes = [] } = useIRBClearanceTypes();

  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [clearanceFile, setClearanceFile] = useState<File | null>(null);
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]);
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
  const [existingSupportingDocs, setExistingSupportingDocs] = useState<
    { id: number; filename: string; url: string | null }[]
  >([]);
  const [removedDocIds, setRemovedDocIds] = useState<number[]>([]);
  const [copiedRef, setCopiedRef] = useState(false);

  const isResubmission = clearance?.status === "rejected";
  const isEditing =
    clearance?.status === "pending_submission" || isResubmission;
  const hasExistingFile = Boolean(existingFileUrl);

  useEffect(() => {
    if (!clearance) return;
    if (clearance.clearanceTypeId) {
      setSelectedTypeId(String(clearance.clearanceTypeId));
    }
    if (clearance.submissionNotes) {
      setSubmissionNotes(clearance.submissionNotes);
    }
    if (clearance.files?.clearanceFile || clearance.clearanceFile) {
      setExistingFileUrl(clearance.files?.clearanceFile || clearance.clearanceFile || null);
    }
    if (clearance.supportingDocuments && clearance.supportingDocuments.length > 0) {
      setExistingSupportingDocs(
        clearance.supportingDocuments.map((doc) => ({
          id: doc.id,
          filename: doc.originalFilename,
          url: doc.fileUrl,
        })),
      );
    }
  }, [clearance]);

  const handleCopyRef = () => {
    if (!clearance) return;
    const refText = clearance.referenceNumber || `IRB-${clearance.id}`;
    navigator.clipboard.writeText(refText);
    setCopiedRef(true);
    toast.success("Reference number copied to clipboard!");
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const submitMutation = useMutation({
    mutationFn: (input: IRBClearanceSubmitInput) =>
      submitIRBClearance(clearanceId, input),
    onSuccess: () => {
      toast.success(
        isResubmission
          ? "IRB clearance application resubmitted successfully."
          : "IRB clearance application submitted successfully.",
      );
      queryClient.invalidateQueries({ queryKey: ["ethical-clearances"] });
      queryClient.invalidateQueries({
        queryKey: ["ethical-clearance", clearanceId],
      });
      router.push(`/research/irb-clearance/my-submissions/${clearanceId}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit IRB clearance application.");
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: () =>
      updateDraftIRBClearance(clearanceId, {
        clearanceTypeId: selectedTypeId ? Number(selectedTypeId) : null,
        submissionNotes: submissionNotes || undefined,
        clearanceFile: clearanceFile ?? undefined,
        supportingDocuments:
          supportingFiles.length > 0 ? supportingFiles : undefined,
        removedDocumentIds: removedDocIds.length > 0 ? removedDocIds : undefined,
      }),
    onSuccess: () => {
      toast.success("Draft saved successfully.");
      queryClient.invalidateQueries({ queryKey: ["ethical-clearances"] });
      queryClient.invalidateQueries({
        queryKey: ["ethical-clearance", clearanceId],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save draft.");
    },
  });

  const handleSubmit = () => {
    if (!clearanceFile && !hasExistingFile) {
      toast.error("Please upload an IRB clearance document before submitting.");
      return;
    }
    submitMutation.mutate({
      clearanceTypeId: selectedTypeId ? Number(selectedTypeId) : null,
      submissionNotes,
      clearanceFile: clearanceFile ?? undefined,
      supportingDocuments:
        supportingFiles.length > 0 ? supportingFiles : undefined,
      removedDocumentIds: removedDocIds.length > 0 ? removedDocIds : undefined,
    });
  };

  const handleClearanceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setClearanceFile(file);
  };

  const handleSupportingFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setSupportingFiles((prev) => [...prev, ...files]);
    if (supportingInputRef.current) supportingInputRef.current.value = "";
  };

  const removeSupportingFile = (index: number) => {
    setSupportingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingSupportingDoc = (docId: number) => {
    setRemovedDocIds((prev) => [...prev, docId]);
    setExistingSupportingDocs((prev) => prev.filter((doc) => doc.id !== docId));
  };

  const status = clearance?.status;
  const canSubmit = status === "pending_submission" || status === "rejected";
  const resolvedExistingFileUrl = existingFileUrl ? resolveFileUrl(existingFileUrl) : null;

  const readinessMap: Record<string, boolean> = {
    type: Boolean(selectedTypeId),
    document: Boolean(clearanceFile || hasExistingFile),
  };

  const completedCount = Object.values(readinessMap).filter(Boolean).length;
  const isReady = Boolean(clearanceFile || hasExistingFile);

  if (isLoadingClearance) {
    return (
      <PageContainer title="Edit IRB Clearance Application">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] pb-24">
          <div className="space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-44 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!clearance) {
    return (
      <PageContainer title="Edit IRB Clearance Application">
        <Card className="max-w-lg mx-auto my-16 border-rose-200 bg-rose-50/20 text-center">
          <CardContent className="flex flex-col items-center justify-center p-12 gap-3">
            <AlertCircle className="h-10 w-10 text-rose-500" />
            <p className="font-bold text-slate-800 dark:text-slate-200">Clearance record not found</p>
            <p className="text-xs text-muted-foreground">The requested IRB submission could not be loaded.</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => router.push("/research/irb-clearance/my-submissions")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Go to Submissions
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (!canSubmit) {
    const cfg = statusConfig[status ?? ""] ?? {
      label: status,
      className: "bg-slate-100 text-slate-700 border-slate-200",
    };
    return (
      <PageContainer
        title="Edit IRB Clearance Application"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/research/irb-clearance/my-submissions/${clearanceId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Submissions
            </Link>
          </Button>
        }
      >
        <Card className="border border-muted-foreground/15 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <CheckCircle2 className="h-12 w-12 text-blue-500" />
            <div className="space-y-2">
              <p className="text-lg font-bold">This clearance application is not in an editable state</p>
              <p className="text-sm text-muted-foreground">Current status:</p>
              <Badge className={cn("border px-2.5 py-0.5 text-xs font-bold uppercase shadow-none", cfg.className)}>
                {cfg.label}
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push(`/research/irb-clearance/my-submissions/${clearanceId}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> View Submission Details
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={isResubmission ? "Resubmit IRB Clearance Application" : "Edit IRB Clearance Application"}
      description={
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="text-xs font-semibold text-muted-foreground">Reference:</span>
          <button
            type="button"
            onClick={handleCopyRef}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted font-mono text-xs font-bold text-foreground border border-border/60 transition-all duration-200 group cursor-pointer shadow-2xs hover:border-primary/40 active:scale-95"
            title="Click to copy reference number"
          >
            <span>{clearance.referenceNumber || `IRB-${clearance.id}`}</span>
            {copiedRef ? (
              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
            )}
          </button>
        </div>
      }
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="shadow-xs">
            <Link href={`/research/irb-clearance/my-submissions/${clearanceId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px] pb-24">
        {/* Main Content Column */}
        <div className="space-y-6 min-w-0">
          {/* Rejection Feedback Banner */}
          {isResubmission && clearance.reviews && clearance.reviews.length > 0 && (
            <Card className="border-rose-200 bg-rose-50/70 dark:bg-rose-950/20 shadow-xs">
              <CardContent className="flex items-start gap-3.5 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-rose-800 dark:text-rose-300">
                    Committee Reviewer Feedback for Resubmission
                  </p>
                  <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed">
                    {clearance.reviews[clearance.reviews.length - 1].comments || "Please update your documents based on committee comments and resubmit."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card 1: Proposal Information Summary */}
          <Card className="border border-muted-foreground/15 shadow-sm">
            <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-900/30">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-primary" />
                Proposal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-3">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Proposal Title
                </p>
                <p className="text-sm font-bold leading-snug text-slate-900 dark:text-slate-100">
                  {clearance.proposalTitle || "—"}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Principal Investigator
                  </p>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {clearance.pi?.fullName || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Institution
                  </p>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {clearance.proposalInstitution || "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: IRB Clearance Type */}
          <Card className="border border-muted-foreground/15 shadow-sm">
            <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-900/30">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4.5 w-4.5 text-primary" />
                <CardTitle className="text-base font-bold">
                  IRB Clearance Type <span className="text-destructive text-sm font-normal">*</span>
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Select the applicable ethical clearance classification for this protocol.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clearanceType" className="text-xs font-semibold">Clearance Category</Label>
                <SearchableSelect
                  value={selectedTypeId}
                  onValueChange={setSelectedTypeId}
                  placeholder="Select clearance category..."
                  searchPlaceholder="Search clearance type..."
                  additionalOptions={clearanceTypes}
                  getOptionValue={(ct) => String(ct.id)}
                  getOptionLabel={(ct) => ct.name}
                  selectedLabel={clearanceTypes.find((ct) => String(ct.id) === selectedTypeId)?.name}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Ethical Clearance Document */}
          <Card className="border border-muted-foreground/15 shadow-sm">
            <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-900/30">
              <div className="flex items-center gap-2">
                <Upload className="h-4.5 w-4.5 text-primary" />
                <CardTitle className="text-base font-bold">
                  Ethical Clearance Document <span className="text-destructive text-sm font-normal">*</span>
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Upload official IRB clearance certificate or protocol approval document (PDF, DOCX, PNG).
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              {existingFileUrl && !clearanceFile && resolvedExistingFileUrl && (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20 px-4 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      Active Clearance File
                    </p>
                    <a
                      href={resolvedExistingFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                    >
                      Click to view current clearance file
                    </a>
                  </div>
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-100 text-[10px] font-bold uppercase text-emerald-700 shadow-none">
                    Uploaded
                  </Badge>
                </div>
              )}

              <div
                className={cn(
                  "relative rounded-xl border-2 border-dashed p-7 text-center transition-colors",
                  clearanceFile
                    ? "border-emerald-300 bg-emerald-50/30 dark:bg-emerald-950/10"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/20",
                )}
              >
                {clearanceFile ? (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs">
                        {getFileExtension(clearanceFile.name)}
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-xs font-bold truncate">
                          {clearanceFile.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatFileSize(clearanceFile.size)}
                          {existingFileUrl && " — Replaces active file"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-rose-600 shrink-0"
                      onClick={() => setClearanceFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <div className="flex flex-col items-center gap-2.5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Upload className="h-5.5 w-5.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          {existingFileUrl
                            ? "Click to upload a replacement clearance document"
                            : "Click to upload primary clearance document"}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Supports PDF, DOC, DOCX, JPG, PNG (up to 20MB)
                        </p>
                      </div>
                    </div>
                    <input
                      type="file"
                      className="sr-only"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleClearanceFileChange}
                    />
                  </label>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Supporting Documents */}
          <Card className="border border-muted-foreground/15 shadow-sm">
            <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-900/30">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4.5 w-4.5 text-primary" />
                <CardTitle className="text-base font-bold">
                  Supporting Documents <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Upload ethics protocols, participant consent forms, or supporting files.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/20">
                <Upload className="h-4 w-4 text-primary" />
                Add Supporting Files
                <input
                  ref={supportingInputRef}
                  type="file"
                  className="sr-only"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleSupportingFilesChange}
                />
              </label>

              {existingSupportingDocs.length > 0 && (
                <div className="space-y-2 pt-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Active Attachments
                  </p>
                  {existingSupportingDocs.map((doc) => {
                    const resolvedUrl = resolveFileUrl(doc.url);
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 rounded-lg border bg-slate-50/50 dark:bg-slate-900/20 px-3.5 py-2.5"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">
                          {getFileExtension(doc.filename)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold">
                            {doc.filename}
                          </p>
                          {resolvedUrl && (
                            <a
                              href={resolvedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-primary hover:underline font-medium"
                            >
                              View file
                            </a>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-rose-600"
                          onClick={() => removeExistingSupportingDoc(doc.id)}
                          title="Remove attachment"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {supportingFiles.length > 0 && (
                <div className="space-y-2 pt-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    New Files Pending Upload
                  </p>
                  {supportingFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-3 rounded-lg border bg-slate-50/50 dark:bg-slate-900/20 px-3.5 py-2.5"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">
                        {getFileExtension(file.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-rose-600"
                        onClick={() => removeSupportingFile(index)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 5: Submission Notes */}
          <Card className="border border-muted-foreground/15 shadow-sm">
            <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-900/30">
              <div className="flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-primary" />
                <CardTitle className="text-base font-bold">
                  Submission Notes <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Add optional notes or comments for the IRB committee reviewers.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <Textarea
                placeholder="Provide optional details or notes for reviewers..."
                value={submissionNotes}
                onChange={(e) => setSubmissionNotes(e.target.value)}
                rows={3}
                className="resize-none text-xs"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column */}
        <aside className="space-y-6">
          {/* Submission Readiness Card */}
          <Card className="border border-muted-foreground/15 shadow-sm">
            <CardHeader className="border-b bg-slate-50/80 dark:bg-slate-900/40">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Submission Readiness
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              {/* Progress Ring */}
              <div className="flex items-center justify-center py-1">
                <div className="relative">
                  <svg className="h-20 w-20 -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      strokeWidth="7"
                      stroke="currentColor"
                      fill="transparent"
                      className="text-muted/20"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      strokeWidth="7"
                      strokeDasharray={213.6}
                      strokeDashoffset={
                        213.6 -
                        (213.6 * completedCount) / READINESS_STEPS.length
                      }
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      className="text-primary"
                      style={{ transition: "stroke-dashoffset 0.4s ease" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-extrabold">
                      {completedCount}/{READINESS_STEPS.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                {READINESS_STEPS.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center gap-2 text-xs"
                  >
                    {readinessMap[item.key] ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <div className="h-4 w-4 shrink-0 rounded-full border-2 border-muted-foreground/30" />
                    )}
                    <span
                      className={
                        readinessMap[item.key]
                          ? "text-slate-900 dark:text-slate-100 font-semibold"
                          : "text-muted-foreground font-medium"
                      }
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              {!isReady && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  Upload your clearance document to submit.
                </div>
              )}

              {isEditing && !isResubmission && (
                <Button
                  variant="outline"
                  className="mt-2 w-full text-xs font-semibold shadow-xs"
                  onClick={() => saveDraftMutation.mutate()}
                  disabled={saveDraftMutation.isPending}
                >
                  {saveDraftMutation.isPending ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-3.5 w-3.5" />
                  )}
                  Save Draft
                </Button>
              )}

              <Button
                className="mt-2 w-full text-xs font-bold shadow-xs"
                onClick={handleSubmit}
                disabled={submitMutation.isPending || !isReady}
              >
                {submitMutation.isPending ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="mr-2 h-3.5 w-3.5" />
                )}
                {isEditing
                  ? isResubmission
                    ? "Resubmit Application"
                    : "Submit Application"
                  : "Submit Application"}
              </Button>
            </CardContent>
          </Card>

          {/* Guidance Note Card */}
          <Card className="border border-muted-foreground/15 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {isResubmission
                    ? "After resubmission, your application will re-enter the review queue for committee evaluation."
                    : "Once submitted, your clearance application will be routed to the IRB Ethics Committee."}
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
