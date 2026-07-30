"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Award,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Eye,
  ExternalLink,
  FileCheck2,
  FileText,
  Filter,
  FolderOpen,
  History,
  Paperclip,
  PlusCircle,
  ShieldCheck,
  Upload,
  User,
  UserCheck,
  Wallet,
  XCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
import { StyledDatePicker } from "@/components/ui/date-picker";
import {
  useCreateProgressReport,
  useProjectTrackingById,
  useGroupedProgressReport,
} from "@/hooks";
import { cn } from "@/lib/utils";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";

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

function parseDateString(str?: string): Date | null {
  if (!str) return null;
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateToString(date: Date | null): string {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

export default function ProjectTrackingDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedPt, setCopiedPt] = useState(false);
  const [reportFilter, setReportFilter] = useState<string>("all");

  // Document Preview Viewer state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [previewTitle, setPreviewTitle] = useState<string>("");

  const projectTrackingId = useMemo(
    () => (typeof id === "string" ? id : Array.isArray(id) ? id[0] : undefined),
    [id],
  );

  // Grouped progress report query (matching backend format)
  const {
    data: proposalData,
    isLoading: isGroupedLoading,
    refetch: refetchGrouped,
  } = useGroupedProgressReport(projectTrackingId);

  // Supplemental project tracking query for total award amount
  const {
    data: projectTracking,
    isLoading: isProjectLoading,
  } = useProjectTrackingById(projectTrackingId);

  const reports = useMemo(() => proposalData?.reports || [], [proposalData]);

  // Financial metrics
  const totalAmountUsed = useMemo(() => {
    return reports.reduce(
      (acc, report) => acc + Number(report.amountUsed || report.amount_used || 0),
      0,
    );
  }, [reports]);

  const rawTotalAward =
    projectTracking?.totalAwardAmount ??
    projectTracking?.proposal?.totalAwardAmount;
  const totalAward = Number(rawTotalAward || 0);

  const budgetDifference = totalAward - totalAmountUsed;
  const isOverBudget = totalAward > 0 && totalAmountUsed > totalAward;
  const overBudgetAmount = Math.abs(budgetDifference);
  const remainingAmount = Math.max(0, budgetDifference);
  const rawPercentage = totalAward > 0 ? Math.round((totalAmountUsed / totalAward) * 100) : 0;

  // Filtered reports calculation
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (reportFilter === "all") return true;
      return (r.status || "pending").toLowerCase() === reportFilter;
    });
  }, [reports, reportFilter]);

  // Compute 1-based chronological report sequence numbers (1 = earliest/initial report, N = latest report)
  const chronologicalOrderMap = useMemo(() => {
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

  // Statistics breakdown from grouped data or fallback calculation
  const statistics = useMemo(() => {
    if (proposalData?.statistics) {
      return proposalData.statistics;
    }
    const pending = reports.filter((r) => (r.status || "pending").toLowerCase() === "pending").length;
    const approved = reports.filter((r) => (r.status || "").toLowerCase() === "approved").length;
    const rejected = reports.filter((r) => ["rejected", "terminated", "cancelled"].includes((r.status || "").toLowerCase())).length;
    return { totalReports: reports.length, pending, approved, rejected };
  }, [proposalData, reports]);

  const reviewsCount = useMemo(() => {
    return reports.reduce((acc, r) => acc + (r.approvals?.length || (r.latestApproval || r.latest_approval ? 1 : 0)), 0);
  }, [reports]);

  const createProgressReport = useCreateProgressReport();

  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [progressReportName, setProgressReportName] = useState("");
  const [progressActivities, setProgressActivities] = useState("");
  const [progressAmountUsed, setProgressAmountUsed] = useState("");
  const [progressStartDate, setProgressStartDate] = useState("");
  const [progressEndDate, setProgressEndDate] = useState("");
  const [progressAttachment, setProgressAttachment] = useState<File | null>(null);

  const referenceNumber =
    proposalData?.referenceNumber ||
    projectTracking?.referenceNumber ||
    projectTracking?.proposal?.referenceNumber ||
    (projectTrackingId ? `PT-${projectTrackingId}` : "—");
  const trackingIdStr = `#${proposalData?.projectTrackingId || projectTracking?.id || projectTrackingId}`;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(referenceNumber);
    setCopiedRef(true);
    toast.success("Reference number copied to clipboard!");
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleCopyPt = () => {
    navigator.clipboard.writeText(String(proposalData?.projectTrackingId || projectTracking?.id || projectTrackingId));
    setCopiedPt(true);
    toast.success("Tracking ID copied to clipboard!");
    setTimeout(() => setCopiedPt(false), 2000);
  };

  const handlePreviewDocument = (fileUrl: string, title?: string) => {
    if (!fileUrl) return;
    const resolved = resolveFileUrl(fileUrl);
    setPreviewUrl(resolved);
    setPreviewTitle(title || "Progress Report Document");
    setPreviewOpen(true);
  };

  async function submitProgressReport() {
    const targetPtId = proposalData?.projectTrackingId || projectTracking?.id || projectTrackingId;
    if (!targetPtId) {
      toast.error("Project tracking details are still loading.");
      return;
    }
    if (!progressReportName.trim() || !progressActivities.trim()) {
      toast.error("Report title and main activities are required.");
      return;
    }

    try {
      await createProgressReport.mutateAsync({
        project_tracking: Number(targetPtId),
        report_name: progressReportName.trim(),
        main_activities_achieved: progressActivities.trim(),
        attachment: progressAttachment,
        amount_used: progressAmountUsed,
        start_date: progressStartDate || undefined,
        end_date: progressEndDate || undefined,
        status: "pending",
      });

      toast.success("Progress report submitted successfully.");
      setIsProgressDialogOpen(false);
      setProgressReportName("");
      setProgressActivities("");
      setProgressAmountUsed("");
      setProgressStartDate("");
      setProgressEndDate("");
      setProgressAttachment(null);
      await refetchGrouped();
    } catch {
      toast.error("Failed to submit progress report.");
    }
  }

  const isLoading = isGroupedLoading && isProjectLoading;

  if (isLoading) {
    return (
      <PageContainer title="Loading Progress Report Workspace…">
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

  if (!proposalData && !projectTracking) {
    return (
      <PageContainer title="Progress Report Workspace">
        <div className="space-y-6 w-full">
          <Card className="border border-dashed p-12 text-center">
            <CardContent className="space-y-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">Project Tracking Not Found</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                No tracking record found for identifier #{projectTrackingId}.
              </p>
              <Button size="sm" variant="outline" onClick={() => router.push("/research/monitoring/progress-report")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Directory
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  const proposalObj = projectTracking?.proposal;
  const proposalTitle =
    proposalData?.title ||
    projectTracking?.proposalTitle ||
    proposalObj?.title ||
    "Untitled Proposal";
  const piInfo = proposalData?.pi || projectTracking?.pi || proposalObj?.pi;
  const hasEthicalClearance = proposalObj?.hasEthicalClearanceApproval ?? false;
  const projectStatus = proposalData?.status || projectTracking?.status || "on_progress";

  return (
    <PageContainer
      title={proposalTitle}
      description={
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          {/* Reference Copy Pill */}
          <button
            type="button"
            onClick={handleCopyRef}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted font-mono text-xs font-bold text-foreground border border-border/60 transition-all duration-200 group cursor-pointer shadow-2xs hover:border-primary/40 active:scale-95"
            title="Click to copy reference number"
          >
            <span className="text-[10px] uppercase text-muted-foreground font-sans">Ref:</span>
            <span>{referenceNumber}</span>
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

          {getStatusBadge(projectStatus)}

          <Badge variant="secondary" className="text-[10px] font-bold">
            {reports.length} Reports
          </Badge>

          {statistics.pending > 0 && (
            <Badge className="bg-amber-500 text-white font-bold text-[10px] animate-pulse">
              {statistics.pending} Pending Review
            </Badge>
          )}
        </div>
      }
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="shadow-xs text-xs">
            <Link href="/research/monitoring/progress-report">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Directory
            </Link>
          </Button>
          {proposalObj?.fundingRecommendationId && (
            <Button variant="outline" size="sm" asChild className="hidden md:flex shadow-xs text-xs">
              <Link href={`/research/funding-recommendations/${proposalObj.fundingRecommendationId}`}>
                <Award className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                Award Details
              </Link>
            </Button>
          )}
          {proposalObj?.proposalId && (
            <Button variant="outline" size="sm" asChild className="hidden sm:flex shadow-xs text-xs">
              <Link href={`/research/proposals/my-proposals/${proposalObj.proposalId}`}>
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                View Proposal
              </Link>
            </Button>
          )}
          <Button
            size="sm"
            className="shadow-xs text-xs"
            onClick={() => setIsProgressDialogOpen(true)}
          >
            <PlusCircle className="mr-1.5 h-4 w-4" />
            Submit Report
          </Button>
        </div>
      }
    >
      {/* ── Main Layout: 2-Column Workspace Grid ────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main Content Column */}
        <div className="space-y-6 min-w-0">
          {/* Overbudget Warning Banner */}
          {isOverBudget && (
            <Card className="border-l-4 border-l-rose-500 bg-rose-50 dark:bg-rose-950/20 shadow-xs">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs space-y-0.5">
                  <span className="font-bold text-sm block text-rose-900 dark:text-rose-200">
                    Budget Allocation Exceeded
                  </span>
                  <p className="text-rose-800 dark:text-rose-300">
                    Total progress expenditures (<span className="font-bold font-mono">{formatAmount(totalAmountUsed)}</span>) exceed the allocated award budget (<span className="font-bold font-mono">{formatAmount(totalAward)}</span>) by <span className="font-extrabold font-mono text-rose-700 dark:text-rose-300">{formatAmount(overBudgetAmount)}</span> ({rawPercentage - 100}% overrun).
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

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
                Review History
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
                      {statistics.pending}
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
                      {statistics.approved}
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
                      {statistics.rejected}
                    </Badge>
                  </button>
                </div>
              </div>

              {filteredReports.length === 0 ? (
                <Card className="border border-dashed p-8 text-center">
                  <CardContent className="space-y-3">
                    <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                    <p className="text-xs text-muted-foreground">
                      No progress reports found matching status filter &ldquo;{reportFilter}&rdquo;.
                    </p>
                    <Button size="sm" variant="outline" onClick={() => setIsProgressDialogOpen(true)}>
                      <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                      Submit New Report
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                /* Single-Expand Accordion */
                <Accordion
                  type="single"
                  collapsible
                  defaultValue={filteredReports[0] ? String(filteredReports[0].id) : undefined}
                  className="space-y-4"
                >
                  {filteredReports.map((report, idx) => {
                    const reportName = report.reportName || report.report_name || `Progress Report #${report.id}`;
                    const activities = report.mainActivitiesAchieved || report.main_activities_achieved || "No activities description provided.";
                    const amountUsed = report.amountUsed ?? report.amount_used;
                    const startDate = report.startDate || report.start_date;
                    const endDate = report.endDate || report.end_date;
                    const submittedAt = report.submittedAt || report.submitted_at;
                    const submitter = report.submittedBy || report.submitted_by || piInfo;
                    const submitterName =
                      submitter?.fullName ||
                      submitter?.full_name ||
                      submitter?.name ||
                      (typeof submitter === "string" ? submitter : "Investigator");
                    const latestApproval = report.latestApproval || report.latest_approval || (report.approvals && report.approvals[0]);
                    const reportSeqNum = chronologicalOrderMap.get(report.id) ?? (reports.length - idx);

                    return (
                      <AccordionItem
                        key={report.id}
                        value={String(report.id)}
                        className={cn(
                          "rounded-2xl border overflow-hidden bg-card transition-all",
                          (report.status || "pending").toLowerCase() === "pending"
                            ? "border-amber-300 dark:border-amber-800 shadow-xs"
                            : "border-border/80",
                        )}
                      >
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
                                {reportName}
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
                                {formatAmount(amountUsed)}
                              </p>
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
                              <SubmitterAvatar user={submitter} fallback={piInfo} />
                            </div>

                            <div className="space-y-2 text-xs">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4 text-primary shrink-0" />
                                <div>
                                  <span className="font-semibold text-foreground">Reporting Period: </span>
                                  <span>
                                    {formatDate(startDate)} – {formatDate(endDate)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4 text-primary shrink-0" />
                                <div>
                                  <span className="font-semibold text-foreground">Submitted Date & Time: </span>
                                  <span>{formatDateTime(submittedAt)}</span>
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
                              {activities}
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
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handlePreviewDocument(report.attachment!, reportName)}
                                    className="text-xs h-8 shadow-2xs cursor-pointer"
                                  >
                                    <Eye className="mr-1.5 h-3.5 w-3.5 text-primary" />
                                    Preview Document
                                  </Button>

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
                          {latestApproval && (
                            <div className="p-4 rounded-xl bg-muted/50 border text-xs space-y-1.5">
                              <div className="flex items-center justify-between font-semibold">
                                <span className="flex items-center gap-1.5 text-foreground font-bold">
                                  <UserCheck className="h-4 w-4 text-primary" />
                                  Committee Evaluation Decision
                                </span>
                                {getStatusBadge(latestApproval.decision)}
                              </div>
                              {latestApproval.comment && (
                                <p className="text-slate-700 dark:text-slate-300 text-xs italic mt-1 bg-background/80 p-3 rounded-lg border">
                                  &ldquo;{latestApproval.comment}&rdquo;
                                </p>
                              )}
                              <p className="text-[10px] text-muted-foreground font-mono text-right pt-1">
                                Reviewed at {formatDateTime(latestApproval.reviewedAt || latestApproval.reviewed_at)}
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
                        {proposalTitle}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Proposal Reference Number
                      </p>
                      <p className="text-sm font-semibold font-mono text-foreground">
                        {referenceNumber}
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
                        Overall Project Status
                      </p>
                      <div>{getStatusBadge(projectStatus)}</div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Ethical Clearance Status
                      </p>
                      <div>
                        {hasEthicalClearance ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold py-0.5">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> IRB Approved
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-bold py-0.5">
                            <AlertCircle className="mr-1 h-3 w-3" /> Pending / N/A
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Principal Investigator
                    </p>
                    <SubmitterAvatar user={piInfo} />
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
                    Review History & Committee Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                  {reports.every((r) => !r.approvals || r.approvals.length === 0) && !reports.some(r => r.latestApproval || r.latest_approval) ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      No review decisions logged yet.
                    </p>
                  ) : (
                    reports.flatMap((r) => {
                      const rName = r.reportName || r.report_name || `Progress Report #${r.id}`;
                      const apps = r.approvals || (r.latestApproval || r.latest_approval ? [r.latestApproval || r.latest_approval] : []);
                      return apps.map((app: any) => ({
                        ...app,
                        reportName: rName,
                      }));
                    }).map((log: any, idx: number) => (
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
                              Committee Evaluation
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

        {/* ── Sidebar Column: Sticky Context Cards ─────────────────────── */}
        <div className="space-y-4 sticky top-6">
          {/* Card 1: Submit Report Action */}
          <Card className="border border-border/80 shadow-2xs bg-card overflow-hidden">
            <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-900/30">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Upload className="h-4 w-4 text-primary" />
                Progress Report Submission
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Log project milestones, main activities achieved, and upload expenditure receipts.
              </p>
              <Button
                onClick={() => setIsProgressDialogOpen(true)}
                className="w-full text-xs font-bold shadow-xs gap-1.5"
              >
                <PlusCircle className="h-4 w-4" />
                Submit Progress Report
              </Button>
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
              <SubmitterAvatar user={piInfo} />
            </CardContent>
          </Card>

          {/* Card 3: Financial Summary & Award Budget Card */}
          <Card className="border border-border/80 shadow-2xs bg-card">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Award Budget
                  </p>
                  <p className="text-base font-bold font-mono text-foreground">
                    {formatAmount(totalAward)}
                  </p>
                </div>
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>

              <Separator />

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Amount Spent:</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {formatAmount(totalAmountUsed)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{isOverBudget ? "Overrun:" : "Remaining:"}</span>
                  <span className={cn("font-mono font-bold", isOverBudget ? "text-rose-600" : "text-emerald-600")}>
                    {isOverBudget ? `-${formatAmount(overBudgetAmount)}` : formatAmount(remainingAmount)}
                  </span>
                </div>

                {totalAward > 0 && (
                  <div className="pt-1">
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className={cn("h-full transition-all", isOverBudget ? "bg-rose-500" : "bg-emerald-500")}
                        style={{ width: `${Math.min(100, rawPercentage)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-right mt-1 font-mono">
                      {rawPercentage}% Budget Used
                    </p>
                  </div>
                )}
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
                  {statistics.pending}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
                <span className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approved Reports
                </span>
                <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                  {statistics.approved}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/40">
                <span className="flex items-center gap-1.5 font-bold text-rose-800 dark:text-rose-300">
                  <XCircle className="h-3.5 w-3.5" />
                  Rejected Reports
                </span>
                <Badge className="bg-rose-600 text-white font-bold text-[10px]">
                  {statistics.rejected}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Card 5: Project Identifiers Card */}
          <Card className="border border-border/80 shadow-2xs bg-card">
            <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-900/30">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <FileCheck2 className="h-4 w-4 text-primary" />
                Project Identifiers
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
                  <span>{referenceNumber}</span>
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
                <div>{getStatusBadge(projectStatus)}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submit Progress Report Dialog */}
      <Dialog
        open={isProgressDialogOpen}
        onOpenChange={setIsProgressDialogOpen}
      >
        <DialogContent className="sm:max-w-3xl lg:max-w-4xl max-h-[92vh] overflow-y-auto p-0 gap-0 border-border/80 shadow-2xl rounded-2xl">
          <DialogHeader className="p-5 border-b border-border/60 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0 text-primary">
                <Upload className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <DialogTitle className="text-lg font-bold text-foreground">
                  Submit Progress Report
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Log progress milestones, activities achieved, and budget used for this project.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-4">
            {/* Report Title */}
            <div className="space-y-2">
              <Label htmlFor="progress-report-name" className="text-xs font-semibold flex items-center gap-1">
                <span>Report Title</span>
                <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="progress-report-name"
                placeholder="e.g. Q1 Progress & Milestone Update"
                value={progressReportName}
                onChange={(event) => setProgressReportName(event.target.value)}
                className="h-10 text-sm rounded-xl border-border/80 focus:ring-primary/20"
              />
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
                    Quick template suggestions (click to apply & edit):
                  </span>
                  {progressReportName && (
                    <button
                      type="button"
                      onClick={() => setProgressReportName("")}
                      className="text-[10px] text-muted-foreground hover:text-rose-500 underline transition-colors"
                    >
                      Clear title
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "First Quarter (Q1) Progress & Financial Update",
                    "Mid-Term Progress & Milestone Report",
                    "Third Quarter (Q3) Activity & Expenditure Summary",
                    "Final Technical & Research Output Report",
                    "Annual Progress & Expenditure Summary",
                  ].map((template) => {
                    const isActive = progressReportName === template;
                    return (
                      <button
                        type="button"
                        key={template}
                        onClick={() => setProgressReportName(template)}
                        className={cn(
                          "text-[11px] px-2.5 py-1 rounded-lg border text-left transition-all cursor-pointer font-medium leading-tight",
                          isActive
                            ? "bg-primary/10 border-primary text-primary font-semibold shadow-2xs"
                            : "bg-muted/40 hover:bg-muted border-border/80 text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {template}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Main Activities */}
            <div className="space-y-1.5">
              <Label htmlFor="progress-activities" className="text-xs font-semibold flex items-center gap-1">
                <span>Main Activities Achieved</span>
                <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                id="progress-activities"
                placeholder="Describe key research tasks, milestones completed, data collected, or preliminary findings..."
                value={progressActivities}
                onChange={(event) => setProgressActivities(event.target.value)}
                className="min-h-[110px] text-sm resize-y rounded-xl border-border/80 focus:ring-primary/20 leading-relaxed"
              />
            </div>

            {/* Amount Used & Budget Indicator */}
            <div className="space-y-2 p-4 rounded-xl border border-border/70 bg-muted/20">
              <Label htmlFor="progress-amount" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Expenditure Amount (ETB)</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-mono font-bold">
                  ETB
                </span>
                <Input
                  id="progress-amount"
                  type="number"
                  min="0"
                  placeholder="0.00"
                  className="pl-14 h-10 text-sm font-mono rounded-xl border-border/80 focus:ring-primary/20 bg-background"
                  value={progressAmountUsed}
                  onChange={(event) => setProgressAmountUsed(event.target.value)}
                />
              </div>

              {(() => {
                const inputAmt = Number(progressAmountUsed || 0);
                if (inputAmt <= 0) return null;
                const projectedTotal = totalAmountUsed + inputAmt;
                const projectedOverrun = projectedTotal - totalAward;
                if (totalAward > 0 && projectedTotal > totalAward) {
                  return (
                    <div className="flex items-start gap-2.5 p-3 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/90 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 text-xs mt-2">
                      <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">
                        This report brings total expenditure to <strong className="font-mono font-bold">{formatAmount(projectedTotal)}</strong>, exceeding the award budget by <strong className="font-mono font-bold text-rose-700 dark:text-rose-300">{formatAmount(projectedOverrun)}</strong>.
                      </span>
                    </div>
                  );
                }
                return (
                  <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>
                      Projected total: <span className="font-mono font-bold text-foreground">{formatAmount(projectedTotal)}</span> (Remaining: <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">{formatAmount(Math.max(0, totalAward - projectedTotal))}</span>).
                    </span>
                  </p>
                );
              })()}
            </div>

            {/* Dates & Attachment Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Start Date</span>
                </Label>
                <StyledDatePicker
                  selected={parseDateString(progressStartDate)}
                  onChange={(date) => setProgressStartDate(formatDateToString(date))}
                  placeholder="Select start date..."
                  dateFormat="yyyy-MM-dd"
                  className="h-10 text-xs w-full rounded-xl border-border/80"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>End Date</span>
                </Label>
                <StyledDatePicker
                  selected={parseDateString(progressEndDate)}
                  onChange={(date) => setProgressEndDate(formatDateToString(date))}
                  placeholder="Select end date..."
                  dateFormat="yyyy-MM-dd"
                  className="h-10 text-xs w-full rounded-xl border-border/80"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="progress-attachment" className="text-xs font-semibold flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Supporting Attachment</span>
                </Label>
                <Input
                  id="progress-attachment"
                  type="file"
                  className="file:bg-primary/10 file:text-primary file:font-semibold file:border-0 file:rounded-lg file:px-2.5 file:py-0.5 file:mr-2 h-10 text-xs cursor-pointer rounded-xl border-border/80"
                  onChange={(event) =>
                    setProgressAttachment(event.target.files?.[0] || null)
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 px-6 border-t border-border/60 bg-muted/20 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsProgressDialogOpen(false)}
              className="rounded-xl h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={submitProgressReport}
              disabled={createProgressReport.isPending}
              className="shadow-xs font-bold rounded-xl h-9 gap-1.5"
            >
              <Upload className="h-3.5 w-3.5" />
              {createProgressReport.isPending ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Viewer Modal */}
      <PdfViewerDialog
        isOpen={previewOpen}
        onOpenChange={setPreviewOpen}
        url={previewUrl}
        title={previewTitle}
      />
    </PageContainer>
  );
}
