"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  FolderUp,
  Loader2,
  Save,
  ShieldCheck,
  Upload,
  Users,
} from "lucide-react";

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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

import {
  useDataCenters,
  useFinalSubmission,
  useOutputTypes,
  useUpdateFinalSubmission,
} from "@/hooks";
import type {
  FinalSubmissionStatus,
  FinalSubmissionUpdateInput,
} from "@/types/final-submission";
import { canEditFinalSubmission } from "@/types/final-submission";
import { extractFileName } from "@/lib/utils/resolve-file-url";

const statusLabels: Record<FinalSubmissionStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  revision_requested: "Revision Requested",
  approved: "Approved",
  rejected: "Rejected",
};

function FileField({
  id,
  label,
  helperText,
  file,
  existingFile,
  onFileChange,
}: {
  id: string;
  label: string;
  helperText: string;
  file: File | null;
  existingFile?: string | null;
  onFileChange: (file: File | null) => void;
}) {
  const existingName = existingFile ? extractFileName(existingFile) : null;

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <div className="rounded-2xl border border-dashed border-muted-foreground/20 bg-slate-50 p-4">
        <input
          id={id}
          type="file"
          accept=".pdf,.doc,.docx,image/*"
          className="hidden"
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="break-all text-sm font-semibold text-slate-900">
              {file ? file.name : existingName || "No file selected"}
            </p>
            <p className="text-xs text-muted-foreground">
              {file
                ? "New file selected · will replace the current upload"
                : existingName
                  ? "Current file · choose a new file to replace"
                  : helperText}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {file ? (
              <Badge className="border-emerald-200 bg-emerald-50 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                New file
              </Badge>
            ) : existingName ? (
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
                Uploaded
              </Badge>
            ) : null}
            {file ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onFileChange(null)}
              >
                Clear
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById(id)?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              {existingName || file ? "Replace" : "Choose File"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditRepositorySubmissionPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const { data: submission, isLoading } = useFinalSubmission(id);
  const updateMutation = useUpdateFinalSubmission();

  const outputTypesQuery = useOutputTypes({
    page: 1,
    limit: 100,
    ordering: "name",
  });
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
    data_sharing_checklist_completed: false,
    status: "draft" as FinalSubmissionStatus,
    output_type: "",
    data_center: "",
  });
  const [files, setFiles] = useState({
    full_report: null as File | null,
    policy_brief: null as File | null,
    supplementary_document: null as File | null,
  });

  useEffect(() => {
    if (!submission) return;

    setForm({
      title: submission.title ?? "",
      abstract: submission.abstract ?? "",
      executive_summary: submission.executive_summary ?? "",
      external_link: submission.external_link ?? "",
      doi: submission.doi ?? "",
      ndmc_submission_reference: submission.ndmc_submission_reference ?? "",
      data_sharing_checklist_completed:
        submission.data_sharing_checklist_completed ?? false,
      status: submission.status,
      output_type: String(submission.output_type ?? ""),
      data_center: submission.data_center ? String(submission.data_center) : "",
    });
    setFiles({
      full_report: null,
      policy_brief: null,
      supplementary_document: null,
    });
  }, [submission]);

  const outputTypes = outputTypesQuery.data?.data ?? [];
  const dataCenters = dataCentersQuery.data?.data ?? [];
  const isEditable = submission ? canEditFinalSubmission(submission.status) : false;

  const fundingProposalLabel = useMemo(() => {
    const detail = submission?.fundedproposal_detail;
    if (!detail) {
      return submission?.fundedproposal
        ? `Funding proposal #${submission.fundedproposal}`
        : "No funding proposal linked";
    }

    return detail.reference_number
      ? `${detail.reference_number}${detail.title ? ` · ${detail.title}` : ""}`
      : detail.title || `Funding proposal #${submission?.fundedproposal}`;
  }, [submission]);

  const checklist = [
    { key: "title", label: "Submission title", done: !!form.title.trim() },
    {
      key: "output_type",
      label: "Output type selected",
      done: !!form.output_type,
    },
    {
      key: "full_report",
      label: "Full report attached",
      done: !!files.full_report || !!submission?.full_report,
    },
  ];

  function setFormField<K extends keyof typeof form>(
    field: K,
    value: (typeof form)[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (!submission || !id) return;

    if (!form.title.trim() || !form.output_type) {
      toast.error("Title and output type are required.");
      return;
    }

    const payload: FinalSubmissionUpdateInput = {
      title: form.title.trim(),
      abstract: form.abstract.trim(),
      executive_summary: form.executive_summary.trim(),
      external_link: form.external_link.trim(),
      doi: form.doi.trim(),
      ndmc_submission_reference: form.ndmc_submission_reference.trim(),
      data_sharing_checklist_completed: form.data_sharing_checklist_completed,
      status: form.status,
      output_type: Number(form.output_type),
      data_center: form.data_center ? Number(form.data_center) : null,
    };

    if (files.full_report) payload.full_report = files.full_report;
    if (files.policy_brief) payload.policy_brief = files.policy_brief;
    if (files.supplementary_document) {
      payload.supplementary_document = files.supplementary_document;
    }

    try {
      await updateMutation.mutateAsync({ id, values: payload });
      toast.success("Final submission updated successfully.");
      router.push(`/research/repository/${id}`);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update the final submission.";
      toast.error(message);
    }
  }

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
      description={`Updating ${submission.ndmc_submission_reference || `FS-${submission.id}`}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/research/repository/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </Button>
          <Button
            type="submit"
            form="edit-final-submission-form"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
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
            void handleSubmit();
          }}
        >
          <Card className="overflow-hidden border border-muted-foreground/10 shadow-sm">
            <CardHeader className="border-b bg-slate-50/70 pb-4">
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
                <Label>Funded Proposal</Label>
                <Input
                  value={fundingProposalLabel}
                  disabled
                  className="h-11 rounded-xl bg-muted/40"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(event) => setFormField("title", event.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="output_type">
                  Output Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.output_type}
                  onValueChange={(value) => setFormField("output_type", value)}
                >
                  <SelectTrigger id="output_type" className="h-11 rounded-xl">
                    <SelectValue placeholder="Choose output type" />
                  </SelectTrigger>
                  <SelectContent>
                    {outputTypes.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setFormField("status", value as FinalSubmissionStatus)
                  }
                >
                  <SelectTrigger id="status" className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="data_center">Data Center</Label>
                <Select
                  value={form.data_center || "none"}
                  onValueChange={(value) =>
                    setFormField("data_center", value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger id="data_center" className="h-11 rounded-xl">
                    <SelectValue placeholder="Choose data center" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not set</SelectItem>
                    {dataCenters.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ndmc_reference">NDMC Submission Reference</Label>
                <Input
                  id="ndmc_reference"
                  value={form.ndmc_submission_reference}
                  onChange={(event) =>
                    setFormField("ndmc_submission_reference", event.target.value)
                  }
                  className="h-11 rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border border-muted-foreground/10 shadow-sm">
            <CardHeader className="border-b bg-slate-50/70 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-primary" />
                Narrative Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 p-6">
              <div className="space-y-2">
                <Label htmlFor="abstract">Abstract</Label>
                <Textarea
                  id="abstract"
                  value={form.abstract}
                  onChange={(event) =>
                    setFormField("abstract", event.target.value)
                  }
                  className="min-h-[140px] rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="executive_summary">Executive Summary</Label>
                <Textarea
                  id="executive_summary"
                  value={form.executive_summary}
                  onChange={(event) =>
                    setFormField("executive_summary", event.target.value)
                  }
                  className="min-h-[140px] rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border border-muted-foreground/10 shadow-sm">
            <CardHeader className="border-b bg-slate-50/70 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <FolderUp className="h-4 w-4 text-primary" />
                Supporting Files & Links
              </CardTitle>
              <CardDescription>
                Replace files only when you need to upload a new version.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 p-6">
              <FileField
                id="full_report"
                label="Full Report"
                helperText="Attach the main report document."
                file={files.full_report}
                existingFile={submission.full_report}
                onFileChange={(file) =>
                  setFiles((prev) => ({ ...prev, full_report: file }))
                }
              />
              <FileField
                id="policy_brief"
                label="Policy Brief"
                helperText="Attach the policy brief or executive brief."
                file={files.policy_brief}
                existingFile={submission.policy_brief}
                onFileChange={(file) =>
                  setFiles((prev) => ({ ...prev, policy_brief: file }))
                }
              />
              <FileField
                id="supplementary_document"
                label="Supplementary Document"
                helperText="Attach any supplementary material or annex."
                file={files.supplementary_document}
                existingFile={submission.supplementary_document}
                onFileChange={(file) =>
                  setFiles((prev) => ({
                    ...prev,
                    supplementary_document: file,
                  }))
                }
              />

              <Separator />

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="external_link">External Link</Label>
                  <Input
                    id="external_link"
                    type="url"
                    value={form.external_link}
                    onChange={(event) =>
                      setFormField("external_link", event.target.value)
                    }
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="doi">DOI</Label>
                  <Input
                    id="doi"
                    value={form.doi}
                    onChange={(event) => setFormField("doi", event.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-muted-foreground/10 bg-slate-50 p-4 sm:col-span-2">
                  <Checkbox
                    id="data_sharing"
                    checked={form.data_sharing_checklist_completed}
                    onCheckedChange={(checked) =>
                      setFormField(
                        "data_sharing_checklist_completed",
                        Boolean(checked),
                      )
                    }
                  />
                  <div className="space-y-1">
                    <Label htmlFor="data_sharing" className="text-sm font-semibold">
                      Data sharing checklist completed
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Confirm that the data-sharing checklist has been completed.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>

        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Card className="overflow-hidden border border-muted-foreground/10 shadow-sm">
            <CardHeader className="border-b bg-slate-50/70 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Submission Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6 text-sm">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Reference
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {submission.ndmc_submission_reference || `FS-${submission.id}`}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Version
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {submission.version ?? 1}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Downloads
                </p>
                <p className="mt-1 font-semibold tabular-nums text-slate-900">
                  {submission.download_count ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border border-muted-foreground/10 shadow-sm">
            <CardHeader className="border-b bg-slate-50/70 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Readiness Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-6">
              {checklist.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center gap-3 rounded-2xl border border-muted-foreground/10 p-3"
                >
                  <CheckCircle2
                    className={
                      item.done ? "h-4 w-4 text-emerald-600" : "h-4 w-4 text-muted-foreground"
                    }
                  />
                  <p className="text-sm font-medium text-slate-900">{item.label}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
