"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Paperclip,
  Upload,
  Calendar,
  Wallet,
  Activity,
  User,
  Hash,
  AlertCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Building2,
  Mail,
  PlusCircle,
  ExternalLink,
  PieChart,
  Layers,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

type ReportStatus = "pending" | "approved" | "rejected";

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function statusConfig(status: string) {
  switch (status?.toLowerCase()) {
    case "approved":
    case "completed":
      return {
        label: "Approved",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
        icon: CheckCircle2,
      };
    case "rejected":
    case "cancelled":
    case "terminated":
      return {
        label: "Terminated / Rejected",
        color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
        icon: AlertCircle,
      };
    case "on_progress":
    case "active":
      return {
        label: "On Progress",
        color: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
        icon: Activity,
      };
    default:
      return {
        label: status
          ? status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
          : "Pending",
        color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
        icon: Clock,
      };
  }
}

export default function ProjectTrackingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
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
      <PageContainer title="Loading Project Tracking Workspace...">
        <div className="space-y-6 max-w-7xl mx-auto">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
      </PageContainer>
    );
  }

  if (!projectTracking) {
    return (
      <PageContainer title="Tracking Record Not Found">
        <div className="flex flex-col items-center justify-center space-y-4 rounded-2xl border border-dashed p-12 text-center bg-card max-w-xl mx-auto my-12">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-full">
            <AlertCircle className="h-10 w-10" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg">Project Tracking Unavailable</h3>
            <p className="text-sm text-muted-foreground">
              The project tracking record could not be found or you do not have permission to view it.
            </p>
          </div>
          <Button
            onClick={() => router.push("/research/monitoring/progress-report")}
            variant="outline"
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Project Directory
          </Button>
        </div>
      </PageContainer>
    );
  }

  const projStatus = statusConfig(projectTracking.status);
  const generalStatusInfo = statusConfig(projectTracking.generalStatus || "pending");

  const proposalObj = projectTracking.proposal;
  const referenceNumber =
    projectTracking.referenceNumber ||
    proposalObj?.referenceNumber ||
    `#${projectTracking.id}`;
  const proposalTitle =
    projectTracking.proposalTitle ||
    proposalObj?.title ||
    "Untitled Proposal";
  const piInfo = projectTracking.pi || proposalObj?.pi;
  const hasEthicalClearance =
    proposalObj?.hasEthicalClearanceApproval ?? false;

  return (
    <PageContainer
      title={proposalTitle}
      description={`Project Tracking Workspace · Ref #${referenceNumber}`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/research/monitoring/progress-report")}
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Directory
          </Button>
          {proposalObj?.proposalId && (
            <Button variant="outline" size="sm" asChild className="hidden sm:flex">
              <Link href={`/research/proposals/my-proposals/${proposalObj.proposalId}`}>
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                View Proposal
              </Link>
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setIsProgressDialogOpen(true)}
            className="shadow-xs bg-primary hover:bg-primary/90"
          >
            <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
            Submit Report
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border bg-card shadow-xs">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <Badge variant="outline" className="font-mono text-xs bg-muted/50">
              <Hash className="mr-1 h-3 w-3 opacity-60" />
              {referenceNumber}
            </Badge>
            {piInfo && (
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span>PI: {piInfo.fullName}</span>
                {piInfo.email && (
                  <span className="text-muted-foreground font-normal">
                    ({piInfo.email})
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("px-2.5 py-0.5 font-medium", projStatus.color)}>
              <projStatus.icon className="mr-1.5 h-3 w-3" />
              Tracking: {projStatus.label}
            </Badge>
            <Badge variant="outline" className={cn("px-2.5 py-0.5 font-medium", generalStatusInfo.color)}>
              <Clock className="mr-1.5 h-3 w-3" />
              General: {generalStatusInfo.label}
            </Badge>
          </div>
        </div>

      {/* Overbudget Warning Banner */}
      {isOverBudget && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-rose-200 bg-rose-50/80 dark:bg-rose-950/40 dark:border-rose-900 text-rose-900 dark:text-rose-200 shadow-xs">
          <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs space-y-0.5">
            <span className="font-bold text-sm block text-rose-700 dark:text-rose-300">
              Budget Allocation Exceeded
            </span>
            <p>
              Total progress expenditures (<span className="font-bold font-mono">ETB {totalAmountUsed.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>) exceed the allocated award budget (<span className="font-bold font-mono">ETB {totalAward.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>) by <span className="font-extrabold font-mono text-rose-700 dark:text-rose-300">ETB {overBudgetAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span> ({rawPercentage - 100}% overrun).
            </p>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-xs border bg-card">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Award Amount
              </p>
              <h3 className="text-xl font-bold tracking-tight text-foreground mt-0.5">
                ETB {totalAward > 0 ? totalAward.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0.00"}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border bg-card">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Amount Used
              </p>
              <h3 className="text-xl font-bold tracking-tight text-foreground mt-0.5">
                ETB {totalAmountUsed.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className={cn("shadow-xs border bg-card", isOverBudget && "border-rose-200 bg-rose-50/20")}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className={cn("p-3 rounded-xl border", isOverBudget ? "bg-rose-100 text-rose-600 border-rose-200" : "bg-emerald-50 text-emerald-600 border-emerald-100")}>
              {isOverBudget ? <AlertTriangle className="h-5 w-5" /> : <PieChart className="h-5 w-5" />}
            </div>
            <div className="w-full">
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {isOverBudget ? "Budget Overrun" : "Remaining Balance"}
                </p>
                <span className={cn("text-xs font-bold", isOverBudget ? "text-rose-600" : "text-emerald-600")}>
                  {isOverBudget ? `${rawPercentage}% Used` : `${100 - progressPercentage}%`}
                </span>
              </div>
              <h3 className={cn("text-xl font-bold tracking-tight", isOverBudget ? "text-rose-700 dark:text-rose-400" : "text-foreground")}>
                {isOverBudget
                  ? `-ETB ${overBudgetAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                  : `ETB ${remainingAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
              </h3>
              <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", isOverBudget ? "bg-rose-500" : "bg-emerald-500")}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border bg-card">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Reports Logged
              </p>
              <h3 className="text-xl font-bold tracking-tight text-foreground mt-0.5">
                {progressReports.length} {progressReports.length === 1 ? "Report" : "Reports"}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4 h-11 p-1 bg-muted/40 w-full sm:w-auto overflow-x-auto justify-start inline-flex rounded-xl">
          <TabsTrigger
            value="overview"
            className="h-9 px-4 rounded-lg text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs"
          >
            Overview & Specifications
          </TabsTrigger>
          <TabsTrigger
            value="progress-reports"
            className="h-9 px-4 rounded-lg text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs"
          >
            Progress Reports
            <Badge
              variant="secondary"
              className="ml-2 bg-primary/10 text-primary hover:bg-primary/15 rounded-full px-2 py-0 text-[11px]"
            >
              {progressReports.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0 focus-visible:outline-none">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="shadow-xs border lg:col-span-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  Project Specifications
                </CardTitle>
                <CardDescription>
                  Operational tracking metrics and compliance approvals.
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="p-0">
                <dl className="grid sm:grid-cols-2 text-sm divide-y sm:divide-y-0 sm:divide-x border-b">
                  <div className="p-5 space-y-1">
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5 text-muted-foreground" /> Reference Number
                    </dt>
                    <dd className="font-semibold text-foreground font-mono text-sm">
                      {referenceNumber}
                    </dd>
                  </div>
                  <div className="p-5 space-y-1">
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      {hasEthicalClearance ? (
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                      )}
                      Ethical Clearance
                    </dt>
                    <dd className="font-semibold flex items-center gap-1.5 text-sm">
                      {hasEthicalClearance ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          <CheckCircle2 className="mr-1 h-3 w-3" /> IRB Approved
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          <AlertCircle className="mr-1 h-3 w-3" /> Not Required / Pending
                        </Badge>
                      )}
                    </dd>
                  </div>
                </dl>

                <div className="p-6 bg-muted/20">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold">Ready to log project progress?</h4>
                      <p className="text-xs text-muted-foreground">
                        File milestones, activities achieved, and attach supporting budget receipts.
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
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="shadow-xs border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Principal Investigator
                  </CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                  {piInfo ? (
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shadow-inner shrink-0">
                        {piInfo.fullName?.charAt(0).toUpperCase() || "P"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{piInfo.fullName}</p>
                        {piInfo.email && (
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3 shrink-0" />
                            {piInfo.email}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      No PI details available.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="progress-reports" className="mt-0 focus-visible:outline-none">
          <Card className="shadow-xs border">
            <CardHeader className="border-b bg-muted/20 px-6 py-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Progress Timeline & Reports</CardTitle>
                <CardDescription className="text-xs">
                  All progress report submissions logged under this project.
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setIsProgressDialogOpen(true)}
                className="gap-1.5"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                New Report
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {isReportsLoading ? (
                <div className="p-6 space-y-4">
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
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-14 w-14 bg-muted rounded-full flex items-center justify-center mb-3">
                    <FileText className="h-7 w-7 text-muted-foreground/60" />
                  </div>
                  <h3 className="font-semibold text-base">No Progress Reports Yet</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-5">
                    No progress reports have been filed under this tracking ID. Click below to file the first report.
                  </p>
                  <Button size="sm" onClick={() => setIsProgressDialogOpen(true)}>
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                    Submit First Report
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {progressReports.map((report, index) => {
                    const rStatus = statusConfig(report.status);
                    return (
                      <div
                        key={report.id}
                        className="p-6 hover:bg-muted/10 transition-colors flex flex-col sm:flex-row gap-5"
                      >
                        <div className="flex flex-col items-center sm:w-12 shrink-0 pt-1">
                          <div
                            className={cn(
                              "h-9 w-9 rounded-full flex items-center justify-center shadow-xs border",
                              rStatus.color,
                            )}
                          >
                            <rStatus.icon className="h-4 w-4" />
                          </div>
                          {index !== progressReports.length - 1 && (
                            <div className="h-full w-px bg-border/60 my-2 hidden sm:block" />
                          )}
                        </div>

                        <div className="flex-1 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                            <div>
                              <h4 className="text-base font-semibold">
                                {report.report_name || `Progress Report #${report.id}`}
                              </h4>
                              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                                <Calendar className="h-3.5 w-3.5" />
                                Submitted on {formatDate(report.submitted_at)}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn("px-2.5 py-0.5 whitespace-nowrap text-xs font-medium", rStatus.color)}
                            >
                              {rStatus.label}
                            </Badge>
                          </div>

                          <div className="text-xs text-foreground/80 leading-relaxed bg-muted/30 p-4 rounded-xl border border-border/40">
                            <span className="font-semibold text-foreground block mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                              Main Activities Achieved
                            </span>
                            {report.main_activities_achieved || "No activities described."}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                            <div className="flex items-center gap-1.5 font-medium bg-muted px-2.5 py-1 rounded-lg">
                              <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                              ETB {Number(report.amount_used || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} Used
                            </div>

                            {(report.start_date || report.end_date) && (
                              <div className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-lg text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                {formatDate(report.start_date)} - {formatDate(report.end_date)}
                              </div>
                            )}

                            {report.attachment && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs ml-auto"
                                asChild
                              >
                                <a
                                  href={resolveFileUrl(report.attachment) ?? "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <Paperclip className="mr-1.5 h-3.5 w-3.5" />
                                  Attachment
                                </a>
                              </Button>
                            )}
                          </div>
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
                        This report brings total expenditure to <strong className="font-mono">ETB {projectedTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>, exceeding the award budget by <strong className="font-mono text-rose-700">ETB {projectedOverrun.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>.
                      </span>
                    </div>
                  );
                }
                return (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Projected total after this report: <span className="font-mono font-medium">ETB {projectedTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span> (Remaining: <span className="font-mono font-medium">ETB {Math.max(0, totalAward - projectedTotal).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>).
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
    </div>
  </PageContainer>
  );
}
