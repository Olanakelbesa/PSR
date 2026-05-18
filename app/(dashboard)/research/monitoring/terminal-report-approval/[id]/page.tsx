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
  Globe,
  Archive,
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageContainer } from "@/components/layout";
import { monitoringApi } from "@/api/client";
import { mockProjects } from "@/lib/api/mock-data";
import type { ResearchProject } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// Define local high-fidelity interface for mock terminal reports matching Django model
interface MockTerminalReport {
  id: string;
  projectId: string;
  reportName: string;
  terminalTypes: string[];
  mainDeliverables: string;
  attachmentName?: string;
  attachmentSize?: number;
  isPublished: boolean;
  publicationLink?: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
}

const mockTerminalReports: MockTerminalReport[] = [
  {
    id: "tr-pending-1",
    projectId: "proj-001",
    reportName: "Final Terminal Report - Special Needs Education",
    terminalTypes: ["technical", "policy", "outputs"],
    mainDeliverables:
      "Successfully established special needs learning infrastructure across 12 designated pilot schools. Distributed adaptive curricula guidelines, enrolled 450+ students in trial cohorts, and developed comprehensive policy briefs for the Ministry of Education.",
    attachmentName: "Addis_Special_Needs_Final_Terminal.pdf",
    attachmentSize: 8450000,
    isPublished: true,
    publicationLink: "https://doi.org/10.1016/j.jedu.2024.12.004",
    status: "pending",
    submittedAt: "2024-05-14T10:00:00Z",
  },
  {
    id: "tr-pending-2",
    projectId: "proj-002",
    reportName: "Final Terminal Report - Bole Villa Structural Feasibility Study",
    terminalTypes: ["technical", "financial"],
    mainDeliverables:
      "Finalized complete urban density evaluations, cost benefit ratios, and architectural zoning blueprints. Delivered full ledger balances and financial audit receipts corresponding to Phase 1 and 2 execution releases.",
    attachmentName: "Bole_Villa_Zoning_Final_Financials.pdf",
    attachmentSize: 11200000,
    isPublished: false,
    status: "pending",
    submittedAt: "2024-05-16T16:45:00Z",
  },
];

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  active: { label: "Active", color: "text-blue-600", bg: "bg-blue-600", icon: Activity },
  on_track: { label: "On Track", color: "text-emerald-600", bg: "bg-emerald-600", icon: CheckCircle2 },
  at_risk: { label: "At Risk", color: "text-amber-600", bg: "bg-amber-600", icon: Clock },
  delayed: { label: "Delayed", color: "text-rose-600", bg: "bg-rose-600", icon: AlertCircle },
  completed: { label: "Completed", color: "text-indigo-600", bg: "bg-indigo-600", icon: CheckCircle2 },
};

