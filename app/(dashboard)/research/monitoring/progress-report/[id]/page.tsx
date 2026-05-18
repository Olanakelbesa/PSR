"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Plus,
  Upload,
  BarChart3,
  Users,
  Wallet,
  TrendingUp,
  Search,
  Download,
  ChevronRight,
  ShieldCheck,
  Target,
  MoreHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer } from "@/components/layout";
import { monitoringApi } from "@/api/client";
import type { ResearchProject, Milestone, ProgressReport } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; icon: any }
> = {
  active: {
    label: "Active",
    color: "text-white",
    bg: "bg-primary",
    icon: Activity,
  },
  on_track: {
    label: "On Track",
    color: "text-emerald-600",
    bg: "bg-emerald-600",
    icon: CheckCircle2,
  },
  at_risk: {
    label: "At Risk",
    color: "text-amber-600",
    bg: "bg-amber-600",
    icon: Clock,
  },
  delayed: {
    label: "Delayed",
    color: "text-rose-600",
    bg: "bg-rose-600",
    icon: AlertCircle,
  },
  completed: {
    label: "Completed",
    color: "text-indigo-600",
    bg: "bg-indigo-600",
    icon: Target,
  },
};

export default function MonitoringProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<ResearchProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Progress Report Modal Form State
  const [isProgressReportModalOpen, setIsProgressReportModalOpen] =
    useState(false);
  const [reportName, setReportName] = useState("");
  const [mainActivitiesAchieved, setMainActivitiesAchieved] = useState("");
  const [amountUsed, setAmountUsed] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [progressReportAttachment, setProgressReportAttachment] =
    useState<File | null>(null);
  const [
    isProgressReportAttachmentDragging,
    setIsProgressReportAttachmentDragging,
  ] = useState(false);
  const [isSubmittingProgressReport, setIsSubmittingProgressReport] =
    useState(false);

  // Final Report Modal Form State
  const [isFinalReportModalOpen, setIsFinalReportModalOpen] = useState(false);
  const [finalReportName, setFinalReportName] = useState("Final Terminal Report");
  const [selectedTerminalTypes, setSelectedTerminalTypes] = useState<string[]>([]);
  const [mainDeliverables, setMainDeliverables] = useState("");
  const [finalReportAttachment, setFinalReportAttachment] = useState<File | null>(null);
  const [isFinalReportAttachmentDragging, setIsFinalReportAttachmentDragging] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [publicationLink, setPublicationLink] = useState("");
  const [isSubmittingFinalReport, setIsSubmittingFinalReport] = useState(false);

  async function handleSubmitFinalReport() {
    if (!finalReportName || !mainDeliverables) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (isPublished && !publicationLink) {
      toast.error("Please provide the publication link since the report is marked as published.");
      return;
    }

    setIsSubmittingFinalReport(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Final Terminal Report submitted successfully.");
      
      // Update local state if needed (e.g. mark project status as completed)
      if (project) {
        setProject({
          ...project,
          status: "completed",
        });
      }
      
      // Reset form
      setFinalReportName("Final Terminal Report");
      setSelectedTerminalTypes([]);
      setMainDeliverables("");
      setFinalReportAttachment(null);
      setIsPublished(false);
      setPublicationLink("");
      setIsFinalReportModalOpen(false);
    } catch (error) {
      toast.error("Failed to submit final terminal report.");
    } finally {
      setIsSubmittingFinalReport(false);
    }
  }

  async function handleSubmitProgressReport() {
    if (
      !reportName ||
      !mainActivitiesAchieved ||
      !amountUsed ||
      !startDate ||
      !endDate
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmittingProgressReport(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Progress report submitted successfully.");

      if (project) {
        const newReport: ProgressReport = {
          id: `r-${Date.now()}`,
          projectId: project.id,
          reportingPeriod: reportName,
          activitiesCompleted: mainActivitiesAchieved,
          challenges: "",
          nextSteps: "",
          budgetSpent: parseFloat(amountUsed) || 0,
          attachments: progressReportAttachment
            ? [
                {
                  id: `att-${Date.now()}`,
                  name: progressReportAttachment.name,
                  type: progressReportAttachment.type,
                  size: progressReportAttachment.size,
                  url: "#",
                  uploadedAt: new Date().toISOString(),
                },
              ]
            : [],
          status: "submitted",
          submittedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        setProject({
          ...project,
          progressReports: [newReport, ...project.progressReports],
        });
      }

      // Reset form
      setReportName("");
      setMainActivitiesAchieved("");
      setAmountUsed("");
      setStartDate("");
      setEndDate("");
      setProgressReportAttachment(null);
      setIsProgressReportModalOpen(false);
    } catch (error) {
      toast.error("Failed to submit progress report.");
    } finally {
      setIsSubmittingProgressReport(false);
    }
  }

  useEffect(() => {
    async function loadProject() {
      setIsLoading(true);
      try {
        const response = await monitoringApi.getProjectById(id as string);
        if (response.success && response.data) {
          setProject(response.data);
        } else {
          setProject(MOCK_PROJECT as any);
        }
      } catch (error) {
        console.error("Error loading project:", error);
        setProject(MOCK_PROJECT as any);
      } finally {
        setIsLoading(false);
      }
    }
    loadProject();
  }, [id]);

  if (isLoading) {
    return (
      <PageContainer title="Loading...">
        <div className="h-96 flex flex-col items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading execution details...
          </p>
        </div>
      </PageContainer>
    );
  }

  if (!project)
    return <PageContainer title="Project Not Found">Not Found</PageContainer>;

  const status = statusConfig[project.status] || statusConfig.active;
  const budget = project.budgetUtilization;
  const budgetSpentPercent = budget
    ? Math.round((budget.spent / budget.allocated) * 100)
    : 0;

  const completedMilestones =
    project.milestones?.filter((m) => m.status === "completed").length || 0;
  const totalMilestones = project.milestones?.length || 0;
  const progressPercent =
    totalMilestones > 0
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : 0;

  return (
    <PageContainer
      title={project.proposal.title}
      description={`Project Portfolio Tracking — Contract: ${project.contractNumber}`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/research/monitoring/progress-report")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 shadow-lg">
                Manage Project
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 shadow-xl border-primary/10"
            >
              <DropdownMenuItem
                className="cursor-pointer font-medium"
                onClick={() => setIsProgressReportModalOpen(true)}
              >
                <Upload className="h-4 w-4 mr-2 text-muted-foreground" />
                Submit Progress Report
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-primary font-bold"
                onClick={() => setIsFinalReportModalOpen(true)}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Submit Final Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Progress Overview Card */}
          <Card className="shadow-sm border-none overflow-hidden bg-white">
            <div className="bg-primary/5 p-8 flex items-center gap-12">
              <div className="space-y-3 flex-1">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">
                  <span>Cumulative Execution Progress</span>
                  <span className="text-primary text-sm">
                    {progressPercent}%
                  </span>
                </div>
                <Progress
                  value={progressPercent}
                  className="h-2.5 bg-primary/10"
                />
                <p className="text-[10px] text-muted-foreground font-medium italic">
                  Based on {completedMilestones} of {totalMilestones} milestones
                  completed
                </p>
              </div>

              <div className="h-16 w-px bg-primary/10 hidden md:block" />

              <div className="grid grid-cols-2 gap-10">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                    Time Elapsed
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black tracking-tighter text-slate-900">
                      7
                    </span>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">
                      / 12 Mo
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                    Budget Burn
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={cn(
                        "text-2xl font-black tracking-tighter",
                        budgetSpentPercent > 90
                          ? "text-rose-600"
                          : "text-emerald-600",
                      )}
                    >
                      {budgetSpentPercent}%
                    </span>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">
                      Utilized
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Tabs defaultValue="milestones" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none h-14 bg-transparent p-0 gap-10 px-8">
                <TabsTrigger
                  value="milestones"
                  className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-14 px-0 text-[11px] font-black uppercase tracking-widest transition-all"
                >
                  Milestones & Delivery
                </TabsTrigger>
                <TabsTrigger
                  value="reports"
                  className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-14 px-0 text-[11px] font-black uppercase tracking-widest transition-all"
                >
                  Progress Reports
                </TabsTrigger>
                <TabsTrigger
                  value="outputs"
                  className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-14 px-0 text-[11px] font-black uppercase tracking-widest transition-all"
                >
                  Research Outputs
                </TabsTrigger>
              </TabsList>

              <TabsContent value="milestones" className="p-8">
                <div className="space-y-6">
                  {project.milestones.map((milestone, idx) => (
                    <div
                      key={milestone.id}
                      className="relative pl-10 pb-8 last:pb-0"
                    >
                      {idx !== project.milestones.length - 1 && (
                        <div className="absolute left-[13px] top-8 bottom-0 w-[1px] bg-muted-foreground/20" />
                      )}
                      <div
                        className={cn(
                          "absolute left-0 top-1 h-7 w-7 rounded-full border-4 border-white shadow-sm flex items-center justify-center transition-all",
                          milestone.status === "completed"
                            ? "bg-emerald-500 scale-110"
                            : milestone.status === "in_progress"
                              ? "bg-primary animate-pulse"
                              : "bg-muted-foreground/30",
                        )}
                      >
                        {milestone.status === "completed" && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        )}
                        {milestone.status === "in_progress" && (
                          <Activity className="h-3.5 w-3.5 text-white" />
                        )}
                      </div>

                      <Card className="shadow-sm border-muted/50 hover:border-primary/20 transition-all group cursor-pointer bg-white">
                        <CardContent className="p-5">
                          <div className="flex justify-between items-start mb-4">
                            <div className="space-y-1">
                              <h4 className="text-sm font-black group-hover:text-primary transition-colors">
                                {milestone.title}
                              </h4>
                              <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                                {milestone.description}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] font-black uppercase tracking-widest px-2 py-0.5",
                                milestone.status === "completed"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : milestone.status === "in_progress"
                                    ? "border-primary/20 bg-primary/5 text-primary"
                                    : "border-muted/30 bg-muted/5 text-muted-foreground",
                              )}
                            >
                              {milestone.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-6 pt-4 border-t border-muted/30">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              DUE:{" "}
                              {new Date(milestone.dueDate).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </div>
                            {milestone.completedAt && (
                              <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                COMPLETED:{" "}
                                {new Date(
                                  milestone.completedAt,
                                ).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="reports" className="p-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Periodic Reporting History
                    </p>
                    <Button
                      size="sm"
                      className="h-8 text-[10px] font-black uppercase tracking-widest bg-primary/5 hover:bg-primary/10 text-primary border-none"
                    >
                      Archive Access
                    </Button>
                  </div>
                  {project.progressReports.map((report) => (
                    <Card
                      key={report.id}
                      className="shadow-none border-muted/50 hover:bg-primary/5 hover:border-primary/20 transition-all cursor-pointer group"
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-5">
                          <div className="h-11 w-11 rounded-xl bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold group-hover:text-primary transition-colors">
                              {report.reportingPeriod}
                            </h4>
                            <p className="text-[10px] text-muted-foreground font-medium tracking-tight">
                              Filed on{" "}
                              {new Date(
                                report.submittedAt || "",
                              ).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-right hidden sm:block">
                            <p className="text-sm font-black text-slate-900">
                              ETB {report.budgetSpent.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                              Period Expenditure
                            </p>
                          </div>
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border shadow-none uppercase text-[9px] font-black tracking-widest px-2.5">
                            Approved
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="outputs" className="p-8">
                <div className="grid gap-6 md:grid-cols-2">
                  {project.outputs.map((output) => (
                    <div
                      key={output.id}
                      className="group p-5 rounded-2xl border border-muted/50 bg-white hover:border-primary/20 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className="text-[9px] uppercase font-black tracking-[0.2em] border-primary/20 text-primary py-0.5"
                          >
                            {output.type}
                          </Badge>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase">
                            {new Date(output.createdAt).getFullYear()}
                          </span>
                        </div>
                        <h4 className="text-sm font-black line-clamp-1 group-hover:text-primary transition-colors">
                          {output.title}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {output.description}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        className="w-full mt-6 h-9 text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 hover:text-primary border border-transparent hover:border-primary/10"
                      >
                        <Download className="h-3.5 w-3.5 mr-2" />
                        Access Artifact
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Status Card */}
          <Card className="shadow-sm border-none overflow-hidden bg-white">
            <CardHeader
              className={cn(
                "py-8 text-center text-white transition-colors",
                status.bg,
              )}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 opacity-80">
                Portfolio Governance
              </p>
              <div className="flex items-center justify-center gap-3">
                <status.icon className="h-7 w-7" />
                <p className="text-2xl font-black tracking-tighter">
                  {status.label}
                </p>
              </div>
              <p className="text-[10px] opacity-70 mt-2 font-bold uppercase tracking-widest">
                Research Stage: Execution
              </p>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-center justify-between border-b border-muted pb-3">
                <span className="text-xs font-bold text-muted-foreground uppercase">
                  Reference ID
                </span>
                <span className="text-sm font-black text-primary tracking-tight">
                  {project.id}
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  Active Duration
                </p>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-muted-foreground/5">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-[11px] font-bold">
                    {new Date(project.startDate).toLocaleDateString("en-GB", {
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    —{" "}
                    {new Date(project.endDate).toLocaleDateString("en-GB", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
              <div className="pt-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">
                  Principal Investigator
                </p>
                <div className="flex items-start gap-3 p-3 rounded-xl border border-primary/10 bg-primary/5">
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-black text-xs">
                    {project.proposal.principalInvestigator.firstName[0]}
                    {project.proposal.principalInvestigator.lastName[0]}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-black truncate">
                      {project.proposal.principalInvestigator.firstName}{" "}
                      {project.proposal.principalInvestigator.lastName}
                    </p>
                    <p className="text-[10px] text-primary font-bold uppercase truncate">
                      {project.proposal.institution}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget Utilization Sidebar */}
          <Card className="shadow-sm border-none overflow-hidden bg-white">
            <CardHeader className="py-4 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Financial Burn Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-black">
                  <span className="text-slate-900">
                    Spent: ETB {(budget?.spent / 1000).toFixed(0)}K
                  </span>
                  <span className="text-primary">
                    Total: ETB {(budget?.allocated / 1000).toFixed(0)}K
                  </span>
                </div>
                <Progress
                  value={budgetSpentPercent}
                  className="h-2.5 bg-primary/10"
                />
              </div>

              <div className="space-y-4 pt-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b pb-2">
                  Category Utilization
                </p>
                {project.budgetUtilization.breakdown.slice(0, 4).map((item) => (
                  <div key={item.category} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                      <span className="text-muted-foreground">
                        {item.category}
                      </span>
                      <span
                        className={cn(
                          item.spent / item.allocated > 0.9
                            ? "text-rose-600"
                            : "text-emerald-600",
                        )}
                      >
                        {Math.round((item.spent / item.allocated) * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={(item.spent / item.allocated) * 100}
                      className="h-1 bg-muted/50"
                    />
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                className="w-full mt-2 h-9 text-[10px] font-black uppercase tracking-widest border-primary/10 hover:bg-primary/5 hover:text-primary"
              >
                Detailed Audit Log
              </Button>
            </CardContent>
          </Card>
          <Dialog
            open={isProgressReportModalOpen}
            onOpenChange={setIsProgressReportModalOpen}
          >
            <DialogContent className="sm:max-w-2xl max-h-[95vh] overflow-y-auto pt-8">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Submit Progress Report
                  </DialogTitle>
                  <DialogDescription>
                    Provide the main activities achieved, financial progress,
                    and support documentation for this reporting period.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-5 py-4">
                  {/* Report Name & Amount Used */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label
                        htmlFor="report-name"
                        className="text-sm font-semibold"
                      >
                        Report Name / Period{" "}
                        <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="report-name"
                        placeholder="e.g., Quarter 3 Progress Report"
                        value={reportName}
                        onChange={(e) => setReportName(e.target.value)}
                        className="h-10 border-muted-foreground/20 focus-visible:ring-primary/20"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label
                        htmlFor="amount-used"
                        className="text-sm font-semibold"
                      >
                        Amount Used (ETB){" "}
                        <span className="text-rose-500">*</span>
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                          ETB
                        </span>
                        <Input
                          id="amount-used"
                          type="number"
                          placeholder="0.00"
                          value={amountUsed}
                          onChange={(e) => setAmountUsed(e.target.value)}
                          className="pl-12 h-10 border-muted-foreground/20 focus-visible:ring-primary/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Start Date & End Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label
                        htmlFor="start-date"
                        className="text-sm font-semibold"
                      >
                        Reporting Period Start{" "}
                        <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-10 border-muted-foreground/20 focus-visible:ring-primary/20"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label
                        htmlFor="end-date"
                        className="text-sm font-semibold"
                      >
                        Reporting Period End{" "}
                        <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-10 border-muted-foreground/20 focus-visible:ring-primary/20"
                      />
                    </div>
                  </div>

                  {/* Main Activities Achieved */}
                  <div className="grid gap-2">
                    <Label
                      htmlFor="activities"
                      className="text-sm font-semibold"
                    >
                      Main Activities & Milestones Achieved{" "}
                      <span className="text-rose-500">*</span>
                    </Label>
                    <Textarea
                      id="activities"
                      placeholder="Describe the key achievements, milestones reached, and overall progress during this period..."
                      value={mainActivitiesAchieved}
                      onChange={(e) =>
                        setMainActivitiesAchieved(e.target.value)
                      }
                      className="min-h-[120px] resize-none border-muted-foreground/20 focus-visible:ring-primary/20"
                    />
                  </div>

                  {/* Attachment */}
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label className="text-sm font-semibold">
                        Attachment / Supporting Docs
                      </Label>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Optional
                      </span>
                    </div>

                    {!progressReportAttachment ? (
                      <div
                        className={cn(
                          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all cursor-pointer group",
                          isProgressReportAttachmentDragging
                            ? "border-primary bg-primary/5"
                            : "border-muted-foreground/20 hover:border-primary/40 hover:bg-primary/[0.02]",
                        )}
                        onDragEnter={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsProgressReportAttachmentDragging(true);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsProgressReportAttachmentDragging(false);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsProgressReportAttachmentDragging(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) {
                            setProgressReportAttachment(file);
                          }
                        }}
                        onClick={() =>
                          document
                            .getElementById("progress-report-attachment-input")
                            ?.click()
                        }
                      >
                        <input
                          id="progress-report-attachment-input"
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                          onChange={(e) => {
                            setProgressReportAttachment(
                              e.target.files?.[0] || null,
                            );
                          }}
                          className="hidden"
                        />
                        <div className="p-3 bg-muted/50 rounded-full mb-3 group-hover:scale-110 transition-transform">
                          <Upload className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="text-center space-y-0.5">
                          <p className="text-sm font-medium text-foreground">
                            {isProgressReportAttachmentDragging
                              ? "Drop the document here"
                              : "Click to upload or drag and drop"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PDF, Excel, Word, or images. Max 15MB.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between border-2 border border-primary/20 bg-primary/[0.01] rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-primary/10 rounded-lg">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-primary truncate max-w-[300px] md:max-w-[400px]">
                              {progressReportAttachment.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(
                                progressReportAttachment.size /
                                (1024 * 1024)
                              ).toFixed(2)}{" "}
                              MB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer">
                            <div className="flex items-center justify-center h-8 px-3 text-[11px] font-bold bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md transition-colors">
                              Replace
                            </div>
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                              onChange={(e) =>
                                setProgressReportAttachment(
                                  e.target.files?.[0] || null,
                                )
                              }
                            />
                          </label>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="h-8 px-2 text-[11px]"
                            onClick={() => setProgressReportAttachment(null)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter className="border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsProgressReportModalOpen(false)}
                    disabled={isSubmittingProgressReport}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmitProgressReport}
                    disabled={isSubmittingProgressReport}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    {isSubmittingProgressReport
                      ? "Submitting..."
                      : "Submit Progress Report"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Final Terminal Report Submission Modal */}
            <Dialog
              open={isFinalReportModalOpen}
              onOpenChange={setIsFinalReportModalOpen}
            >
              <DialogContent className="sm:max-w-2xl max-h-[95vh] overflow-y-auto pt-8">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    Submit Final Terminal Report
                  </DialogTitle>
                  <DialogDescription>
                    Provide the final deliverables, select terminal report types, and upload attachments to finalize this project's execution.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-6">
                  {/* Report Name */}
                  <div className="grid gap-2">
                    <Label htmlFor="final-report-name" className="text-sm font-semibold">
                      Report Name / Title <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="final-report-name"
                      placeholder="e.g., Final Terminal Report"
                      value={finalReportName}
                      onChange={(e) => setFinalReportName(e.target.value)}
                      className="h-10 border-muted-foreground/20 focus-visible:ring-primary/20"
                    />
                  </div>

                  {/* Terminal Report Types */}
                  <div className="grid gap-2">
                    <Label className="text-sm font-semibold">
                      Terminal Report Type(s) <span className="text-rose-500">*</span>
                    </Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between h-10 border-muted-foreground/20 text-left font-normal bg-white"
                        >
                          <span className="truncate">
                            {selectedTerminalTypes.length === 0
                              ? "Select report type(s)"
                              : selectedTerminalTypes
                                  .map(
                                    (t) =>
                                      ({
                                        technical: "Technical",
                                        financial: "Financial",
                                        policy: "Policy Brief",
                                        outputs: "Outputs Package",
                                      }[t] || t),
                                  )
                                  .join(", ")}
                          </span>
                          <ChevronRight className="h-4 w-4 opacity-50 rotate-90" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[450px] max-w-full p-2 bg-white" align="start">
                        {[
                          { id: "technical", label: "Technical", desc: "Technical execution details and achievements" },
                          { id: "financial", label: "Financial", desc: "Audits, logs, and cost breakdown updates" },
                          { id: "policy", label: "Policy Brief", desc: "Policy recommendations and metropolitan insights" },
                          { id: "outputs", label: "Outputs Package", desc: "Scientific datasets and publication attachments" },
                        ].map((t) => {
                          const isSelected = selectedTerminalTypes.includes(t.id);
                          return (
                            <DropdownMenuItem
                              key={t.id}
                              className="flex items-start gap-3 p-3 rounded-lg cursor-pointer focus:bg-muted/80"
                              onSelect={(e) => {
                                e.preventDefault(); // Keep dropdown open for multi-select
                                if (isSelected) {
                                  setSelectedTerminalTypes(
                                    selectedTerminalTypes.filter((x) => x !== t.id),
                                  );
                                } else {
                                  setSelectedTerminalTypes([...selectedTerminalTypes, t.id]);
                                }
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                readOnly
                                className="mt-1 h-4 w-4 rounded border-muted-foreground/30 text-primary accent-primary cursor-pointer"
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-foreground">{t.label}</span>
                                <span className="text-xs text-muted-foreground">{t.desc}</span>
                              </div>
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Main Deliverables */}
                  <div className="grid gap-2">
                    <Label htmlFor="main-deliverables" className="text-sm font-semibold">
                      Main Deliverables Achieved <span className="text-rose-500">*</span>
                    </Label>
                    <Textarea
                      id="main-deliverables"
                      placeholder="Summarize the primary objectives, deliverables, and major breakthroughs achieved during this research..."
                      value={mainDeliverables}
                      onChange={(e) => setMainDeliverables(e.target.value)}
                      className="min-h-[120px] resize-none border-muted-foreground/20 focus-visible:ring-primary/20"
                    />
                  </div>

                  {/* Attachment */}
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label className="text-sm font-semibold">Attachment / Supporting Docs</Label>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Optional
                      </span>
                    </div>

                    {!finalReportAttachment ? (
                      <div
                        className={cn(
                          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all cursor-pointer group",
                          isFinalReportAttachmentDragging
                            ? "border-primary bg-primary/5"
                            : "border-muted-foreground/20 hover:border-primary/40 hover:bg-primary/[0.02]",
                        )}
                        onDragEnter={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsFinalReportAttachmentDragging(true);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsFinalReportAttachmentDragging(false);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsFinalReportAttachmentDragging(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) {
                            setFinalReportAttachment(file);
                          }
                        }}
                        onClick={() =>
                          document.getElementById("final-report-attachment-input")?.click()
                        }
                      >
                        <input
                          id="final-report-attachment-input"
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                          onChange={(e) => {
                            setFinalReportAttachment(e.target.files?.[0] || null);
                          }}
                          className="hidden"
                        />
                        <div className="p-3 bg-muted/50 rounded-full mb-3 group-hover:scale-110 transition-transform">
                          <Upload className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="text-center space-y-0.5">
                          <p className="text-sm font-medium text-foreground">
                            {isFinalReportAttachmentDragging
                              ? "Drop the document here"
                              : "Click to upload or drag and drop"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PDF, Excel, Word, or images. Max 25MB.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between border-2 border border-primary/20 bg-primary/[0.01] rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-primary/10 rounded-lg">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-primary truncate max-w-[300px] md:max-w-[400px]">
                              {finalReportAttachment.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(finalReportAttachment.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer">
                            <div className="flex items-center justify-center h-8 px-3 text-[11px] font-bold bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md transition-colors">
                              Replace
                            </div>
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                              onChange={(e) => setFinalReportAttachment(e.target.files?.[0] || null)}
                            />
                          </label>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="h-8 px-2 text-[11px]"
                            onClick={() => setFinalReportAttachment(null)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mark as Published Switch/Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-muted-foreground/10 bg-muted/20">
                    <div className="space-y-0.5 pr-4">
                      <Label htmlFor="is-published" className="text-sm font-semibold cursor-pointer">
                        Mark as Published
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Is this terminal report published in an external peer-reviewed journal or open archive?
                      </p>
                    </div>
                    <input
                      id="is-published"
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="h-5 w-5 rounded border-muted-foreground/30 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                    />
                  </div>

                  {/* Publication Link Input (Conditional) */}
                  {isPublished && (
                    <div className="grid gap-2 animate-in slide-in-from-top-2 duration-200">
                      <Label htmlFor="publication-link" className="text-sm font-semibold">
                        Publication URL / Link <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="publication-link"
                        type="url"
                        placeholder="https://doi.org/... or journal link"
                        value={publicationLink}
                        onChange={(e) => setPublicationLink(e.target.value)}
                        className="h-10 border-muted-foreground/20 focus-visible:ring-primary/20"
                      />
                    </div>
                  )}
                </div>

                <DialogFooter className="border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsFinalReportModalOpen(false)}
                    disabled={isSubmittingFinalReport}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmitFinalReport}
                    disabled={isSubmittingFinalReport}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    {isSubmittingFinalReport ? "Submitting..." : "Submit Final Report"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </aside>
      </div>
    </PageContainer>
  );
}

const MOCK_PROJECT = {
  id: "PROJ-2024-001",
  contractNumber: "MOE/PSR/2024/042",
  startDate: "2024-03-01T00:00:00Z",
  endDate: "2025-02-28T00:00:00Z",
  status: "on_track",
  proposal: {
    title:
      "Enhancing Inclusive Education for Students with Special Needs in Primary Schools of Addis Ababa",
    principalInvestigator: { firstName: "Abebe", lastName: "Mekonnen" },
    institution: "Addis Ababa University",
  },
  milestones: [
    {
      id: "m1",
      title: "Institutional Ethical Approval",
      description:
        "Securing clearance from AAU IRB board and national regulatory bodies.",
      dueDate: "2024-03-15T00:00:00Z",
      status: "completed",
      completedAt: "2024-03-10T00:00:00Z",
    },
    {
      id: "m2",
      title: "Baseline Data Collection",
      description:
        "Comprehensive survey of 20 target primary schools and field interviews.",
      dueDate: "2024-05-30T00:00:00Z",
      status: "completed",
      completedAt: "2024-06-02T00:00:00Z",
    },
    {
      id: "m3",
      title: "Mid-term Analysis Report",
      description:
        "Triangulating qualitative and quantitative findings from initial fieldwork.",
      dueDate: "2024-08-15T00:00:00Z",
      status: "in_progress",
    },
    {
      id: "m4",
      title: "Policy Hub Prototype",
      description:
        "Initial design of the metropolitan inclusive education model.",
      dueDate: "2024-11-01T00:00:00Z",
      status: "pending",
    },
    {
      id: "m5",
      title: "Final Research Publication",
      description: "Submission to international peer-reviewed journals.",
      dueDate: "2025-02-15T00:00:00Z",
      status: "pending",
    },
  ],
  progressReports: [
    {
      id: "r1",
      reportingPeriod: "Quarter 1 (Mar - May 2024)",
      budgetSpent: 85000,
      submittedAt: "2024-06-05T10:00:00Z",
      status: "approved",
    },
    {
      id: "r2",
      reportingPeriod: "Quarter 2 (Jun - Aug 2024)",
      budgetSpent: 146000,
      submittedAt: "2024-09-02T14:00:00Z",
      status: "approved",
    },
  ],
  budgetUtilization: {
    allocated: 550000,
    spent: 231000,
    remaining: 319000,
    breakdown: [
      { category: "Personnel", allocated: 240000, spent: 120000 },
      { category: "Travel & Logistics", allocated: 120000, spent: 65000 },
      { category: "Scientific Equipment", allocated: 85000, spent: 46000 },
      { category: "Consumables", allocated: 105000, spent: 0 },
    ],
  },
  outputs: [
    {
      id: "o1",
      type: "dataset",
      title: "Baseline Survey Dataset",
      description:
        "Raw cleaned data from 400 primary school teacher surveys and classroom observations.",
      createdAt: "2024-06-10T00:00:00Z",
    },
    {
      id: "o2",
      type: "report",
      title: "Stakeholder Consultation Workshop",
      description:
        "Summary report presented to the Ministry Directorate on inclusion barriers.",
      createdAt: "2024-07-22T00:00:00Z",
    },
  ],
};
