"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Globe,
  Info,
  Mail,
  MessageSquare,
  Paperclip,
  PenLine,
  RotateCcw,
  ShieldCheck,
  Tag,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTerminalReport } from "@/hooks/useProgressReports";
import { cn } from "@/lib/utils";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { getConceptNoteAttachmentKind, downloadConceptNoteAttachment } from "@/lib/utils/concept-note-attachments";
import { GradeTerminalReportModal } from "@/components/features/terminal-report/GradeTerminalReportModal";
import { PdfViewerDialog } from "@/components/shared/pdf-viewer-dialog";

// ─── Status Config ────────────────────────────────────────────────────────────
const statusConfig: Record<
  string,
  { label: string; className: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pending Review",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200",
    icon: Clock,
  },
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
  revision_requested: {
    label: "Revision Requested",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200",
    icon: RotateCcw,
  },
};

function StatusBadge({ value }: { value: string }) {
  const cfg = statusConfig[value?.toLowerCase()] ?? statusConfig.pending;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={cn("gap-1 text-[11px] font-bold uppercase shadow-none border", cfg.className)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function DecisionBadge({ decision }: { decision: string }) {
  const config: Record<string, { label: string; className: string; icon: React.ElementType }> = {
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

// ─── Page Component ───────────────────────────────────────────────────────────

export default function TerminalReportApprovalDetailPage() {
  const params = useParams();
  const router = useRouter();

  const reportId = useMemo(() => {
    const raw = params?.id;
    return typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : undefined;
  }, [params]);

  const { data: report, isLoading, refetch } = useTerminalReport(reportId);
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [previewTitle, setPreviewTitle] = useState<string>("");
  const [copiedRef, setCopiedRef] = useState(false);

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

  // Submitter information
  const submittedByName =
    report?.submitted_by_name || (report as any)?.submittedByName || "Investigator";
  const submittedByEmail =
    report?.submitted_by_email || (report as any)?.submittedByEmail || null;
  const submittedByPhotoUrl = resolveFileUrl(
    report?.submitted_by_photo_url || (report as any)?.submittedByPhotoUrl
  );
  const submitterInitials = getInitials(submittedByName, "SB");

  // Principal Investigator information
  const piData = report?.pi || (projectTracking as any)?.pi || null;
  const piName = piData?.full_name || piData?.fullName || submittedByName;
  const piEmail = piData?.email || null;
  const piPhotoUrl = resolveFileUrl(piData?.photo_url || piData?.photoUrl || piData?.photo);
  const piDepartment = piData?.department || null;
  const piInitials = getInitials(piName, "PI");

  // Team Members
  const rawTeamMembers = report?.team_members || (projectTracking as any)?.team_members || (projectTracking as any)?.teamMembers || [];
  const teamMembers = useMemo(() => {
    return rawTeamMembers.map((tm: any) => ({
      id: tm.id,
      member_type: tm.member_type || tm.memberType || "internal",
      full_name: tm.full_name || tm.fullName || tm.name || "Team Member",
      email: tm.email || null,
      photo_url: tm.photo_url || tm.photoUrl || tm.photo || null,
      role: tm.role || tm.roleName || null,
      organization: tm.organization || tm.organizationName || null,
    }));
  }, [rawTeamMembers]);

  // Main deliverables & publication details
  const mainDeliverables = report?.main_deliverables || (report as any)?.mainDeliverables || "";
  const isPublished = report?.is_published ?? (report as any)?.isPublished ?? false;
  const publicationLink = report?.publication_link || (report as any)?.publicationLink || null;
  const mainAttachment = report?.attachment || null;

  const approvals = report?.approvals || [];
  const reviewerComments = report?.reviewer_comments || (report as any)?.reviewerComments || null;
  const checklistCompleted = report?.data_sharing_checklist_completed ?? (report as any)?.dataSharingChecklistCompleted ?? false;

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

  // ── Loading ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageContainer title="Loading report details...">
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

  // ── Not found ──────────────────────────────────────────────────────────
  if (!report) {
    return (
      <PageContainer title="Report Not Found">
        <Card className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <h3 className="font-bold text-amber-900 dark:text-amber-200">Terminal Report Unavailable</h3>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                This terminal report does not exist or you do not have permission to view it.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => router.push("/research/final-report/final-report-approval")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Approval Queue
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <>
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
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
              )}
            </button>
            <StatusBadge value={report.status} />
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/research/final-report/final-report-approval")}
              className="shadow-2xs"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to List
            </Button>

            <Button
              asChild
              size="sm"
              className="shadow-2xs text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Link href={`/research/final-report/final-report-approval/${report.id}/evaluate`}>
                <Award className="h-4 w-4" />
                Evaluate & Grade Report
              </Link>
            </Button>
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

        {/* ── Main Layout Grid (2 Columns) ──────── */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">

          {/* Main Content Column */}
          <div className="space-y-6 min-w-0">

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

                  {/* Proposal Reference Number */}
                  <div className="p-3.5 rounded-xl border border-border/50 bg-card space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Tag className="w-3 h-3 text-primary" />
                      Proposal Reference
                    </p>
                    <p className="text-sm font-bold font-mono text-primary pt-0.5">
                      {refNum}
                    </p>
                  </div>

                  {/* Submitted By User */}
                  <div className="p-3.5 rounded-xl border border-border/50 bg-card space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <User className="w-3 h-3 text-primary" />
                      Submitted By
                    </p>
                    <div className="flex items-center gap-2.5 pt-1">
                      <Avatar className="h-8 w-8 border border-border/60 shrink-0">
                        {submittedByPhotoUrl && (
                          <AvatarImage src={submittedByPhotoUrl} alt={submittedByName} className="object-cover" />
                        )}
                        <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                          {submitterInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">{submittedByName}</p>
                        {submittedByEmail && (
                          <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                            <Mail className="h-2.5 w-2.5 text-muted-foreground/70" />
                            {submittedByEmail}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Principal Investigator */}
                  <div className="p-3.5 rounded-xl border border-border/50 bg-card space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <User className="w-3 h-3 text-emerald-600" />
                      Principal Investigator
                    </p>
                    <div className="flex items-center gap-2.5 pt-1">
                      <Avatar className="h-8 w-8 border border-border/60 shrink-0">
                        {piPhotoUrl && <AvatarImage src={piPhotoUrl} alt={piName} className="object-cover" />}
                        <AvatarFallback className="text-[10px] font-bold bg-emerald-500/10 text-emerald-700">
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
                        {piDepartment && (
                          <p className="text-[10px] text-muted-foreground truncate font-medium">
                            {piDepartment}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>


            {/* Output Deliverables & Attached Items Card */}
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
                {/* Main Direct Attachment if exists */}
                {mainAttachment && (
                  <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Paperclip className="w-4 h-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">Primary Terminal Report Document</p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">{mainAttachment.split("/").pop()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewDocument(mainAttachment, "Primary Terminal Report Document")}
                        className="h-8 text-xs font-semibold gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-primary" />
                        Preview
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => downloadConceptNoteAttachment(mainAttachment, "Primary Terminal Report Document")}
                        className="h-8 text-xs font-semibold gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}

                {(report.items || []).length === 0 && !mainAttachment ? (
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
                                <Info className="w-3.5 h-3.5 text-emerald-600" /> Grade Comments:
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

            {/* Approval & Evaluation History Card */}
            <Card className="border border-border/60 shadow-xs">
              <CardHeader className="pb-3 border-b bg-muted/30">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <MessageSquare className="h-4.5 w-4.5 text-primary" />
                  Reviewer Decision & Audit History
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">


                {approvals.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-muted/10">
                    <MessageSquare className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="font-semibold text-sm text-foreground">No committee evaluations recorded yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click &quot;Evaluate &amp; Grade Report&quot; to submit an approval, add feedback, or request resubmission.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {approvals.map((appr: any, idx: number) => {
                      const revName =
                        appr.reviewer_name ||
                        appr.reviewerName ||
                        appr.reviewer_email ||
                        (typeof appr.reviewer === "string" ? appr.reviewer : appr.reviewer?.fullName || appr.reviewer?.name || appr.reviewer?.email) ||
                        "Committee Reviewer";
                      const comments =
                        appr.ROC_Comments ||
                        appr.ROCComments ||
                        appr.comment ||
                        appr.comments ||
                        appr.general_feedback ||
                        appr.feedback ||
                        report.comments ||
                        report.reviewer_comments;
                      const revDate = appr.reviewed_at || appr.reviewedAt;

                      return (
                        <div key={appr.id || idx} className="p-4 rounded-xl border border-border/70 bg-card space-y-3 shadow-2xs">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                                <Users className="h-4 w-4" />
                              </div>
                              <div>
                                <span className="font-bold text-xs sm:text-sm text-foreground block">{revName}</span>
                                {revDate && (
                                  <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatFullDateTime(revDate)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <DecisionBadge decision={appr.decision} />
                          </div>

                          {comments ? (
                            <div className="bg-muted/30 p-3.5 rounded-xl border border-border/50 space-y-1.5">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span>General Committee Feedback & Remarks</span>
                              </p>
                              <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                                {comments}
                              </p>
                            </div>
                          ) : (
                            <div className="p-3 rounded-xl border border-dashed border-border/60 bg-muted/10 text-[11px] text-muted-foreground italic flex items-center gap-1.5">
                              <Info className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                              <span>No general written feedback remarks provided for this decision.</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Column (Right 340px) */}
          <div className="space-y-6">

            {/* Principal Investigator Card */}
            <Card className="border border-border/60 shadow-xs">
              <CardHeader className="pb-3 border-b bg-muted/30">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-600" />
                  Principal Investigator
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 flex items-center gap-3.5">
                <Avatar className="h-12 w-12 border border-border/60 shadow-2xs">
                  {piPhotoUrl && <AvatarImage src={piPhotoUrl} alt={piName} className="object-cover" />}
                  <AvatarFallback className="font-bold bg-emerald-500/10 text-emerald-700">
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
                  {piDepartment && (
                    <span className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {piDepartment}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submitted By User Card */}
            <Card className="border border-border/60 shadow-xs">
              <CardHeader className="pb-3 border-b bg-muted/30">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Submitted By (Submitter)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 flex items-center gap-3.5">
                <Avatar className="h-12 w-12 border border-border/60 shadow-2xs">
                  {submittedByPhotoUrl && <AvatarImage src={submittedByPhotoUrl} alt={submittedByName} className="object-cover" />}
                  <AvatarFallback className="font-bold bg-primary/10 text-primary">
                    {submitterInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm text-foreground truncate">
                    {submittedByName}
                  </span>
                  {submittedByEmail && (
                    <span className="text-[10px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3 text-muted-foreground/70" />
                      {submittedByEmail}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground mt-1">
                    Submitted: {formatDate(report.submitted_at || (report as any).submittedAt)}
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
                  {teamMembers.map((tm: any) => {
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
                    Public Repository Status:
                  </span>
                  <div className="flex items-center justify-between pt-0.5">
                    <Badge variant={isPublished ? "default" : "outline"} className={cn("text-[9px] uppercase font-bold", isPublished && "bg-emerald-600")}>
                      {isPublished ? "Published" : "Internal"}
                    </Badge>
                    {isPublished && publicationLink && (
                      <a href={publicationLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> Link
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metadata Summary Card */}
            <Card className="border border-border/60 shadow-xs">
              <CardHeader className="pb-3 border-b bg-muted/30">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Submission Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Evaluation Status:</span>
                  <StatusBadge value={report.status} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Submitted On:</span>
                  <span className="font-semibold text-foreground">{formatDate(report.submitted_at || (report as any).submittedAt)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="font-semibold text-foreground">{formatDate(report.updated_at || (report as any).updatedAt)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>

      {/* Grade & Approval Modal */}
      <GradeTerminalReportModal
        isOpen={gradeModalOpen}
        onClose={() => {
          setGradeModalOpen(false);
          refetch();
        }}
        terminalReport={report}
      />
    </>
  );
}