export default function TerminalReportApprovalDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<ResearchProject | null>(null);
  const [report, setReport] = useState<MockTerminalReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Decision state
  const [decision, setDecision] = useState<"approved" | "rejected" | "">("");
  const [comment, setComment] = useState("");
  const [archiveProject, setArchiveProject] = useState(false);
  const [releaseRetainer, setReleaseRetainer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadProjectDetails() {
      setIsLoading(true);
      try {
        const response = await monitoringApi.getProjectById(id as string);
        if (response && response.data) {
          setProject(response.data);
        } else {
          const ep = mockProjects.find((x) => x.id === id);
          if (ep) setProject(ep);
        }

        const pendingReport = mockTerminalReports.find((r) => r.projectId === id);
        if (pendingReport) {
          setReport(pendingReport);
        }
      } catch (error) {
        console.error("Failed to load project details:", error);
        const ep = mockProjects.find((x) => x.id === id);
        if (ep) setProject(ep);
        const pendingReport = mockTerminalReports.find((r) => r.projectId === id);
        if (pendingReport) setReport(pendingReport);
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
      toast.error("Please select an evaluation action.");
      return;
    }
    if (!comment) {
      toast.error("Please provide review comment notes describing your rationale.");
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      toast.success(
        decision === "approved"
          ? "Terminal Report approved successfully! Project has been formally closed."
          : "Terminal Report rejected. Notification dispatched to Principal Investigator."
      );
      
      router.push("/research/monitoring/terminal-report-approval");
    } catch (error) {
      toast.error("An error occurred while submitting the decision.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <PageContainer title="Loading Final Report...">
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
          <h3 className="text-lg font-bold text-foreground">No Submitted Terminal Report</h3>
          <p className="text-sm text-muted-foreground mt-2">
            This project has no final terminal reports currently awaiting closeout evaluation.
          </p>
          <Button onClick={() => router.push("/research/monitoring/terminal-report-approval")} className="mt-4">
            Back to Approvals
          </Button>
        </div>
      </PageContainer>
    );
  }

  const status = statusConfig[project.status] || statusConfig.active;

  return (
    <PageContainer
      title={report.reportName}
      description={`Final Closeout Review — Research Contract: ${project.contractNumber}`}
    >
      <div className="space-y-6">
        {/* Navigation Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.push("/research/monitoring/terminal-report-approval")}
            className="shadow-sm bg-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Final Reports
          </Button>

          <Badge variant="outline" className={cn("px-3 py-1 font-bold uppercase tracking-wider", status.color, "border-current/25")}>
            Project Status: {status.label}
          </Badge>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* LEFT COLUMN: Narrative & Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Quick Context Card */}
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-primary">
                  Project Closeout Information
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
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Submission Date</span>
                  <span className="text-sm font-semibold text-foreground mt-1 block">
                    {new Date(report.submittedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Terminal Report Detailed Artifacts */}
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <FileText className="h-5 w-5 text-primary" />
                  Terminal Research Deliverables
                </CardTitle>
                <CardDescription>Comprehensive metrics and achievements achieved during total project lifecycle.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                
                {/* 1. Types */}
                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-black tracking-wider text-muted-foreground">Terminal Report Components</h4>
                  <div className="flex flex-wrap gap-2">
                    {report.terminalTypes.map((t) => (
                      <Badge
                        key={t}
                        variant="secondary"
                        className="bg-primary/5 text-primary border-primary/10 text-xs font-bold uppercase tracking-tight px-3 py-1"
                      >
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* 2. Main deliverables */}
                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-black tracking-wider text-muted-foreground">Key Milestones & Final Deliverables</h4>
                  <div className="p-5 rounded-xl border border-muted-foreground/10 bg-muted/10 text-sm leading-relaxed text-foreground whitespace-pre-line">
                    {report.mainDeliverables}
                  </div>
                </div>

                {/* 3. External Publications */}
                <div className="space-y-3 border-t pt-5">
                  <h4 className="text-xs uppercase font-black tracking-wider text-muted-foreground">Publication Status</h4>
                  {report.isPublished ? (
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-emerald-200/50 bg-emerald-50/15">
                      <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                        <Globe className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-emerald-800">Published Externally</p>
                        <a
                          href={report.publicationLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary font-semibold hover:underline block truncate mt-1 max-w-[300px] md:max-w-[400px]"
                        >
                          {report.publicationLink}
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-muted-foreground/10 bg-muted/20">
                      <div className="p-3 bg-muted/50 rounded-xl text-muted-foreground">
                        <Archive className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">Internal Archiving Only</p>
                        <p className="text-xs text-muted-foreground mt-0.5">This project has not requested peer-reviewed journal linkages.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Financial overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-5">
                  <div className="flex items-center justify-between p-4 border rounded-xl bg-white shadow-sm">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Total Grant Released</span>
                      <span className="text-lg font-black text-foreground mt-1 block">
                        ETB {project.budgetUtilization?.spent?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "N/A"}
                      </span>
                    </div>
                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600">
                      <Wallet className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-xl bg-white shadow-sm">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Total Allocated Cap</span>
                      <span className="text-lg font-black text-foreground mt-1 block">
                        ETB {project.budgetUtilization?.allocated?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "N/A"}
                      </span>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-xl text-primary">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                  </div>
                </div>

                {/* 5. Attachment */}
                {report.attachmentName && (
                  <div className="border-t pt-5">
                    <h4 className="text-xs uppercase font-black tracking-wider text-muted-foreground mb-3">Main Uploaded Terminal Report</h4>
                    <div className="flex items-center justify-between p-4 border border-primary/20 bg-primary/[0.01] rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-primary truncate max-w-[280px] md:max-w-[400px]">
                            {report.attachmentName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {report.attachmentSize ? (report.attachmentSize / (1024 * 1024)).toFixed(2) : 0} MB
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="shadow-sm bg-white">
                        <Download className="h-4 w-4 mr-2 text-primary" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Closeout Action Card */}
          <div className="space-y-6">
            <Card className="border-none shadow-lg bg-white sticky top-6">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Terminal Evaluation
                </CardTitle>
                <CardDescription>Record closeout audits and confirm archiving statuses.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                
                {/* Decision picker */}
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
                      Approve & Close
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
                      Reject Closeout
                    </button>
                  </div>
                </div>

                {/* Comment area */}
                <div className="grid gap-2">
                  <Label htmlFor="review-comment" className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Review Comment Notes
                  </Label>
                  <Textarea
                    id="review-comment"
                    placeholder="Provide specific notes regarding compliance audits, quality of deliverables, or outlining rejection details..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[140px] resize-none border-muted-foreground/20 focus-visible:ring-primary/20 text-sm"
                  />
                </div>

                {/* Archive Project checklist (Approved State) */}
                {decision === "approved" && (
                  <div className="space-y-3 p-4 rounded-xl border border-emerald-200/50 bg-emerald-50/20 animate-in slide-in-from-top-2 duration-200">
                    <h5 className="text-xs font-bold text-emerald-800 uppercase tracking-tight">Project Closeout Checklist</h5>
                    
                    <div className="flex items-start gap-2">
                      <input
                        id="archive-proj"
                        type="checkbox"
                        checked={archiveProject}
                        onChange={(e) => setArchiveProject(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-200 accent-emerald-600 cursor-pointer"
                      />
                      <Label htmlFor="archive-proj" className="text-[10px] text-emerald-700 leading-normal font-medium cursor-pointer">
                        Mark project as **Archived & Completed** in portfolio directory.
                      </Label>
                    </div>

                    <div className="flex items-start gap-2">
                      <input
                        id="release-retainer"
                        type="checkbox"
                        checked={releaseRetainer}
                        onChange={(e) => setReleaseRetainer(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-200 accent-emerald-600 cursor-pointer"
                      />
                      <Label htmlFor="release-retainer" className="text-[10px] text-emerald-700 leading-normal font-medium cursor-pointer">
                        Authorize final retainer budget release (remaining 10%).
                      </Label>
                    </div>
                  </div>
                )}

                {/* Warning note if rejected */}
                {decision === "rejected" && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-rose-200/50 bg-rose-50/20 text-rose-700 animate-in slide-in-from-top-2 duration-200">
                    <AlertTriangle className="h-4.5 w-4.5 mt-0.5 shrink-0" />
                    <p className="text-[10px] leading-normal font-semibold">
                      Rejecting the final report locks the project in closeout stage and alerts the PI that significant revisions or missing data points are needed.
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
                    {isSubmitting ? "Submitting Closeout..." : "Commit Closeout Decision"}
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
