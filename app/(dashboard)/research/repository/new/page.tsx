"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  ChevronDown,
  Download,
  ExternalLink,
  FileText,
  FolderUp,
  Globe,
  Link2,
  Loader2,
  Paperclip,
  Save,
  Upload,
  Users,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout";
import { cn } from "@/lib/utils";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RichTextEditor } from "@/components/RichTextEditor";

import {
  useCreateFinalSubmission,
  useDataCenters,
  useOutputTypes,
  useGradedForRepository,
  useFinalSubmission,
  useUpdateFinalSubmission,
} from "@/hooks";
import { finalSubmissionsService } from "@/api/services/final-submissions.service";
import { resolveFileUrl, downloadRemoteFile, extractFileName } from "@/lib/utils/resolve-file-url";
import { PdfViewerDialog } from "@/components/shared/pdf-viewer-dialog";
import type {
  FinalSubmissionCreateInput,
  FinalSubmissionStatus,
} from "@/types/final-submission";

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
                  ? "File prefilled from Terminal Report"
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

const initialForm = {
  title: "",
  abstract: "",
  executive_summary: "",
  external_link: "",
  doi: "",
  ndmc_submission_reference: "",
  status: "draft" as FinalSubmissionStatus,
  fundedproposal: "",
  external_research: "",
  output_type: "",
  data_center: "",
  is_published: true,
};

