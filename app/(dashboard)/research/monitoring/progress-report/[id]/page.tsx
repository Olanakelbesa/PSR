"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Paperclip,
  Send,
  Upload,
  Calendar,
  Wallet,
  Activity,
  Briefcase,
  User,
  Hash,
  AlertCircle,
  Clock,
  ShieldCheck,
  Building,
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
  useCreateTerminalReport,
  useProjectTrackingById,
  useProgressReports,
  useTerminalReportTypes,
} from "@/hooks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ReportStatus = "pending" | "approved" | "rejected";

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function statusConfig(status: string) {
  switch (status?.toLowerCase()) {
    case "approved":
    case "completed":
      return {
        label: "Approved",
        color:
          "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
        icon: CheckCircle2,
      };
    case "rejected":
    case "cancelled":
      return {
        label: "Rejected",
        color:
          "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800",
        icon: AlertCircle,
      };
    case "on_progress":
      return {
        label: "In Progress",
        color:
          "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
        icon: Activity,
      };
    default:
      return {
        label: status
          ? status.charAt(0).toUpperCase() + status.slice(1)
          : "Pending",
        color:
          "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
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
    refetch: refetchProject,
  } = useProjectTrackingById(projectTrackingId);
  const {
    data: progressReportsList,
    isLoading: isReportsLoading,
    refetch: refetchReports,
  } = useProgressReports({ project_tracking: projectTrackingId });
  const { data: terminalReportTypes = [] } = useTerminalReportTypes();

  const progressReports = progressReportsList?.data || [];

  // Calculate stats
  const totalAmountUsed = useMemo(() => {
    return progressReports.reduce(
      (acc, report) => acc + Number(report.amount_used || 0),
      0,
    );
  }, [progressReports]);

  const totalAward = Number(projectTracking?.totalAwardAmount || 0);
  const remainingAmount = Math.max(0, totalAward - totalAmountUsed);
  const progressPercentage =
    totalAward > 0
      ? Math.min(100, Math.round((totalAmountUsed / totalAward) * 100))
      : 0;

  const createProgressReport = useCreateProgressReport();
  const createTerminalReport = useCreateTerminalReport();

  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [isTerminalDialogOpen, setIsTerminalDialogOpen] = useState(false);

  const [progressReportName, setProgressReportName] = useState("");
  const [progressActivities, setProgressActivities] = useState("");
  const [progressAmountUsed, setProgressAmountUsed] = useState("");
  const [progressStartDate, setProgressStartDate] = useState("");
  const [progressEndDate, setProgressEndDate] = useState("");
  const [progressAttachment, setProgressAttachment] = useState<File | null>(
    null,
  );
  const [progressStatus, setProgressStatus] = useState<ReportStatus>("pending");

  const [terminalReportName, setTerminalReportName] = useState("");
  const [terminalDeliverables, setTerminalDeliverables] = useState("");
  const [terminalAttachment, setTerminalAttachment] = useState<File | null>(
    null,
  );
  const [terminalIsPublished, setTerminalIsPublished] = useState(false);
  const [terminalPublicationLink, setTerminalPublicationLink] = useState("");
  const [terminalStatus, setTerminalStatus] = useState<ReportStatus>("pending");
  const [terminalTypeIds, setTerminalTypeIds] = useState<number[]>([]);

  async function submitProgressReport() {
    if (!projectTracking) {
      toast.error("Project tracking details are still loading.");
      return;
    }
    if (!progressReportName || !progressActivities) {
      toast.error("Report name and activities are required.");
      return;
    }

    try {
      await createProgressReport.mutateAsync({
        project_tracking: projectTracking.id,
        report_name: progressReportName,
        main_activities_achieved: progressActivities,
        attachment: progressAttachment,
        amount_used: progressAmountUsed,
        start_date: progressStartDate,
        end_date: progressEndDate,
        status: progressStatus,
      });

      toast.success("Progress report submitted successfully.");
      setIsProgressDialogOpen(false);
      setProgressReportName("");
      setProgressActivities("");
      setProgressAmountUsed("");
      setProgressStartDate("");
      setProgressEndDate("");
      setProgressAttachment(null);
      setProgressStatus("pending");
      await refetchReports();
    } catch (error) {
      toast.error("Progress report submission failed.");
    }
  }

  async function submitTerminalReport() {
    if (!projectTracking) return;
    if (!terminalDeliverables.trim()) {
      toast.error("Main deliverables are required.");
      return;
    }

    if (terminalTypeIds.length === 0) {
      toast.error("Please select at least one terminal type.");
      return;
    }

    try {
      await createTerminalReport.mutateAsync({
        project_tracking: projectTracking.id,
        report_name: terminalReportName || undefined,
        main_deliverables: terminalDeliverables,
        attachment: terminalAttachment,
        is_published: terminalIsPublished,
        publication_link: terminalPublicationLink,
        status: terminalStatus,
        terminal_type: terminalTypeIds,
      });

      toast.success("Terminal report submitted successfully.");
      setIsTerminalDialogOpen(false);
      setTerminalReportName("");
      setTerminalDeliverables("");
      setTerminalAttachment(null);
      setTerminalIsPublished(false);
      setTerminalPublicationLink("");
      setTerminalStatus("pending");
      setTerminalTypeIds([]);
    } catch (error) {
      toast.error("Terminal report submission failed.");
    }
  }

  if (isProjectLoading) {
    return (
      <PageContainer title="Loading Workspace...">
        <div className="space-y-6">
          <Skeleton className="h-[120px] w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </PageContainer>
    );
  }

  if (!projectTracking) {
    return (
      <PageContainer title="Tracking Details Not Found">
        <div className="flex flex-col items-center justify-center space-y-4 rounded-xl border border-dashed p-12 text-center bg-card">
          <AlertCircle className="h-10 w-10 text-muted-foreground" />
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">
              Project Tracking Unavailable
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              The project tracking record could not be loaded. It might have
              been deleted or you lack permissions.
            </p>
          </div>
          <Button
            onClick={() => router.push("/research/monitoring/progress-report")}
            variant="outline"
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Directory
          </Button>
        </div>
      </PageContainer>
    );
  }

  const projStatus = statusConfig(projectTracking.status);

  return (
    <div className="space-y-6 p-6 pb-16 max-w-7xl mx-auto">
      {/* Page Header Area */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                router.push("/research/monitoring/progress-report")
              }
              className="-ml-2 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {projectTracking.proposalTitle || "Untitled Project"}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground pl-11">
            <div className="flex items-center gap-1.5 font-medium">
              <Hash className="h-3.5 w-3.5" />
              {projectTracking.referenceNumber || "No Reference"}
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {projectTracking.pi?.fullName || "Unassigned"}
            </div>
            <Separator orientation="vertical" className="h-4" />
            <Badge
              variant="outline"
              className={cn(
                "px-2 py-0.5 font-medium rounded-full",
                projStatus.color,
              )}
            >
              <projStatus.icon className="mr-1.5 h-3 w-3" />
              {projStatus.label}
            </Badge>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            onClick={() => setIsProgressDialogOpen(true)}
            className="shadow-sm"
          >
            <Upload className="mr-2 h-4 w-4" />
            Add Progress
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsTerminalDialogOpen(true)}
            className="shadow-sm"
          >
            <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
            Terminal Report
          </Button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-muted/60">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Award
              </p>
              <h3 className="text-2xl font-bold tracking-tight">
                ETB {totalAward.toLocaleString()}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-muted/60">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Amount Used
              </p>
              <h3 className="text-2xl font-bold tracking-tight">
                ETB {totalAmountUsed.toLocaleString()}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-muted/60">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Building className="h-5 w-5" />
            </div>
            <div className="w-full">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Remaining
                </p>
                <span className="text-xs font-semibold text-emerald-600">
                  {100 - progressPercentage}%
                </span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight">
                ETB {remainingAmount.toLocaleString()}
              </h3>
              <div className="mt-2 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-muted/60">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Reports Logged
              </p>
              <h3 className="text-2xl font-bold tracking-tight">
                {progressReports.length}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4 h-12 p-1 bg-muted/40 w-full sm:w-auto overflow-x-auto justify-start inline-flex">
          <TabsTrigger
            value="overview"
            className="h-10 px-5 rounded-md text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="progress-reports"
            className="h-10 px-5 rounded-md text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Progress Reports
            <Badge
              variant="secondary"
              className="ml-2 bg-muted-foreground/15 hover:bg-muted-foreground/15 rounded-full px-2 py-0 text-xs"
            >
              {progressReports.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="overview"
          className="mt-0 focus-visible:outline-none focus-visible:ring-0"
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <Card className="shadow-sm border-muted/60">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Project Specifications
                </CardTitle>
                <CardDescription>
                  General details and approval status for this project tracking
                  record.
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="p-0">
                <dl className="grid sm:grid-cols-2 text-sm">
                  <div className="p-5 border-b sm:border-r border-border/40">
                    <dt className="text-muted-foreground font-medium mb-1 flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5" /> Tracking ID
                    </dt>
                    <dd className="font-semibold text-foreground">
                      #{projectTracking.id}
                    </dd>
                  </div>
                  <div className="p-5 border-b border-border/40">
                    <dt className="text-muted-foreground font-medium mb-1 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" /> Proposal ID
                    </dt>
                    <dd className="font-semibold text-foreground">
                      {projectTracking.proposal?.proposalId || "Not Linked"}
                    </dd>
                  </div>
                  <div className="p-5 border-b sm:border-r border-border/40">
                    <dt className="text-muted-foreground font-medium mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" /> Ethical Clearance
                    </dt>
                    <dd className="font-semibold flex items-center gap-1.5">
                      {projectTracking.proposal?.hasEthicalClearanceApproval ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />{" "}
                          Approved
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-amber-500" />{" "}
                          Pending / Not Approved
                        </>
                      )}
                    </dd>
                  </div>
                  <div className="p-5 border-b border-border/40">
                    <dt className="text-muted-foreground font-medium mb-1 flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5" /> General Status
                    </dt>
                    <dd className="font-semibold text-foreground capitalize">
                      {projectTracking.generalStatus || "Pending"}
                    </dd>
                  </div>
                </dl>

                <div className="border-t p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">
                        Need to submit a report?
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Ensure you attach all necessary documents and itemized
                        expenditures.
                      </p>
                    </div>
                    <Button
                      className="shrink-0 shadow-sm"
                      onClick={() => setIsProgressDialogOpen(true)}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Submit Progress Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="shadow-sm border-muted/60">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Principal Investigator
                  </CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                  {projectTracking.pi ? (
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner">
                        {projectTracking.pi.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm leading-none">
                          {projectTracking.pi.fullName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {projectTracking.pi.email}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No PI assigned to this project.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="progress-reports"
          className="mt-0 focus-visible:outline-none focus-visible:ring-0"
        >
          <Card className="shadow-sm border-muted/60">
            <CardHeader className="border-b bg-muted/20 px-6 py-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Progress Timeline</CardTitle>
                <CardDescription>
                  All submitted reports for this project tracking.
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setIsProgressDialogOpen(true)}
                className="hidden sm:flex"
              >
                <Upload className="mr-2 h-4 w-4" />
                New Report
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {isReportsLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                      <div className="space-y-2 w-full">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : progressReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground/60" />
                  </div>
                  <h3 className="font-semibold text-lg">
                    No Progress Reports Yet
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-[300px] mt-1 mb-6">
                    There are no reports filed under this tracking ID. Start by
                    submitting the first progress update.
                  </p>
                  <Button onClick={() => setIsProgressDialogOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
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
                        <div className="flex flex-col items-center sm:w-16 shrink-0 pt-1">
                          <div
                            className={cn(
                              "h-10 w-10 rounded-full flex items-center justify-center shadow-sm",
                              rStatus.color
                                .replace("text-", "text-")
                                .split(" ")[0],
                            )}
                          >
                            <rStatus.icon className="h-5 w-5" />
                          </div>
                          {index !== progressReports.length - 1 && (
                            <div className="h-full w-px bg-border my-2 hidden sm:block" />
                          )}
                        </div>

                        <div className="flex-1 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                            <div>
                              <h4 className="text-base font-semibold leading-none">
                                {report.report_name ||
                                  `Progress Update #${report.id}`}
                              </h4>
                              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
                                <Calendar className="h-3.5 w-3.5" />
                                Submitted on {formatDate(report.submitted_at)}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                "px-2.5 py-0.5 whitespace-nowrap",
                                rStatus.color,
                              )}
                            >
                              {rStatus.label}
                            </Badge>
                          </div>

                          <div className="text-sm text-foreground/80 leading-relaxed bg-muted/30 p-4 rounded-lg border border-border/40">
                            <span className="font-medium text-foreground block mb-1 text-xs uppercase tracking-wider">
                              Main Activities
                            </span>
                            {report.main_activities_achieved ||
                              "No activities described."}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 pt-2">
                            <div className="flex items-center gap-1.5 text-sm font-medium bg-secondary/50 px-2.5 py-1 rounded-md">
                              <Wallet className="h-4 w-4 text-muted-foreground" />
                              ETB{" "}
                              {Number(report.amount_used || 0).toLocaleString()}{" "}
                              Used
                            </div>

                            {(report.start_date || report.end_date) && (
                              <div className="flex items-center gap-1.5 text-sm bg-secondary/50 px-2.5 py-1 rounded-md text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {formatDate(report.start_date)} -{" "}
                                {formatDate(report.end_date)}
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
                                  href={report.attachment}
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

      {/* Dialogs */}
      <Dialog
        open={isProgressDialogOpen}
        onOpenChange={setIsProgressDialogOpen}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
          <div className="px-6 py-4 border-b bg-muted/20">
            <DialogHeader>
              <DialogTitle className="text-xl">
                Submit Progress Report
              </DialogTitle>
              <DialogDescription>
                Fill out the form below to log a new milestone or activity for
                this project.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 py-6 space-y-6">
            <div className="grid gap-2">
              <Label
                htmlFor="progress-report-name"
                className="text-sm font-medium"
              >
                Report Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="progress-report-name"
                placeholder="e.g. Q1 Milestone Complete"
                value={progressReportName}
                onChange={(event) => setProgressReportName(event.target.value)}
                className="h-11"
              />
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="progress-activities"
                className="text-sm font-medium"
              >
                Main Activities Achieved{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="progress-activities"
                placeholder="Describe the tasks completed..."
                value={progressActivities}
                onChange={(event) => setProgressActivities(event.target.value)}
                className="min-h-[120px] resize-y"
              />
            </div>

            <div className=" gap-6 p-4 rounded-xl border bg-muted/10">
              <div className="grid gap-2">
                <Label htmlFor="progress-amount">Amount Used (ETB)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    ETB
                  </span>
                  <Input
                    id="progress-amount"
                    type="number"
                    min="0"
                    placeholder="0.00"
                    className="pl-10 h-10"
                    value={progressAmountUsed}
                    onChange={(event) =>
                      setProgressAmountUsed(event.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="progress-start-date">Start Date</Label>
                <Input
                  id="progress-start-date"
                  type="date"
                  className="h-10 text-muted-foreground"
                  value={progressStartDate}
                  onChange={(event) => setProgressStartDate(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="progress-end-date">End Date</Label>
                <Input
                  id="progress-end-date"
                  type="date"
                  className="h-10 text-muted-foreground"
                  value={progressEndDate}
                  onChange={(event) => setProgressEndDate(event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2 pt-2">
              <Label htmlFor="progress-attachment">Supporting Document</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="progress-attachment"
                  type="file"
                  className="file:bg-transparent file:text-foreground file:font-medium h-10 cursor-pointer"
                  onChange={(event) =>
                    setProgressAttachment(event.target.files?.[0] || null)
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Attach receipts, detailed logs, or PDF summaries.
              </p>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-muted/20">
            <Button
              variant="ghost"
              onClick={() => setIsProgressDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={submitProgressReport}
              disabled={createProgressReport.isPending}
              className="shadow-sm"
            >
              {createProgressReport.isPending
                ? "Submitting..."
                : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isTerminalDialogOpen}
        onOpenChange={setIsTerminalDialogOpen}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
          <div className="px-6 py-4 border-b bg-emerald-500/10 dark:bg-emerald-500/20">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" /> Submit Terminal Report
              </DialogTitle>
              <DialogDescription>
                Close out the project by declaring final deliverables and
                publications.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 py-6 space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="terminal-report-name">
                Terminal Report Title
              </Label>
              <Input
                id="terminal-report-name"
                placeholder="e.g. Final Project Handover"
                value={terminalReportName}
                onChange={(event) => setTerminalReportName(event.target.value)}
                className="h-11"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="terminal-main-deliverables">
                Main Deliverables <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="terminal-main-deliverables"
                placeholder="Summarize the final outcomes and products..."
                value={terminalDeliverables}
                onChange={(event) =>
                  setTerminalDeliverables(event.target.value)
                }
                className="min-h-[120px]"
              />
            </div>

            <div className="p-4 rounded-xl border bg-muted/10">
              <div className="grid gap-3">
                <Label htmlFor="terminal-type-select">
                  Terminal Type <span className="text-destructive">*</span>
                </Label>
                <select
                  id="terminal-type-select"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={terminalTypeIds[0]?.toString() ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setTerminalTypeIds(value ? [Number(value)] : []);
                  }}
                >
                  <option value="">Select a terminal type</option>
                  {terminalReportTypes.length > 0 ? (
                    terminalReportTypes.map((type) => (
                      <option key={type.id} value={String(type.id)}>
                        {type.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      Loading terminal types...
                    </option>
                  )}
                </select>
              </div>
            </div>

            <div className="grid gap-2 pt-2">
              <Label htmlFor="terminal-attachment">Final Document</Label>
              <Input
                id="terminal-attachment"
                type="file"
                className="h-10 cursor-pointer"
                onChange={(event) =>
                  setTerminalAttachment(event.target.files?.[0] || null)
                }
              />
            </div>

            <div className="rounded-xl border p-5 space-y-4 bg-muted/5">
              <div className="flex items-center space-x-3">
                <input
                  id="terminal-published"
                  type="checkbox"
                  checked={terminalIsPublished}
                  onChange={(event) =>
                    setTerminalIsPublished(event.target.checked)
                  }
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                />
                <Label
                  htmlFor="terminal-published"
                  className="text-sm font-medium cursor-pointer"
                >
                  Project resulted in a publication
                </Label>
              </div>

              {terminalIsPublished && (
                <div className="grid gap-2 pl-7 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Label
                    htmlFor="terminal-publication-link"
                    className="text-xs text-muted-foreground"
                  >
                    Publication Link
                  </Label>
                  <Input
                    id="terminal-publication-link"
                    value={terminalPublicationLink}
                    onChange={(event) =>
                      setTerminalPublicationLink(event.target.value)
                    }
                    placeholder="https://doi.org/..."
                    className="h-10"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-muted/20">
            <Button
              variant="ghost"
              onClick={() => setIsTerminalDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={submitTerminalReport}
              disabled={createTerminalReport.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              {createTerminalReport.isPending
                ? "Submitting..."
                : "Submit Terminal Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
