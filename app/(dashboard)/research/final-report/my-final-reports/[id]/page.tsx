"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FileText,
  Paperclip,
  Activity,
  Briefcase,
  User,
  Hash,
  AlertCircle,
  Wallet,
  Building,
  Send,
  Upload,
  ChevronDown,
  Check,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useProgressReport,
  useCreateTerminalReport,
  useTerminalReportTypes,
} from "@/hooks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { parseBackendApiMessageFromError } from "@/lib/api/parse-backend-error";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";

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

function formatCurrency(value?: string | number | null) {
  const amount = Number(value ?? 0);
  return `ETB ${Number.isFinite(amount) ? amount.toLocaleString() : "0"}`;
}

export default function MyFinalReportDetailPage() {
  const params = useParams();
  const router = useRouter();

  const routeId = params.id;
  const reportId = Array.isArray(routeId) ? routeId[0] : routeId;

  const { data: report, isLoading, isError, refetch } = useProgressReport(reportId);

  // ── Terminal Report Dialog State ──────────────────────────────────────────
  const [isTerminalDialogOpen, setIsTerminalDialogOpen] = useState(false);
  const [terminalReportName, setTerminalReportName] = useState("");
  const [terminalDeliverables, setTerminalDeliverables] = useState("");
  const [terminalAttachment, setTerminalAttachment] = useState<File | null>(null);
  const [terminalIsPublished, setTerminalIsPublished] = useState(false);
  const [terminalPublicationLink, setTerminalPublicationLink] = useState("");
  const [terminalSelectedTypes, setTerminalSelectedTypes] = useState<string[]>([]);
  const [terminalTypesOpen, setTerminalTypesOpen] = useState(false);

  const createTerminalReport = useCreateTerminalReport();
  const { data: terminalReportTypes } = useTerminalReportTypes();

  function toggleTerminalType(id: string) {
    setTerminalSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  function resetTerminalDialog() {
    setTerminalReportName("");
    setTerminalDeliverables("");
    setTerminalAttachment(null);
    setTerminalIsPublished(false);
    setTerminalPublicationLink("");
    setTerminalSelectedTypes([]);
    setTerminalTypesOpen(false);
  }

  async function submitTerminalReport() {
    if (!report) {
      toast.error("Progress report details are still loading.");
      return;
    }
    if (!terminalDeliverables.trim()) {
      toast.error("Main deliverables field is required.");
      return;
    }

    try {
      await createTerminalReport.mutateAsync({
        project_tracking: report.project_tracking,
        report_name: terminalReportName || undefined,
        main_deliverables: terminalDeliverables,
        attachment: terminalAttachment,
        is_published: terminalIsPublished,
        publication_link: terminalPublicationLink || undefined,
        terminal_type: terminalSelectedTypes.length > 0 ? terminalSelectedTypes.map(Number) : undefined,
      });

      toast.success("Terminal report submitted successfully.");
      setIsTerminalDialogOpen(false);
      resetTerminalDialog();
      await refetch();
    } catch (error) {
      toast.error("Terminal report submission failed", {
        description: parseBackendApiMessageFromError(
          error,
          "Please try again.",
        ),
      });
    }
  }

  // ── Loading / Error States ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageContainer title="Loading Details...">
        <div className="space-y-6">
          <Skeleton className="h-[120px] w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !report) {
    return (
      <PageContainer title="Error Loading Details">
        <Card className="border-rose-200 bg-rose-50/40 shadow-sm max-w-2xl mx-auto my-12">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-14 text-center">
            <div className="rounded-full bg-rose-100 p-4 text-rose-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold">Unable to load progress report details.</p>
              <p className="text-sm text-muted-foreground">
                The record could not be retrieved. It may have been deleted or you lack permission.
              </p>
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => router.push("/research/final-report/my-final-reports")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to List
              </Button>
              <Button onClick={() => void refetch()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Progress Report Detail"
      description={`Record ID: PR-${report.id}`}
      actions={
        <>
          <Button
            variant="outline"
            onClick={() => router.push("/research/final-report/my-final-reports")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
          <Button
            onClick={() => setIsTerminalDialogOpen(true)}
            className="shadow-sm"
          >
            <Send className="mr-2 h-4 w-4" />
            Submit Terminal Report
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Header Summary Card */}
        <Card className="border border-muted-foreground/15 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-snug mt-2">
                  {report.report_name || "Untitled Report"}
                </h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold shrink-0">
                <Calendar className="h-4 w-4" />
                <span>Submitted: {formatDate(report.submitted_at)}</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Info Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="shadow-sm border-muted/60">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-lg">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount Used</p>
                <h3 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
                  {formatCurrency(report.amount_used)}
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-muted/60">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Project Window</p>
                <h3 className="text-sm font-semibold tracking-tight text-slate-800 mt-1">
                  {formatDate(report.start_date)} - {formatDate(report.end_date)}
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-muted/60">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Project Tracking ID</p>
                <h3 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
                  #{report.project_tracking}
                </h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Area */}
        <div className="grid gap-6 lg:grid-cols-[1fr_340px] items-start">
          <div className="space-y-6">
            {/* Activities Card */}
            <Card className="border border-muted-foreground/15 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="flex gap-2 items-center text-base font-bold text-slate-900">
                  <FileText className="h-5 w-5 text-primary" />
                  Main Activities Achieved
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-line bg-slate-50/50 border p-4 rounded-xl">
                  {report.main_activities_achieved || "No activities described."}
                </p>
              </CardContent>
            </Card>

            {/* Attachment Card */}
            {report.attachment && (
              <Card className="border border-muted-foreground/15 shadow-sm">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="flex gap-2 items-center text-base font-bold text-slate-900">
                    <Paperclip className="h-5 w-5 text-slate-600" />
                    Attached File
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 flex items-center justify-between bg-slate-50/40 p-4 rounded-xl border m-5">
                  <div className="flex items-center gap-2 text-sm text-slate-700 font-medium truncate">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <span className="truncate">Progress Report Attachment</span>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={resolveFileUrl(report.attachment) ?? "#"} target="_blank" rel="noreferrer">
                      <Paperclip className="mr-1.5 h-3.5 w-3.5" />
                      View Document
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <Card className="border border-muted-foreground/15 shadow-sm">
              <CardHeader className="border-b bg-slate-50/80">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Project Context
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4 text-sm">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground block">Project Title</span>
                  <p className="font-bold text-slate-900 leading-snug">
                    {report.project_tracking_title || "Untitled Project"}
                  </p>
                </div>

                <Separator />

                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground font-medium flex items-center gap-1">
                    <Hash className="h-3.5 w-3.5" /> Project Tracking ID
                  </span>
                  <Badge variant="outline" className="font-bold border-slate-300">
                    #{report.projectTracking?.projectTrackingId ?? report.project_tracking}
                  </Badge>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground font-medium flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> Proposal ID
                  </span>
                  <Badge variant="outline" className="font-bold border-slate-300">
                    #{report.projectTracking?.proposalId ?? "-"}
                  </Badge>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground font-medium flex items-center gap-1">
                    <Building className="h-3.5 w-3.5" /> Project Status
                  </span>
                  <Badge className="bg-slate-100 text-slate-700 shadow-none border-none font-semibold text-xs capitalize">
                    {report.projectTracking?.status ?? "-"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Terminal Report CTA Card */}
            <Card className="border border-emerald-200 bg-emerald-50/30 shadow-sm">
              <CardContent className="p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <p className="font-semibold text-sm text-slate-900">Ready to close out?</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Submit a Terminal Report to officially finalize this project and record all outcomes and deliverables.
                </p>
                <Button
                  size="sm"
                  className="w-full shadow-sm"
                  onClick={() => setIsTerminalDialogOpen(true)}
                >
                  <Send className="mr-2 h-3.5 w-3.5" />
                  Submit Terminal Report
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      {/* ── Terminal Report Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={isTerminalDialogOpen}
        onOpenChange={(open) => {
          setIsTerminalDialogOpen(open);
          if (!open) resetTerminalDialog();
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
          <div className="px-6 py-4 border-b bg-muted/20">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Submit Terminal Report
              </DialogTitle>
              <DialogDescription>
                Complete this form to officially close out the project and record all final deliverables and outcomes.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* Report Name */}
            <div className="grid gap-2">
              <Label htmlFor="terminal-report-name" className="text-sm font-medium">
                Report Title
              </Label>
              <Input
                id="terminal-report-name"
                placeholder="e.g. Final Project Terminal Report"
                value={terminalReportName}
                onChange={(e) => setTerminalReportName(e.target.value)}
                className="h-11"
              />
            </div>

            {/* Main Deliverables */}
            <div className="grid gap-2">
              <Label htmlFor="terminal-deliverables" className="text-sm font-medium">
                Main Deliverables / Outcomes{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="terminal-deliverables"
                placeholder="Describe the final outcomes, deliverables, and key findings of the project..."
                value={terminalDeliverables}
                onChange={(e) => setTerminalDeliverables(e.target.value)}
                className="min-h-[130px] resize-y"
              />
            </div>

            {/* Terminal Report Types */}
            {terminalReportTypes && terminalReportTypes.length > 0 && (
              <div className="grid gap-2">
                <Label className="text-sm font-medium">Report Type(s)</Label>
                <Popover open={terminalTypesOpen} onOpenChange={setTerminalTypesOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={terminalTypesOpen}
                      className="h-11 w-full justify-between bg-background text-left font-normal"
                    >
                      <span className="truncate">
                        {terminalSelectedTypes.length > 0
                          ? terminalReportTypes
                              .filter((type) =>
                                terminalSelectedTypes.includes(String(type.id)),
                              )
                              .map((type) => type.name)
                              .join(", ")
                          : "Select report type(s)..."}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-1"
                    align="start"
                  >
                    {terminalReportTypes.map((type) => {
                      const typeId = String(type.id);
                      const isSelected = terminalSelectedTypes.includes(typeId);

                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => toggleTerminalType(typeId)}
                          className="flex w-full cursor-pointer items-center rounded-sm px-2 py-2 text-sm hover:bg-muted"
                        >
                          <div
                            className={cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50 [&_svg]:invisible",
                            )}
                          >
                            <Check className="h-3 w-3" />
                          </div>
                          <span>{type.name}</span>
                        </button>
                      );
                    })}
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Publication */}
            <div className="space-y-4 p-4 rounded-xl border bg-muted/10">
              <div className="flex items-center gap-3">
                <input
                  id="terminal-is-published"
                  type="checkbox"
                  checked={terminalIsPublished}
                  onChange={(e) => setTerminalIsPublished(e.target.checked)}
                  className="h-4 w-4 text-primary cursor-pointer"
                />
                <Label htmlFor="terminal-is-published" className="cursor-pointer text-sm font-medium">
                  Research outcomes have been published
                </Label>
              </div>

              {terminalIsPublished && (
                <div className="grid gap-2">
                  <Label htmlFor="terminal-publication-link" className="text-sm font-medium">
                    Publication Link / DOI
                  </Label>
                  <Input
                    id="terminal-publication-link"
                    type="url"
                    placeholder="https://doi.org/..."
                    value={terminalPublicationLink}
                    onChange={(e) => setTerminalPublicationLink(e.target.value)}
                    className="h-10"
                  />
                </div>
              )}
            </div>

            {/* Attachment */}
            <div className="grid gap-2 pt-2">
              <Label htmlFor="terminal-attachment" className="text-sm font-medium">
                Supporting Document
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="terminal-attachment"
                  type="file"
                  className="file:bg-transparent file:text-foreground file:font-medium h-10 cursor-pointer"
                  onChange={(e) => setTerminalAttachment(e.target.files?.[0] || null)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Attach the final report PDF, publication, or supporting documentation.
              </p>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-muted/20">
            <Button
              variant="ghost"
              onClick={() => {
                setIsTerminalDialogOpen(false);
                resetTerminalDialog();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={submitTerminalReport}
              disabled={createTerminalReport.isPending || !terminalDeliverables.trim()}
              className="shadow-sm"
            >
              {createTerminalReport.isPending ? (
                "Submitting..."
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Submit Terminal Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}