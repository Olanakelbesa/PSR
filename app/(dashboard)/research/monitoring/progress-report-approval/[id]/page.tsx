"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  FolderOpen,
  History,
  MessageSquare,
  Paperclip,
  ShieldCheck,
  User,
  UserCheck,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PdfViewerDialog } from "@/components/shared/pdf-viewer-dialog";
import { GradeTerminalReportModal } from "@/components/features/terminal-report/GradeTerminalReportModal";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  useGroupedProgressReport,
  useCreateProgressReportApproval,
} from "@/hooks";
import {
  GroupedProgressReportItem,
  ReportDecision,
} from "@/api/services/progress-reports.service";
import { cn } from "@/lib/utils";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";

type ApprovalDecision = "approved" | "pending" | "rejected";

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: typeof Clock }
> = {
  approved: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    icon: XCircle,
  },
  terminated: {
    label: "Terminated",
    className: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    icon: XCircle,
  },
  on_progress: {
    label: "On Progress",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    icon: ShieldCheck,
  },
  active: {
    label: "Active",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    icon: ShieldCheck,
  },
  pending: {
    label: "Pending Review",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    icon: Clock,
  },
};

function getStatusBadge(status?: string) {
  const key = status?.toLowerCase() || "pending";
  const cfg = STATUS_CONFIG[key] || {
    label: status?.replace(/_/g, " ") || "Pending",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    icon: Clock,
  };
  const Icon = cfg.icon;
  return (
    <Badge className={cn("text-[10px] font-bold uppercase gap-1 shadow-none border", cfg.className)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatAmount(value?: string | number | null) {
  if (value === undefined || value === null || value === "") return "ETB 0.00";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return `ETB ${num.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

function getInitials(name?: string): string {
  if (!name) return "PI";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function SubmitterAvatar({ user, fallback }: { user?: any; fallback?: any }) {
  const targetUser = user || fallback || {};
  const fullName =
    targetUser.fullName ||
    targetUser.full_name ||
    targetUser.name ||
    (typeof targetUser === "string" ? targetUser : "Investigator");
  const email = targetUser.email || "";
  const photo = targetUser.photoUrl || targetUser.photo || targetUser.photo_url;
  const resolvedPhoto = photo ? resolveFileUrl(photo) : null;
  const initials = getInitials(fullName);

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-10 w-10 rounded-full border-2 border-primary/20 bg-primary/10 overflow-hidden shrink-0 flex items-center justify-center font-bold text-sm text-primary shadow-xs">
        {resolvedPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resolvedPhoto} alt={fullName} className="h-full w-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-foreground truncate">{fullName}</span>
          <Badge variant="outline" className="text-[9px] font-bold uppercase py-0 px-1.5 border-primary/30 text-primary bg-primary/5">
            Submitter
          </Badge>
        </div>
        {email && <span className="text-[11px] text-muted-foreground truncate">{email}</span>}
      </div>
    </div>
  );
}

// ─── Evaluation Decision Modal ────────────────────────────────────────────────
interface EvaluationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: GroupedProgressReportItem | null;
  allReports?: GroupedProgressReportItem[];
  onSuccess: () => void;
}

function EvaluationModal({
  open,
  onOpenChange,
  report,
  allReports = [],
  onSuccess,
}: EvaluationModalProps) {
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [decision, setDecision] = useState<ApprovalDecision>("approved");
  const [comment, setComment] = useState("");
  const createApproval = useCreateProgressReportApproval();

  const currentReport = useMemo(() => {
    if (selectedReportId && allReports.length > 0) {
      const found = allReports.find((r) => r.id === selectedReportId);
      if (found) return found;
    }
    return report || allReports[0] || null;
  }, [selectedReportId, allReports, report]);

  const reportOptions = useMemo(
    () =>
      allReports.map((r) => ({
        value: String(r.id),
        label: `${r.reportName} (${r.status ? r.status.replace(/_/g, " ") : "Pending"})`,
      })),
    [allReports],
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      const active = report || allReports[0] || null;
      if (active) {
        setSelectedReportId(active.id);
        const currentDecision = active.latestApproval?.decision || active.status || "approved";
        if (["approved", "pending", "rejected"].includes(currentDecision.toLowerCase())) {
          setDecision(currentDecision.toLowerCase() as ApprovalDecision);
        } else {
          setDecision("approved");
        }
        setComment(active.latestApproval?.comment || "");
      }
    }
    onOpenChange(nextOpen);
  };

  const handleReportSelect = (reportId: number) => {
    setSelectedReportId(reportId);
    const found = allReports.find((r) => r.id === reportId);
    if (found) {
      const currentDecision = found.latestApproval?.decision || found.status || "approved";
      if (["approved", "pending", "rejected"].includes(currentDecision.toLowerCase())) {
        setDecision(currentDecision.toLowerCase() as ApprovalDecision);
      } else {
        setDecision("approved");
      }
      setComment(found.latestApproval?.comment || "");
    }
  };

  async function handleSubmit() {
    if (!currentReport) return;
    try {
      await createApproval.mutateAsync({
        decision: decision as ReportDecision,
        comment: comment.trim() || undefined,
        progress_report: currentReport.id,
      });
      toast.success(`Evaluation decision recorded for ${currentReport.reportName}.`);
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error("Failed to submit evaluation decision. Please try again.");
    }
  }

  const decisionOptions: {
    value: ApprovalDecision;
    label: string;
    description: string;
    activeClass: string;
  }[] = [
      {
        value: "approved",
        label: "Approve Report",
        description: "Progress milestones and financial expenditure meet compliance guidelines.",
        activeClass: "border-emerald-500 bg-emerald-50/60 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
      },
      {
        value: "pending",
        label: "Hold Pending",
        description: "Requires additional clarification or resubmission from project PI.",
        activeClass: "border-amber-500 bg-amber-50/60 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
      },
      {
        value: "rejected",
        label: "Reject Report",
        description: "Report fails to satisfy required research deliverables or compliance rules.",
        activeClass: "border-rose-500 bg-rose-50/60 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200",
      },
    ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[94vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Evaluate Progress Report
          </DialogTitle>
          <DialogDescription className="text-xs">
            Submit an official evaluation decision for &ldquo;{currentReport?.reportName || "this report"}&rdquo;.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Searchable Progress Report Selector when multiple reports exist */}
          {allReports.length > 1 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Target Progress Report <span className="text-rose-500">*</span>
              </Label>
              <SearchableSelect<GroupedProgressReportItem>
                value={currentReport?.id ? String(currentReport.id) : ""}
                onValueChange={(val) => handleReportSelect(Number(val))}
                options={allReports}
                getOptionValue={(r) => String(r.id)}
                getOptionLabel={(r) => r.reportName}
                placeholder="Search and select progress report…"
                searchPlaceholder="Type report name or status…"
                triggerClassName="w-full text-xs font-semibold rounded-xl bg-background border-input shadow-2xs h-10 px-3"
                renderTriggerValue={(item) => {
                  const target = item || currentReport;
                  if (!target) return <span className="text-muted-foreground">Select progress report…</span>;
                  return (
                    <div className="flex items-center justify-between w-full min-w-0 pr-1">
                      <span className="font-bold text-foreground truncate">{target.reportName}</span>
                      <div className="shrink-0">{getStatusBadge(target.status)}</div>
                    </div>
                  );
                }}
                renderOption={(item, isSelected) => {
                  return (
                    <div className="flex items-center justify-between w-full gap-2 min-w-0 py-0.5">
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-xs text-foreground truncate">{item.reportName}</span>
                        {item.startDate && item.endDate && (
                          <span className="text-[10px] text-muted-foreground">
                            {formatDate(item.startDate)} – {formatDate(item.endDate)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {getStatusBadge(item.status)}
                        <Check
                          className={cn(
                            "h-3.5 w-3.5 text-primary transition-opacity",
                            isSelected ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </div>
                    </div>
                  );
                }}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Evaluation Decision <span className="text-rose-500">*</span>
            </Label>
            <div className="grid grid-cols-1 gap-2">
              {decisionOptions.map((opt) => {
                const isSelected = decision === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDecision(opt.value)}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-3 text-left transition-all",
                      isSelected
                        ? opt.activeClass + " ring-1 ring-primary/20 shadow-xs"
                        : "border-border/70 hover:border-muted-foreground/40 bg-card text-foreground",
                    )}
                  >
                    <div className="mt-0.5">
                      <div
                        className={cn(
                          "h-4 w-4 rounded-full border flex items-center justify-center",
                          isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
                        )}
                      >
                        {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-background" />}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold">{opt.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{opt.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="eval-comment"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Reviewer Remarks / Feedback
            </Label>
            <Textarea
              id="eval-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Provide committee comments, feedback, or evaluation justification…"
              className="min-h-[90px] text-xs resize-y"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={createApproval.isPending}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={createApproval.isPending}
            className="shadow-xs"
          >
            {createApproval.isPending ? "Submitting…" : "Confirm Decision"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Detail Page ─────────────────────────────────────────────────────────
export default function ProgressReportApprovalDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const targetId = useMemo(
    () => (typeof id === "string" ? id : Array.isArray(id) ? id[0] : undefined),
    [id],
  );

  const {
    data: proposalData,
    isLoading,
    refetch,
  } = useGroupedProgressReport(targetId);

  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedPt, setCopiedPt] = useState(false);
  const [selectedReport, setSelectedReport] = useState<GroupedProgressReportItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [reportFilter, setReportFilter] = useState<string>("all");

  // Document Preview Viewer state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [previewTitle, setPreviewTitle] = useState<string>("");
  const [gradeModalOpen, setGradeModalOpen] = useState(false);

  const reports = useMemo(() => proposalData?.reports || [], [proposalData]);

  // Compute 1-based chronological report sequence numbers (1 = earliest/initial report, N = latest report)
  const chronologicalOrderMap = useMemo(() => {
    if (!reports.length) return new Map<number, number>();
    const sortedAscending = [...reports].sort((a, b) => {
      const timeA = new Date(a.submittedAt || a.submitted_at || 0).getTime();
      const timeB = new Date(b.submittedAt || b.submitted_at || 0).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return (a.id || 0) - (b.id || 0);
    });

    const map = new Map<number, number>();
    sortedAscending.forEach((rep, index) => {
      map.set(rep.id, index + 1);
    });
    return map;
  }, [reports]);

  const refNumber = proposalData?.referenceNumber || `PT-${proposalData?.projectTrackingId || targetId}`;
  const trackingIdStr = `#${proposalData?.projectTrackingId || targetId}`;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(refNumber);
    setCopiedRef(true);
    toast.success("Reference number copied to clipboard!");
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleCopyPt = () => {
    navigator.clipboard.writeText(String(proposalData?.projectTrackingId || targetId));
    setCopiedPt(true);
    toast.success("Tracking ID copied to clipboard!");
    setTimeout(() => setCopiedPt(false), 2000);
  };

  const handleOpenModal = (report: GroupedProgressReportItem) => {
    setSelectedReport(report);
    setModalOpen(true);
  };

  const handlePreviewDocument = (fileUrl: string, title?: string) => {
    if (!fileUrl) return;
    const resolved = resolveFileUrl(fileUrl);
    setPreviewUrl(resolved);
    setPreviewTitle(title || "Progress Report Document");
    setPreviewOpen(true);
  };

  if (isLoading) {
    return (
      <PageContainer title="Loading Progress Report Review Workspace…">
        <div className="space-y-6 w-full">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <Skeleton className="h-96 w-full rounded-2xl" />
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!proposalData) {
    return (
      <PageContainer title="Progress Report Approval Workspace">
        <div className="space-y-6 w-full">
          <Card className="border border-dashed p-12 text-center">
            <CardContent className="space-y-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">Proposal Progress Reports Not Found</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                No progress report records were found for project identifier #{targetId}.
              </p>
              <Button size="sm" variant="outline" onClick={() => router.push("/research/monitoring/progress-report-approval")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Progress Report Approvals
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  const filteredReports = reports.filter((r) => {
    if (reportFilter === "all") return true;
    return r.status?.toLowerCase() === reportFilter;
  });

  const totalAmountUsed = reports.reduce(
    (acc, r) => acc + (Number(r.amountUsed) || 0),
    0,
  );
  const reviewsCount = reports.reduce(
    (acc, r) => acc + (r.approvals?.length || 0),
    0,
  );

  return (
    <PageContainer
      title={proposalData.title}
      action={
        <Button
          onClick={() => setGradeModalOpen(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm font-semibold flex items-center gap-2"
        >
          <FileCheck2 className="w-4 h-4" />
          Grade & Evaluate Terminal Report
        </Button>
      }
      description={
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          {/* Reference Copy Pill */}
          <button
            type="button"
            onClick={handleCopyRef}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted font-mono text-xs font-bold text-foreground border border-border/60 transition-all duration-200 group cursor-pointer shadow-2xs hover:border-primary/40 active:scale-95"
            title="Click to copy proposal reference number"
          >
            <span className="text-[10px] uppercase text-muted-foreground font-sans">Ref:</span>
            <span>{refNumber}</span>
            {copiedRef ? (
              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
            )}
          </button>

          {/* Tracking ID Copy Pill */}
          <button
            type="button"
            onClick={handleCopyPt}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/5 hover:bg-primary/10 font-mono text-xs font-bold text-primary border border-primary/20 transition-all duration-200 group cursor-pointer shadow-2xs active:scale-95"
            title="Click to copy tracking ID"
          >
            <span className="text-[10px] uppercase text-primary/70 font-sans">Track:</span>
            <span>{trackingIdStr}</span>
            {copiedPt ? (
              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-primary/60 group-hover:text-primary shrink-0 transition-colors" />
            )}
          </button>

          {getStatusBadge(proposalData.status)}

          <Badge variant="secondary" className="text-[10px] font-bold">
            {reports.length} Reports
          </Badge>

          {proposalData.statistics.pending > 0 && (
            <Badge className="bg-amber-500 text-white font-bold text-[10px] animate-pulse">
              {proposalData.statistics.pending} Pending Review
            </Badge>
          )}
        </div>
      }
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="shadow-xs text-xs">
            <Link href="/research/monitoring/progress-report-approval">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to List
            </Link>
          </Button>
          {reports.length > 0 && (
            <Button
              size="sm"
              className="shadow-xs text-xs"
              onClick={() => handleOpenModal(reports[0])}
            >
              <ShieldCheck className="mr-1.5 h-4 w-4" />
              Evaluate Report
            </Button>
          )}
        </div>
      }
    >
      {/* ── Main Layout: 2-Column Workspace Grid ────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main Content Column */}
        <div className="space-y-6 min-w-0">
          <Tabs defaultValue="reports" className="w-full">
            <TabsList className="w-full flex flex-wrap sm:flex-nowrap justify-start h-auto sm:h-11 bg-muted/60 p-1 border border-border/50 rounded-xl gap-1 overflow-x-auto">
              <TabsTrigger value="reports" className="gap-2 text-xs font-semibold px-3 sm:px-4 py-2 sm:py-0 rounded-lg shrink-0">
                <FolderOpen className="h-3.5 w-3.5" />
                Submitted Reports
                {reports.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[9px] px-1.5 py-0 font-bold">
                    {reports.length}
                  </Badge>
                )}
              </TabsTrigger>

              <TabsTrigger value="overview" className="gap-2 text-xs font-semibold px-3 sm:px-4 py-2 sm:py-0 rounded-lg shrink-0">
                <FileText className="h-3.5 w-3.5" />
                Project Details
              </TabsTrigger>

              <TabsTrigger value="reviews" className="gap-2 text-xs font-semibold px-3 sm:px-4 py-2 sm:py-0 rounded-lg shrink-0">
                <History className="h-3.5 w-3.5" />
                Status
                {reviewsCount > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[9px] px-1.5 py-0 font-bold">
                    {reviewsCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ── Progress Reports Tab Content (Single-Expand Accordion Mode) ─── */}
            <TabsContent value="reports" className="pt-4 space-y-4">
              {/* Premium Segmented Filter Control Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-900/40 p-2.5 rounded-2xl border border-border/80 shadow-2xs">
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-0.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1 shrink-0 flex items-center gap-1">
                    <Filter className="h-3.5 w-3.5 text-primary" />
                    Filter:
                  </span>

                  <button
                    type="button"
                    onClick={() => setReportFilter("all")}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer",
                      reportFilter === "all"
                        ? "bg-background text-foreground shadow-xs border border-border ring-1 ring-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                    )}
                  >
                    <span>All Reports</span>
                    <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0 h-4">
                      {reports.length}
                    </Badge>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportFilter("pending")}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer",
                      reportFilter === "pending"
                        ? "bg-amber-500 text-white shadow-xs ring-2 ring-amber-500/30"
                        : "text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30",
                    )}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Pending</span>
                    <Badge className={cn("text-[10px] font-bold px-1.5 py-0 h-4", reportFilter === "pending" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800")}>
                      {proposalData.statistics.pending}
                    </Badge>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportFilter("approved")}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer",
                      reportFilter === "approved"
                        ? "bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30"
                        : "text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
                    )}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Approved</span>
                    <Badge className={cn("text-[10px] font-bold px-1.5 py-0 h-4", reportFilter === "approved" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800")}>
                      {proposalData.statistics.approved}
                    </Badge>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportFilter("rejected")}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer",
                      reportFilter === "rejected"
                        ? "bg-rose-600 text-white shadow-xs ring-2 ring-rose-600/30"
                        : "text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30",
                    )}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Rejected</span>
                    <Badge className={cn("text-[10px] font-bold px-1.5 py-0 h-4", reportFilter === "rejected" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-800")}>
                      {proposalData.statistics.rejected}
                    </Badge>
                  </button>
                </div>
              </div>

              {filteredReports.length === 0 ? (
                <Card className="border border-dashed p-8 text-center">
                  <CardContent className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      No progress reports found matching status filter &ldquo;{reportFilter}&rdquo;.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                /* Single-Expand Accordion: collapsing other report rows when expanding a new one */
                <Accordion
                  type="single"
                  collapsible
                  defaultValue={filteredReports[0] ? String(filteredReports[0].id) : undefined}
                  className="space-y-4"
                >
                  {filteredReports.map((report, idx) => {
                    const submitter = report.submittedBy || report.submitted_by || proposalData.pi;
                    const submitterName =
                      submitter?.fullName ||
                      submitter?.full_name ||
                      submitter?.name ||
                      (typeof submitter === "string" ? submitter : "Investigator");
                    const reportSeqNum = chronologicalOrderMap.get(report.id) ?? (reports.length - idx);

                    return (
                      <AccordionItem
                        key={report.id}
                        value={String(report.id)}
                        className={cn(
                          "rounded-2xl border overflow-hidden bg-card transition-all",
                          report.status?.toLowerCase() === "pending"
                            ? "border-amber-300 dark:border-amber-800 shadow-xs"
                            : "border-border/80",
                        )}
                      >
                        {/* ENTIRE ROW IS A CLICKABLE ACCORDION TRIGGER */}
                        <AccordionTrigger className="w-full p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 border-b cursor-pointer transition-colors hover:no-underline text-left [&[data-state=open]>svg]:rotate-180">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] font-bold text-muted-foreground">
                                  Report #{reportSeqNum}
                                </span>
                                {reportSeqNum === reports.length && reports.length > 1 && (
                                  <Badge variant="outline" className="text-[9px] font-bold py-0 px-1.5 text-primary border-primary/30 bg-primary/5">
                                    Latest
                                  </Badge>
                                )}
                                {getStatusBadge(report.status)}
                              </div>
                              <h3 className="text-sm font-bold text-foreground truncate">
                                {report.reportName}
                              </h3>
                              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
                                <User className="h-3 w-3 text-primary shrink-0" />
                                <span>Submitted by <strong className="text-foreground">{submitterName}</strong></span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 ml-auto">
                            <div className="text-right">
                              <p className="text-[10px] font-bold uppercase text-muted-foreground">Amount Used</p>
                              <p className="text-xs font-bold font-mono text-primary">
                                {formatAmount(report.amountUsed)}
                              </p>
                            </div>

                            {/* Styled Action Control (div role=button prevents nested button HTML validation error) */}
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModal(report);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.stopPropagation();
                                  handleOpenModal(report);
                                }
                              }}
                              className="inline-flex items-center justify-center rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors cursor-pointer shrink-0"
                            >
                              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                              Evaluate
                            </div>
                          </div>
                        </AccordionTrigger>

                        <AccordionContent className="p-5 space-y-5">
                          {/* Submitter Info & Submission Timestamps */}
                          <div className="grid gap-4 sm:grid-cols-2 p-4 rounded-xl bg-muted/40 border">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                                <User className="h-3 w-3 text-primary" />
                                Report Submitter Info
                              </p>
                              <SubmitterAvatar user={submitter} fallback={proposalData.pi} />
                            </div>

                            <div className="space-y-2 text-xs">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4 text-primary shrink-0" />
                                <div>
                                  <span className="font-semibold text-foreground">Reporting Period: </span>
                                  <span>
                                    {formatDate(report.startDate)} – {formatDate(report.endDate)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4 text-primary shrink-0" />
                                <div>
                                  <span className="font-semibold text-foreground">Submitted Date & Time: </span>
                                  <span>{formatDateTime(report.submittedAt)}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Activities Achieved */}
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Main Activities & Achievements
                            </p>
                            <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/20 border p-4 rounded-xl whitespace-pre-line">
                              {report.mainActivitiesAchieved || "No activities description provided."}
                            </div>
                          </div>

                          {/* File Attachment & Document Preview */}
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Report Document Attachment
                            </p>
                            {report.attachment ? (
                              <div className="flex flex-wrap items-center justify-between p-3.5 rounded-xl border bg-card gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                    <Paperclip className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold truncate text-foreground">
                                      {report.attachment.split("/").pop()}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">Attached Document File</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {/* Document Viewer Preview Button */}
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handlePreviewDocument(report.attachment!, report.reportName)}
                                    className="text-xs h-8 shadow-2xs cursor-pointer"
                                  >
                                    <Eye className="mr-1.5 h-3.5 w-3.5 text-primary" />
                                    Preview Document
                                  </Button>

                                  {/* Direct Download Button */}
                                  <Button variant="outline" size="sm" asChild className="text-xs h-8 shadow-2xs">
                                    <a
                                      href={resolveFileUrl(report.attachment)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <Download className="mr-1.5 h-3.5 w-3.5 text-primary" />
                                      Download
                                    </a>
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="p-3.5 rounded-xl border border-dashed text-xs text-muted-foreground text-center">
                                No document file attached for this report.
                              </div>
                            )}
                          </div>

                          {/* Latest Approval Note */}
                          {report.latestApproval && (
                            <div className="p-4 rounded-xl bg-muted/50 border text-xs space-y-1.5">
                              <div className="flex items-center justify-between font-semibold">
                                <span className="flex items-center gap-1.5 text-foreground font-bold">
                                  <UserCheck className="h-4 w-4 text-primary" />
                                  Last Evaluated by {report.latestApproval.reviewerName || report.latestApproval.reviewer_name || "Staff Reviewer"}
                                </span>
                                {getStatusBadge(report.latestApproval.decision)}
                              </div>
                              {report.latestApproval.comment && (
                                <p className="text-slate-700 dark:text-slate-300 text-xs italic mt-1 bg-background/80 p-3 rounded-lg border">
                                  &ldquo;{report.latestApproval.comment}&rdquo;
                                </p>
                              )}
                              <p className="text-[10px] text-muted-foreground font-mono text-right pt-1">
                                Reviewed at {formatDateTime(report.latestApproval.reviewedAt || report.latestApproval.reviewed_at)}
                              </p>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </TabsContent>

            {/* ── Project Details Tab Content ─────────────────────────────────── */}
            <TabsContent value="overview" className="pt-4 space-y-6">
              <Card className="border border-muted-foreground/15 shadow-sm">
                <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-900/30">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FileText className="h-4.5 w-4.5 text-primary" />
                    Proposal & Project Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Proposal Title
                      </p>
                      <p className="text-sm font-semibold leading-snug text-foreground">
                        {proposalData.title}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Proposal Reference Number
                      </p>
                      <p className="text-sm font-semibold font-mono text-foreground">
                        {refNumber}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Project Tracking ID
                      </p>
                      <p className="text-sm font-semibold font-mono text-primary">
                        {trackingIdStr}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Overall Proposal Status
                      </p>
                      <div>{getStatusBadge(proposalData.status)}</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Principal Investigator
                    </p>
                    <SubmitterAvatar user={proposalData.pi} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Review History Tab Content ──────────────────────────────────── */}
            <TabsContent value="reviews" className="pt-4 space-y-4">
              <Card className="border border-muted-foreground/15 shadow-sm">
                <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-900/30">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <History className="h-4.5 w-4.5 text-primary" />
                    Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                  {reports.every((r) => !r.approvals || r.approvals.length === 0) ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      No review decisions logged yet.
                    </p>
                  ) : (
                    reports.flatMap((r) =>
                      (r.approvals || []).map((app) => ({
                        ...app,
                        reportName: r.reportName,
                      })),
                    ).map((log, idx) => (
                      <div
                        key={log.id || idx}
                        className="flex items-start gap-3 p-4 rounded-xl border bg-card text-xs"
                      >
                        <div className="mt-0.5">
                          {log.decision === "approved" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : log.decision === "rejected" ? (
                            <XCircle className="h-4 w-4 text-rose-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-foreground">
                              {log.reviewerName || log.reviewer_name || "Staff Reviewer"}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {formatDateTime(log.reviewedAt || log.reviewed_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-muted-foreground">
                              Decision for &ldquo;{log.reportName}&rdquo;:
                            </span>
                            {getStatusBadge(log.decision)}
                          </div>
                          {log.comment && (
                            <p className="text-slate-700 dark:text-slate-300 bg-slate-50/60 dark:bg-slate-900/30 p-3 rounded-xl text-[11px] mt-2 border">
                              {log.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Sidebar Column: Sticky Context & Action Panel ─────────────────────── */}
        <div className="space-y-4 sticky top-6">
          {/* Card 1: Report Evaluation Action */}
          <Card className="border border-border/80 shadow-2xs bg-card overflow-hidden">
            <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-900/30">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Report Evaluation
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Review submitted progress reports and submit committee decisions & feedback.
              </p>
              {reports.length > 0 ? (
                <Button
                  onClick={() => handleOpenModal(reports[0])}
                  className="w-full text-xs font-bold shadow-xs gap-1.5"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Evaluate Progress Report
                </Button>
              ) : (
                <Badge variant="outline" className="w-full justify-center py-2 text-xs">
                  No Reports Submitted
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Principal Investigator Card */}
          <Card className="border border-border/80 shadow-2xs bg-card">
            <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-900/30">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <User className="h-4 w-4 text-primary" />
                Principal Investigator
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <SubmitterAvatar user={proposalData.pi} />
            </CardContent>
          </Card>

          {/* Card 3: Total Funds Used Card */}
          <Card className="border border-border/80 shadow-2xs bg-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Total Expenditure
                </p>
                <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {formatAmount(totalAmountUsed)}
                </p>
                <p className="text-[11px] text-muted-foreground">Cumulated spend across reports</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
                <Wallet className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Reports Status Breakdown Card */}
          <Card className="border border-border/80 shadow-2xs bg-card">
            <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-900/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <FolderOpen className="h-4 w-4 text-primary" />
                  Reports Summary
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] font-bold">
                  {reports.length} Total
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
                <span className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                  <Clock className="h-3.5 w-3.5" />
                  Pending Review
                </span>
                <Badge className="bg-amber-500 text-white font-bold text-[10px]">
                  {proposalData.statistics.pending}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
                <span className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approved Reports
                </span>
                <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                  {proposalData.statistics.approved}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/40">
                <span className="flex items-center gap-1.5 font-bold text-rose-800 dark:text-rose-300">
                  <XCircle className="h-3.5 w-3.5" />
                  Rejected Reports
                </span>
                <Badge className="bg-rose-600 text-white font-bold text-[10px]">
                  {proposalData.statistics.rejected}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Card 5: Project Identifiers Card */}
          <Card className="border border-border/80 shadow-2xs bg-card">
            <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-900/30">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <FileCheck2 className="h-4 w-4 text-primary" />
                Proposal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Reference:</span>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/60 hover:bg-muted font-mono text-xs font-bold text-foreground border border-border/60 transition-all cursor-pointer"
                  title="Click to copy proposal reference number"
                >
                  <span>{refNumber}</span>
                  {copiedRef ? (
                    <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                  ) : (
                    <Copy className="h-3 w-3 text-muted-foreground shrink-0" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Tracking ID:</span>
                <button
                  type="button"
                  onClick={handleCopyPt}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/5 hover:bg-primary/10 font-mono text-xs font-bold text-primary border border-primary/20 transition-all cursor-pointer"
                  title="Click to copy tracking ID"
                >
                  <span>{trackingIdStr}</span>
                  {copiedPt ? (
                    <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                  ) : (
                    <Copy className="h-3 w-3 text-primary/60 shrink-0" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between pt-1 border-t">
                <span className="text-xs text-muted-foreground font-medium">Project Status:</span>
                <div>{getStatusBadge(proposalData.status)}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Evaluation Modal */}
      <EvaluationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        report={selectedReport}
        allReports={reports}
        onSuccess={() => refetch()}
      />

      {/* Document Viewer Modal */}
      <PdfViewerDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        pdfUrl={previewUrl}
        title={previewTitle}
      />

      {/* Grade & Evaluate Terminal Report Modal */}
      <GradeTerminalReportModal
        isOpen={gradeModalOpen}
        onClose={() => setGradeModalOpen(false)}
        terminalReport={{
          id: Number(targetId),
          report_name: proposalData?.title,
          project_tracking_title: proposalData?.title,
          submitted_by_name: typeof proposalData?.pi === "string" ? proposalData.pi : proposalData?.pi?.fullName,
          items: [],
        }}
      />
    </PageContainer>
  );
}
