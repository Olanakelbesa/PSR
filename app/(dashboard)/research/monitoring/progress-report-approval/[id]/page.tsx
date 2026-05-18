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
  Upload,
  BarChart3,
  Users,
  Wallet,
  Check,
  X,
  FileCheck2,
  MessageSquare,
  AlertTriangle,
  Download,
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageContainer } from "@/components/layout";
import { monitoringApi } from "@/api/client";
import { mockProjects } from "@/lib/api/mock-data";
import type { ResearchProject, ProgressReport } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// Enriched mock projects matches list page for full end-to-end integration
const enrichedProjects = mockProjects.map((p) => {
  if (p.id === "proj-001") {
    return {
      ...p,
      progressReports: [
        {
          id: "pr-pending-1",
          projectId: "proj-001",
          reportingPeriod: "Q2 2024 Progress Report",
          activitiesCompleted:
            "Phase 2 clinical screenings are active. We have recruited over 400 subjects. Core databases are being cleaned and indexed for the review committee.",
          challenges: "Severe weather events delayed field data aggregation in several sub-regions.",
          nextSteps: "Execute mid-term evaluations and prepare draft report summaries.",
          budgetSpent: 124500.00,
          attachments: [
            {
              id: "att-q2-1",
              name: "Q2_Progress_Report_Complete.pdf",
              type: "application/pdf",
              size: 2450000,
              url: "#",
              uploadedAt: "2024-05-15T09:30:00Z"
            }
          ],
          status: "submitted" as const,
          submittedAt: "2024-05-15T09:30:00Z",
          createdAt: "2024-05-10T08:00:00Z",
        },
        ...p.progressReports,
      ],
    };
  }
  if (p.id === "proj-002") {
    return {
      ...p,
      progressReports: [
        {
          id: "pr-pending-2",
          projectId: "proj-002",
          reportingPeriod: "Q2 2024 Architecture Audit",
          activitiesCompleted:
            "Finalized geographic models, coordinated structural and municipal zoning filings, and held core alignment meetups with Addis Ababa housing bureaus.",
          challenges: "Delays in zoning authorizations from municipal bodies due to legislative updates.",
          nextSteps: "Kick off physical core excavations and material supply distributions.",
          budgetSpent: 310000.00,
          attachments: [
            {
              id: "att-q2-2",
              name: "Bole_Villa_Structural_Report.pdf",
              type: "application/pdf",
              size: 4890000,
              url: "#",
              uploadedAt: "2024-05-16T14:15:00Z"
            }
          ],
          status: "submitted" as const,
          submittedAt: "2024-05-16T14:15:00Z",
          createdAt: "2024-05-12T11:00:00Z",
        },
        ...p.progressReports,
      ],
    };
  }
  return p;
});

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  active: { label: "Active", color: "text-blue-600", bg: "bg-blue-600", icon: Activity },
  on_track: { label: "On Track", color: "text-emerald-600", bg: "bg-emerald-600", icon: CheckCircle2 },
  at_risk: { label: "At Risk", color: "text-amber-600", bg: "bg-amber-600", icon: Clock },
  delayed: { label: "Delayed", color: "text-rose-600", bg: "bg-rose-600", icon: AlertCircle },
  completed: { label: "Completed", color: "text-indigo-600", bg: "bg-indigo-600", icon: CheckCircle2 },
};

