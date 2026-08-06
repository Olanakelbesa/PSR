"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Building,
  Check,
  CheckCircle2,
  Circle,
  Copy,
  Database,
  FileCheck,
  FileText,
  Globe,
  Loader2,
  Paperclip,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  Upload,
  User,
  Link2,
  Lock,
  Tag,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useDataCenters, useOutputTypes } from "@/hooks/useFinalSubmissions";
import { useTerminalReportTypes } from "@/hooks/useReference";
import {
  useExternalResearch,
  useCreateExternalResearch,
  useUpdateExternalResearch,
  externalResearchKeys,
} from "@/hooks/useExternalResearch";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { cn } from "@/lib/utils";

interface OutputTypeItemConfig {
  output_type_id: number;
  name: string;
  upload_mode: "file" | "link";
  file: File | null;
  external_link: string;
  existing_file_url?: string | null;
}

function AddExternalResearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const editId = searchParams.get("edit_id") || searchParams.get("id");

  const { data: existingResearch } = useExternalResearch(editId || undefined);
  const createMutation = useCreateExternalResearch();
  const updateMutation = useUpdateExternalResearch();

  const statusLower = (
    existingResearch?.approval_status ||
    (existingResearch as any)?.approvalStatus ||
    ""
  )
    .toString()
    .toLowerCase();

  const isApproved = statusLower === "approved";
  const isUnderReviewOrSubmitted =
    statusLower === "submitted" ||
    statusLower === "under_review" ||
    statusLower === "pending";

  const researchLocked = !!existingResearch && (isApproved || isUnderReviewOrSubmitted);

  const dataCentersQuery = useDataCenters();
  const dataCenters = dataCentersQuery.data?.data ?? [];

  const { data: terminalReportTypes = [], isLoading: isLoadingTerminalTypes } = useTerminalReportTypes();
  const outputTypesQuery = useOutputTypes();

  // Dynamically extract Output Types returned from backend API queries with unique keys
  const outputTypes = useMemo(() => {
    const list: Array<{ id: number; name: string; key: string }> = [];
    const seenNames = new Set<string>();
    const seenIds = new Set<number>();

    const addItems = (items: any[]) => {
      if (!Array.isArray(items)) return;
      items.forEach((item) => {
        const rawId = Number(item.id ?? item.pk);
        const name = String(item.name || "").trim();
        if (name && !seenNames.has(name.toLowerCase())) {
          seenNames.add(name.toLowerCase());
          let finalId = rawId;
          if (seenIds.has(finalId)) {
            finalId = 1000 + rawId + list.length;
          }
          seenIds.add(finalId);
          list.push({ id: finalId, name, key: `ot-${finalId}-${list.length}` });
        }
      });
    };

    // 1. Backend OutputTypes (/v1/outputtypes/)
    const rawOt = outputTypesQuery.data;
    if (Array.isArray(rawOt)) addItems(rawOt);
    else if (rawOt && Array.isArray((rawOt as any).data)) addItems((rawOt as any).data);
    else if (rawOt && Array.isArray((rawOt as any).results)) addItems((rawOt as any).results);

    // 2. Backend Terminal Report Types reference data (/v1/terminalreporttypes/)
    if (Array.isArray(terminalReportTypes)) addItems(terminalReportTypes);

    return list;
  }, [outputTypesQuery.data, terminalReportTypes]);

  const isLoadingTypes = isLoadingTerminalTypes || outputTypesQuery.isLoading;

  // Form State
  const [title, setTitle] = useState<string>("");
  const [authors, setAuthors] = useState<string>("");
  const [institution, setInstitution] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [abstract, setAbstract] = useState<string>("");
  const [executiveSummary, setExecutiveSummary] = useState<string>("");
  const [gradedEvidence, setGradedEvidence] = useState<string>("not_graded");
  const [doi, setDoi] = useState<string>("");
  const [externalLink, setExternalLink] = useState<string>("");
  const [keywords, setKeywords] = useState<string>("");

  // Primary Single Upload Fallbacks
  const [fullReportFile, setFullReportFile] = useState<File | null>(null);
  const [policyBriefFile, setPolicyBriefFile] = useState<File | null>(null);
  const [supplementaryFile, setSupplementaryFile] = useState<File | null>(null);

  // Multi-select Output Types & Dynamic File Upload Configurations
  const [selectedTypeIds, setSelectedTypeIds] = useState<number[]>([]);
  const [typeConfigs, setTypeConfigs] = useState<Record<number, OutputTypeItemConfig>>({});

  // Data Center
  const [selectedDataCenterId, setSelectedDataCenterId] = useState<string>("");
  const [customDataCenter, setCustomDataCenter] = useState<string>("");
  const [checklistCompleted, setChecklistCompleted] = useState<boolean>(false);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const syncedIdRef = useRef<string | number | null>(null);

  // Toggle selection for an output type checkbox matching final-report/new pattern EXACTLY
  const handleTypeToggle = (typeId: number, name: string) => {
    if (researchLocked) return;
    const isChecked = selectedTypeIds.some((id) => Number(id) === Number(typeId));
    if (isChecked) {
      setSelectedTypeIds((prev) => prev.filter((id) => Number(id) !== Number(typeId)));
      setTypeConfigs((prev) => {
        const copy = { ...prev };
        delete copy[typeId];
        return copy;
      });
    } else {
      setSelectedTypeIds((prev) => [...prev, typeId]);
      setTypeConfigs((prev) => ({
        ...prev,
        [typeId]: {
          output_type_id: typeId,
          name,
          upload_mode: "file",
          file: null,
          external_link: "",
        },
      }));
    }
  };

  // Modify configuration for a selected output type
  const handleItemConfigChange = (
    typeId: number,
    updates: Partial<OutputTypeItemConfig>
  ) => {
    if (researchLocked) return;
    setTypeConfigs((prev) => ({
      ...prev,
      [typeId]: {
        ...prev[typeId],
        ...updates,
      },
    }));
  };

  // Populate existing data when editing (Guarded strictly on existingResearch.id)
  useEffect(() => {
    if (!existingResearch || syncedIdRef.current === existingResearch.id) {
      return;
    }
    syncedIdRef.current = existingResearch.id;

    setTitle(existingResearch.title || "");
    setAuthors(existingResearch.authors || "");
    setInstitution(existingResearch.institution || "");
    setDepartment(existingResearch.department || "");
    setYear(
      existingResearch.year
        ? String(existingResearch.year)
        : String(new Date().getFullYear())
    );
    setAbstract(existingResearch.abstract || "");
    setExecutiveSummary(
      existingResearch.executive_summary ||
        (existingResearch as any).executiveSummary ||
        ""
    );
    setGradedEvidence(
      existingResearch.graded_evidence ||
        (existingResearch as any).gradedEvidence ||
        "not_graded"
    );
    setDoi(existingResearch.doi || "");

    const extLink =
      existingResearch.external_link ||
      (existingResearch as any).externalLink ||
      "";
    setExternalLink(extLink);

    setKeywords(existingResearch.keywords || "");

    // Unified Output Types & Uploaded Files Populator
    const extractedTypeIds: number[] = [];
    const initialConfigs: Record<number, OutputTypeItemConfig> = {};

    const addConfig = (
      typeId: number,
      name: string,
      fileUrl: string | null,
      linkUrl: string
    ) => {
      if (!typeId || Number.isNaN(typeId)) return;
      if (!extractedTypeIds.includes(typeId)) {
        extractedTypeIds.push(typeId);
      }

      const existingConfig = initialConfigs[typeId];
      const resolvedFileUrl = fileUrl || existingConfig?.existing_file_url || null;
      const resolvedLinkUrl = linkUrl || existingConfig?.external_link || "";
      const mode: "file" | "link" = resolvedFileUrl ? "file" : resolvedLinkUrl ? "link" : "file";

      initialConfigs[typeId] = {
        output_type_id: typeId,
        name: name || existingConfig?.name || `Type #${typeId}`,
        upload_mode: mode,
        file: existingConfig?.file || null,
        external_link: resolvedLinkUrl,
        existing_file_url: resolvedFileUrl,
      };
    };

    // 1. Items array from backend
    const items = existingResearch.items || (existingResearch as any).external_research_items || [];
    if (Array.isArray(items) && items.length > 0) {
      items.forEach((it: any) => {
        const typeId = Number(it.output_type || it.outputType || it.output_type_id);
        const typeObj = outputTypes.find((t: any) => Number(t.id ?? t.pk) === typeId);
        const typeName = it.output_type_name || it.outputTypeName || typeObj?.name || `Type #${typeId}`;
        const fileUrl = it.file || it.file_url || it.fileUrl || null;
        const linkUrl = it.external_link || it.externalLink || "";
        addConfig(typeId, typeName, fileUrl, linkUrl);
      });
    } else {
      // 2. Fallback to output_types_detail / outputTypes / output_type
      const otsDetail =
        existingResearch.output_types_detail ||
        (existingResearch as any).outputTypesDetail ||
        [];
      const otsList =
        existingResearch.output_types ||
        (existingResearch as any).outputTypes ||
        [];
      const otDetail =
        existingResearch.output_type_detail ||
        (existingResearch as any).outputTypeDetail;
      const otId =
        existingResearch.output_type || (existingResearch as any).outputType;

      const getSavedFileForType = (typeName: string) => {
        const lower = (typeName || "").toLowerCase();
        if (lower.includes("policy")) {
          return (
            existingResearch.policy_brief ||
            (existingResearch as any).policyBrief ||
            null
          );
        }
        if (lower.includes("supple") || lower.includes("data")) {
          return (
            existingResearch.supplementary_document ||
            (existingResearch as any).supplementaryDocument ||
            null
          );
        }
        return (
          existingResearch.full_report ||
          (existingResearch as any).fullReport ||
          existingResearch.file ||
          null
        );
      };

      if (Array.isArray(otsDetail) && otsDetail.length > 0) {
        otsDetail.forEach((ot: any) => {
          const id = Number(ot.id);
          const name = ot.name || `Type #${id}`;
          const savedFile = getSavedFileForType(name);
          addConfig(id, name, savedFile, extLink);
        });
      }

      if (Array.isArray(otsList) && otsList.length > 0) {
        otsList.forEach((rawId: any) => {
          const id = Number(rawId?.id || rawId);
          const typeObj = outputTypes.find((t: any) => Number(t.id ?? t.pk) === id);
          const name = rawId?.name || typeObj?.name || `Type #${id}`;
          const savedFile = getSavedFileForType(name);
          addConfig(id, name, savedFile, extLink);
        });
      }

      const fallbackId = Number(otDetail?.id || otId);
      if (fallbackId && !Number.isNaN(fallbackId)) {
        const name = otDetail?.name || `Type #${fallbackId}`;
        const savedFile = getSavedFileForType(name);
        addConfig(fallbackId, name, savedFile, extLink);
      }
    }

    if (extractedTypeIds.length > 0) {
      setSelectedTypeIds(extractedTypeIds);
      setTypeConfigs(initialConfigs);
    }

    // Data Center
    const dcDetail =
      existingResearch.data_center_detail ||
      (existingResearch as any).dataCenterDetail;
    const dcId =
      existingResearch.data_center || (existingResearch as any).dataCenter;
    const customDc =
      existingResearch.custom_data_center ||
      (existingResearch as any).customDataCenter;

    if (dcDetail?.id) {
      setSelectedDataCenterId(String(dcDetail.id));
    } else if (dcId) {
      setSelectedDataCenterId(String(dcId));
    } else if (customDc) {
      setSelectedDataCenterId("other");
      setCustomDataCenter(customDc);
    }

    setChecklistCompleted(
      Boolean(
        existingResearch.data_sharing_checklist_completed ??
          (existingResearch as any).dataSharingChecklistCompleted
      )
    );
  }, [existingResearch, outputTypes]);

  // Formatted data center options for SearchableSelect
  const dataCenterSelectOptions = useMemo(() => {
    const list = dataCenters.map((dc: any) => ({
      value: String(dc.id),
      label: dc.name,
      data: dc,
    }));
    list.push({
      value: "other",
      label: "Other / Custom Repository",
      data: null,
    });
    return list;
  }, [dataCenters]);

  const selectedDataCenterName = useMemo(() => {
    if (!selectedDataCenterId) return "Not selected";
    if (selectedDataCenterId === "other") return customDataCenter || "Custom Repository";
    const dc = dataCenters.find((d: any) => String(d.id) === selectedDataCenterId);
    return dc?.name || "Selected";
  }, [dataCenters, selectedDataCenterId, customDataCenter]);

  const isDataCenterSelected =
    !!selectedDataCenterId &&
    (selectedDataCenterId !== "other" || !!customDataCenter.trim());

  // Interactive submission checklist progress steps — single source of truth for step labels & numbering
  const checklistItems = useMemo(() => {
    return [
      {
        id: "metadata",
        label: "Research Metadata & Overview",
        sublabel: title.trim() ? title : "Enter research title, authors & institution",
        completed: !!title.trim() && !!authors.trim() && !!institution.trim(),
      },
      {
        id: "output_types",
        label: "Output Types & Files Uploads",
        sublabel:
          selectedTypeIds.length > 0
            ? `${selectedTypeIds.length} Output Type(s) Configured`
            : "Select research output types and attach files",
        completed: selectedTypeIds.length > 0,
      },
      {
        id: "datacenter",
        label: "Target Repository Data Center",
        sublabel: isDataCenterSelected ? selectedDataCenterName : "Select repository data center",
        completed: isDataCenterSelected,
      },
      {
        id: "compliance",
        label: "Data Sharing & Compliance Confirmation",
        sublabel: checklistCompleted ? "Confirmed" : "Confirm data sharing checklist box",
        completed: checklistCompleted,
      },
    ];
  }, [
    title,
    authors,
    institution,
    selectedTypeIds,
    isDataCenterSelected,
    selectedDataCenterName,
    checklistCompleted,
  ]);

  /** Helper: returns "N. Label" for the given step id from checklistItems */
  const stepTitle = (stepId: string) => {
    const idx = checklistItems.findIndex((s) => s.id === stepId);
    if (idx === -1) return stepId;
    return `${idx + 1}. ${checklistItems[idx].label}`;
  };

  const completedCount = checklistItems.filter((i) => i.completed).length;
  const progressPercent = Math.round((completedCount / checklistItems.length) * 100);

  /**
   * Build FormData payload — mirrors final-report/new/page.tsx exactly.
   * Sends multi-value `output_type` entries + `file_{typeId}` OR `external_link_{typeId}`.
   */
  const buildPayload = (isDraft: boolean) => {
    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("authors", authors.trim());
    formData.append("institution", institution.trim());
    if (department.trim()) formData.append("department", department.trim());
    formData.append("year", year || String(new Date().getFullYear()));
    if (abstract.trim()) formData.append("abstract", abstract.trim());
    if (executiveSummary.trim()) formData.append("executive_summary", executiveSummary.trim());
    formData.append("graded_evidence", gradedEvidence);
    if (doi.trim()) formData.append("doi", doi.trim());
    if (keywords.trim()) formData.append("keywords", keywords.trim());

    formData.append("approval_status", isDraft ? "draft" : "submitted");
    formData.append("data_sharing_checklist_completed", checklistCompleted ? "true" : "false");

    if (selectedDataCenterId === "other") {
      formData.append("custom_data_center", customDataCenter.trim());
    } else if (selectedDataCenterId) {
      formData.append("data_center", selectedDataCenterId);
    }

    // Mirror final-report/new: append multi-value output_type + file/link per type
    selectedTypeIds.forEach((typeId) => {
      formData.append("output_type", String(typeId));
      const config = typeConfigs[typeId];
      if (config) {
        if (config.upload_mode === "file" && config.file) {
          formData.append(`file_${typeId}`, config.file);
        } else if (config.upload_mode === "link" && config.external_link) {
          formData.append(`external_link_${typeId}`, config.external_link.trim());
        }
      }
    });

    return formData;
  };

  // Save Draft action
  const handleSaveDraft = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (researchLocked) {
      toast.error("This external research entry has been approved and can no longer be edited.");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a research title before saving a draft.");
      return;
    }

    try {
      setIsSavingDraft(true);
      const payload = buildPayload(true);

      if (editId) {
        await updateMutation.mutateAsync({ id: editId, values: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }

      toast.success("External research draft saved!", {
        description: "Your draft has been saved. You can resume anytime from My External Research.",
      });

      router.push("/research/external-research/my-external-research");
    } catch (err: any) {
      console.error("Save Draft Error detail:", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to save draft.";
      toast.error("Save Draft Error", { description: String(msg) });
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Submit action
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (researchLocked) {
      toast.error("This external research entry has been approved and can no longer be edited.");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a research title.");
      return;
    }
    if (!authors.trim()) {
      toast.error("Please enter author name(s).");
      return;
    }
    if (!institution.trim()) {
      toast.error("Please enter the institution.");
      return;
    }
    if (selectedTypeIds.length === 0) {
      toast.error("Please select at least one research output type.");
      return;
    }
    if (!selectedDataCenterId) {
      toast.error("Please select a target repository data center.");
      return;
    }
    if (!checklistCompleted) {
      toast.error("Please confirm the data sharing checklist.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = buildPayload(false);

      if (editId) {
        await updateMutation.mutateAsync({ id: editId, values: payload });
        toast.success("External Research entry resubmitted!", {
          description: "Your entry is now awaiting committee evaluation.",
        });
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("External Research entry submitted successfully!", {
          description: "Your entry is now registered and awaiting approval.",
        });
      }

      router.push("/research/external-research/my-external-research");
    } catch (err: any) {
      console.error("Submission Error detail:", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to submit external research.";
      toast.error("Submission Error", { description: String(msg) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer
      title={editId ? "Edit External Research Entry" : "Add External Research Entry"}
      description="Register external research findings, upload report files, select data center repository, and submit for evaluation."
      actions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSavingDraft || isSubmitting}
            onClick={() => router.push("/research/external-research/my-external-research")}
            className="h-9 text-xs font-semibold gap-1.5 border-border text-muted-foreground hover:text-foreground shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancel / Back
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSavingDraft || isSubmitting || researchLocked}
            onClick={handleSaveDraft}
            className="h-9 text-xs font-semibold gap-2 border-border text-foreground hover:bg-accent shadow-2xs"
            title={researchLocked ? "This entry is locked and can no longer be edited." : undefined}
          >
            {researchLocked ? (
              <Lock className="w-4 h-4 text-muted-foreground" />
            ) : isSavingDraft ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <Save className="w-4 h-4 text-muted-foreground" />
            )}
            Save as Draft
          </Button>
          <Button
            type="submit"
            form="external-research-form"
            size="sm"
            disabled={isSavingDraft || isSubmitting || researchLocked}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-2 h-9 shadow-2xs"
            title={researchLocked ? "This entry is locked and can no longer be edited." : undefined}
          >
            {researchLocked ? (
              <Lock className="w-4 h-4" />
            ) : isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {researchLocked ? (isApproved ? "Approved — Locked" : "Submitted — Locked") : editId ? "Resubmit Entry" : "Submit Entry"}
          </Button>
        </div>
      }
    >
      <div className="w-full max-w-full space-y-6">
        {researchLocked && (
          <Card className={cn(
            "border-l-4 shadow-xs",
            isApproved
              ? "border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
              : "border-l-blue-500 bg-blue-50 dark:bg-blue-950/20"
          )}>
            <CardContent className="p-4 flex items-start gap-3">
              <Lock className={cn("h-5 w-5 shrink-0 mt-0.5", isApproved ? "text-emerald-600" : "text-blue-600")} />
              <div className="flex-1 min-w-0">
                <h3 className={cn("font-bold text-sm", isApproved ? "text-emerald-900 dark:text-emerald-200" : "text-blue-900 dark:text-blue-200")}>
                  {isApproved
                    ? "External Research Approved — Editing Locked"
                    : "External Research Under Review — Editing Locked"}
                </h3>
                <p className={cn("text-xs mt-0.5", isApproved ? "text-emerald-800 dark:text-emerald-300" : "text-blue-800 dark:text-blue-300")}>
                  {isApproved
                    ? "This external research entry has been reviewed and officially approved. It can no longer be edited or resubmitted. Contact the research committee if you need to request a change."
                    : "This external research entry has been submitted and is currently undergoing committee review. Editing is disabled until evaluation completes."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        <form id="external-research-form" onSubmit={handleSubmit}>
          <fieldset disabled={researchLocked} className={cn("contents", researchLocked && "pointer-events-none select-none")}>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] items-start">
            {/* LEFT COLUMN */}
            <div className="space-y-6 min-w-0">
              {/* STEP 1: Metadata Card */}
              <Card className="overflow-hidden border border-muted-foreground/10 shadow-sm">
                <CardHeader className="border-b bg-slate-50/70 dark:bg-slate-900/30 py-4 px-6">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FileText className="h-4.5 w-4.5 text-primary" />
                    {stepTitle("metadata")} <span className="text-destructive">*</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Research Title <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="Enter research paper or output title..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={researchLocked}
                      className="text-xs h-9 bg-background"
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Authors <span className="text-destructive">*</span></Label>
                      <Input
                        placeholder="List of authors (comma-separated)..."
                        value={authors}
                        onChange={(e) => setAuthors(e.target.value)}
                        disabled={researchLocked}
                        className="text-xs h-9 bg-background"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Institution / Organization <span className="text-destructive">*</span></Label>
                      <Input
                        placeholder="Publishing institution name..."
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        disabled={researchLocked}
                        className="text-xs h-9 bg-background"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Department</Label>
                      <Input
                        placeholder="Department name (optional)..."
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        disabled={researchLocked}
                        className="text-xs h-9 bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Publication Year</Label>
                      <Input
                        type="number"
                        placeholder="Year (e.g. 2026)"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        disabled={researchLocked}
                        className="text-xs h-9 bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Evidence Tier Grade</Label>
                      <Select value={gradedEvidence} onValueChange={setGradedEvidence} disabled={researchLocked}>
                        <SelectTrigger className="h-9 text-xs bg-background" disabled={researchLocked}>
                          <SelectValue placeholder="Evidence Tier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High Evidence Tier</SelectItem>
                          <SelectItem value="medium">Medium Evidence Tier</SelectItem>
                          <SelectItem value="low">Low Evidence Tier</SelectItem>
                          <SelectItem value="not_graded">Not Graded</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Abstract / Summary</Label>
                    <Textarea
                      rows={3}
                      placeholder="Abstract or summary of the research paper..."
                      value={abstract}
                      onChange={(e) => setAbstract(e.target.value)}
                      disabled={researchLocked}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Executive Summary</Label>
                    <Textarea
                      rows={3}
                      placeholder="Policy-focused executive summary..."
                      value={executiveSummary}
                      onChange={(e) => setExecutiveSummary(e.target.value)}
                      disabled={researchLocked}
                      className="text-xs"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">DOI Reference</Label>
                      <Input
                        placeholder="e.g. 10.1000/182"
                        value={doi}
                        onChange={(e) => setDoi(e.target.value)}
                        disabled={researchLocked}
                        className="text-xs h-9 bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">External URL Link</Label>
                      <Input
                        placeholder="https://..."
                        value={externalLink}
                        onChange={(e) => setExternalLink(e.target.value)}
                        disabled={researchLocked}
                        className="text-xs h-9 bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Keywords</Label>
                      <Input
                        placeholder="e.g. IoT, Agriculture, Ethiopia"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        disabled={researchLocked}
                        className="text-xs h-9 bg-background"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* STEP 2: Output Types & Files Uploads Card (Matching final-report/new pattern EXACTLY) */}
              <Card className="overflow-hidden border border-muted-foreground/10 shadow-sm">
                <CardHeader className="border-b bg-slate-50/70 dark:bg-slate-900/30 py-4 px-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Paperclip className="h-4.5 w-4.5 text-primary" />
                      {stepTitle("output_types")} <span className="text-destructive">*</span>
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {selectedTypeIds.length} Selected
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-5">
                  {isLoadingTypes ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground p-4">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      Loading output types...
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs text-muted-foreground">
                        Select the output types produced by your research project. You will be prompted to upload a file or add a URL link for each selected item:
                      </p>

                      {/* Multi-select Checkbox Grid */}
                      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                        {outputTypes.map((type: any, idx: number) => {
                          const typeId = Number(type.id ?? type.pk);
                          const isChecked = selectedTypeIds.some(
                            (id) => Number(id) === typeId
                          );
                          return (
                            <div
                              key={type.key || `ot-item-${typeId}-${idx}`}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-xl border transition-all select-none",
                                researchLocked ? "cursor-not-allowed opacity-60 bg-muted/40" : "cursor-pointer",
                                isChecked
                                  ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-2xs"
                                  : "border-border/60 hover:border-border hover:bg-muted/30"
                              )}
                              onClick={() => !researchLocked && handleTypeToggle(typeId, type.name)}
                            >
                              <div
                                className={cn(
                                  "h-4 w-4 rounded-md border flex items-center justify-center transition-colors shrink-0",
                                  isChecked
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : "border-muted-foreground/40 bg-background"
                                )}
                              >
                                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span className="text-xs font-semibold text-foreground flex-1 line-clamp-1">
                                {type.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Config & File Upload Cards for Selected Types */}
                      {selectedTypeIds.length > 0 && (
                        <div className="space-y-4 pt-4 border-t">
                          <Label className="text-xs font-bold text-foreground block">
                            Configure Deliverable Files & External Links ({selectedTypeIds.length})
                          </Label>

                          {selectedTypeIds.map((typeId, idx) => {
                            const config = typeConfigs[typeId];
                            if (!config) return null;

                            return (
                              <Card key={`config-card-${typeId}-${idx}`} className="p-4 border border-muted-foreground/20 bg-card space-y-3">
                                <div className="flex flex-col gap-3">
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                      <Paperclip className="w-4 h-4 text-primary shrink-0" />
                                      <span className="font-bold text-xs text-foreground">
                                        {config.name}
                                      </span>
                                    </div>

                                    {/* Upload Mode Switcher */}
                                    <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border">
                                      <button
                                        type="button"
                                        disabled={researchLocked}
                                        onClick={() =>
                                          !researchLocked &&
                                          handleItemConfigChange(typeId, {
                                            upload_mode: "file",
                                          })
                                        }
                                        className={cn(
                                          "px-3 py-1 text-[10px] font-bold rounded-md transition-all gap-1 inline-flex items-center cursor-pointer",
                                          researchLocked && "cursor-not-allowed opacity-60",
                                          config.upload_mode === "file"
                                            ? "bg-background text-primary shadow-2xs"
                                            : "text-muted-foreground hover:text-foreground"
                                        )}
                                      >
                                        <Upload className="w-3 h-3" />
                                        File Upload
                                      </button>
                                      <button
                                        type="button"
                                        disabled={researchLocked}
                                        onClick={() =>
                                          !researchLocked &&
                                          handleItemConfigChange(typeId, {
                                            upload_mode: "link",
                                          })
                                        }
                                        className={cn(
                                          "px-3 py-1 text-[10px] font-bold rounded-md transition-all gap-1 inline-flex items-center cursor-pointer",
                                          researchLocked && "cursor-not-allowed opacity-60",
                                          config.upload_mode === "link"
                                            ? "bg-background text-primary shadow-2xs"
                                            : "text-muted-foreground hover:text-foreground"
                                        )}
                                      >
                                        <Link2 className="w-3 h-3" />
                                        External Link
                                      </button>
                                    </div>
                                  </div>

                                  {/* Mode 1: File Upload */}
                                  {config.upload_mode === "file" ? (
                                    <div className="space-y-2 pt-1">
                                      <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 p-4 text-center sm:text-left">
                                        <input
                                          id={`file-input-${typeId}`}
                                          type="file"
                                          accept=".pdf,.doc,.docx,.zip,.tar.gz"
                                          disabled={researchLocked}
                                          className="hidden"
                                          onChange={(e) => {
                                            if (researchLocked) return;
                                            const file = e.target.files?.[0] || null;
                                            handleItemConfigChange(typeId, { file });
                                          }}
                                        />
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                          <div className="space-y-1.5 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <p className="text-xs font-semibold text-foreground truncate max-w-[260px]">
                                                {config.file
                                                  ? config.file.name
                                                  : config.existing_file_url
                                                  ? "Attached File Ready"
                                                  : `Upload document file for ${config.name}`}
                                              </p>
                                              {config.file && (
                                                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[9px] font-bold px-2 py-0.5 border border-blue-200">
                                                  New File Selected
                                                </Badge>
                                              )}
                                              {!config.file && config.existing_file_url && (
                                                <Badge variant="outline" className="text-[9px] font-bold text-primary border-primary/30 bg-primary/5">
                                                  Current Saved File
                                                </Badge>
                                              )}
                                            </div>

                                            <p className="text-[10px] text-muted-foreground">
                                              Supported formats: PDF, DOCX, ZIP (Max: 50MB)
                                            </p>

                                            {!config.file && config.existing_file_url && (
                                              <div className="pt-0.5">
                                                <a
                                                  href={resolveFileUrl(config.existing_file_url) || "#"}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline bg-background px-2.5 py-1 rounded-md border border-border/80 shadow-2xs"
                                                >
                                                  <Paperclip className="w-3.5 h-3.5" />
                                                  View / Download Current Attachment
                                                </a>
                                              </div>
                                            )}

                                            {config.file && config.existing_file_url && (
                                              <button
                                                type="button"
                                                disabled={researchLocked}
                                                onClick={() => !researchLocked && handleItemConfigChange(typeId, { file: null })}
                                                className="text-[10px] font-semibold text-muted-foreground hover:text-destructive underline block pt-0.5 cursor-pointer disabled:cursor-not-allowed"
                                              >
                                                Undo replacement & keep existing file
                                              </button>
                                            )}
                                          </div>

                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={researchLocked}
                                            onClick={() => {
                                              if (researchLocked) return;
                                              document.getElementById(`file-input-${typeId}`)?.click();
                                            }}
                                            className="h-8 text-xs font-bold gap-1.5 shrink-0 shadow-2xs"
                                          >
                                            <Upload className="w-3.5 h-3.5" />
                                            {config.file || config.existing_file_url ? "Change File" : "Choose File"}
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    /* Mode 2: External Link */
                                    <div className="space-y-2 pt-1">
                                      <Label className="text-xs font-semibold text-muted-foreground">
                                        URL Publication Link for {config.name}
                                      </Label>
                                      <Input
                                        placeholder="https://example.org/publication-or-data..."
                                        value={config.external_link || ""}
                                        disabled={researchLocked}
                                        onChange={(e) =>
                                          handleItemConfigChange(typeId, {
                                            external_link: e.target.value,
                                          })
                                        }
                                        className="text-xs h-9 bg-background"
                                      />
                                    </div>
                                  )}
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* STEP 3: Repository Data Center Selection Card */}
              <Card className="overflow-hidden border border-muted-foreground/10 shadow-sm">
                <CardHeader className="border-b bg-slate-50/70 dark:bg-slate-900/30 py-4 px-6">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Building className="h-4.5 w-4.5 text-primary" />
                    {stepTitle("datacenter")} <span className="text-destructive">*</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Choose Data Center Repository <span className="text-destructive">*</span></Label>
                    <SearchableSelect
                      options={dataCenterSelectOptions}
                      value={selectedDataCenterId}
                      onValueChange={(val) => setSelectedDataCenterId(val)}
                      placeholder="Search and choose repository data center..."
                      searchPlaceholder="Search data centers..."
                      emptyMessage="No data centers available"
                      disabled={dataCentersQuery.isLoading || researchLocked}
                    />
                  </div>

                  {selectedDataCenterId === "other" && (
                    <div className="space-y-2 pt-2 animate-in fade-in">
                      <Label className="text-xs font-semibold">Custom Repository Name <span className="text-destructive">*</span></Label>
                      <Input
                        placeholder="Enter custom data center repository name..."
                        value={customDataCenter}
                        onChange={(e) => setCustomDataCenter(e.target.value)}
                        disabled={researchLocked}
                        className="text-xs h-9 bg-background"
                        required
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* STEP 4: Compliance & Data Sharing Checklist Card */}
              <Card className="overflow-hidden border border-muted-foreground/10 shadow-sm">
                <CardHeader className="border-b bg-slate-50/70 dark:bg-slate-900/30 py-4 px-6">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <ShieldCheck className="h-4.5 w-4.5 text-primary" />
                    {stepTitle("compliance")} <span className="text-destructive">*</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
                    <Checkbox
                      id="data-sharing-checklist"
                      checked={checklistCompleted}
                      disabled={researchLocked}
                      onCheckedChange={(c) => setChecklistCompleted(Boolean(c))}
                      className="mt-0.5"
                    />
                    <div className="space-y-1">
                      <label htmlFor="data-sharing-checklist" className="text-xs font-bold text-foreground cursor-pointer">
                        I confirm that the submitted external research document is accurate, compliant with institutional data sharing policies, and cleared for indexing in the repository.
                      </label>
                      <p className="text-[11px] text-muted-foreground">
                        Submitted records will undergo committee evaluation before being indexed and published.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT SIDEBAR COLUMN */}
            <div className="space-y-6">
              {/* Interactive Submission Progress Widget */}
              <Card className="border border-border/70 shadow-xs sticky top-20">
                <CardHeader className="pb-3 border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Submission Progress
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs font-bold bg-primary/10 text-primary">
                      {progressPercent}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <Progress value={progressPercent} className="h-2" />

                  <div className="space-y-3">
                    {checklistItems.map((item) => (
                      <div key={item.id} className="flex items-start gap-2.5">
                        {item.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <p className={cn("text-xs font-bold leading-none", item.completed ? "text-foreground" : "text-muted-foreground")}>
                            {item.label}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1 truncate">
                            {item.sublabel}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Button
                      type="submit"
                      disabled={isSavingDraft || isSubmitting || researchLocked}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-9 gap-2 shadow-2xs"
                      title={researchLocked ? "This entry has been approved and can no longer be edited." : undefined}
                    >
                      {researchLocked ? (
                        <Lock className="w-4 h-4" />
                      ) : isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {researchLocked ? (isApproved ? "Approved — Locked" : "Submitted — Locked") : editId ? "Resubmit Entry" : "Submit Entry"}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSavingDraft || isSubmitting || researchLocked}
                      onClick={handleSaveDraft}
                      className="w-full h-9 text-xs font-semibold gap-2 border-border text-foreground hover:bg-accent shadow-2xs"
                      title={researchLocked ? "This entry has been approved and can no longer be edited." : undefined}
                    >
                      {researchLocked ? (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      ) : isSavingDraft ? (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground text-xs" />
                      ) : (
                        <Save className="w-4 h-4 text-muted-foreground" />
                      )}
                      Save as Draft
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          </fieldset>
        </form>
      </div>
    </PageContainer>
  );
}

export default function AddExternalResearchPage() {
  return (
    <Suspense fallback={<PageContainer title="Loading External Research Form..."><Skeleton className="h-64 w-full" /></PageContainer>}>
      <AddExternalResearchForm />
    </Suspense>
  );
}