export default function NewRepositorySubmissionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const editId = searchParams?.get("id") || null;
  const isEditMode = !!editId;

  const createMutation = useCreateFinalSubmission();
  const { data: existingSubmission, isLoading: isExistingLoading } = useFinalSubmission(editId);
  const updateMutation = useUpdateFinalSubmission();

  const initialProposalParam =
    searchParams?.get("proposal_id") ||
    searchParams?.get("tracking_id") ||
    searchParams?.get("funded_proposal_id");

  const [sourceType, setSourceType] = useState<"proposal" | "external_research">("proposal");
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState({
    full_report: null as File | null,
    policy_brief: null as File | null,
    supplementary_document: null as File | null,
  });
  const [prefillItems, setPrefillItems] = useState<any[]>([]);
  const [prefillData, setPrefillData] = useState<any | null>(null);
  const [itemVisibility, setItemVisibility] = useState<Record<number | string, boolean>>({});
  const [isPrefilling, setIsPrefilling] = useState(false);
  const [pendingAction, setPendingAction] = useState<"draft" | "submitted" | null>(null);

  const gradedRepositoryQuery = useGradedForRepository();
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

  const gradedItems = gradedRepositoryQuery.data ?? [];
  const gradedProposals = useMemo(
    () => gradedItems.filter((it: any) => it.source_type === "proposal" || (!it.source_type && (it.proposal_id || it.proposalId))),
    [gradedItems]
  );
  const approvedExternalResearches = useMemo(
    () => gradedItems.filter((it: any) => it.source_type === "external_research" || it.external_research_id),
    [gradedItems]
  );
  const outputTypes = outputTypesQuery.data?.data ?? [];
  const dataCenters = dataCentersQuery.data?.data ?? [];

  const selectedProposal = useMemo(
    () => {
      if (isEditMode && existingSubmission) {
        if (existingSubmission.fundedproposal_detail) {
          const detail = existingSubmission.fundedproposal_detail;
          return {
            ...detail,
            pi: existingSubmission.pi,
            total_award_amount: detail?.total_award_amount,
            proposal_id: detail?.proposal_id,
            project_tracking_id: detail?.proposal_id,
            projectTrackingId: detail?.proposal_id,
            title: detail?.title,
            referenceNumber: detail?.reference_number,
            reference_number: detail?.reference_number,
          };
        }
      }
      return gradedProposals.find(
        (item: any) =>
          String(item.proposal_id) === form.fundedproposal ||
          String(item.project_tracking_id) === form.fundedproposal ||
          String(item.id) === form.fundedproposal,
      );
    },
    [form.fundedproposal, gradedProposals, isEditMode, existingSubmission],
  );

  const selectedExternalResearch = useMemo(
    () => {
      if (isEditMode && existingSubmission) {
        if (existingSubmission.external_research_detail) {
          const detail = existingSubmission.external_research_detail;
          return {
            ...detail,
            pi: existingSubmission.pi,
            title: detail.title,
            authors: detail.authors,
            institution: detail.institution,
            year: detail.year,
            graded_evidence: detail.graded_evidence,
          };
        }
      }
      return approvedExternalResearches.find(
        (item: any) =>
          String(item.external_research_id || item.id) === form.external_research,
      );
    },
    [form.external_research, approvedExternalResearches, isEditMode, existingSubmission],
  );

  function setFormField<K extends keyof typeof initialForm>(
    field: K,
    value: (typeof initialForm)[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSourceTypeChange(type: "proposal" | "external_research") {
    setSourceType(type);
    setForm((prev) => ({ ...prev, fundedproposal: "", external_research: "" }));
    setPrefillData(null);
    setPrefillItems([]);
  }

  async function handleFundedProposalChange(proposalVal: string) {
    setForm((prev) => ({ ...prev, fundedproposal: proposalVal, external_research: "" }));

    if (!proposalVal || !/^\d+$/.test(proposalVal)) return;

    setIsPrefilling(true);
    try {
      const selected = gradedProposals.find(
        (item: any) =>
          String(item.proposal_id) === proposalVal ||
          String(item.project_tracking_id) === proposalVal ||
          String(item.terminal_report_id) === proposalVal ||
          String(item.id) === proposalVal,
      );

      const targetProposalId = selected?.proposal_id || proposalVal;

      let prefill: any = null;
      try {
        prefill = await finalSubmissionsService.getPrefillData(targetProposalId);
      } catch {
        if (selected?.project_tracking_id) {
          try {
            prefill = await finalSubmissionsService.getPrefillData(
              selected.project_tracking_id,
            );
          } catch {
            // Ignore fallback
          }
        }
      }

      if (prefill) {
        setPrefillData(prefill);
        const pItems = prefill.items ?? [];
        setPrefillItems(pItems);
        const initialVis: Record<number | string, boolean> = {};
        pItems.forEach((it: any, idx: number) => {
          const isVis = (it.is_searchable ?? it.isSearchable) !== false;
          initialVis[it.id ?? idx] = isVis;
        });
        setItemVisibility(initialVis);

        const rawDataCenter =
          prefill.dataCenter ??
          prefill.data_center ??
          prefill.data_center_id ??
          (selected?.data_center_id ? String(selected.data_center_id) : "") ??
          (dataCenters[0]?.id ? String(dataCenters[0].id) : "");

        const pubLink =
          prefill.publicationLink ?? prefill.publication_link ?? "";

        const abstractText =
          prefill.abstract ?? prefill.main_deliverables ?? "";

        const outputTypeVal =
          prefill.outputType ?? prefill.output_type ?? "";

        setForm((prev) => ({
          ...prev,
          fundedproposal: proposalVal,
          external_research: "",
          title: prefill.title || selected?.title || prev.title,
          abstract: abstractText || prev.abstract,
          executive_summary: abstractText || prev.executive_summary,
          data_center: rawDataCenter
            ? String(rawDataCenter)
            : dataCenters[0]?.id
              ? String(dataCenters[0].id)
              : prev.data_center,
          external_link: pubLink || prev.external_link,
          output_type: outputTypeVal ? String(outputTypeVal) : prev.output_type,
        }));

        toast.success("Details prefilled from Terminal Report!", {
          description:
            "Title, Data Center, narrative, deliverables, and links populated automatically.",
        });
      } else if (selected) {
        setForm((prev) => ({
          ...prev,
          fundedproposal: proposalVal,
          external_research: "",
          title: selected.title || prev.title,
          data_center: prev.data_center || (dataCenters[0]?.id ? String(dataCenters[0].id) : ""),
        }));
      }
    } catch (error) {
      console.error("Failed to prefill submission data:", error);
    } finally {
      setIsPrefilling(false);
    }
  }

  async function handleExternalResearchChange(extVal: string) {
    setForm((prev) => ({ ...prev, external_research: extVal, fundedproposal: "" }));

    if (!extVal || !/^\d+$/.test(extVal)) return;

    setIsPrefilling(true);
    try {
      const selected = approvedExternalResearches.find(
        (item: any) => String(item.external_research_id || item.id) === extVal,
      );

      const prefill = await finalSubmissionsService.getPrefillData({
        external_research_id: extVal,
      });

      if (prefill) {
        setPrefillData(prefill);
        const pItems = prefill.items ?? [];
        setPrefillItems(pItems);
        const initialVis: Record<number | string, boolean> = {};
        pItems.forEach((it: any, idx: number) => {
          const isVis = (it.is_searchable ?? it.isSearchable) !== false;
          initialVis[it.id ?? idx] = isVis;
        });
        setItemVisibility(initialVis);

        const rawDataCenter =
          prefill.dataCenter ??
          prefill.data_center ??
          prefill.data_center_id ??
          (selected?.data_center_id ? String(selected.data_center_id) : "") ??
          (dataCenters[0]?.id ? String(dataCenters[0].id) : "");

        const pubLink =
          prefill.publication_link ?? prefill.external_link ?? "";

        const abstractText =
          prefill.abstract ?? prefill.executive_summary ?? "";

        const outputTypeVal =
          prefill.output_type ?? prefill.outputType ?? "";

        setForm((prev) => ({
          ...prev,
          external_research: extVal,
          fundedproposal: "",
          title: prefill.title || selected?.title || prev.title,
          abstract: abstractText || prev.abstract,
          executive_summary: prefill.executive_summary || abstractText || prev.executive_summary,
          data_center: rawDataCenter
            ? String(rawDataCenter)
            : dataCenters[0]?.id
              ? String(dataCenters[0].id)
              : prev.data_center,
          external_link: pubLink || prev.external_link,
          doi: prefill.doi || prev.doi || "",
          output_type: outputTypeVal ? String(outputTypeVal) : prev.output_type,
        }));

        toast.success("Details prefilled from Approved External Research!", {
          description:
            "Title, Data Center, narrative, deliverables, and links populated automatically.",
        });
      } else if (selected) {
        setForm((prev) => ({
          ...prev,
          external_research: extVal,
          fundedproposal: "",
          title: selected.title || prev.title,
          data_center: prev.data_center || (dataCenters[0]?.id ? String(dataCenters[0].id) : ""),
        }));
      }
    } catch (error) {
      console.error("Failed to prefill external research data:", error);
    } finally {
      setIsPrefilling(false);
    }
  }

  useEffect(() => {
    if (isEditMode) return;
    if (
      initialProposalParam &&
      gradedProposals.length > 0 &&
      !form.fundedproposal
    ) {
      const matched = gradedProposals.find(
        (p: any) =>
          String(p.proposal_id) === initialProposalParam ||
          String(p.project_tracking_id) === initialProposalParam ||
          String(p.id) === initialProposalParam,
      );

      const targetVal = matched
        ? String(matched.proposal_id || matched.project_tracking_id || matched.id)
        : initialProposalParam;

      void handleFundedProposalChange(targetVal);
    }
  }, [initialProposalParam, gradedProposals, isEditMode]);

  useEffect(() => {
    if (!existingSubmission || !isEditMode) return;

    const isExternal = !!existingSubmission.external_research;
    setSourceType(isExternal ? "external_research" : "proposal");

    setForm({
      title: existingSubmission.title ?? "",
      abstract: existingSubmission.abstract ?? "",
      executive_summary: existingSubmission.executive_summary ?? "",
      external_link: existingSubmission.external_link ?? "",
      doi: existingSubmission.doi ?? "",
      ndmc_submission_reference: existingSubmission.ndmc_submission_reference ?? "",
      status: existingSubmission.status,
      fundedproposal: existingSubmission.fundedproposal ? String(existingSubmission.fundedproposal) : "",
      external_research: existingSubmission.external_research ? String(existingSubmission.external_research) : "",
      output_type: String(existingSubmission.output_type ?? ""),
      data_center: existingSubmission.data_center ? String(existingSubmission.data_center) : "",
    });
    setFiles({
      full_report: null,
      policy_brief: null,
      supplementary_document: null,
    });

    const proposalId = existingSubmission.fundedproposal_detail?.proposal_id;
    const externalResearchId = existingSubmission.external_research_detail?.id || existingSubmission.external_research;

    if (proposalId) {
      setIsPrefilling(true);
      finalSubmissionsService
        .getPrefillData(proposalId)
        .then((prefill) => {
          setPrefillData(prefill);
          setPrefillItems(prefill.items ?? []);
        })
        .catch(() => {
          setPrefillItems([]);
          setPrefillData(null);
        })
        .finally(() => {
          setIsPrefilling(false);
        });
    } else if (externalResearchId) {
      setIsPrefilling(true);
      finalSubmissionsService
        .getPrefillData({ external_research_id: externalResearchId })
        .then((prefill) => {
          setPrefillData(prefill);
          setPrefillItems(prefill.items ?? []);
        })
        .catch(() => {
          setPrefillItems([]);
          setPrefillData(null);
        })
        .finally(() => {
          setIsPrefilling(false);
        });
    }
  }, [existingSubmission, isEditMode]);

  const hasNarrative = !!form.abstract.trim() || !!form.executive_summary.trim();
  const isSourceSelected = sourceType === "proposal" ? !!form.fundedproposal : !!form.external_research;

  const checklist = [
    {
      key: "source_record",
      label: sourceType === "proposal" ? "Graded proposal selected" : "Approved external research selected",
      required: true,
      done: isSourceSelected,
    },
    { key: "title", label: "Submission title entered", required: true, done: !!form.title.trim() },
    { key: "narrative", label: "Narrative details entered (Abstract or Executive Summary)", required: true, done: hasNarrative },
    { key: "prefill", label: "Record data prefilled", required: false, done: !!prefillData },
    { key: "terminal_items", label: "Deliverable items loaded", required: false, done: prefillItems.length > 0 },
    { key: "data_center", label: "Data center selected", required: false, done: !!form.data_center },
  ];

  const checklistTotal = checklist.length;
  const checklistDone = checklist.filter((item) => item.done).length;

  const requiredReady = !!form.title.trim() && isSourceSelected && hasNarrative;

  async function handleSubmit(targetStatus: FinalSubmissionStatus) {
    if (!requiredReady) {
      toast.error(
        `Please select an eligible ${sourceType === "proposal" ? "proposal" : "external research entry"}, enter a submission title, and provide at least one Narrative Detail (Abstract or Executive Summary) before saving.`,
      );
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

    const defaultOutputType =
      form.output_type ||
      (prefillData?.output_type ? String(prefillData.output_type) : "") ||
      (outputTypes[0]?.id ? String(outputTypes[0].id) : "1");

    const itemsVisibilityArray = Object.entries(itemVisibility).map(([itemId, isSearchable]) => ({
      item_id: Number(itemId),
      is_searchable: isSearchable,
    }));

    const payload: any = {
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
      fundedproposal: form.fundedproposal ? Number(form.fundedproposal) : null,
      external_research: form.external_research ? Number(form.external_research) : null,
      output_type: Number(defaultOutputType),
      data_center: form.data_center ? Number(form.data_center) : null,
      is_published: String(form.is_published),
      items_visibility: JSON.stringify(itemsVisibilityArray),
    };

    try {
      if (isEditMode && editId) {
        await updateMutation.mutateAsync({ id: editId, values: payload });
        toast.success(
          targetStatus === "submitted"
            ? "Final submission submitted."
            : "Draft saved.",
        );
      } else {
        await createMutation.mutateAsync(payload as FinalSubmissionCreateInput);
        toast.success(
          targetStatus === "submitted"
            ? "Final submission submitted."
            : "Draft saved.",
        );
      }
      router.push("/research/repository");
    } catch (error: any) {
      console.error("Submission error:", error?.response?.data || error);
      const rawData = error?.response?.data;
      const errObj = rawData?.error || rawData;
      const details = errObj?.details || (typeof errObj === "object" ? errObj : null);

      if (details && typeof details === "object") {
        const messages: string[] = [];
        Object.entries(details).forEach(([key, val]) => {
          if (key === "message" || key === "detail" || key === "code" || key === "success") return;
          const msgList = Array.isArray(val) ? val.join(", ") : String(val);
          messages.push(`${key !== "non_field_errors" ? `${key}: ` : ""}${msgList}`);
        });

        if (messages.length > 0) {
          toast.error(messages.join(" | "));
          setPendingAction(null);
          return;
        }
      }

      const message =
        errObj?.message ||
        rawData?.message ||
        rawData?.detail ||
        error?.message ||
        "Failed to save the final submission.";
      toast.error(message);
      setPendingAction(null);
    }
  }

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  const isLookupLoading =
    gradedRepositoryQuery.isLoading ||
    outputTypesQuery.isLoading ||
    dataCentersQuery.isLoading;

  return (
    <PageContainer
      title={isEditMode ? "Edit Final Submission" : "Register Final Submission"}
      description={
        isEditMode
          ? "Update an existing final submission entry."
          : "Create and archive a final submission entry linked to an approved funded proposal and graded terminal report."
      }
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/research/repository">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl px-5 font-bold uppercase tracking-widest"
            disabled={!!pendingAction || isPrefilling || isExistingLoading}
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
            disabled={!!pendingAction || isPrefilling || isExistingLoading}
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
          id="final-submission-form"
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          {/* Section 1: Linked Record Selection */}
          <Card className="overflow-hidden border border-muted-foreground/10 shadow-sm">
            <CardHeader className="border-b bg-slate-50/70 dark:bg-slate-900/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" />
                Submission Identity
              </CardTitle>
              <CardDescription>
                Select an internal proposal or an approved external research to prefill submission data.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 p-6 sm:grid-cols-2">
              {!isEditMode && (
                <div className="sm:col-span-2 flex items-center gap-1.5 p-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-border/60">
                  <button
                    type="button"
                    onClick={() => handleSourceTypeChange("proposal")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-full text-xs font-bold transition-all cursor-pointer",
                      sourceType === "proposal"
                        ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <FileText className="h-3.5 w-3.5 text-indigo-500" />
                    Internal Proposal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSourceTypeChange("external_research")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-full text-xs font-bold transition-all cursor-pointer",
                      sourceType === "external_research"
                        ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Globe className="h-3.5 w-3.5 text-sky-500" />
                    External Research
                  </button>
                </div>
              )}

              {sourceType === "proposal" ? (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="fundedproposal">
                    Proposal <span className="text-destructive">*</span>
                  </Label>
                  {isEditMode ? (
                    <div className="flex h-11 items-center rounded-xl border border-muted-foreground/20 bg-muted/30 px-4 text-sm font-medium text-muted-foreground">
                      {selectedProposal?.title || `Proposal #${form.fundedproposal}`}
                      <Badge variant="secondary" className="ml-2 text-[10px] font-bold uppercase tracking-wider border-none">
                        Locked
                      </Badge>
                    </div>
                  ) : (
                    <SearchableSelect
                      value={form.fundedproposal}
                      onValueChange={(val) => void handleFundedProposalChange(val)}
                      disabled={isLookupLoading || isPrefilling}
                      placeholder={
                        isLookupLoading
                          ? "Loading eligible graded proposals..."
                          : isPrefilling
                            ? "Prefilling submission data..."
                            : "Choose an eligible graded proposal"
                      }
                      options={gradedProposals}
                      getOptionValue={(item: any) =>
                        String(item.proposal_id ?? item.proposalId ?? item.project_tracking_id ?? item.projectTrackingId ?? item.terminal_report_id ?? item.terminalReportId ?? item.id ?? "")
                      }
                      getOptionLabel={(item: any) => item.title}
                      renderOption={(item: any) => (
                        <div className="flex flex-col py-1 text-left">
                          <span className="font-semibold">{item.title}</span>
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Ref: {item.referenceNumber || item.reference_number || `PT-${item.projectTrackingId || item.project_tracking_id}`} · Data Center: {item.dataCenterName || item.data_center_name || "Repository"}
                          </span>
                        </div>
                      )}
                    />
                  )}
                </div>
              ) : (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="external_research">
                    Approved External Research <span className="text-destructive">*</span>
                  </Label>
                  {isEditMode ? (
                    <div className="flex h-11 items-center rounded-xl border border-muted-foreground/20 bg-muted/30 px-4 text-sm font-medium text-muted-foreground">
                      {selectedExternalResearch?.title || `External Research #${form.external_research}`}
                      <Badge variant="secondary" className="ml-2 text-[10px] font-bold uppercase tracking-wider border-none">
                        Locked
                      </Badge>
                    </div>
                  ) : (
                    <SearchableSelect
                      value={form.external_research}
                      onValueChange={(val) => void handleExternalResearchChange(val)}
                      disabled={isLookupLoading || isPrefilling}
                      placeholder={
                        isLookupLoading
                          ? "Loading approved external research entries..."
                          : isPrefilling
                            ? "Prefilling external research data..."
                            : "Choose an approved external research entry"
                      }
                      options={approvedExternalResearches}
                      getOptionValue={(item: any) =>
                        String(item.external_research_id ?? item.externalResearchId ?? item.id ?? "")
                      }
                      getOptionLabel={(item: any) => item.title}
                      renderOption={(item: any) => (
                        <div className="flex flex-col py-1 text-left">
                          <span className="font-semibold">{item.title}</span>
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Authors: {item.authors || "N/A"} · Inst: {item.institution || "N/A"} · Year: {item.year || "N/A"}
                          </span>
                        </div>
                      )}
                    />
                  )}
                </div>
              )}

              {/* Prefilled Confirmation Banner */}
              {prefillData && (
                <div className="sm:col-span-2 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800 p-4 text-sm text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="font-semibold text-xs uppercase tracking-wide">
                        {sourceType === "proposal" ? "Prefilled from Approved Final Report" : "Prefilled from Approved External Research"}
                      </p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300/90 mt-0.5">
                        Title, Data Center, Deliverables, and Links have been loaded automatically.
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-600 text-white border-none text-[10px] font-bold uppercase tracking-wider shrink-0">
                    Auto-filled
                  </Badge>
                </div>
              )}

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="title">
                  Submission Title <span className="text-destructive">*</span>
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
                <Label htmlFor="data_center">Data Center</Label>
                <SearchableSelect
                  value={form.data_center}
                  onValueChange={(value) => setFormField("data_center", value)}
                  disabled={isLookupLoading}
                  placeholder={
                    isLookupLoading
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
                    setFormField(
                      "ndmc_submission_reference",
                      event.target.value,
                    )
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
                {isEditMode
                  ? "Review and replace files attached to this submission."
                  : prefillData
                    ? "Graded deliverables and files loaded from the approved terminal report."
                    : "Select a proposal above to load deliverables from the terminal report."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {/* Graded Deliverables from Terminal Report items */}
              {(() => {
                const items: any[] = prefillItems || [];
                const supportingFiles: any[] =
                  prefillData?.supportingFiles ||
                  prefillData?.supporting_files ||
                  [];

                // Show graded items if available, otherwise fall back to supportingFiles
                if (items.length > 0) {
                  return (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Graded Deliverables
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] gap-1 px-2.5 rounded-lg border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                            onClick={() => {
                              const newVis: Record<number | string, boolean> = {};
                              items.forEach((it: any, idx: number) => {
                                newVis[it.id ?? idx] = true;
                              });
                              setItemVisibility(newVis);
                            }}
                          >
                            <Globe className="h-3 w-3" />
                            Make All Public
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] gap-1 px-2.5 rounded-lg border-amber-200 bg-amber-50/50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300"
                            onClick={() => {
                              const newVis: Record<number | string, boolean> = {};
                              items.forEach((it: any, idx: number) => {
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
                            {items.length} {items.length === 1 ? "Deliverable" : "Deliverables"}
                          </Badge>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-border/60 overflow-hidden">
                        {items.map((item: any, idx: number) => {
                          const itemFile = item.file;
                          const itemLink =
                            item.externalLink || item.external_link;
                          const typeName =
                            item.terminalTypeName ||
                            item.terminal_type_name ||
                            `Deliverable #${item.terminalType || item.terminal_type || idx + 1}`;
                          const gradeName =
                            item.gradeName || item.grade_name;

                          // Grade color mapping
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
                              className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${idx > 0 ? "border-t border-border/40" : ""
                                }`}
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
                                    className="text-xs font-semibold cursor-pointer select-none"
                                  >
                                    {itemVisibility[item.id ?? idx] !== false ? (
                                      <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                        <Globe className="h-3.5 w-3.5" /> Public in Repo
                                      </span>
                                    ) : (
                                      <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                        <EyeOff className="h-3.5 w-3.5" /> Hidden / Internal
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
                  );
                }

                // Fallback: show supportingFiles if items are empty but supportingFiles exist
                if (supportingFiles.length > 0) {
                  return (
                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Supporting Files
                      </p>
                      <div className="rounded-2xl border border-border/60 overflow-hidden">
                        {supportingFiles.map((sf: any, sfIdx: number) => {
                          const fileUrl = sf.file || sf.file_url;
                          const extLink =
                            sf.externalLink || sf.external_link;
                          return (
                            <div
                              key={`sf-${sf.key || sfIdx}`}
                              className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${sfIdx > 0 ? "border-t border-border/40" : ""
                                }`}
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5">
                                  {extLink && !fileUrl ? (
                                    <Globe className="h-4.5 w-4.5 text-primary" />
                                  ) : (
                                    <FileText className="h-4.5 w-4.5 text-primary" />
                                  )}
                                </div>
                                <div className="min-w-0 space-y-0.5">
                                  <p className="text-sm font-semibold text-foreground truncate">
                                    {sf.label || `File #${sfIdx + 1}`}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {fileUrl ? "File attached" : ""}
                                    {fileUrl && extLink ? " · " : ""}
                                    {extLink ? "External link" : ""}
                                  </p>
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                {fileUrl && (
                                  <>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 text-xs gap-1.5 rounded-lg"
                                      onClick={() => {
                                        const url = resolveFileUrl(fileUrl);
                                        if (url) {
                                          setPreviewUrl(url);
                                          setPreviewTitle(sf.label || `File #${sfIdx + 1}`);
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
                                        downloadRemoteFile(fileUrl, extractFileName(fileUrl))
                                      }
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                      Download
                                    </Button>
                                  </>
                                )}
                                {extLink && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs gap-1.5 rounded-lg"
                                    onClick={() =>
                                      window.open(extLink, "_blank", "noopener,noreferrer")
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
                  );
                }

                // Edit mode: show existing files from the submission
                if (isEditMode && existingSubmission) {
                  const subFiles = [
                    { key: "full_report", label: "Full Report", url: existingSubmission.full_report },
                    { key: "policy_brief", label: "Policy Brief", url: existingSubmission.policy_brief },
                    { key: "supplementary_document", label: "Supplementary Document", url: existingSubmission.supplementary_document },
                  ].filter((e) => e.url);

                  if (subFiles.length > 0) {
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Existing Files
                          </p>
                          <Badge variant="outline" className="text-[10px] font-semibold gap-1">
                            <Paperclip className="h-3 w-3" />
                            {subFiles.length} {subFiles.length === 1 ? "File" : "Files"}
                          </Badge>
                        </div>
                        <div className="rounded-2xl border border-border/60 overflow-hidden">
                          {subFiles.map((entry, idx) => (
                            <div
                              key={entry.key}
                              className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${idx > 0 ? "border-t border-border/40" : ""}`}
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5">
                                  <FileText className="h-4.5 w-4.5 text-primary" />
                                </div>
                                <div className="min-w-0 space-y-1.5">
                                  <p className="text-sm font-semibold text-foreground leading-tight">
                                    {entry.label}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {extractFileName(entry.url!)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs gap-1.5 rounded-lg"
                                  onClick={() => {
                                    const url = resolveFileUrl(entry.url!);
                                    if (url) {
                                      setPreviewUrl(url);
                                      setPreviewTitle(entry.label);
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
                                    downloadRemoteFile(entry.url!, extractFileName(entry.url!))
                                  }
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                }

                // No proposal selected yet
                if (!prefillData) {
                  return (
                    <div className="rounded-2xl border border-dashed border-muted-foreground/20 bg-slate-50/50 dark:bg-slate-900/30 p-8 text-center">
                      <FolderUp className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">
                        {isEditMode ? "No uploaded files" : "No deliverables loaded yet"}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {isEditMode
                          ? "Use the section below to upload files for this submission."
                          : "Select an eligible proposal above to load graded deliverables from the terminal report."}
                      </p>
                    </div>
                  );
                }

                // Proposal selected but no files
                return (
                  <div className="rounded-2xl border border-dashed border-muted-foreground/20 bg-slate-50/50 dark:bg-slate-900/30 p-6 text-center text-sm text-muted-foreground">
                    {isEditMode
                      ? "No files attached to this submission."
                      : "No deliverables or files found in the terminal report for this proposal."}
                  </div>
                );
              })()}

              {/* Attach Additional Files — collapsible */}
              <details className="group">
                <summary className="flex cursor-pointer items-center gap-2 rounded-xl px-1 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors select-none">
                  <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                  {isEditMode
                    ? (files.full_report || files.policy_brief || files.supplementary_document
                      ? "Replace or Add Files (optional)"
                      : "Upload New Files (optional)")
                    : "Attach Additional Files (optional)"}
                </summary>
                <div className="mt-3 space-y-4 rounded-2xl border border-dashed border-muted-foreground/15 bg-slate-50/40 dark:bg-slate-900/20 p-4">
                  <FileField
                    id="full_report"
                    label="Full Report"
                    helperText={isEditMode ? "Upload a new report document to replace the current file." : "Upload a report document to supplement or override the terminal report file."}
                    file={files.full_report}
                    existingUrl={isEditMode ? existingSubmission?.full_report ?? null : null}
                    onFileChange={(file) =>
                      setFiles((prev) => ({ ...prev, full_report: file }))
                    }
                  />
                  <FileField
                    id="policy_brief"
                    label="Policy Brief"
                    helperText="Attach a policy brief or executive brief."
                    file={files.policy_brief}
                    existingUrl={isEditMode ? existingSubmission?.policy_brief ?? null : undefined}
                    onFileChange={(file) =>
                      setFiles((prev) => ({ ...prev, policy_brief: file }))
                    }
                  />
                  <FileField
                    id="supplementary_document"
                    label="Supplementary Document"
                    helperText="Attach any supplementary material or annex."
                    file={files.supplementary_document}
                    existingUrl={isEditMode ? existingSubmission?.supplementary_document ?? null : undefined}
                    onFileChange={(file) =>
                      setFiles((prev) => ({
                        ...prev,
                        supplementary_document: file,
                      }))
                    }
                  />
                </div>
              </details>

              <Separator />

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="external_link">External Link / Publication URL</Label>
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
                  <Label htmlFor="doi">DOI (optional)</Label>
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
                {sourceType === "proposal" ? "Selected Proposal" : "Selected External Research"}
              </CardTitle>
              <CardDescription>
                {sourceType === "proposal"
                  ? "Review the proposal record backing this final submission."
                  : "Review the external research record backing this final submission."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {sourceType === "proposal" ? (
                selectedProposal ? (
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
                      This proposal has an approved, fully graded terminal report and is eligible for final repository registration.
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-muted-foreground/20 bg-slate-50 dark:bg-slate-900/40 p-4 text-xs text-muted-foreground">
                    Choose an eligible proposal above to view its funding record and load prefilled data.
                  </div>
                )
              ) : selectedExternalResearch ? (
                <>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Authors / Institution
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {selectedExternalResearch.authors || "N/A"}
                      {selectedExternalResearch.institution ? ` (${selectedExternalResearch.institution})` : ""}
                    </p>
                  </div>
                  {selectedExternalResearch.year && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Publication Year
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {selectedExternalResearch.year}
                      </p>
                    </div>
                  )}
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800 p-4 text-xs text-emerald-800 dark:text-emerald-300">
                    This external research entry has been reviewed & approved and is eligible for final repository registration.
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-muted-foreground/20 bg-slate-50 dark:bg-slate-900/40 p-4 text-xs text-muted-foreground">
                  Choose an approved external research entry above to view its metadata and load prefilled data.
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
                  All checks passed — ready to register
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
