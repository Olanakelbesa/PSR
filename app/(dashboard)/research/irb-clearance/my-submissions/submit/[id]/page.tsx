"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  FileText,
  Upload,
  CheckCircle2,
  Send,
  Loader2,
  Info,
  X,
  Paperclip,
  AlertCircle,
  File,
  Save,
} from "lucide-react";
import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import {
  useEthicalClearance,
  useIRBClearanceTypes,
} from "@/lib/queries/ethical-clearance";
import { submitIRBClearance, updateDraftIRBClearance } from "@/api/services/ethical-clearance.service";
import type { IRBClearanceSubmitInput } from "@/types/ethical-clearance";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "PDF";
  if (["doc", "docx"].includes(ext || "")) return "DOC";
  if (["jpg", "jpeg", "png"].includes(ext || "")) return "IMG";
  return "FILE";
}

const READINESS = [
  { key: "type", label: "Clearance type selected" },
  { key: "document", label: "Clearance document uploaded" },
  { key: "notes", label: "Submission notes added" },
];

export default function IRBSubmissionPage() {
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
    if (clearance.files?.clearanceFile) {
      setExistingFileUrl(clearance.files.clearanceFile);
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

  const submitMutation = useMutation({
    mutationFn: (input: IRBClearanceSubmitInput) =>
      submitIRBClearance(clearanceId, input),
    onSuccess: () => {
      toast.success(
        isResubmission
          ? "IRB clearance resubmitted successfully."
          : "IRB clearance submitted successfully.",
      );
      queryClient.invalidateQueries({ queryKey: ["ethical-clearances"] });
      queryClient.invalidateQueries({
        queryKey: ["ethical-clearance", clearanceId],
      });
      router.push(`/research/irb-clearance/my-submissions/${clearanceId}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit IRB clearance.");
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
      toast.error("Please upload a clearance document.");
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

  const handleSaveDraft = () => {
    saveDraftMutation.mutate();
  };

  const handleClearanceFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0] ?? null;
    setClearanceFile(file);
  };

  const handleSupportingFilesChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
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

  const statusConfig: Record<string, { label: string; className: string }> = {
    pending_submission: {
      label: "Pending Submission",
      className: "bg-amber-100 text-amber-700 border-amber-200",
    },
    pending_review: {
      label: "Pending Review",
      className: "bg-blue-100 text-blue-700 border-blue-200",
    },
    approved: {
      label: "Approved",
      className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    rejected: {
      label: "Rejected",
      className: "bg-rose-100 text-rose-700 border-rose-200",
    },
    resubmitted: {
      label: "Resubmitted",
      className: "bg-violet-100 text-violet-700 border-violet-200",
    },
  };

  const status = clearance?.status;
  const canSubmit = status === "pending_submission" || status === "rejected";

  const resolvedExistingFileUrl = existingFileUrl
    ? resolveFileUrl(existingFileUrl)
    : null;

  const readinessMap: Record<string, boolean> = {
    type: !!selectedTypeId,
    document: !!clearanceFile || hasExistingFile,
    notes: submissionNotes.trim().length > 0,
  };
  const completedCount = Object.values(readinessMap).filter(Boolean).length;
  const isReady = !!clearanceFile || hasExistingFile;

  if (isLoadingClearance) {
    return (
      <PageContainer title="Submit IRB Clearance">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    );
  }

  if (!clearance) {
    return (
      <PageContainer title="Submit IRB Clearance">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="font-semibold">Clearance record not found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
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
        title="Submit IRB Clearance"
        actions={
          <Button variant="outline" asChild>
            <Link
              href={`/research/irb-clearance/my-submissions/${clearanceId}`}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Submission
            </Link>
          </Button>
        }
      >
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <CheckCircle2 className="h-12 w-12 text-blue-500" />
            <div className="space-y-2">
              <p className="text-lg font-semibold">
                This clearance is not in a submittable state
              </p>
              <p className="text-sm text-muted-foreground">Current status:</p>
              <Badge
                className={cn(
                  "border px-2.5 py-0.5 text-xs font-bold uppercase",
                  cfg.className,
                )}
              >
                {cfg.label}
              </Badge>
            </div>
            <Button
              variant="outline"
              onClick={() =>
                router.push(
                  `/research/irb-clearance/my-submissions/${clearanceId}`,
                )
              }
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Submission
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={
        isEditing
          ? isResubmission
            ? "Resubmit IRB Clearance"
            : "Edit IRB Clearance"
          : "Submit IRB Clearance"
      }
      description={
        isEditing
          ? isResubmission
            ? "Your previous application was rejected. Update your documents and resubmit."
            : "Update your IRB clearance draft before submitting."
          : "Submit your IRB clearance application with the required documents."
      }
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link
              href={`/research/irb-clearance/my-submissions/${clearanceId}`}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* Main column */}
        <div className="space-y-6">
          {/* Rejection feedback */}
          {isResubmission &&
            clearance.reviews &&
            clearance.reviews.length > 0 && (
              <Card className="border-rose-200 bg-rose-50/60">
                <CardContent className="flex items-start gap-3 py-4">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-rose-700">
                      Rejection Feedback
                    </p>
                    <p className="text-sm text-rose-600">
                      {clearance.reviews[clearance.reviews.length - 1]
                        .comments || "No comments provided."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Proposal summary */}
          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Proposal Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight">
                      {clearance.proposalTitle || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {clearance.referenceNumber || "—"}
                      {clearance.pi?.fullName &&
                        ` · PI: ${clearance.pi.fullName}`}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-xs text-muted-foreground">
                  {clearance.proposalInstitution || ""}
                </div>
              </div>
              {clearance.proposalShortAbstract && (
                <>
                  <Separator />
                  <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
                    {clearance.proposalShortAbstract}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Clearance Type */}
          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">
                  IRB Clearance Type{" "}
                  <span className="text-destructive text-sm font-normal">*</span>
                </CardTitle>
              </div>
              <CardDescription>
                Select the type of IRB clearance applicable to this proposal.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="clearanceType">Clearance Type</Label>
                <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                  <SelectTrigger
                    id="clearanceType"
                    className="h-11 shadow-sm focus:ring-primary/20"
                  >
                    <SelectValue placeholder="Select clearance type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clearanceTypes.map((ct) => (
                      <SelectItem key={ct.id} value={ct.id.toString()}>
                        <div>
                          <p className="font-medium">{ct.name}</p>
                          {ct.description && (
                            <p className="text-xs text-muted-foreground">
                              {ct.description}
                            </p>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Primary clearance document */}
          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">
                  IRB Clearance Document{" "}
                  <span className="text-destructive text-sm font-normal">*</span>
                </CardTitle>
              </div>
              <CardDescription>
                Upload the primary IRB clearance document (PDF, DOC, or image).
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              {existingFileUrl && !clearanceFile && resolvedExistingFileUrl && (
                <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-emerald-800">
                      Current clearance document
                    </p>
                    <a
                      href={resolvedExistingFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 hover:underline"
                    >
                      View existing file
                    </a>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-emerald-200 bg-emerald-100 text-[10px] text-emerald-700"
                  >
                    Uploaded
                  </Badge>
                </div>
              )}
              <div
                className={cn(
                  "relative rounded-xl border-2 border-dashed p-8 text-center transition-colors",
                  clearanceFile
                    ? "border-emerald-300 bg-emerald-50/30"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50",
                )}
              >
                {clearanceFile ? (
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">
                        {clearanceFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(clearanceFile.size)}
                        {existingFileUrl && " — will replace current file"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-4 h-9 w-9 text-muted-foreground hover:text-rose-600"
                      onClick={() => setClearanceFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <Upload className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {existingFileUrl
                            ? "Click to replace with a new file"
                            : "Click to upload or drag and drop"}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          PDF, DOC, DOCX, JPG, JPEG, PNG (max 20MB)
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

          {/* Supporting documents */}
          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">
                  Supporting Documents
                </CardTitle>
              </div>
              <CardDescription>
                Upload any additional supporting documents (ethics protocol,
                consent forms, etc.). You can select multiple files.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 text-sm text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:bg-muted/30">
                <Upload className="h-4 w-4" />
                Add supporting documents
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
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Current files
                  </p>
                  {existingSupportingDocs.map((doc) => {
                    const resolvedUrl = resolveFileUrl(doc.url);
                    return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-emerald-800">
                          {doc.filename}
                        </p>
                        {resolvedUrl && (
                          <a
                            href={resolvedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-emerald-600 hover:underline"
                          >
                            View file
                          </a>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-100 text-[10px] text-emerald-700"
                      >
                        Uploaded
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-rose-600"
                        onClick={() => removeExistingSupportingDoc(doc.id)}
                        title="Remove file"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    );
                  })}
                </div>
              )}

              {supportingFiles.length > 0 && (
                <div className="space-y-2">
                  {existingSupportingDocs.length > 0 && (
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      New files to add
                    </p>
                  )}
                  {supportingFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-3 rounded-lg border bg-muted/20 px-4 py-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-bold text-primary">
                        {getFileIcon(file.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-rose-600"
                        onClick={() => removeSupportingFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submission notes */}
          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <div className="flex items-center gap-2">
                <File className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Submission Notes</CardTitle>
              </div>
              <CardDescription>
                Add any notes or comments for the IRB reviewers.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <Textarea
                placeholder="Describe the clearance application, mention any specific considerations for the reviewers..."
                value={submissionNotes}
                onChange={(e) => setSubmissionNotes(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 xl:sticky xl:top-5">
          {/* Readiness tracker */}
          <Card
            className={cn(
              "shadow-sm border",
              isReady ? "border-primary/10" : "border-primary/20",
            )}
          >
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">
                Submission Readiness
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {/* Progress ring */}
              <div className="flex items-center justify-center py-2">
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
                        (213.6 * completedCount) / READINESS.length
                      }
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      className="text-primary"
                      style={{ transition: "stroke-dashoffset 0.4s ease" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-black">
                      {completedCount}/{READINESS.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {READINESS.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center gap-2 text-xs"
                  >
                    {readinessMap[item.key] ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <div className="h-4 w-4 shrink-0 rounded-full border-2 border-muted-foreground/30" />
                    )}
                    <span
                      className={
                        readinessMap[item.key]
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              {!isReady && (
                <div className="flex items-start gap-2 rounded border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  Upload a clearance document to submit.
                </div>
              )}

              {isEditing && !isResubmission && (
                <Button
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={handleSaveDraft}
                  disabled={saveDraftMutation.isPending}
                >
                  {saveDraftMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Draft
                </Button>
              )}

              <Button
                className={cn(
                  "mt-2 w-full bg-primary hover:bg-primary/90",
                  isEditing && !isResubmission && "mt-1",
                )}
                onClick={handleSubmit}
                disabled={submitMutation.isPending || !isReady}
              >
                {submitMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isEditing
                  ? isResubmission
                    ? "Resubmit Application"
                    : "Submit Application"
                  : "Submit Application"}
              </Button>
            </CardContent>
          </Card>

          {/* Info card */}
          <Card className="shadow-sm border-primary/10">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {isEditing
                    ? isResubmission
                      ? "After resubmission, the clearance will re-enter the review queue. You will be notified once a decision is made."
                      : "Saving changes will keep your submission as a draft. You can submit it when ready."
                    : "Once submitted, the IRB committee will review your application. You will be notified of any decisions."}
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
