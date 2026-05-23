"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  FolderUp,
  Globe,
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

import {
  useCreateFinalSubmission,
  useDataCenters,
  useOutputTypes,
  useReadyForFinalSubmissionFundingRecommendations,
} from "@/hooks";
import type {
  FinalSubmissionCreateInput,
  FinalSubmissionStatus,
} from "@/types/final-submission";
import type {
  FundingRecommendation,
  FundingRecommendationPi,
} from "@/types/funding-recommendation";

const statusLabels: Record<FinalSubmissionStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  revision_requested: "Revision Requested",
  approved: "Approved",
  rejected: "Rejected",
};

function formatCurrency(value?: string | number | null) {
  const amount = Number(value ?? 0);

  return `ETB ${Number.isFinite(amount) ? amount.toLocaleString() : "0"}`;
}

function piName(pi?: FundingRecommendationPi | string | null) {
  if (!pi) return "-";
  if (typeof pi === "string") return pi;

  return pi.full_name || pi.fullName || pi.email || "-";
}

function proposalLabel(item: FundingRecommendation) {
  return `${item.reference_number || `FR-${item.id}`} · ${item.proposal_title || "Untitled proposal"}`;
}

function FileField({
  id,
  label,
  helperText,
  file,
  onFileChange,
}: {
  id: string;
  label: string;
  helperText: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
}) {
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
            <p className="text-sm font-semibold text-slate-900">
              {file ? file.name : "No file selected"}
            </p>
            <p className="text-xs text-muted-foreground">{helperText}</p>
          </div>
          <div className="flex items-center gap-2">
            {file && (
              <Badge
                variant="secondary"
                className="border-none bg-emerald-50 text-[10px] font-bold uppercase tracking-widest text-emerald-700"
              >
                Selected
              </Badge>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById(id)?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Choose File
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const initialForm = {
  title: "",
  abstract: "",
  executive_summary: "",
  external_link: "",
  doi: "",
  ndmc_submission_reference: "",
  data_sharing_checklist_completed: false,
  status: "draft" as FinalSubmissionStatus,
  fundedproposal: "",
  output_type: "",
  data_center: "",
};

export default function NewRepositorySubmissionPage() {
  const router = useRouter();
  const createMutation = useCreateFinalSubmission();

  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState({
    full_report: null as File | null,
    policy_brief: null as File | null,
    supplementary_document: null as File | null,
  });

  const readySubmissionQuery = useReadyForFinalSubmissionFundingRecommendations(
    {
      page: 1,
      limit: 100,
      ordering: "-recommended_at",
    },
  );
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

  const readyFundingRecommendations = readySubmissionQuery.data?.data ?? [];
  const outputTypes = outputTypesQuery.data?.data ?? [];
  const dataCenters = dataCentersQuery.data?.data ?? [];

  const selectedProposal = useMemo(
    () =>
      readyFundingRecommendations.find(
        (item) => String(item.id) === form.fundedproposal,
      ),
    [form.fundedproposal, readyFundingRecommendations],
  );

  const selectedOutputType = useMemo(
    () => outputTypes.find((item) => String(item.id) === form.output_type),
    [form.output_type, outputTypes],
  );

  const selectedDataCenter = useMemo(
    () => dataCenters.find((item) => String(item.id) === form.data_center),
    [dataCenters, form.data_center],
  );

  const checklist = [
    { key: "title", label: "Submission title", done: !!form.title.trim() },
    {
      key: "fundedproposal",
      label: "Funded proposal selected",
      done: !!form.fundedproposal,
    },
    {
      key: "output_type",
      label: "Output type selected",
      done: !!form.output_type,
    },
    {
      key: "full_report",
      label: "Full report attached",
      done: !!files.full_report,
    },
    {
      key: "policy_brief",
      label: "Policy brief attached",
      done: !!files.policy_brief,
    },
  ];

  const requiredReady =
    !!form.title.trim() && !!form.fundedproposal && !!form.output_type;

  function setFormField<K extends keyof typeof initialForm>(
    field: K,
    value: (typeof initialForm)[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFundedProposalChange(value: string) {
    const selected = readyFundingRecommendations.find(
      (item) => String(item.id) === value,
    );

    setForm((prev) => ({
      ...prev,
      fundedproposal: value,
      title: selected?.proposal_title || prev.title,
    }));
  }

  async function handleSubmit() {
    if (!requiredReady) {
      toast.error(
        "Please complete the required submission fields before saving.",
      );
      return;
    }

    const payload: FinalSubmissionCreateInput = {
      title: form.title.trim(),
      abstract: form.abstract.trim(),
      executive_summary: form.executive_summary.trim(),
      full_report: files.full_report,
      policy_brief: files.policy_brief,
      supplementary_document: files.supplementary_document,
      external_link: form.external_link.trim(),
      doi: form.doi.trim(),
      ndmc_submission_reference: form.ndmc_submission_reference.trim(),
      data_sharing_checklist_completed: form.data_sharing_checklist_completed,
      status: form.status,
      fundedproposal: Number(form.fundedproposal),
      output_type: Number(form.output_type),
      data_center: form.data_center ? Number(form.data_center) : null,
    };

    try {
      await createMutation.mutateAsync(payload);
      toast.success("Final submission registered successfully.");
      router.push("/research/repository");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to register the final submission.";
      toast.error(message);
    }
  }

  const isLookupLoading =
    readySubmissionQuery.isLoading ||
    outputTypesQuery.isLoading ||
    dataCentersQuery.isLoading;

  return (
    <PageContainer
      title="Register Final Submission"
      description="Create a new final submission entry linked to an approved funded proposal."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/research/repository">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </Button>
          <Button
            type="submit"
            form="final-submission-form"
            className="rounded-xl px-5 font-bold uppercase tracking-widest"
            disabled={createMutation.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            {createMutation.isPending ? "Saving..." : "Register"}
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form
          id="final-submission-form"
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        >
          <Card className="overflow-hidden border border-muted-foreground/10 shadow-sm">
            <CardHeader className="border-b bg-slate-50/70 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" />
                Submission Identity
              </CardTitle>
              <CardDescription>
                Select the funded proposal and define the core output details.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 p-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(event) =>
                    setFormField("title", event.target.value)
                  }
                  placeholder="Enter the final submission title"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="fundedproposal">
                  Funded Proposal <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.fundedproposal}
                  onValueChange={handleFundedProposalChange}
                  disabled={isLookupLoading}
                >
                  <SelectTrigger
                    id="fundedproposal"
                    className="h-11 rounded-xl"
                  >
                    <SelectValue
                      placeholder={
                        isLookupLoading
                          ? "Loading funded proposals..."
                          : "Choose a funded proposal"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {readyFundingRecommendations.length > 0 ? (
                      readyFundingRecommendations.map((item) => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          <div className="flex flex-col py-1 text-left">
                            <span className="font-semibold">
                              {proposalLabel(item)}
                            </span>
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              PI: {piName(item.pi)} · Award:{" "}
                              {formatCurrency(item.total_award_amount)}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        No funded proposals are ready for final submission.
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="output_type">
                  Output Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.output_type}
                  onValueChange={(value) => setFormField("output_type", value)}
                  disabled={isLookupLoading}
                >
                  <SelectTrigger id="output_type" className="h-11 rounded-xl">
                    <SelectValue
                      placeholder={
                        isLookupLoading
                          ? "Loading output types..."
                          : "Choose output type"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {outputTypes.length > 0 ? (
                      outputTypes.map((item) => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          {item.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        No output types available.
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_center">Data Center</Label>
                <Select
                  value={form.data_center}
                  onValueChange={(value) => setFormField("data_center", value)}
                  disabled={isLookupLoading}
                >
                  <SelectTrigger id="data_center" className="h-11 rounded-xl">
                    <SelectValue
                      placeholder={
                        isLookupLoading
                          ? "Loading data centers..."
                          : "Choose data center"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {dataCenters.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ndmc_reference">
                  NDMC Submission Reference
                </Label>
                <Input
                  id="ndmc_reference"
                  value={form.ndmc_submission_reference}
                  onChange={(event) =>
                    setFormField(
                      "ndmc_submission_reference",
                      event.target.value,
                    )
                  }
                  placeholder="Reference number or tracking code"
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
              <CardDescription>
                Provide the abstract and executive summary that describe the
                final output.
              </CardDescription>
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
                  placeholder="Summarize the final submission..."
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
                  placeholder="Write a short executive summary..."
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
                Upload the primary report and any supporting documents.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 p-6">
              <FileField
                id="full_report"
                label="Full Report"
                helperText="Attach the main report document."
                file={files.full_report}
                onFileChange={(file) =>
                  setFiles((prev) => ({ ...prev, full_report: file }))
                }
              />
              <FileField
                id="policy_brief"
                label="Policy Brief"
                helperText="Attach the policy brief or executive brief."
                file={files.policy_brief}
                onFileChange={(file) =>
                  setFiles((prev) => ({ ...prev, policy_brief: file }))
                }
              />
              <FileField
                id="supplementary_document"
                label="Supplementary Document"
                helperText="Attach any supplementary material or annex."
                file={files.supplementary_document}
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
                    placeholder="https://..."
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="doi">DOI</Label>
                  <Input
                    id="doi"
                    value={form.doi}
                    onChange={(event) =>
                      setFormField("doi", event.target.value)
                    }
                    placeholder="10.xxxx/xxxxx"
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2 flex items-start gap-3 rounded-2xl border border-muted-foreground/10 bg-slate-50 p-4">
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
                    <Label
                      htmlFor="data_sharing"
                      className="text-sm font-semibold"
                    >
                      Data sharing checklist completed
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Confirm that the data-sharing checklist has been completed
                      for this submission.
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
                Selected Proposal
              </CardTitle>
              <CardDescription>
                Review the funding record that will back this final submission.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {selectedProposal ? (
                <>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Reference
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {proposalLabel(selectedProposal)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Principal Investigator
                    </p>
                    <p className="text-sm font-medium text-slate-700">
                      {piName(selectedProposal.pi)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Award Amount
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(selectedProposal.total_award_amount)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    This proposal is ready for final submission because its
                    linked project tracking exists and the terminal report is
                    approved.
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-muted-foreground/20 bg-slate-50 p-4 text-sm text-muted-foreground">
                  Choose a funded proposal to unlock the final submission
                  payload.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border border-muted-foreground/10 shadow-sm">
            <CardHeader className="border-b bg-slate-50/70 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Readiness Checklist
              </CardTitle>
              <CardDescription>
                These items are required or recommended before registration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="grid gap-3">
                {checklist.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center gap-3 rounded-2xl border border-muted-foreground/10 p-3"
                  >
                    <div
                      className={
                        item.done ? "text-emerald-600" : "text-muted-foreground"
                      }
                    >
                      {item.done ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {item.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 text-xs text-muted-foreground">
                Required fields are title, funded proposal, and output type. You
                can save the record as{" "}
                <span className="font-semibold text-slate-900">Draft</span> or
                switch to another status before registration.
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-muted-foreground/10 bg-white p-3 text-sm">
                <Globe className="h-4 w-4 text-primary" />
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">
                    {selectedOutputType?.name || "No output type selected"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedDataCenter?.name || "No data center selected"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
