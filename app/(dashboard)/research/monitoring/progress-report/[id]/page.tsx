"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Award,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  FolderOpen,
  Hash,
  Layers,
  Mail,
  Paperclip,
  PieChart,
  PlusCircle,
  ShieldAlert,
  ShieldCheck,
  Upload,
  User,
  Wallet,
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCreateProgressReport,
  useProjectTrackingById,
  useProgressReports,
} from "@/hooks";
import { cn } from "@/lib/utils";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { toast } from "sonner";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatCurrency(amount: number) {
  return `ETB ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusConfig(status: string) {
  switch (status?.toLowerCase()) {
    case "approved":
    case "completed":
      return {
        label: "Approved",
        color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
        icon: CheckCircle2,
      };
    case "rejected":
    case "cancelled":
    case "terminated":
      return {
        label: "Terminated / Rejected",
        color: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
        icon: AlertCircle,
      };
    case "on_progress":
    case "active":
      return {
        label: "On Progress",
        color: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200 dark:border-sky-800",
        icon: Activity,
      };
    default:
      return {
        label: status
          ? status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
          : "Pending",
        color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
        icon: Clock,
      };
  }
}

export default function ProjectTrackingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [copiedRef, setCopiedRef] = useState(false);

  const projectTrackingId = useMemo(
    () => (typeof id === "string" ? id : Array.isArray(id) ? id[0] : undefined),
    [id],
  );

  const {
    data: projectTracking,
    isLoading: isProjectLoading,
  } = useProjectTrackingById(projectTrackingId);

  const {
    data: progressReportsList,
    isLoading: isReportsLoading,
    refetch: refetchReports,
  } = useProgressReports({ project_tracking: projectTrackingId });

  const progressReports = progressReportsList?.data || [];

  // Calculate financial metrics
  const totalAmountUsed = useMemo(() => {
    return progressReports.reduce(
      (acc, report) => acc + Number(report.amount_used || 0),
      0,
    );
  }, [progressReports]);

  const rawTotalAward =
    projectTracking?.totalAwardAmount ??
    projectTracking?.proposal?.totalAwardAmount;
  const totalAward = Number(rawTotalAward || 0);

  const budgetDifference = totalAward - totalAmountUsed;
  const isOverBudget = totalAward > 0 && totalAmountUsed > totalAward;
  const overBudgetAmount = Math.abs(budgetDifference);

  const remainingAmount = Math.max(0, budgetDifference);
  const rawPercentage = totalAward > 0 ? Math.round((totalAmountUsed / totalAward) * 100) : 0;
  const progressPercentage = Math.min(100, rawPercentage);

  const createProgressReport = useCreateProgressReport();

  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [progressReportName, setProgressReportName] = useState("");
  const [progressActivities, setProgressActivities] = useState("");
  const [progressAmountUsed, setProgressAmountUsed] = useState("");
  const [progressStartDate, setProgressStartDate] = useState("");
  const [progressEndDate, setProgressEndDate] = useState("");
  const [progressAttachment, setProgressAttachment] = useState<File | null>(null);

  const referenceNumber =
    projectTracking?.referenceNumber ||
    projectTracking?.proposal?.referenceNumber ||
    (projectTracking?.id ? `PT-${projectTracking.id}` : "—");

  const handleCopyRef = () => {
    if (!referenceNumber || referenceNumber === "—") return;
    navigator.clipboard.writeText(referenceNumber);
    setCopiedRef(true);
    toast.success("Reference number copied to clipboard!");
    setTimeout(() => setCopiedRef(false), 2000);
  };

  async function submitProgressReport() {
    if (!projectTracking) {
      toast.error("Project tracking details are still loading.");
      return;
    }
    if (!progressReportName.trim() || !progressActivities.trim()) {
      toast.error("Report title and main activities are required.");
      return;
    }

    try {
      await createProgressReport.mutateAsync({
        project_tracking: projectTracking.id,
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
      await refetchReports();
    } catch (error) {
      toast.error("Failed to submit progress report.");
    }
  }

  if (isProjectLoading) {
    return (
      <PageContainer title="Loading Project Tracking...">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!projectTracking) {
    return (
      <PageContainer
        title="Tracking Record Not Found"
        description="The requested project tracking workspace could not be loaded."
        actions={
          <Button
            variant="outline"
            onClick={() => router.push("/research/monitoring/progress-report")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Directory
          </Button>
        }
      >
        <Card className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <h3 className="font-bold text-amber-900 dark:text-amber-200">
                Project Tracking Unavailable
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                The project tracking record could not be found or you do not have permission to view it.
              </p>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const projStatus = statusConfig(projectTracking.status);
  const generalStatusInfo = statusConfig(projectTracking.generalStatus || "pending");
  const StatusIcon = projStatus.icon;

  const proposalObj = projectTracking.proposal;
  const proposalTitle =
    projectTracking.proposalTitle ||
    proposalObj?.title ||
    "Untitled Proposal";
  const piInfo = projectTracking.pi || proposalObj?.pi;
  const hasEthicalClearance =
    proposalObj?.hasEthicalClearanceApproval ?? false;

  const rawPhoto = piInfo ? (piInfo.photoUrl || piInfo.photo_url || piInfo.photo) : null;
  const avatarUrl = resolveFileUrl(rawPhoto) || undefined;
  const piName = piInfo?.fullName || piInfo?.full_name || piInfo?.email || "Principal Investigator";
  const piInitials = piName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "PI";

  return (
    <PageContainer
      title={proposalTitle}
      description={
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="text-xs font-semibold text-muted-foreground">Reference:</span>
          <button
            type="button"
            onClick={handleCopyRef}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted font-mono text-xs font-bold text-foreground border border-border/60 transition-all duration-200 group cursor-pointer shadow-2xs hover:border-primary/40 active:scale-95"
            title="Click to copy reference number"
          >
            <span>{referenceNumber}</span>
            {copiedRef ? (
              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
            )}
          </button>
          <Badge className={cn("text-[10px] font-bold uppercase gap-1 shadow-none border ml-1", projStatus.color)}>
            <StatusIcon className="h-3 w-3" />
            {projStatus.label}
          </Badge>
          <span className="text-xs text-muted-foreground font-medium ml-1">
            · Tracking ID: #{projectTracking.id}
          </span>
        </div>
      }
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="shadow-xs">
            <Link href="/research/monitoring/progress-report">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Directory
            </Link>
          </Button>
          {proposalObj?.fundingRecommendationId && (
            <Button variant="outline" size="sm" asChild className="hidden md:flex shadow-xs">
              <Link href={`/research/funding-recommendations/${proposalObj.fundingRecommendationId}`}>
                <Award className="mr-2 h-4 w-4 text-emerald-600" />
                Award Details
              </Link>
            </Button>
          )}
          {proposalObj?.proposalId && (
            <Button variant="outline" size="sm" asChild className="hidden sm:flex shadow-xs">
              <Link href={`/research/proposals/my-proposals/${proposalObj.proposalId}`}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View Proposal
              </Link>
            </Button>
          )}
          <Button
            size="sm"
            className="shadow-xs"
            onClick={() => setIsProgressDialogOpen(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Submit Report
          </Button>
        </div>
      }
    >
      {/* ── Main Layout: Exact Mirror of IRB Submissions Detail View ──────────────── */}
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
                    Total progress expenditures (<span className="font-bold font-mono">{formatCurrency(totalAmountUsed)}</span>) exceed the allocated award budget (<span className="font-bold font-mono">{formatCurrency(totalAward)}</span>) by <span className="font-extrabold font-mono text-rose-700 dark:text-rose-300">{formatCurrency(overBudgetAmount)}</span> ({rawPercentage - 100}% overrun).
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* KPI Stats Bar */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border border-muted-foreground/15 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3.5">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shrink-0 dark:bg-blue-950/40 dark:border-blue-900">
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Award Budget
                  </p>
                  <p className="text-base font-extrabold tracking-tight text-foreground truncate mt-0.5">
                    {formatCurrency(totalAward)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-muted-foreground/15 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3.5">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shrink-0 dark:bg-amber-950/40 dark:border-amber-900">
                  <Activity className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Amount Used
                  </p>
                  <p className="text-base font-extrabold tracking-tight text-foreground truncate mt-0.5">
                    {formatCurrency(totalAmountUsed)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className={cn("border border-muted-foreground/15 shadow-sm", isOverBudget && "border-rose-200 bg-rose-50/20")}>
              <CardContent className="p-4 flex items-center gap-3.5">
                <div className={cn("p-2.5 rounded-xl border shrink-0", isOverBudget ? "bg-rose-100 text-rose-600 border-rose-200" : "bg-emerald-50 text-emerald-600 border-emerald-100")}>
                  {isOverBudget ? <AlertTriangle className="h-5 w-5" /> : <PieChart className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                      {isOverBudget ? "Overrun" : "Remaining"}
                    </p>
                    <span className={cn("text-[10px] font-bold", isOverBudget ? "text-rose-600" : "text-emerald-600")}>
                      {isOverBudget ? `${rawPercentage}%` : `${100 - progressPercentage}%`}
                    </span>
                  </div>
                  <p className={cn("text-base font-extrabold tracking-tight truncate mt-0.5", isOverBudget ? "text-rose-700 dark:text-rose-400" : "text-foreground")}>
                    {isOverBudget
                      ? `-${formatCurrency(overBudgetAmount)}`
                      : formatCurrency(remainingAmount)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-muted-foreground/15 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3.5">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shrink-0 dark:bg-indigo-950/40 dark:border-indigo-900">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Reports Filed
                  </p>
                  <p className="text-base font-extrabold tracking-tight text-foreground truncate mt-0.5">
                    {progressReports.length} {progressReports.length === 1 ? "Report" : "Reports"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Standard Tabs Navigation */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full flex flex-wrap sm:flex-nowrap justify-start h-auto sm:h-11 bg-muted/60 p-1 border border-border/50 rounded-xl gap-1 overflow-x-auto">
              <TabsTrigger value="overview" className="gap-2 text-xs font-semibold px-3 sm:px-4 py-2 sm:py-0 rounded-lg shrink-0">
                <Layers className="h-3.5 w-3.5" />
                Overview & Details
              </TabsTrigger>
              <TabsTrigger value="progress-reports" className="gap-2 text-xs font-semibold px-3 sm:px-4 py-2 sm:py-0 rounded-lg shrink-0">
                <FolderOpen className="h-3.5 w-3.5" />
                Progress Reports Timeline
                {progressReports.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[9px] px-1.5 py-0 font-bold">
                    {progressReports.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ── Overview Tab Content ────────────────────────────────────────── */}
            <TabsContent value="overview" className="pt-5 space-y-6">
              {/* Proposal Information Card */}
              <Card className="border border-muted-foreground/15 shadow-sm">
                <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-900/30">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FileText className="h-4.5 w-4.5 text-primary" />
                    Proposal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Proposal Title
                      </p>
                      <p className="text-sm font-semibold leading-snug">
                        {proposalTitle}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Reference Number
                      </p>
                      <p className="text-sm font-semibold font-mono text-primary">
                        {referenceNumber}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Principal Investigator
                      </p>
                      <p className="text-sm font-semibold">
                        {piName}
                      </p>
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

                  <div className="p-4 bg-slate-50/50 dark:bg-slate-900/20 rounded-xl border border-border/50 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-foreground">File a Progress Report</h4>
                      <p className="text-xs text-muted-foreground">
                        Log milestones, activities achieved, and attach budget receipts for review.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="shrink-0 shadow-xs"
                      onClick={() => setIsProgressDialogOpen(true)}
                    >
                      <Upload className="mr-1.5 h-3.5 w-3.5" />
                      Submit Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Progress Reports Tab Content ────────────────────────────────── */}
            <TabsContent value="progress-reports" className="pt-5 space-y-6">
              <Card className="border border-muted-foreground/15 shadow-sm">
                <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-900/30 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <FolderOpen className="h-4.5 w-4.5 text-primary" />
                      Progress Reports Timeline
                    </CardTitle>
                    <CardDescription className="text-xs">
                      All progress report submissions logged under this project.
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setIsProgressDialogOpen(true)}
                    className="gap-1.5 shadow-xs"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    New Report
                  </Button>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                  {isReportsLoading ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="flex gap-4">
                          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                          <div className="space-y-2 w-full">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-3 w-2/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : progressReports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                      <FileText className="h-10 w-10 text-muted-foreground/30" />
                      <p className="font-bold text-muted-foreground text-sm">No Progress Reports Filed Yet</p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        No progress reports have been filed under this tracking record. Click below to submit your first update.
                      </p>
                      <Button size="sm" onClick={() => setIsProgressDialogOpen(true)} className="mt-2">
                        <Upload className="mr-1.5 h-3.5 w-3.5" />
                        Submit First Report
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {progressReports.map((report, index) => {
                        const rStatus = statusConfig(report.status);
                        const ReportIcon = rStatus.icon;
                        return (
                          <div
                            key={report.id}
                            className="rounded-xl border border-border/60 bg-slate-50/50 dark:bg-slate-900/20 p-4 space-y-3"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center border shrink-0",
                                    rStatus.color,
                                  )}
                                >
                                  <ReportIcon className="h-4 w-4" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                    {report.report_name || `Progress Report #${report.id}`}
                                  </h4>
                                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>Submitted on: {formatDate(report.submitted_at)}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Badge
                                  className={cn("border px-2.5 py-0.5 text-[10px] font-bold uppercase shadow-none", rStatus.color)}
                                >
                                  {rStatus.label}
                                </Badge>
                              </div>
                            </div>

                            <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 bg-background border p-3.5 rounded-lg space-y-1">
                              <span className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground block">
                                Main Activities Achieved
                              </span>
                              <p className="whitespace-pre-line text-xs font-normal">
                                {report.main_activities_achieved || "No activities described."}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                              <div className="flex items-center gap-1.5 font-bold bg-background border px-3 py-1 rounded-lg text-foreground">
                                <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                                {formatCurrency(Number(report.amount_used || 0))} Used
                              </div>

                              {(report.start_date || report.end_date) && (
                                <div className="flex items-center gap-1.5 bg-muted/60 px-3 py-1 rounded-lg text-muted-foreground font-medium">
                                  <Clock className="h-3.5 w-3.5" />
                                  {formatDate(report.start_date)} - {formatDate(report.end_date)}
                                </div>
                              )}

                              {report.attachment && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs font-semibold ml-auto"
                                  asChild
                                >
                                  <a
                                    href={resolveFileUrl(report.attachment) ?? "#"}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <Paperclip className="mr-1.5 h-3.5 w-3.5 text-primary" />
                                    View Attachment
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Sidebar Column: Exact Mirror of IRB Submissions Detail View ──────────────── */}
        <aside className="space-y-6">
          {/* Tracking Status Card */}
          <Card className="border border-muted-foreground/15 shadow-sm">
            <CardHeader className="border-b bg-slate-50/80 dark:bg-slate-900/40 py-3.5">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Tracking Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b">
                <span className="text-muted-foreground font-medium">Tracking Status</span>
                <Badge className={cn("text-[10px] font-bold uppercase gap-1 shadow-none border", projStatus.color)}>
                  <StatusIcon className="h-3 w-3" />
                  {projStatus.label}
                </Badge>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b">
                <span className="text-muted-foreground font-medium">General Status</span>
                <Badge className={cn("text-[10px] font-bold uppercase gap-1 shadow-none border", generalStatusInfo.color)}>
                  <Clock className="h-3 w-3" />
                  {generalStatusInfo.label}
                </Badge>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b">
                <span className="text-muted-foreground font-medium">Tracking ID</span>
                <span className="font-mono font-bold text-foreground text-xs">
                  #{projectTracking.id}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5">
                <span className="text-muted-foreground font-medium">Ethics Clearance</span>
                <Badge
                  className={cn(
                    "border shadow-none text-[10px] font-bold uppercase",
                    hasEthicalClearance
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-400",
                  )}
                >
                  {hasEthicalClearance ? (
                    <>
                      <ShieldCheck className="mr-1 h-3 w-3 text-emerald-600" />
                      Approved
                    </>
                  ) : (
                    "Pending / N/A"
                  )}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Principal Investigator Card */}
          <Card className="border border-muted-foreground/15 shadow-sm">
            <CardHeader className="border-b bg-slate-50/80 dark:bg-slate-900/40 py-3.5">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Principal Investigator
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex gap-3 items-center">
                <Avatar className="h-10 w-10 border shrink-0">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={piName} />}
                  <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                    {piInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-foreground truncate">
                    {piName}
                  </p>
                  {piInfo?.email && (
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{piInfo.email}</span>
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Submit Progress Report Dialog */}
      <Dialog
        open={isProgressDialogOpen}
        onOpenChange={setIsProgressDialogOpen}
      >
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Submit Progress Report
            </DialogTitle>
            <DialogDescription className="text-xs">
              Log progress milestones, activities achieved, and budget used for this project.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="progress-report-name" className="text-xs font-semibold">
                Report Title <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="progress-report-name"
                placeholder="e.g. Q1 Progress & Milestone Update"
                value={progressReportName}
                onChange={(event) => setProgressReportName(event.target.value)}
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="progress-activities" className="text-xs font-semibold">
                Main Activities Achieved <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                id="progress-activities"
                placeholder="Describe key research tasks completed..."
                value={progressActivities}
                onChange={(event) => setProgressActivities(event.target.value)}
                className="min-h-[100px] text-sm resize-y"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="progress-amount" className="text-xs font-semibold">
                Amount Used (ETB)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-mono">
                  ETB
                </span>
                <Input
                  id="progress-amount"
                  type="number"
                  min="0"
                  placeholder="0.00"
                  className="pl-12 h-10 text-sm font-mono"
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
                    <div className="flex items-center gap-2 p-2.5 rounded-lg border border-amber-200 bg-amber-50/90 text-amber-900 text-xs mt-1.5">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>
                        This report brings total expenditure to <strong className="font-mono">{formatCurrency(projectedTotal)}</strong>, exceeding the award budget by <strong className="font-mono text-rose-700">{formatCurrency(projectedOverrun)}</strong>.
                      </span>
                    </div>
                  );
                }
                return (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Projected total after this report: <span className="font-mono font-medium">{formatCurrency(projectedTotal)}</span> (Remaining: <span className="font-mono font-medium">{formatCurrency(Math.max(0, totalAward - projectedTotal))}</span>).
                  </p>
                );
              })()}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="progress-start-date" className="text-xs font-semibold">
                  Start Date
                </Label>
                <Input
                  id="progress-start-date"
                  type="date"
                  className="h-10 text-xs"
                  value={progressStartDate}
                  onChange={(event) => setProgressStartDate(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="progress-end-date" className="text-xs font-semibold">
                  End Date
                </Label>
                <Input
                  id="progress-end-date"
                  type="date"
                  className="h-10 text-xs"
                  value={progressEndDate}
                  onChange={(event) => setProgressEndDate(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="progress-attachment" className="text-xs font-semibold">
                Supporting Attachment
              </Label>
              <Input
                id="progress-attachment"
                type="file"
                className="file:bg-transparent file:text-foreground file:font-medium h-10 text-xs cursor-pointer"
                onChange={(event) =>
                  setProgressAttachment(event.target.files?.[0] || null)
                }
              />
              <p className="text-[11px] text-muted-foreground">
                Upload receipts, progress summaries, or PDF reports.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsProgressDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={submitProgressReport}
              disabled={createProgressReport.isPending}
              className="shadow-xs"
            >
              {createProgressReport.isPending ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