export default function ProgressReportApprovalDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<ResearchProject | null>(null);
  const [report, setReport] = useState<ProgressReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Decision state
  const [decision, setDecision] = useState<"approved" | "rejected" | "">("");
  const [comment, setComment] = useState("");
  const [releaseInstallment, setReleaseInstallment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadProjectDetails() {
      setIsLoading(true);
      try {
        const response = await monitoringApi.getProjectById(id as string);
        let currentProject: ResearchProject | undefined;

        if (response && response.data) {
          // Attempt to match matching enriched project locally
          const ep = enrichedProjects.find((x) => x.id === id);
          currentProject = ep ? ep : response.data;
        } else {
          currentProject = enrichedProjects.find((x) => x.id === id);
        }

        if (currentProject) {
          setProject(currentProject);
          // Get the submitted progress report
          const pendingReport = currentProject.progressReports?.find(
            (r) => r.status === "submitted" || (r.status as string) === "pending"
          );
          if (pendingReport) {
            setReport(pendingReport);
          } else if (currentProject.progressReports?.length > 0) {
            // Fallback to latest progress report
            setReport(currentProject.progressReports[0]);
          }
        }
      } catch (error) {
        console.error("Failed to load project details:", error);
        const ep = enrichedProjects.find((x) => x.id === id);
        if (ep) {
          setProject(ep);
          const pendingReport = ep.progressReports?.find(
            (r) => r.status === "submitted" || (r.status as string) === "pending"
          );
          setReport(pendingReport || ep.progressReports[0] || null);
        }
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      loadProjectDetails();
    }
  }, [id]);

  async function handleSubmitDecision() {
    if (!decision) {
      toast.error("Please select a decision action.");
      return;
    }
    if (!comment) {
      toast.error("Please provide review comment notes describing your rationale.");
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      
      toast.success(
        decision === "approved"
          ? "Progress report has been successfully approved!"
          : "Progress report has been rejected."
      );
      
      router.push("/research/monitoring/progress-report-approval");
    } catch (error) {
      toast.error("An error occurred while submitting the decision.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <PageContainer title="Loading Details...">
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-3 gap-6">
            <Skeleton className="col-span-2 h-[400px]" />
            <Skeleton className="h-[400px]" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!project || !report) {
    return (
      <PageContainer title="Report Not Found">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground">No Pending Progress Report</h3>
          <p className="text-sm text-muted-foreground mt-2">
            This project has no progress reports currently awaiting review.
          </p>
          <Button onClick={() => router.push("/research/monitoring/progress-report-approval")} className="mt-4">
            Back to Approvals
          </Button>
        </div>
      </PageContainer>
    );
  }

  const status = statusConfig[project.status] || statusConfig.active;

  return (
    <PageContainer
      title={report.reportingPeriod}
      description={`Research Project: ${project.proposal.title}`}
    >
      <div className="space-y-6">
        {/* Back Button */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.push("/research/monitoring/progress-report-approval")}
            className="shadow-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Approvals
          </Button>

          <Badge variant="outline" className={cn("px-3 py-1 font-bold uppercase tracking-wider", status.color, "border-current/25")}>
            Project Status: {status.label}
          </Badge>
        </div>

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* LEFT: Project & Progress Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Project Quick Overview Card */}
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-base font-black uppercase tracking-wider text-primary">
                  Project Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Reference</span>
                  <span className="text-sm font-mono font-black text-foreground mt-1 block">{project.contractNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Principal Investigator</span>
                  <span className="text-sm font-bold text-foreground mt-1 block">
                    {project.proposal.principalInvestigator.firstName} {project.proposal.principalInvestigator.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Institution</span>
                  <span className="text-sm font-semibold text-foreground mt-1 block truncate">
                    {project.proposal.institution}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Duration</span>
                  <span className="text-sm font-semibold text-foreground mt-1 block">
                    {new Date(project.startDate).toLocaleDateString(undefined, { year: "numeric", month: "short" })} -{" "}
                    {new Date(project.endDate).toLocaleDateString(undefined, { year: "numeric", month: "short" })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Progress Report Narrative Card */}
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <FileText className="h-5 w-5 text-primary" />
                  Report Achievements & Metrics
                </CardTitle>
                <CardDescription>Submitted on {report.submittedAt ? new Date(report.submittedAt).toLocaleDateString() : "N/A"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* 1. Activities Achieved */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    Major Activities & Milestones Achieved
                  </h3>
                  <div className="p-4 rounded-xl border border-muted-foreground/10 bg-muted/10 text-sm leading-relaxed text-foreground whitespace-pre-line">
                    {report.activitiesCompleted}
                  </div>
                </div>

                {/* 2. Challenges & Blockers */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Challenges & Roadblock Issues Encountered
                  </h3>
                  <div className="p-4 rounded-xl border border-amber-200/40 bg-amber-500/5 text-sm leading-relaxed text-foreground whitespace-pre-line">
                    {report.challenges || "No significant roadblocks reported."}
                  </div>
                </div>

                {/* 3. Next Phase Action Steps */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Proposed Next Steps & Phase Objectives
                  </h3>
                  <div className="p-4 rounded-xl border border-emerald-200/40 bg-emerald-500/5 text-sm leading-relaxed text-foreground whitespace-pre-line">
                    {report.nextSteps || "No next step details provided."}
                  </div>
                </div>

                {/* 4. Financial Claims */}
                <div className="border-t pt-6">
                  <h3 className="text-sm font-bold text-foreground mb-4">Financial Utilization Claim</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-muted-foreground/10">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Amount Claimed in Period</span>
                        <span className="text-xl font-black text-foreground mt-1 block">
                          ETB {report.budgetSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="p-3 bg-primary/10 rounded-xl text-primary">
                        <Wallet className="h-6 w-6" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-muted-foreground/10">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Project Budget Allocated</span>
                        <span className="text-xl font-black text-foreground mt-1 block">
                          ETB {project.budgetUtilization?.allocated?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "N/A"}
                        </span>
                      </div>
                      <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600">
                        <BarChart3 className="h-6 w-6" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Attachments */}
                {report.attachments && report.attachments.length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="text-sm font-bold text-foreground mb-4">Supporting Attachments</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {report.attachments.map((att) => (
                        <div key={att.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate max-w-[180px]">{att.name}</p>
                              <p className="text-[10px] text-muted-foreground">{(att.size / (1024 * 1024)).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                            <Download className="h-4 w-4 text-primary" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Decision Controls Card */}
          <div className="space-y-6">
            <Card className="border-none shadow-lg bg-white sticky top-6">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <FileCheck2 className="h-5 w-5 text-primary" />
                  Approval Decision
                </CardTitle>
                <CardDescription>Record committee evaluations and issue feedback to PI.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                
                {/* Decision Actions */}
                <div className="grid gap-2">
                  <Label className="text-xs uppercase font-bold text-muted-foreground">Evaluation Action</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDecision("approved")}
                      className={cn(
                        "flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 text-sm font-bold transition-all",
                        decision === "approved"
                          ? "border-emerald-600 bg-emerald-600/5 text-emerald-700 shadow-sm"
                          : "border-muted-foreground/15 hover:border-emerald-600/50 hover:bg-emerald-500/[0.02] text-muted-foreground"
                      )}
                    >
                      <Check className="h-4 w-4" />
                      Approve Report
                    </button>
                    <button
                      type="button"
                      onClick={() => setDecision("rejected")}
                      className={cn(
                        "flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 text-sm font-bold transition-all",
                        decision === "rejected"
                          ? "border-rose-600 bg-rose-600/5 text-rose-700 shadow-sm"
                          : "border-muted-foreground/15 hover:border-rose-600/50 hover:bg-rose-500/[0.02] text-muted-foreground"
                      )}
                    >
                      <X className="h-4 w-4" />
                      Reject Report
                    </button>
                  </div>
                </div>

                {/* Comment notes */}
                <div className="grid gap-2">
                  <Label htmlFor="review-comment" className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Review Comment Notes
                  </Label>
                  <Textarea
                    id="review-comment"
                    placeholder="Provide specific comments detailing achievements or outlining the reasons for rejecting this progress report..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[140px] resize-none border-muted-foreground/20 focus-visible:ring-primary/20 text-sm"
                  />
                </div>

                {/* Release Budget installment toggle */}
                {decision === "approved" && (
                  <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-200/50 bg-emerald-50/20 animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-0.5 pr-2">
                      <Label htmlFor="release-install" className="text-xs font-bold text-emerald-800 cursor-pointer">
                        Authorize Next Budget Release
                      </Label>
                      <p className="text-[10px] text-emerald-700/80 leading-normal">
                        Confirming releases the subsequent milestone installment funding assigned to this project's outline.
                      </p>
                    </div>
                    <input
                      id="release-install"
                      type="checkbox"
                      checked={releaseInstallment}
                      onChange={(e) => setReleaseInstallment(e.target.checked)}
                      className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-200 accent-emerald-600 cursor-pointer"
                    />
                  </div>
                )}

                {/* Warning note if rejected */}
                {decision === "rejected" && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-rose-200/50 bg-rose-50/20 text-rose-700 animate-in slide-in-from-top-2 duration-200">
                    <AlertTriangle className="h-4.5 w-4.5 mt-0.5 shrink-0" />
                    <p className="text-[10px] leading-normal font-semibold">
                      Rejecting this report registers the progress as failed and notifies the Principal Investigator. All future budget releases are immediately locked.
                    </p>
                  </div>
                )}

                {/* Submit Decision */}
                <div className="border-t pt-4">
                  <Button
                    type="button"
                    onClick={handleSubmitDecision}
                    disabled={isSubmitting || !decision}
                    className={cn(
                      "w-full h-11 text-white text-xs font-bold uppercase tracking-wider",
                      decision === "approved"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : decision === "rejected"
                        ? "bg-rose-600 hover:bg-rose-700"
                        : "bg-primary hover:bg-primary/95"
                    )}
                  >
                    {isSubmitting ? "Submitting Decision..." : "Commit Evaluation"}
                  </Button>
                </div>

              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}
