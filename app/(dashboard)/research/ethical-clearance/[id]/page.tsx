"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Paperclip,
  RefreshCcw,
  Shield,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/layout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { EthicalClearance } from "@/types/ethical-clearance";
import { useCreateEthicalClearance, useEthicalClearance } from "@/lib/queries/ethical-clearance";

const clearanceTypeLabel: Record<string, string> = {
  full_board: "Full Board Review",
  expedited: "Expedited Review",
  exempt: "Exempt",
  informed_consent_waiver: "Informed Consent Waiver",
};

const statusConfig: Record<
  EthicalClearance["status"],
  { label: string; className: string; icon: typeof Shield }
> = {
  pending: {
    label: "Pending Review",
    className: "bg-slate-100 text-slate-700 border-slate-200",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-100 text-rose-700 border-rose-200",
    icon: XCircle,
  },
  additional_info_required: {
    label: "Additional Information Required",
    className: "bg-amber-100 text-amber-700 border-amber-200",
    icon: AlertCircle,
  },
};

const MAX_UPLOAD_SIZE_MB = 10;
const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

function formatDate(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function resolveFileUrl(filePath?: string | null) {
  if (!filePath) return null;
  if (/^https?:\/\//i.test(filePath)) return filePath;
  if (filePath.startsWith("/api/proxy")) return filePath;
  if (filePath.startsWith("/")) return `/api/proxy${filePath}`;
  return `/api/proxy/${filePath}`;
}

function getFileName(filePath?: string | null) {
  if (!filePath) return "";
  return filePath.split("/").pop() || filePath;
}

function isAcceptedUpload(file: File) {
  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();

  return (
    mimeType.startsWith("image/") ||
    mimeType === "application/pdf" ||
    mimeType === "application/msword" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".pdf") ||
    fileName.endsWith(".doc") ||
    fileName.endsWith(".docx")
  );
}

function validateUploadFile(file: File) {
  if (!isAcceptedUpload(file)) {
    return "Accepted file types are PDF, DOC, DOCX, and images.";
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return `File size must be ${MAX_UPLOAD_SIZE_MB}MB or less.`;
  }

  return null;
}

interface UploadFieldProps {
  id: string;
  label: string;
  helperText: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  existingFileName?: string | null;
  existingFileUrl?: string | null;
  isDragging: boolean;
  setIsDragging: (value: boolean) => void;
  required?: boolean;
  disabled?: boolean;
}

function UploadField({
  id,
  label,
  helperText,
  file,
  onFileChange,
  existingFileName,
  existingFileUrl,
  isDragging,
  setIsDragging,
  required = false,
  disabled = false,
}: UploadFieldProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setPreviewUrl(nextUrl);

    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  const currentUrl = previewUrl || existingFileUrl;
  const currentName = file?.name || existingFileName || "No file selected";

  const handlePick = (selectedFile: File | undefined | null) => {
    if (!selectedFile) {
      onFileChange(null);
      return;
    }

    const validationError = validateUploadFile(selectedFile);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    onFileChange(selectedFile);
  };

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium">{label}</label>
        {required && (
          <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Required
          </span>
        )}
      </div>

      {file ? (
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-3">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{currentName}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Replaces the current backend file.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {currentUrl && (
                <a
                  href={currentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Preview
                </a>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onFileChange(null)}
                aria-label={`Remove ${label.toLowerCase()}`}
              >
                <XCircle className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "rounded-xl border-2 border-dashed p-5 transition-colors",
            disabled
              ? "cursor-not-allowed border-muted-foreground/15 opacity-60"
              : isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/40 hover:bg-muted/30",
          )}
          onDragEnter={(event) => {
            if (disabled) return;
            event.preventDefault();
            event.stopPropagation();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            if (disabled) return;
            event.preventDefault();
            event.stopPropagation();
            setIsDragging(false);
          }}
          onDragOver={(event) => {
            if (disabled) return;
            event.preventDefault();
            event.stopPropagation();
          }}
          onDrop={(event) => {
            if (disabled) return;
            event.preventDefault();
            event.stopPropagation();
            setIsDragging(false);
            handlePick(event.dataTransfer.files?.[0]);
          }}
          onClick={() => {
            if (disabled) return;
            document.getElementById(id)?.click();
          }}
        >
          <input
            id={id}
            type="file"
            accept=".pdf,.doc,.docx,image/*"
            onChange={(event) => handlePick(event.target.files?.[0] || null)}
            className="hidden"
            disabled={disabled}
          />

          <div className="flex items-center gap-4">
            <div className="rounded-full bg-muted p-3">
              <Paperclip className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {isDragging
                  ? "Drop the file here"
                  : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-muted-foreground">{helperText}</p>
              {existingFileName && (
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wide text-foreground/70">
                    Current:
                  </span>
                  <span className="truncate">{existingFileName}</span>
                  {existingFileUrl && (
                    <a
                      href={existingFileUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className="font-medium text-primary hover:underline"
                    >
                      Preview current
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <PageContainer
      title="Ethical Clearance"
      description="Loading ethical clearance record..."
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-52 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </div>
    </PageContainer>
  );
}

function FallbackState({
  title,
  description,
  onRetry,
  onBack,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
  onBack: () => void;
}) {
  return (
    <PageContainer title="Ethical Clearance" description={description}>
      <div className="flex min-h-[55vh] items-center justify-center">
        <Card className="w-full max-w-xl shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
            <div className="rounded-full bg-rose-100 p-4 text-rose-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold">{title}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {onRetry && (
                <Button onClick={onRetry}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              )}
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

export default function EthicalClearanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const createDecision = useCreateEthicalClearance();

  const routeId = Array.isArray(params.id) ? params.id[0] : params.id;
  const clearanceId = routeId ? Number(routeId) : Number.NaN;
  const isValidId = Number.isFinite(clearanceId) && clearanceId > 0;

  const {
    data: clearance,
    isLoading,
    error,
    refetch,
  } = useEthicalClearance(isValidId ? clearanceId : undefined);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [decision, setDecision] = useState<EthicalClearance["status"] | "">("");
  const [clearanceTypeState, setClearanceTypeState] = useState("");
  const [requestFile, setRequestFile] = useState<File | null>(null);
  const [clearanceFile, setClearanceFile] = useState<File | null>(null);
  const [requestDragging, setRequestDragging] = useState(false);
  const [clearanceDragging, setClearanceDragging] = useState(false);

  useEffect(() => {
    if (!isDialogOpen || !clearance) return;

    setDecision(clearance.status);
    setClearanceTypeState(clearance.clearance_type || "");
    setRequestFile(null);
    setClearanceFile(null);
    setRequestDragging(false);
    setClearanceDragging(false);
  }, [clearance, isDialogOpen]);

  const clearDialogState = () => {
    setIsDialogOpen(false);
    setDecision("");
    setClearanceTypeState("");
    setRequestFile(null);
    setClearanceFile(null);
    setRequestDragging(false);
    setClearanceDragging(false);
  };

  if (!isValidId) {
    return (
      <FallbackState
        title="Invalid ethical clearance id"
        description="The route parameter could not be parsed into a valid record id."
        onBack={() => router.push("/research/ethical-clearance")}
      />
    );
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !clearance) {
    return (
      <FallbackState
        title="Failed to load ethical clearance"
        description="The backend did not return a record for this clearance."
        onRetry={() => refetch()}
        onBack={() => router.push("/research/ethical-clearance")}
      />
    );
  }

  const status = statusConfig[clearance.status];
  const StatusIcon = status.icon;
  const requestFileUrl = resolveFileUrl(clearance.request_file);
  const clearanceFileUrl = resolveFileUrl(clearance.clearance_file);
  const piLabel =
    typeof clearance.pi === "string"
      ? clearance.pi
      : clearance.pi?.fullName ||
        clearance.pi?.name ||
        clearance.pi?.first_name ||
        clearance.pi?.firstName ||
        "—";

  const handleSave = async () => {
    if (!clearance.proposal) {
      toast.error("Proposal is required.");
      return;
    }

    if (!decision) {
      toast.error("Decision is required.");
      return;
    }

    if (!clearanceTypeState) {
      toast.error("Clearance type is required.");
      return;
    }

    if (!requestFile) {
      toast.error("Request file is required.");
      return;
    }

    if (decision === "approved" && !clearanceFile) {
      toast.error("Clearance file is required for an approved decision.");
      return;
    }

    const approvalDate =
      decision === "approved"
        ? new Date().toISOString().split("T")[0]
        : undefined;

    try {
      await createDecision.mutateAsync({
        proposal: clearance.proposal,
        request_file: requestFile,
        clearance_type: clearanceTypeState,
        application_date: new Date().toISOString().split("T")[0],
        status: decision,
        clearance_file: clearanceFile || undefined,
        approval_date: approvalDate,
      });

      await refetch();
      clearDialogState();
    } catch {
      // Toasts are handled in the mutation hook.
    }
  };

  return (
    <PageContainer
      title={clearance.proposal_title || "Ethical Clearance"}
      description={`Ethical Clearance — ${clearance.reference_number || `EC-${clearance.id}`}`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/research/ethical-clearance")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            className="bg-primary/80 hover:bg-primary/60"
            onClick={() => setIsDialogOpen(true)}
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            Process Clearance
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="border-primary/10 shadow-sm">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-primary" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full",
                      status.className,
                    )}
                  >
                    <StatusIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-black">{status.label}</p>
                    <p className="text-xs text-muted-foreground">
                      Current backend clearance status
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="font-bold">
                    Proposal {clearance.proposal}
                  </Badge>
                  <Badge variant="outline" className="font-bold">
                    {clearance.need_irb_ethical_clearance
                      ? "IRB Required"
                      : "IRB Not Required"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/5">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Application Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {[
                  {
                    label: "Reference Number",
                    value: (
                      <span className="font-bold text-primary">
                        {clearance.reference_number || `EC-${clearance.id}`}
                      </span>
                    ),
                  },
                  {
                    label: "Proposal Title",
                    value: clearance.proposal_title || "—",
                  },
                  {
                    label: "Principal Investigator",
                    value: piLabel,
                  },
                  {
                    label: "Clearance Type",
                    value: (
                      <Badge
                        variant="outline"
                        className="font-bold border-primary/20"
                      >
                        {clearanceTypeLabel[clearance.clearance_type] ||
                          clearance.clearance_type}
                      </Badge>
                    ),
                  },
                  {
                    label: "Proposal ID",
                    value: clearance.proposal,
                  },
                  {
                    label: "Screening ID",
                    value: clearance.screening_id ?? "—",
                  },
                  {
                    label: "Application Date",
                    value: (
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatDate(clearance.application_date)}
                      </span>
                    ),
                  },
                  {
                    label: "Approval Date",
                    value: clearance.approval_date ? (
                      <span className="flex items-center gap-1.5 font-bold text-primary">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {formatDate(clearance.approval_date)}
                      </span>
                    ) : (
                      <span className="text-xs italic text-muted-foreground/50">
                        Pending approval
                      </span>
                    ),
                  },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <dt className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="text-sm font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/5">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-primary" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="rounded-xl border bg-muted/20 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {getFileName(clearance.request_file) || "Request file"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Request file uploaded with the backend record
                      </p>
                    </div>
                  </div>
                  {requestFileUrl && (
                    <a
                      href={requestFileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Preview
                    </a>
                  )}
                </div>
              </div>

              {clearance.clearance_file ? (
                <div className="rounded-xl border bg-muted/20 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-emerald-50 p-3">
                        <ShieldCheck className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {getFileName(clearance.clearance_file) ||
                            "Clearance file"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Approved clearance certificate from the backend
                        </p>
                      </div>
                    </div>
                    {clearanceFileUrl && (
                      <a
                        href={clearanceFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-emerald-600 hover:underline"
                      >
                        Preview
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-center">
                  <ShieldCheck className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground italic">
                    Clearance certificate will appear here once approved.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 sticky top-20 self-start">
          <Card className="overflow-hidden border-primary/10 shadow-sm">
            <CardHeader
              className={cn(
                "py-6 text-center text-white",
                clearance.status === "approved"
                  ? "bg-emerald-600"
                  : clearance.status === "rejected"
                    ? "bg-rose-600"
                    : clearance.status === "additional_info_required"
                      ? "bg-amber-600"
                      : "bg-primary",
              )}
            >
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">
                Clearance Record
              </p>
              <p className="text-2xl font-black">
                {clearance.reference_number || `EC-${clearance.id}`}
              </p>
              <Badge className="mt-2 bg-white/20 text-white border-white/30 text-[9px] font-bold uppercase">
                {clearanceTypeLabel[clearance.clearance_type] ||
                  clearance.clearance_type}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3 pt-5 text-sm">
              <div className="flex justify-between gap-4">
                <span className="font-medium text-muted-foreground">
                  Status
                </span>
                <Badge
                  className={cn(
                    "border text-[10px] font-bold shadow-none",
                    status.className,
                  )}
                >
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {status.label}
                </Badge>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-medium text-muted-foreground">PI</span>
                <span className="max-w-40 truncate text-right text-xs font-bold leading-tight">
                  {piLabel}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-medium text-muted-foreground">
                  Applied
                </span>
                <span className="text-xs font-bold">
                  {formatDate(clearance.application_date)}
                </span>
              </div>
              {clearance.approval_date && (
                <div className="flex justify-between gap-4">
                  <span className="font-medium text-muted-foreground">
                    Approved
                  </span>
                  <span className="text-xs font-bold text-emerald-600">
                    {formatDate(clearance.approval_date)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 h-11"
            onClick={() => setIsDialogOpen(true)}
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            Process Clearance
          </Button>
        </aside>
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) =>
          open ? setIsDialogOpen(true) : clearDialogState()
        }
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>IRB Decision</DialogTitle>
            <DialogDescription>
              Record the backend decision and upload the supporting files for
              this ethical clearance.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">IRB Decision</label>
              <select
                value={decision}
                onChange={(event) =>
                  setDecision(event.target.value as EthicalClearance["status"])
                }
                className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select decision</option>
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="additional_info_required">
                  Additional Information Required
                </option>
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Clearance Type</label>
              <select
                value={clearanceTypeState}
                onChange={(event) => setClearanceTypeState(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select type</option>
                {Object.entries(clearanceTypeLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <UploadField
              id="request-file-input"
              label="Request File"
              helperText="Upload the original request file. Accepted: PDF, DOC, DOCX, or images."
              file={requestFile}
              onFileChange={setRequestFile}
              existingFileName={getFileName(clearance.request_file)}
              existingFileUrl={requestFileUrl}
              isDragging={requestDragging}
              setIsDragging={setRequestDragging}
              required
            />

            <UploadField
              id="clearance-file-input"
              label="Clearance File"
              helperText="Upload the clearance certificate when the decision is approved."
              file={clearanceFile}
              onFileChange={setClearanceFile}
              existingFileName={getFileName(clearance.clearance_file)}
              existingFileUrl={clearanceFileUrl}
              isDragging={clearanceDragging}
              setIsDragging={setClearanceDragging}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={clearDialogState}
              disabled={createDecision.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={createDecision.isPending}
            >
              {createDecision.isPending ? "Saving..." : "Save Decision"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
