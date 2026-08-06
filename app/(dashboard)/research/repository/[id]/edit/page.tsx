"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  ChevronDown,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  FolderUp,
  Globe,
  Link2,
  Loader2,
  Paperclip,
  Save,
  ShieldCheck,
  Upload,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useQueryClient } from "@tanstack/react-query";
import { RichTextEditor } from "@/components/RichTextEditor";

import {
  useDataCenters,
  useFinalSubmission,
  useUpdateFinalSubmission,
} from "@/hooks";
import { finalSubmissionsService } from "@/api/services/final-submissions.service";
import { resolveFileUrl, downloadRemoteFile, extractFileName } from "@/lib/utils/resolve-file-url";
import { PdfViewerDialog } from "@/components/shared/pdf-viewer-dialog";
import type {
  FinalSubmissionStatus,
} from "@/types/final-submission";
import { canEditFinalSubmission } from "@/types/final-submission";

const statusLabels: Record<FinalSubmissionStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  revision_requested: "Revision Requested",
  approved: "Approved",
  rejected: "Rejected",
};

function getInitials(name?: string | null): string {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatCurrency(value?: string | number | null) {
  const amount = Number(value ?? 0);
  return `ETB ${Number.isFinite(amount) ? amount.toLocaleString() : "0"}`;
}

function piName(pi?: any) {
  if (!pi) return "PSR Investigator";
  if (typeof pi === "string") return pi;
  return pi.full_name || pi.fullName || pi.name || pi.email || "PSR Investigator";
}

function proposalLabel(item: any) {
  return `${item.referenceNumber || item.reference_number || `PT-${item.projectTrackingId || item.project_tracking_id || item.proposalId || item.proposal_id}`} · ${item.title || "Untitled proposal"}`;
}

function FileField({
  id,
  label,
  helperText,
  file,
  existingUrl,
  onFileChange,
}: {
  id: string;
  label: string;
  helperText: string;
  file: File | null;
  existingUrl?: string | null;
  onFileChange: (file: File | null) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <div className="rounded-2xl border border-dashed border-muted-foreground/20 bg-slate-50/60 dark:bg-slate-900/40 p-4">
        <input
          id={id}
          type="file"
          accept=".pdf,.doc,.docx,image/*"
          className="hidden"
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {file
                ? file.name
                : existingUrl
                  ? extractFileName(existingUrl)
                  : "No file selected"}
            </p>
            <p className="text-xs text-muted-foreground">{helperText}</p>
          </div>
          <div className="flex items-center gap-2">
            {file && (
              <Badge
                variant="secondary"
                className="border-none bg-emerald-50 text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
              >
                Selected
              </Badge>
            )}
            {!file && existingUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => {
                  const url = resolveFileUrl(existingUrl);
                  if (url) window.open(url, "_blank", "noopener,noreferrer");
                }}
              >
                <Download className="h-3.5 w-3.5" />
                View File
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById(id)?.click()}
            >
              <Upload className="mr-2 h-3.5 w-3.5" />
              {file ? "Change File" : "Choose File"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditRepositorySubmissionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const { data: submission, isLoading } = useFinalSubmission(id);
  const updateMutation = useUpdateFinalSubmission();

  const dataCentersQuery = useDataCenters({
    page: 1,
    limit: 100,
    ordering: "name",
  });

  const [form, setForm] = useState({
    title: "",
    abstract: "",
    executive_summary: "",
    external_link: "",
    doi: "",
    ndmc_submission_reference: "",
    data_center: "",
  });
  const [files, setFiles] = useState({
    full_report: null as File | null,
    policy_brief: null as File | null,
    supplementary_document: null as File | null,
  });
  const [prefillItems, setPrefillItems] = useState<any[]>([]);
  const [prefillData, setPrefillData] = useState<any | null>(null);
  const [itemVisibility, setItemVisibility] = useState<Record<number | string, boolean>>({});

  const dataCenters = dataCentersQuery.data?.data ?? [];
  const isEditable = submission ? canEditFinalSubmission(submission.status) : false;

  const [pendingAction, setPendingAction] = useState<"draft" | "submitted" | null>(null);

  const selectedProposal = useMemo(() => {
    if (!submission) return null;
    const detail = submission.fundedproposal_detail;
    return {
      ...detail,
      pi: submission.pi,
      total_award_amount: detail?.total_award_amount,
      proposal_id: detail?.proposal_id,
      project_tracking_id: detail?.proposal_id,
      projectTrackingId: detail?.proposal_id,
      title: detail?.title,
      referenceNumber: detail?.reference_number,
      reference_number: detail?.reference_number,
    };
  }, [submission]);

  function setFormField<K extends keyof typeof form>(
    field: K,
    value: (typeof form)[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    if (!submission) return;

    setForm({
      title: submission.title ?? "",
      abstract: submission.abstract ?? "",
      executive_summary: submission.executive_summary ?? "",
      external_link: submission.external_link ?? "",
      doi: submission.doi ?? "",
      ndmc_submission_reference: submission.ndmc_submission_reference ?? "",
      data_center: submission.data_center ? String(submission.data_center) : "",
      is_published: submission.is_published !== false,
    });
    setFiles({
      full_report: null,
      policy_brief: null,
      supplementary_document: null,
    });

    if (submission.items && submission.items.length > 0) {
      setPrefillItems(submission.items);
      setPrefillData({ items: submission.items });
      const initialVis: Record<number | string, boolean> = {};
      submission.items.forEach((it: any, idx: number) => {
        const isVis = (it.is_searchable ?? it.isSearchable) !== false;
        initialVis[it.id ?? idx] = isVis;
      });
      setItemVisibility(initialVis);
    }

    const proposalId = submission.fundedproposal_detail?.proposal_id || submission.fundedproposal;
    if (proposalId) {
      finalSubmissionsService
        .getPrefillData(proposalId)
        .then((prefill) => {
          setPrefillData(prefill);
          const itemsToUse = (submission.items && submission.items.length > 0) ? submission.items : (prefill.items || []);
          setPrefillItems(itemsToUse);
          const initialVis: Record<number | string, boolean> = {};
          itemsToUse.forEach((it: any, idx: number) => {
            const isVis = (it.is_searchable ?? it.isSearchable) !== false;
            initialVis[it.id ?? idx] = isVis;
          });
          setItemVisibility(initialVis);
        })
        .catch(() => {
          if (submission.items) {
            setPrefillItems(submission.items);
            setPrefillData({ items: submission.items });
          }
        });
    }
  }, [submission]);

  const requiredReady = !!form.title.trim() && !!submission;

  async function handleSubmit(targetStatus: FinalSubmissionStatus) {
    if (!requiredReady) {
      toast.error("Please enter a submission title before saving.");
      return;
    }

    let rawExternalLink = form.external_link.trim();
    if (rawExternalLink && !/^https?:\/\//i.test(rawExternalLink)) {
      rawExternalLink = `https://${rawExternalLink}`;
    }

    if (rawExternalLink) {
      try {
        new URL(rawExternalLink);
      } catch {
        toast.error("Enter a valid URL for External Link / Publication URL (e.g. https://example.com).");
        return;
      }
    }

    setPendingAction(targetStatus as "draft" | "submitted");

    const payload = {
      title: form.title.trim(),
      abstract: form.abstract.trim(),
      executive_summary: form.executive_summary.trim(),
      full_report: files.full_report,
      policy_brief: files.policy_brief,
      supplementary_document: files.supplementary_document,
      external_link: rawExternalLink,
      doi: form.doi.trim(),
      ndmc_submission_reference: form.ndmc_submission_reference.trim(),
      status: targetStatus,
      data_center: form.data_center ? Number(form.data_center) : null,
      is_published: String(form.is_published),
      items_visibility: JSON.stringify(itemVisibility),
    };

    try {
      await updateMutation.mutateAsync({ id: id!, values: payload });
      queryClient.invalidateQueries({ queryKey: ["final-submission", id] });
      queryClient.invalidateQueries({ queryKey: ["final-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["unified-search"] });
      toast.success(
        targetStatus === "submitted"
          ? "Final submission submitted."
          : "Draft saved.",
      );
      router.push(`/research/repository/${id}`);
    } catch (error: any) {
      const errData = error?.response?.data?.error;
      const details = errData?.details;
      if (details && typeof details === "object") {
        const fieldMessages = Object.values(details).flat().filter(Boolean).join("; ");
        if (fieldMessages) {
          toast.error(fieldMessages);
          setPendingAction(null);
          return;
        }
      }
      const message =
        errData?.message ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save the final submission.";
      toast.error(message);
      setPendingAction(null);
    }
  }

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  const checklist = [
    { key: "fundedproposal", label: "Graded proposal selected", required: true, done: !!submission },
    { key: "title", label: "Submission title entered", required: true, done: !!form.title.trim() },
    { key: "prefill", label: "Terminal report data prefilled", required: false, done: !!submission },
    { key: "terminal_items", label: "Deliverable items loaded", required: false, done: true },
    { key: "data_center", label: "Data center selected", required: false, done: !!form.data_center },
  ];

  const checklistTotal = checklist.length;
  const checklistDone = checklist.filter((item) => item.done).length;

  const existingFileEntries = useMemo(() => {
    if (!submission) return [];
    return [
      { key: "full_report", label: "Full Report", url: submission.full_report },
      { key: "policy_brief", label: "Policy Brief", url: submission.policy_brief },
      { key: "supplementary_document", label: "Supplementary Document", url: submission.supplementary_document },
    ].filter((e) => e.url);
  }, [submission]);

  if (isLoading) {
    return (
      <PageContainer title="Edit Final Submission">
        <div className="space-y-6">
          <Skeleton className="h-12 w-72 rounded-xl" />
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Skeleton className="h-96 rounded-3xl" />
            <Skeleton className="h-72 rounded-3xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!submission) {
    return (
      <PageContainer title="Submission not found">
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">
            This final submission could not be found.
          </p>
          <Button asChild className="mt-4">
            <Link href="/research/repository">Back to Repository</Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (!isEditable) {
    return (
      <PageContainer title="Submission locked">
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <p className="text-sm font-semibold text-foreground">
            This submission can no longer be edited
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Records with status{" "}
            <span className="font-medium">{statusLabels[submission.status]}</span>{" "}
            are read-only in the repository.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href={`/research/repository/${id}`}>View submission</Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Edit Final Submission"
      description="Update an existing final submission entry."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/research/repository/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl px-5 font-bold uppercase tracking-widest"
            disabled={!!pendingAction}
            onClick={() => handleSubmit("draft")}
          >
            {pendingAction === "draft" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {pendingAction === "draft" ? "Saving..." : "Save as Draft"}
          </Button>
          <Button
            type="button"
            className="rounded-xl px-5 font-bold uppercase tracking-widest"
            disabled={!!pendingAction}
            onClick={() => handleSubmit("submitted")}
          >
            {pendingAction === "submitted" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            {pendingAction === "submitted" ? "Saving..." : "Submit"}
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form
          id="edit-final-submission-form"
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          {/* Section 1: Submission Identity */}
          <Card className="overflow-hidden border border-muted-foreground/10 shadow-sm">
            <CardHeader className="border-b bg-slate-50/70 dark:bg-slate-900/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" />
                Submission Identity
              </CardTitle>
              <CardDescription>
                Update the core metadata for this final submission.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 p-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="fundedproposal">
                  Proposal <span className="text-destructive">*</span>
                </Label>
                <div className="flex h-11 items-center rounded-xl border border-muted-foreground/20 bg-muted/30 px-4 text-sm font-medium text-muted-foreground">
                  {selectedProposal?.title || `Proposal #${submission.fundedproposal}`}
                  <Badge variant="secondary" className="ml-2 text-[10px] font-bold uppercase tracking-wider border-none">
                    Locked
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="title">
                  Submission Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(event) => setFormField("title", event.target.value)}
                  placeholder="Enter the final submission title"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="data_center">Data Center</Label>
                <SearchableSelect
                  value={form.data_center}
                  onValueChange={(value) => setFormField("data_center", value)}
                  disabled={dataCentersQuery.isLoading}
                  placeholder={
                    dataCentersQuery.isLoading
                      ? "Loading data centers..."
                      : "Choose data center"
                  }
                  options={dataCenters}
                  getOptionValue={(item: any) => String(item.id)}
                  getOptionLabel={(item: any) => item.name}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ndmc_reference">
                  NDMC Submission Reference
                </Label>
                <Input
                  id="ndmc_reference"
                  value={form.ndmc_submission_reference}
                  onChange={(event) =>
                    setFormField("ndmc_submission_reference", event.target.value)
                  }
                  placeholder="Reference number or tracking code (optional)"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2 sm:col-span-2 border-t pt-4 mt-1">
                <div className="flex items-center justify-between rounded-2xl border p-4 bg-muted/20">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      {form.is_published ? (
                        <Globe className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-amber-600" />
                      )}
                      Repository Public Visibility
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {form.is_published
                        ? "Published & visible in public search queries and repository catalog."
                        : "Unpublished / Hidden — completely invisible in public search engine results."}
                    </p>
                  </div>
                  <Switch
                    checked={form.is_published}
                    onCheckedChange={(checked) => setFormField("is_published", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Narrative Details */}
          <Card className="overflow-hidden border border-muted-foreground/10 shadow-sm">
            <CardHeader className="border-b bg-slate-50/70 dark:bg-slate-900/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-primary" />
                Narrative Details
              </CardTitle>
              <CardDescription>
                Provide the abstract and executive summary describing the final output.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 p-6">
              <div className="space-y-2">
                <Label htmlFor="abstract">Abstract / Main Deliverables</Label>
                <RichTextEditor
                  content={form.abstract}
                  onChange={(html) => setFormField("abstract", html)}
                  placeholder="Summarize the final submission and main deliverables..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="executive_summary">Executive Summary</Label>
                <RichTextEditor
                  content={form.executive_summary}
                  onChange={(html) => setFormField("executive_summary", html)}
                  placeholder="Write a short executive summary..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Deliverables, Files & Links */}
          <Card className="overflow-hidden border border-muted-foreground/10 shadow-sm">
            <CardHeader className="border-b bg-slate-50/70 dark:bg-slate-900/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <FolderUp className="h-4 w-4 text-primary" />
                Deliverables, Files & Links
              </CardTitle>
              <CardDescription>
                Graded deliverables and files loaded from the approved terminal report and submission.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {/* Graded Deliverables from Terminal Report items */}
              {prefillItems && prefillItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Graded Deliverables (Terminal Report)
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] font-semibold gap-1 rounded-lg border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                        onClick={() => {
                          const newVis: Record<number | string, boolean> = {};
                          prefillItems.forEach((it: any, idx: number) => {
                            newVis[it.id ?? idx] = true;
                          });
                          setItemVisibility(newVis);
                        }}
                      >
                        <Eye className="h-3 w-3" />
                        Make All Public
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] font-semibold gap-1 rounded-lg border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                        onClick={() => {
                          const newVis: Record<number | string, boolean> = {};
                          prefillItems.forEach((it: any, idx: number) => {
                            newVis[it.id ?? idx] = false;
                          });
                          setItemVisibility(newVis);
                        }}
                      >
                        <EyeOff className="h-3 w-3" />
                        Hide All
                      </Button>
                      <Badge variant="outline" className="text-[10px] font-semibold gap-1 h-7">
                        <Award className="h-3 w-3" />
                        {prefillItems.length} {prefillItems.length === 1 ? "Deliverable" : "Deliverables"}
                      </Badge>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/60 overflow-hidden">
                    {prefillItems.map((item: any, idx: number) => {
                      const itemFile = item.file;
                      const itemLink = item.externalLink || item.external_link;
                      const typeName =
                        item.terminalTypeName ||
                        item.terminal_type_name ||
                        `Deliverable #${item.terminalType || item.terminal_type || idx + 1}`;
                      const gradeName = item.gradeName || item.grade_name;

                      const gradeColor = (() => {
                        const g = (gradeName || "").toLowerCase();
                        if (g.includes("excellent"))
                          return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300";
                        if (g.includes("very good"))
                          return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300";
                        if (g.includes("good"))
                          return "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300";
                        if (g.includes("satisfactory"))
                          return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300";
                        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
                      })();

                      return (
                        <div
                          key={`item-${item.id ?? idx}`}
                          className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${idx > 0 ? "border-t border-border/40" : ""}`}
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5">
                              {itemLink && !itemFile ? (
                                <Globe className="h-4.5 w-4.5 text-primary" />
                              ) : (
                                <FileText className="h-4.5 w-4.5 text-primary" />
                              )}
                            </div>
                            <div className="min-w-0 space-y-1.5">
                              <p className="text-sm font-semibold text-foreground leading-tight">
                                {typeName}
                              </p>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {gradeName && (
                                  <Badge
                                    variant="secondary"
                                    className={`border-none text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 ${gradeColor}`}
                                  >
                                    <Award className="h-3 w-3 mr-0.5" />
                                    {gradeName}
                                  </Badge>
                                )}
                                {itemFile && (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <Paperclip className="h-3 w-3" />
                                    File attached
                                  </span>
                                )}
                                {itemLink && (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <Link2 className="h-3 w-3" />
                                    External link
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap shrink-0 items-center gap-3 sm:ml-auto">
                            <div className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 border border-border/50">
                              <Switch
                                id={`toggle-item-${item.id ?? idx}`}
                                checked={itemVisibility[item.id ?? idx] !== false}
                                onCheckedChange={(checked) =>
                                  setItemVisibility((prev) => ({
                                    ...prev,
                                    [item.id ?? idx]: checked,
                                  }))
                                }
                              />
                              <Label
                                htmlFor={`toggle-item-${item.id ?? idx}`}
                                className="text-xs font-semibold cursor-pointer select-none flex items-center gap-1.5"
                              >
                                {itemVisibility[item.id ?? idx] !== false ? (
                                  <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                                    <Globe className="h-3 w-3" /> Public in Repo
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground font-semibold flex items-center gap-1">
                                    <EyeOff className="h-3 w-3" /> Hidden / Internal
                                  </span>
                                )}
                              </Label>
                            </div>
                            {itemFile && (
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs gap-1.5 rounded-lg"
                                  onClick={() => {
                                    const url = resolveFileUrl(itemFile);
                                    if (url) {
                                      setPreviewUrl(url);
                                      setPreviewTitle(typeName);
                                      setPreviewOpen(true);
                                    }
                                  }}
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  View
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs gap-1.5 rounded-lg"
                                  onClick={() =>
                                    downloadRemoteFile(itemFile, extractFileName(itemFile))
                                  }
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  Download
                                </Button>
                              </>
                            )}
                            {itemLink && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs gap-1.5 rounded-lg"
                                onClick={() =>
                                  window.open(itemLink, "_blank", "noopener,noreferrer")
                                }
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Open Link
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Existing Submission Files */}
              {existingFileEntries.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Submission Attachments</p>
                    <Badge variant="outline" className="text-[10px] font-semibold gap-1">
                      <Paperclip className="h-3 w-3" />
                      {existingFileEntries.length} {existingFileEntries.length === 1 ? "File" : "Files"}
                    </Badge>
                  </div>
                  <div className="rounded-2xl border border-border/60 overflow-hidden">
                    {existingFileEntries.map((entry, idx) => (
                      <div key={entry.key}
                        className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${idx > 0 ? "border-t border-border/40" : ""}`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5">
                            <FileText className="h-4.5 w-4.5 text-primary" />
                          </div>
                          <div className="min-w-0 space-y-1.5">
                            <p className="text-sm font-semibold text-foreground leading-tight">{entry.label}</p>
                            <p className="text-xs text-muted-foreground truncate">{extractFileName(entry.url!)}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
                          <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1.5 rounded-lg"
                            onClick={() => {
                              const url = resolveFileUrl(entry.url!);
                              if (url) { setPreviewUrl(url); setPreviewTitle(entry.label); setPreviewOpen(true); }
                            }}
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> View
                          </Button>
                          <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1.5 rounded-lg"
                            onClick={() => downloadRemoteFile(entry.url!, extractFileName(entry.url!))}
                          >
                            <Download className="h-3.5 w-3.5" /> Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!prefillItems || prefillItems.length === 0) && existingFileEntries.length === 0 && (
                <div className="rounded-2xl border border-dashed border-muted-foreground/20 bg-slate-50/50 dark:bg-slate-900/30 p-8 text-center">
                  <FolderUp className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No files attached</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Use the section below to upload files for this submission.</p>
                </div>
              )}

              <Separator />

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="external_link">External Link / Publication URL</Label>
                  <Input
                    id="external_link"
                    type="url"
                    value={form.external_link}
                    onChange={(event) => setFormField("external_link", event.target.value)}
                    placeholder="https://..."
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="doi">DOI (optional)</Label>
                  <Input
                    id="doi"
                    value={form.doi}
                    onChange={(event) => setFormField("doi", event.target.value)}
                    placeholder="10.xxxx/xxxxx"
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* Sidebar Summary & Checklist */}
        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Card className="overflow-hidden border border-muted-foreground/10 shadow-sm">
            <CardHeader className="border-b bg-slate-50/70 dark:bg-slate-900/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Selected Proposal
              </CardTitle>
              <CardDescription>
                Review the proposal record backing this final submission.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {selectedProposal ? (
                <>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Reference Number
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {proposalLabel(selectedProposal)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Principal Investigator
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Avatar className="h-7 w-7 border shrink-0">
                        {selectedProposal.pi?.photo_url ? (
                          <AvatarImage
                            src={resolveFileUrl(selectedProposal.pi.photo_url) ?? undefined}
                            alt={piName(selectedProposal.pi)}
                          />
                        ) : null}
                        <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                          {getInitials(piName(selectedProposal.pi))}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-semibold text-foreground truncate">
                        {piName(selectedProposal.pi)}
                      </span>
                    </div>
                  </div>
                  {selectedProposal.total_award_amount && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Award Amount
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(selectedProposal.total_award_amount)}
                      </p>
                    </div>
                  )}
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800 p-4 text-xs text-emerald-800 dark:text-emerald-300">
                    This proposal has an approved final submission record. Changes will be saved as a new version.
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-muted-foreground/20 bg-slate-50 dark:bg-slate-900/40 p-4 text-xs text-muted-foreground">
                  Loading proposal details...
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border border-muted-foreground/10 shadow-sm">
            <CardHeader className="border-b bg-slate-50/70 dark:bg-slate-900/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className={`h-4 w-4 ${checklistDone === checklistTotal ? "text-emerald-600" : "text-primary"}`} />
                Readiness Checklist
              </CardTitle>
              <CardDescription>
                <span>{checklistDone} of {checklistTotal} completed</span>
              </CardDescription>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${checklistDone === checklistTotal ? "bg-emerald-500" : "bg-primary"}`}
                  style={{ width: `${(checklistDone / checklistTotal) * 100}%` }}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-2 p-6">
              {checklist.map((item) => (
                <div
                  key={item.key}
                  className={`flex items-center gap-3 rounded-2xl border p-3 transition-colors ${item.done
                    ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
                    : "border-muted-foreground/10"
                    }`}
                >
                  <div
                    className={
                      item.done ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                    }
                  >
                    {item.done ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className={`text-xs font-semibold truncate ${item.done ? "text-emerald-700 dark:text-emerald-300" : "text-foreground"}`}>
                      {item.label}
                    </span>
                    {item.required && (
                      <span className="shrink-0 text-[10px] font-bold uppercase text-destructive">*Required</span>
                    )}
                  </div>
                </div>
              ))}
              {checklistDone === checklistTotal && (
                <div className="flex items-center gap-2 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  All checks passed
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <PdfViewerDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        pdfUrl={previewUrl ?? undefined}
        title={previewTitle}
      />
    </PageContainer>
  );
}
