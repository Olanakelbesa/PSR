"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Building,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  FolderOpen,
  Info,
  Mail,
  MessageSquare,
  Paperclip,
  PenLine,
  Phone,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Tag,
  User as UserIcon,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PdfViewer } from "@/components/shared/pdf-viewer";
import { WordViewer } from "@/components/shared/word-viewer";
import { PdfViewerDialog } from "@/components/shared/pdf-viewer-dialog";
import { useTerminalReport } from "@/hooks/useProgressReports";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { getConceptNoteAttachmentKind, downloadConceptNoteAttachment } from "@/lib/utils/concept-note-attachments";
import { cn } from "@/lib/utils";
import type { TerminalReportSummary, TerminalReportApprovalRecord, TerminalReportTeamMember } from "@/api/services/progress-reports.service";

// ── Status Display Configurations ──────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: typeof Clock; description: string }
> = {
  draft: {
    label: "Draft",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    icon: PenLine,
    description: "This report is saved as a draft. Complete your deliverables and submit when ready.",
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    icon: CheckCircle2,
    description: "Your terminal research report has been reviewed, graded, and officially approved.",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    icon: CheckCircle2,
    description: "The research project lifecycle is completed and registered in the repository.",
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    icon: XCircle,
    description: "Your terminal report requires revisions. Please review feedback and resubmit updated files.",
  },
  revision_requested: {
    label: "Revision Requested",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    icon: RotateCcw,
    description: "Committee has requested modifications to your terminal deliverables.",
  },
  pending: {
    label: "Pending Review",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    icon: Clock,
    description: "Your terminal report submission is currently under committee review and grading.",
  },
};

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatFullDateTime(dateStr?: string | null) {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function getInitials(name?: string | null, fallback = "U"): string {
  if (!name) return fallback;
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function EmbeddedViewer({ url, title }: { url: string; title: string }) {
  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center bg-card">
        <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium text-muted-foreground text-sm">No document file available for preview</p>
      </div>
    );
  }

  const resolvedUrl = resolveFileUrl(url) || url;
  const kind = getConceptNoteAttachmentKind(resolvedUrl);

  if (kind === "pdf") {
    return (
      <div className="overflow-hidden rounded-xl border border-primary/20 shadow-xs bg-card">
        <PdfViewer url={resolvedUrl} title={title} className="h-[650px] w-full" />
      </div>
    );
  }

  if (kind === "word") {
    return (
      <div className="overflow-hidden rounded-xl border border-primary/20 bg-[#ededed] dark:bg-muted/30 shadow-xs">
        <WordViewer url={resolvedUrl} title={title} className="h-[650px] w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card p-12 text-center shadow-xs">
      <FileText className="h-10 w-10 text-primary" />
      <div>
        <p className="font-semibold text-foreground text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-1">
          This document format cannot be embedded directly in the browser preview.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="text-xs font-semibold gap-1.5"
        onClick={() => downloadConceptNoteAttachment(resolvedUrl, title)}
      >
        <Download className="h-3.5 w-3.5" />
        Download File
      </Button>
    </div>
  );
}

function DecisionBadge({ decision }: { decision: string }) {
  const config: Record<string, { label: string; className: string; icon: typeof Clock }> = {
    approved: {
      label: "Approved",
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200",
      icon: CheckCircle2,
    },
    rejected: {
      label: "Rejected",
      className: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200",
      icon: XCircle,
    },
    pending: {
      label: "Pending",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200",
      icon: Clock,
    },
  };
  const cfg = config[decision] || config.pending;
  const Icon = cfg.icon;
  return (
    <Badge className={cn("text-[10px] font-bold uppercase gap-1 shadow-none border", cfg.className)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

export default function MyFinalReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params?.id as string;

  const { data: report, isLoading } = useTerminalReport(reportId);

  const [copiedRef, setCopiedRef] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [previewTitle, setPreviewTitle] = useState<string>("");

  const projectTracking = report?.project_tracking || {};
  const propId =
    report?.proposal_id ||
    (projectTracking as any).proposal_id ||
    (projectTracking as any).proposalId ||
    null;
  const refNum =
    report?.reference_number ||
    (projectTracking as any).reference_number ||
    (projectTracking as any).referenceNumber ||
    (propId ? `PROP-${propId}` : `PT-${report?.project_tracking_id || reportId}`);
  const trackingId =
    report?.project_tracking_id || (projectTracking as any).project_tracking_id || reportId;
  const proposalTitle =
    report?.project_tracking_title ||
    (projectTracking as any).title ||
    report?.report_name ||
    `Terminal Report #${reportId}`;
  const reportName = report?.report_name || "Final Terminal Report";
  const dataCenter =
    report?.data_center_name || report?.custom_data_center || "Standard Repository";
  const submittedByName =
    report?.submitted_by_name || "Principal Investigator";

  const piData = report?.pi || (projectTracking as any)?.pi || null;
  const piName = piData?.full_name || piData?.fullName || submittedByName;
  const piEmail = piData?.email || null;
  const piRawPhoto = piData?.photo_url || piData?.photoUrl || piData?.photo;
  const piPhotoUrl = resolveFileUrl(piRawPhoto);
  const piInitials = getInitials(piName, "PI");

  const statusKey = (
    report?.status ||
    report?.general_status ||
    "pending"
  ).toLowerCase();
  const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  const isDraft = statusKey === "draft";
  const isRejectedOrRevision =
    statusKey === "rejected" || statusKey === "revision_requested";

  const rawTeamMembers = report?.team_members || (projectTracking as any)?.team_members || (projectTracking as any)?.teamMembers || [];
  const teamMembers: TerminalReportTeamMember[] = useMemo(() => {
    return rawTeamMembers.map((tm: any) => ({
      id: tm.id,
      member_type: tm.member_type || tm.memberType || "internal",
      full_name: tm.full_name || tm.fullName || tm.name || "Team Member",
      email: tm.email || null,
      photo_url: tm.photo_url || tm.photoUrl || tm.photo || null,
      role: tm.role || tm.roleName || null,
      organization: tm.organization || tm.organizationName || null,
      position: tm.position || null,
    }));
  }, [rawTeamMembers]);

  const approvals: TerminalReportApprovalRecord[] = report?.approvals || [];
  const checklistCompleted = report?.data_sharing_checklist_completed ?? false;

  const handleCopyRef = () => {
    if (!refNum || refNum === "—") return;
    navigator.clipboard.writeText(refNum);
    setCopiedRef(true);
    toast.success("Reference number copied to clipboard!");
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handlePreviewDocument = (url: string, title: string) => {
    if (!url) return;
    setPreviewUrl(resolveFileUrl(url) || url);
    setPreviewTitle(title);
    setPreviewOpen(true);
  };

  const documentList = useMemo(() => {
    if (!report) return [];
    const list: { key: string; label: string; url?: string | null }[] = [];

    if (report.attachment) {
      list.push({ key: "main-report", label: "Primary Final Report File", url: report.attachment });
    }

    (report.items || []).forEach((it: any, idx: number) => {
      if (it.file) {
        list.push({
          key: `item-${it.id || idx}`,
          label: it.terminal_type_name || it.terminalTypeName || `Deliverable File #${idx + 1}`,
          url: it.file,
        });
      }
    });

    return list;
  }, [report]);

  const [activeDocKey, setActiveDocKey] = useState<string>("main-report");
  const activeDoc = useMemo(() => {
    return documentList.find((d) => d.key === activeDocKey) || documentList[0];
  }, [documentList, activeDocKey]);

  const hasApprovals = approvals.length > 0;
  const hasReviewRecord = Boolean(report?.reviewer_comments) || hasApprovals;

  if (isLoading) {
    return (
      <PageContainer title="Loading Terminal Report Details...">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!report) {
    return (
      <PageContainer
        title="Terminal Report Not Found"
        description="The requested terminal report could not be loaded."
        actions={
          <Button variant="outline" onClick={() => router.push("/research/final-report/my-final-reports")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Submissions
          </Button>
        }
      >
        <Card className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <h3 className="font-bold text-amber-900 dark:text-amber-200">Report Unavailable</h3>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Could not load submission details. Return to My Final Reports.
              </p>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

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
            <span>{refNum}</span>
            {copiedRef ? (
              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
            )}
          </button>
          <Badge className={cn("text-[10px] font-bold uppercase gap-1 shadow-none border ml-1", cfg.className)}>
            <StatusIcon className="h-3 w-3" />
            {cfg.label}
          </Badge>
        </div>
      }
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="shadow-2xs">
            <Link href="/research/final-report/my-final-reports">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Submissions
            </Link>
          </Button>

          {propId && (
            <Button variant="outline" size="sm" asChild className="shadow-2xs">
              <Link href={`/research/proposals/my-proposals/${propId}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Proposal Details
              </Link>
            </Button>
          )}

          {isDraft ? (
            <Link href={`/research/final-report/new?resubmit_id=${reportId}`}>
              <Button
                size="sm"
                className="shadow-2xs text-xs font-bold gap-1.5 bg-primary hover:bg-primary/90"
              >
                <PenLine className="h-4 w-4" />
                Continue Editing
              </Button>
            </Link>
          ) : (
            <Link href={`/research/final-report/new?resubmit_id=${reportId}`}>
              <Button
                size="sm"
                className={cn(
                  "shadow-2xs text-xs font-bold gap-1.5",
                  isRejectedOrRevision
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : ""
                )}
              >
                <RotateCcw className="h-4 w-4" />
                {isRejectedOrRevision ? "Resubmit Report" : "Edit / Update Report"}
              </Button>
            </Link>
          )}
        </div>
      }
    >
      <PdfViewerDialog
        isOpen={previewOpen}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        url={previewUrl}
        pdfUrl={previewUrl}
        title={previewTitle}
      />

      {/* ── Contextual Alert Banners ──────────────────────────────────────────── */}
      {isDraft && (
        <Card className="border-l-4 border-l-slate-500 bg-slate-50 dark:bg-slate-950/20 shadow-xs mb-6">
          <CardContent className="p-4 flex items-start gap-3">
            <PenLine className="h-5 w-5 text-slate-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-200">Draft Report — Not Yet Submitted</h3>
              <p className="text-xs text-slate-700 dark:text-slate-400 mt-0.5">
                This report is currently saved as a draft. Complete your deliverables and submit when ready.
              </p>
            </div>
            <Link href={`/research/final-report/new?resubmit_id=${reportId}`}>
              <Button size="sm" className="text-xs font-bold gap-1.5 shrink-0">
                <PenLine className="h-3.5 w-3.5" />
                Continue Editing
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {isRejectedOrRevision && (
        <Card className="border-l-4 border-l-rose-500 bg-rose-50 dark:bg-rose-950/20 shadow-xs mb-6">
          <CardContent className="p-4 flex items-start gap-3">
            <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-rose-900 dark:text-rose-200">
                {statusKey === "rejected" ? "Report Rejected" : "Revisions Requested"}
              </h3>
              <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">
                {statusKey === "rejected"
                  ? "Your terminal report has been rejected. Please review committee feedback below and resubmit with corrections."
                  : "The committee has requested modifications to your deliverables. Check the Review Feedback tab for details."}
              </p>
            </div>
            <Link href={`/research/final-report/new?resubmit_id=${reportId}`}>
              <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold gap-1.5 shrink-0">
                <RotateCcw className="h-3.5 w-3.5" />
                Resubmit Report
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* ── Main Layout Grid (2 Columns: Main Content + Right Sidebar) ──────── */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">

        {/* Main Content Column */}
        <div className="space-y-6 min-w-0">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full flex flex-wrap sm:flex-nowrap justify-start h-auto sm:h-11 bg-muted/60 p-1 border border-border/50 rounded-xl gap-1 overflow-x-auto">
              <TabsTrigger value="overview" className="gap-2 text-xs font-semibold px-3 sm:px-4 py-2 sm:py-0 rounded-lg shrink-0">
                <FileText className="h-3.5 w-3.5" />
                Overview & Details
              </TabsTrigger>
              <TabsTrigger value="documents" className="gap-2 text-xs font-semibold px-3 sm:px-4 py-2 sm:py-0 rounded-lg shrink-0">
                <FolderOpen className="h-3.5 w-3.5" />
                Uploaded Deliverables
                {documentList.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[9px] px-1.5 py-0 font-bold">
                    {documentList.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="reviews" className="gap-2 text-xs font-semibold px-3 sm:px-4 py-2 sm:py-0 rounded-lg shrink-0">
                <MessageSquare className="h-3.5 w-3.5" />
                Review Feedback
                {hasApprovals && (
                  <Badge variant="secondary" className="ml-1 text-[9px] px-1.5 py-0 font-bold">
                    {approvals.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ── Tab 1: Overview & Details ──────────────────────────────────── */}
            <TabsContent value="overview" className="pt-5 space-y-6">

              {/* Proposal & Project Information Card */}
              <Card className="border border-border/60 shadow-xs">
                <CardHeader className="pb-3 border-b bg-muted/30 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FileText className="h-4.5 w-4.5 text-primary" />
                    Proposal & Project Information
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] font-bold font-mono">
                    PT-#{trackingId}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Proposal Title */}
                    <div className="p-3.5 rounded-xl border border-border/50 bg-card space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <FileText className="w-3 h-3 text-primary" />
                        Proposal Title
                      </p>
                      <p className="text-sm font-bold text-foreground leading-snug">
                        {proposalTitle}
                      </p>
                    </div>

                    {/* Proposal Reference Number (Copiable) */}
                    <div className="p-3.5 rounded-xl border border-border/50 bg-card space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-primary" />
                        Proposal Reference
                      </p>
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="text-sm font-bold font-mono text-primary">
                          {refNum}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyRef}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/70 hover:bg-muted font-mono text-[10px] font-bold text-foreground border border-border/60 transition-all duration-200 cursor-pointer hover:border-primary/40 active:scale-95 ml-auto"
                          title="Copy reference number"
                        >
                          {copiedRef ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                              <span className="text-emerald-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Principal Investigator with Avatar */}
                    <div className="p-3.5 rounded-xl border border-border/50 bg-card space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <UserIcon className="w-3 h-3 text-primary" />
                        Principal Investigator
                      </p>
                      <div className="flex items-center gap-2.5 pt-1">
                        <Avatar className="h-8 w-8 border border-border/60 shrink-0">
                          {piPhotoUrl && <AvatarImage src={piPhotoUrl} alt={piName} className="object-cover" />}
                          <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                            {piInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-foreground truncate">{piName}</p>
                          {piEmail && (
                            <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                              <Mail className="h-2.5 w-2.5 text-muted-foreground/70" />
                              {piEmail}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Report Name & Tracking ID */}
                    <div className="p-3.5 rounded-xl border border-border/50 bg-card space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Building className="w-3 h-3 text-primary" />
                        Report Name & Tracking ID
                      </p>
                      <p className="text-xs font-bold text-foreground truncate pt-0.5">
                        {reportName}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        Project Tracking ID: #{trackingId}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Output Deliverables & Items Card */}
              <Card className="border border-border/60 shadow-xs">
                <CardHeader className="pb-3 border-b bg-muted/30 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FileCheck className="h-4.5 w-4.5 text-primary" />
                    Output Deliverables & Attached Items
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {(report.items || []).length} Deliverable Item{(report.items || []).length !== 1 ? "s" : ""}
                  </Badge>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {(report.items || []).length === 0 ? (
                    <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-muted/10">
                      <FileCheck className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="font-semibold text-sm text-foreground">No per-type deliverable items attached</p>
                      <p className="text-xs text-muted-foreground mt-1">No individual deliverable files or links were submitted with this report.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3.5 sm:grid-cols-1">
                      {(report.items || []).map((item: any, idx: number) => {
                        const typeName = item.terminal_type_name || item.terminalTypeName || `Deliverable Item #${idx + 1}`;
                        const resolvedFile = resolveFileUrl(item.file);
                        const fileKind = resolvedFile ? getConceptNoteAttachmentKind(resolvedFile) : null;
                        const extLink = item.external_link || item.externalLink;
                        const gradeName = item.grade_name || item.gradeName;
                        const gradeComments = item.grade_comments || item.gradeComments;

                        return (
                          <div
                            key={item.id || idx}
                            className="p-4 rounded-xl border border-border/60 bg-card hover:bg-muted/20 transition-all duration-200 space-y-3 shadow-2xs"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                  <Paperclip className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-sm text-foreground truncate">{typeName}</h4>
                                  <p className="text-[10px] text-muted-foreground font-mono">Item ID: #{item.id || idx + 1}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {gradeName ? (
                                  <Badge variant="secondary" className="font-bold text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200">
                                    Grade: {gradeName}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="font-semibold text-[10px] text-muted-foreground">
                                    Pending Evaluation
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Action and File Details Row */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                              {item.file ? (
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <Badge variant="outline" className="text-[9px] font-bold uppercase shrink-0">
                                    {fileKind?.toUpperCase() || "FILE"}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground font-mono truncate max-w-[280px]">
                                    {item.file.split("/").pop()}
                                  </span>
                                </div>
                              ) : extLink ? (
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <Badge variant="outline" className="text-[9px] font-bold uppercase shrink-0 text-blue-600 border-blue-200">
                                    LINK
                                  </Badge>
                                  <span className="text-xs text-blue-600 font-mono truncate max-w-[280px]">
                                    {extLink}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">No file or link attached</span>
                              )}

                              <div className="flex items-center gap-2 shrink-0 ml-auto">
                                {item.file && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handlePreviewDocument(item.file, typeName)}
                                      className="h-8 text-xs font-semibold gap-1.5 border-border shadow-2xs"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-primary" />
                                      Preview File
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => downloadConceptNoteAttachment(resolvedFile || item.file, typeName)}
                                      className="h-8 text-xs font-semibold gap-1.5 shadow-2xs"
                                    >
                                      <Download className="w-3.5 h-3.5 text-foreground" />
                                      Download
                                    </Button>
                                  </>
                                )}
                                {extLink && (
                                  <a
                                    href={extLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 text-xs font-semibold gap-1.5 text-primary border-primary/30 hover:bg-primary/5 shadow-2xs"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                      Open Link
                                    </Button>
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Grade Comments Callout */}
                            {gradeComments && (
                              <div className="mt-2 p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 text-xs">
                                <p className="font-bold text-emerald-800 dark:text-emerald-200 text-[11px] mb-0.5 flex items-center gap-1">
                                  <Info className="w-3.5 h-3.5 text-emerald-600" /> Reviewer Grade Comments:
                                </p>
                                <p className="text-emerald-950 dark:text-emerald-100 whitespace-pre-wrap leading-relaxed">
                                  {gradeComments}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab 2: Uploaded Documents ──────────────────────────────────── */}
            <TabsContent value="documents" className="pt-5 space-y-6">
              {documentList.length === 0 ? (
                <Card className="border border-border/60 shadow-xs p-12 text-center">
                  <FolderOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="font-semibold text-sm text-foreground">No Document Files Uploaded</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    No downloadable files or attachments are linked to this report.
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Select Document Tab Pills */}
                  <div className="flex items-center gap-2 flex-wrap bg-muted/40 p-2 rounded-xl border border-border/60">
                    {documentList.map((doc) => (
                      <Button
                        key={doc.key}
                        variant={activeDocKey === doc.key ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setActiveDocKey(doc.key)}
                        className="text-xs font-semibold h-8 rounded-lg"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1.5" />
                        {doc.label}
                      </Button>
                    ))}
                  </div>

                  {/* Document Viewer Component */}
                  {activeDoc?.url && (
                    <EmbeddedViewer url={activeDoc.url} title={activeDoc.label} />
                  )}
                </div>
              )}
            </TabsContent>

            {/* ── Tab 3: Review Feedback (Approval Timeline) ──────────────────── */}
            <TabsContent value="reviews" className="pt-5 space-y-6">
              {!hasReviewRecord ? (
                <Card className="border border-border/60 shadow-xs p-12 text-center">
                  <MessageSquare className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="font-semibold text-sm text-foreground">No Committee Review Comments Yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isDraft
                      ? "This report is still a draft and has not been submitted for review."
                      : "Your report is currently undergoing evaluation by the research committee."}
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Approvals Timeline */}
                  {approvals.length > 0 ? (
                    <Card className="border border-border/60 shadow-xs">
                      <CardHeader className="pb-3 border-b bg-muted/30">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <MessageSquare className="h-4.5 w-4.5 text-primary" />
                          Committee Review Timeline
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {approvals.length} review{approvals.length !== 1 ? "s" : ""} recorded for this report.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-5">
                        <div className="relative space-y-0">
                          {approvals.map((appr, idx) => (
                            <div key={appr.id} className="relative flex gap-4 pb-6 last:pb-0">
                              {/* Timeline connector line */}
                              {idx < approvals.length - 1 && (
                                <div className="absolute left-[15px] top-[30px] bottom-0 w-px bg-border" />
                              )}
                              {/* Timeline dot */}
                              <div className={cn(
                                "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 shrink-0",
                                appr.decision === "approved"
                                  ? "bg-emerald-100 border-emerald-300 dark:bg-emerald-900/40 dark:border-emerald-700"
                                  : appr.decision === "rejected"
                                    ? "bg-rose-100 border-rose-300 dark:bg-rose-900/40 dark:border-rose-700"
                                    : "bg-amber-100 border-amber-300 dark:bg-amber-900/40 dark:border-amber-700"
                              )}>
                                {appr.decision === "approved" ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                ) : appr.decision === "rejected" ? (
                                  <XCircle className="h-4 w-4 text-rose-600" />
                                ) : (
                                  <Clock className="h-4 w-4 text-amber-600" />
                                )}
                              </div>
                              {/* Timeline content */}
                              <div className="flex-1 min-w-0 pt-0.5">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="font-bold text-sm text-foreground">
                                    {appr.reviewer_name || "Reviewer"}
                                  </span>
                                  <DecisionBadge decision={appr.decision} />
                                  <span className="text-[10px] text-muted-foreground ml-auto">
                                    {formatFullDateTime(appr.reviewed_at)}
                                  </span>
                                </div>
                                {appr.ROC_Comments && (
                                  <div className="mt-2 bg-muted/30 p-3 rounded-lg border border-border/50">
                                    <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                                      {appr.ROC_Comments}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : report?.reviewer_comments ? (
                    /* Fallback: aggregated reviewer_comments if no structured approvals */
                    <Card className="border-l-4 border-l-amber-500 border border-border/60 shadow-xs">
                      <CardHeader className="pb-3 border-b bg-amber-50/50 dark:bg-amber-950/20">
                        <CardTitle className="text-base font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-amber-600" />
                          Reviewer Feedback & Modification Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-5 space-y-4">
                        <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap bg-background p-4 rounded-xl border">
                          {report.reviewer_comments}
                        </p>
                      </CardContent>
                    </Card>
                  ) : null}

                  {/* Resubmit CTA if rejected/revision */}
                  {isRejectedOrRevision && (
                    <div className="flex justify-end">
                      <Link href={`/research/final-report/new?resubmit_id=${reportId}`}>
                        <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-1.5">
                          <RotateCcw className="h-3.5 w-3.5" />
                          Resubmit Modified Deliverables
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Column (Right 340px) */}
        <div className="space-y-6">
          {/* Principal Investigator Card */}
          <Card className="border border-border/60 shadow-xs">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-primary" />
                Principal Investigator
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 flex items-center gap-3.5">
              <Avatar className="h-12 w-12 border border-border/60 shadow-2xs">
                {piPhotoUrl && <AvatarImage src={piPhotoUrl} alt={piName} className="object-cover" />}
                <AvatarFallback className="font-bold bg-primary/10 text-primary">
                  {piInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-foreground truncate">
                  {piName}
                </span>
                {piEmail && (
                  <span className="text-[10px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                    <Mail className="h-3 w-3 text-muted-foreground/70" />
                    {piEmail}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground mt-1">
                  Submitted: {formatDateTime(report.submitted_at)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Team Members Card */}
          {teamMembers.length > 0 && (
            <Card className="border border-border/60 shadow-xs">
              <CardHeader className="pb-3 border-b bg-muted/30">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-600" />
                  Team Members
                  <Badge variant="secondary" className="ml-auto text-[9px] px-1.5 py-0 font-bold">
                    {teamMembers.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {teamMembers.map((tm) => {
                  const memberInitials = getInitials(tm.full_name, "TM");
                  const memberPhotoUrl = resolveFileUrl(tm.photo_url);
                  const isExternal = tm.member_type === "external";
                  return (
                    <div key={tm.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-colors shadow-2xs">
                      <Avatar className="h-9 w-9 border border-border/60 shrink-0">
                        {memberPhotoUrl && <AvatarImage src={memberPhotoUrl} alt={tm.full_name} className="object-cover" />}
                        <AvatarFallback className={cn(
                          "text-[10px] font-bold",
                          isExternal ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                        )}>
                          {memberInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-xs text-foreground truncate">
                            {tm.full_name}
                          </span>
                          <Badge variant={isExternal ? "outline" : "secondary"} className="text-[8px] uppercase px-1 py-0 font-bold shrink-0">
                            {isExternal ? "External" : "Internal"}
                          </Badge>
                        </div>
                        {tm.role && (
                          <span className="text-[10px] font-medium text-primary truncate">
                            {tm.role}
                          </span>
                        )}
                        {tm.email && (
                          <span className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                            <Mail className="h-2.5 w-2.5 text-muted-foreground/70" />
                            {tm.email}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Repository & Compliance Info */}
          <Card className="border border-border/60 shadow-xs">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Database className="h-4 w-4 text-emerald-600" />
                Repository & Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">
                  Target Data Center:
                </span>
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-primary" /> {dataCenter}
                </p>
              </div>

              <Separator />

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">
                  Data Sharing Compliance:
                </span>
                {checklistCompleted ? (
                  <p className="font-bold text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Checklist Confirmed & Verified
                  </p>
                ) : (
                  <p className="font-bold text-rose-500 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-500" />
                    Not Confirmed
                  </p>
                )}
              </div>

              <Separator />

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">
                  Publication Status:
                </span>
                <p className="font-medium text-foreground">
                  {report.is_published ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      Published {report.publication_link && <a href={report.publication_link} target="_blank" rel="noreferrer" className="underline font-normal text-xs">(View Link)</a>}
                    </span>
                  ) : (
                    "Unpublished / Pending Repository Registration"
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submission Info Summary Card */}
          <Card className="border border-border/60 shadow-xs">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Submission Info
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge className={cn("text-[10px] font-bold uppercase gap-1 shadow-none border", cfg.className)}>
                  <StatusIcon className="h-3 w-3" />
                  {cfg.label}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Submitted On:</span>
                <span className="font-semibold text-foreground">{formatDateTime(report.submitted_at)}</span>
              </div>
              {report.updated_at && report.updated_at !== report.submitted_at && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Last Modified:</span>
                    <span className="font-semibold text-foreground">{formatDateTime(report.updated_at)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}