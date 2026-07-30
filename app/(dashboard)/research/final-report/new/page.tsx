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
import { Checkbox } from "@/components/ui/checkbox";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useTerminalReportTypes } from "@/hooks/useReference";
import { useDataCenters } from "@/hooks/useFinalSubmissions";
import {
  useEligibleForTerminalReport,
  useTerminalReport,
  terminalReportKeys,
  progressReportKeys,
} from "@/hooks/useProgressReports";
import { progressReportsService } from "@/api/services/progress-reports.service";
import { cn } from "@/lib/utils";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";

function CopyBadge({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/90 border border-border/70 text-xs shadow-2xs hover:border-primary/40 transition-colors">
      <span className="text-[11px] text-muted-foreground font-medium">{label}:</span>
      <span className="font-mono font-bold text-foreground text-xs">{value}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-4.5 w-4.5 p-0 text-muted-foreground hover:text-primary shrink-0 ml-0.5"
        onClick={handleCopy}
        title={`Copy ${label}`}
      >
        {copied ? (
          <Check className="h-3 w-3 text-emerald-500" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}

function getInitials(name?: string | null) {
  if (!name) return "PI";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

interface TypeItemConfig {
  terminal_type_id: number;
  name: string;
  upload_mode: "file" | "link";
  file: File | null;
  external_link: string;
  existing_file_url?: string | null;
}

function NewTerminalReportForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const queryTrackingId = searchParams.get("tracking_id");
  const resubmitOrEditId =
    searchParams.get("resubmit_id") ||
    searchParams.get("edit_id") ||
    searchParams.get("id");

  // Fetch Existing Report if editing/resubmitting
  const { data: existingReport } = useTerminalReport(resubmitOrEditId || undefined);

  // API Hooks
  const { data: eligibleProjects = [], isLoading: isLoadingProjects } =
    useEligibleForTerminalReport({ scope: "my" });
  const { data: terminalReportTypes = [], isLoading: isLoadingTypes } =
    useTerminalReportTypes();
  const dataCentersQuery = useDataCenters();
  const dataCenters = dataCentersQuery.data?.data ?? [];

  // Form State
  const [selectedTrackingId, setSelectedTrackingId] = useState<string>("");
  const [selectedTypeIds, setSelectedTypeIds] = useState<number[]>([]);
  const [typeConfigs, setTypeConfigs] = useState<Record<number, TypeItemConfig>>({});
  const [selectedDataCenterId, setSelectedDataCenterId] = useState<string>("");
  const [customDataCenter, setCustomDataCenter] = useState<string>("");
  const [checklistCompleted, setChecklistCompleted] = useState<boolean>(false);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const syncedReportIdRef = useRef<string | number | null>(null);

  // Sync tracking_id from query params if present (guarded against duplicate updates)
  useEffect(() => {
    if (queryTrackingId && selectedTrackingId !== String(queryTrackingId)) {
      setSelectedTrackingId(String(queryTrackingId));
    }
  }, [queryTrackingId, selectedTrackingId]);

  const reportId = existingReport?.id || (existingReport as any)?.pk || resubmitOrEditId;
  const reportSyncKey = reportId
    ? `${reportId}_${terminalReportTypes.length}_${dataCenters.length}`
    : null;

  // Sync existing report values if editing/resubmitting (Guarded against infinite re-renders)
  useEffect(() => {
    if (reportSyncKey && syncedReportIdRef.current !== reportSyncKey && existingReport) {
      syncedReportIdRef.current = reportSyncKey;

      const ptId =
        existingReport.project_tracking_id ||
        existingReport.project_tracking?.project_tracking_id ||
        (existingReport as any).project_tracking?.id;
      if (ptId) {
        setSelectedTrackingId(String(ptId));
      }

      let resolvedDcId: string | null = null;
      const rawDc =
        (existingReport as any).data_center_id ||
        (existingReport as any).data_center?.id ||
        (existingReport as any).data_center;

      if (rawDc && typeof rawDc === "object" && rawDc.id) {
        resolvedDcId = String(rawDc.id);
      } else if (rawDc && (typeof rawDc === "number" || /^\d+$/.test(String(rawDc)))) {
        resolvedDcId = String(rawDc);
      } else if (rawDc && typeof rawDc === "string") {
        const matched = dataCenters.find(
          (d: any) =>
            d.name?.toLowerCase() === rawDc.toLowerCase() || String(d.id) === rawDc
        );
        if (matched) {
          resolvedDcId = String(matched.id);
        }
      }

      if (!resolvedDcId && (existingReport as any).data_center_name) {
        const dcName = (existingReport as any).data_center_name;
        const matched = dataCenters.find(
          (d: any) => d.name?.toLowerCase() === dcName.toLowerCase()
        );
        if (matched) {
          resolvedDcId = String(matched.id);
        }
      }

      if (resolvedDcId) {
        setSelectedDataCenterId(resolvedDcId);
      } else if (existingReport.custom_data_center || (existingReport as any).customDataCenter) {
        setSelectedDataCenterId("other");
        setCustomDataCenter(
          existingReport.custom_data_center || (existingReport as any).customDataCenter || ""
        );
      }

      if (existingReport.data_sharing_checklist_completed !== undefined) {
        setChecklistCompleted(Boolean(existingReport.data_sharing_checklist_completed));
      }

      const items = existingReport.items || (existingReport as any).terminal_report_items || [];
      if (items && items.length > 0) {
        const typeIds = items.map((it: any) => Number(it.terminal_type || it.terminal_type_id || it.terminalType));
        setSelectedTypeIds(typeIds);

        const configs: Record<number, TypeItemConfig> = {};
        items.forEach((it: any) => {
          const typeId = Number(it.terminal_type || it.terminal_type_id || it.terminalType);
          const typeObj = terminalReportTypes.find(
            (t: any) => Number(t.id ?? t.pk) === typeId
          );
          const fileUrl = it.file || it.file_url || it.fileUrl || it.attachment || null;
          const linkUrl = it.external_link || it.externalLink || "";

          configs[typeId] = {
            terminal_type_id: typeId,
            name: typeObj?.name || `Type #${typeId}`,
            upload_mode: linkUrl ? "link" : "file",
            file: null,
            external_link: linkUrl,
            existing_file_url: fileUrl,
          };
        });
        setTypeConfigs(configs);
      }
    }
  }, [existingReport, reportSyncKey, resubmitOrEditId, terminalReportTypes]);

  // Normalized list of eligible project proposals
  const normalizedProjects = useMemo(() => {
    const list = Array.isArray(eligibleProjects) ? [...eligibleProjects] : [];
    if (existingReport && existingReport.project_tracking) {
      const pt = existingReport.project_tracking;
      const ptId =
        pt.project_tracking_id ||
        pt.id ||
        existingReport.project_tracking_id;
      const exists = list.some(
        (p: any) => String(p.id || p.project_tracking_id) === String(ptId)
      );
      const piObj =
        pt.pi ||
        existingReport.pi ||
        (existingReport as any).submitted_by ||
        null;
      if (!exists) {
        list.push({
          id: ptId,
          proposal: {
            title:
              pt.title ||
              existingReport.project_tracking_title ||
              existingReport.report_name,
            referenceNumber:
              pt.reference_number ||
              pt.referenceNumber ||
              existingReport.reference_number ||
              `PT-${ptId}`,
            proposal_id: pt.proposal_id || existingReport.proposal_id,
            pi: piObj,
          },
          proposalTitle:
            pt.title ||
            existingReport.project_tracking_title ||
            existingReport.report_name,
          reference_number:
            pt.reference_number ||
            pt.referenceNumber ||
            existingReport.reference_number,
          pi: piObj,
        });
      }
    }
    return list.map((item: any) => {
      const p = item.proposal || {};
      const ptId = item.id || item.project_tracking_id;
      const propId = p.proposal_id || item.proposal_id || item.proposalId || ptId;
      const title =
        p.title ||
        item.proposalTitle ||
        item.title ||
        `Project Tracking #${ptId}`;
      const ref =
        p.referenceNumber ||
        p.reference_number ||
        item.reference_number ||
        item.referenceNumber ||
        (propId ? `PROP-${propId}` : `PT-${ptId}`);

      const isCurrentEditingReport =
        existingReport &&
        String(ptId) ===
          String(
            existingReport.project_tracking_id ||
              existingReport.project_tracking?.project_tracking_id ||
              (existingReport as any).project_tracking?.id
          );

      const piData =
        p.pi ||
        item.pi ||
        item.submitted_by ||
        (isCurrentEditingReport
          ? existingReport.pi ||
            existingReport.project_tracking?.pi ||
            (existingReport as any).submitted_by
          : null);

      let piName: string | null = null;
      let piAvatar: string | null = null;
      let piEmail: string | null = null;
      let piDept: string | null = null;

      if (piData) {
        if (typeof piData === "string") {
          piName = piData;
        } else if (typeof piData === "object") {
          piName =
            piData.full_name ||
            piData.fullName ||
            piData.name ||
            (piData.first_name ? `${piData.first_name} ${piData.last_name || ""}`.trim() : null);
          piAvatar = piData.photo_url || piData.photoUrl || piData.photo || piData.avatar || null;
          piEmail = piData.email || null;
          piDept = piData.department_name || piData.department || piData.institution || null;
        }
      }

      return {
        id: String(ptId),
        rawId: ptId,
        proposalId: String(propId),
        title,
        ref,
        pi: {
          name: piName,
          avatar: piAvatar,
          email: piEmail,
          dept: piDept,
        },
        raw: item,
      };
    });
  }, [eligibleProjects, existingReport]);

  // Formatted proposal options for SearchableSelect: Proposal Title — by PI Name
  const proposalSelectOptions = useMemo(() => {
    return normalizedProjects.map((proj) => {
      const piSuffix = proj.pi?.name ? ` — by ${proj.pi.name}` : "";
      return {
        value: proj.id,
        label: `${proj.title}${piSuffix}`,
        data: proj,
      };
    });
  }, [normalizedProjects]);

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

  // Selected project details
  const selectedProjectInfo = useMemo(() => {
    if (!selectedTrackingId) return null;
    return (
      normalizedProjects.find((p) => String(p.id) === String(selectedTrackingId)) ||
      null
    );
  }, [normalizedProjects, selectedTrackingId]);

  const selectedDataCenterName = useMemo(() => {
    if (!selectedDataCenterId) return "Not selected";
    if (selectedDataCenterId === "other") return customDataCenter || "Custom Repository";
    const dc = dataCenters.find((d: any) => String(d.id) === selectedDataCenterId);
    return dc?.name || "Selected";
  }, [dataCenters, selectedDataCenterId, customDataCenter]);

  const isDataCenterSelected =
    !!selectedDataCenterId &&
    (selectedDataCenterId !== "other" || !!customDataCenter.trim());

  // Interactive submission checklist progress steps
  const checklistItems = useMemo(() => {
    return [
      {
        id: "proposal",
        label: "Proposal Selected",
        sublabel: selectedProjectInfo
          ? selectedProjectInfo.title
          : "Choose eligible proposal project",
        completed: !!selectedTrackingId,
      },
      {
        id: "deliverables",
        label: "Output Types & Uploads",
        sublabel:
          selectedTypeIds.length > 0
            ? `${selectedTypeIds.length} output type(s) selected`
            : "Select output types & attach files/links",
        completed: selectedTypeIds.length > 0,
      },
      {
        id: "datacenter",
        label: "Target Data Center",
        sublabel: isDataCenterSelected
          ? selectedDataCenterName
          : "Select repository data center",
        completed: isDataCenterSelected,
      },
      {
        id: "compliance",
        label: "Compliance Checklist",
        sublabel: checklistCompleted
          ? "Guidelines confirmed"
          : "Confirm data sharing checklist box",
        completed: checklistCompleted,
      },
    ];
  }, [
    selectedProjectInfo,
    selectedTrackingId,
    selectedTypeIds,
    isDataCenterSelected,
    selectedDataCenterName,
    checklistCompleted,
  ]);

  const completedCount = checklistItems.filter((i) => i.completed).length;
  const progressPercent = Math.round((completedCount / checklistItems.length) * 100);

  const handleTypeToggle = (typeId: number, name: string) => {
    if (selectedTypeIds.includes(typeId)) {
      setSelectedTypeIds((prev) => prev.filter((id) => id !== typeId));
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
          terminal_type_id: typeId,
          name,
          upload_mode: "file",
          file: null,
          external_link: "",
        },
      }));
    }
  };

  const handleItemConfigChange = (
    typeId: number,
    updates: Partial<TypeItemConfig>
  ) => {
    setTypeConfigs((prev) => ({
      ...prev,
      [typeId]: {
        ...prev[typeId],
        ...updates,
      },
    }));
  };

  // Save as Draft action
  const handleSaveDraft = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!selectedTrackingId) {
      toast.error("Please select a proposal project before saving a draft.");
      return;
    }

    try {
      setIsSavingDraft(true);
      const formData = new FormData();
      formData.append("project_tracking", selectedTrackingId);
      formData.append("is_draft", "true");
      formData.append("status", "draft");
      formData.append(
        "data_sharing_checklist_completed",
        checklistCompleted ? "true" : "false"
      );

      if (selectedDataCenterId === "other") {
        formData.append("custom_data_center", customDataCenter.trim());
      } else if (selectedDataCenterId) {
        formData.append("data_center", selectedDataCenterId);
      }

      selectedTypeIds.forEach((typeId) => {
        formData.append("terminal_type", String(typeId));
        const config = typeConfigs[typeId];
        if (config) {
          if (config.upload_mode === "file" && config.file) {
            formData.append(`file_${typeId}`, config.file);
          } else if (config.upload_mode === "link" && config.external_link) {
            formData.append(`external_link_${typeId}`, config.external_link);
          }
        }
      });

      if (existingReport?.id) {
        await progressReportsService.updateTerminalReport(
          existingReport.id,
          formData as any
        );
      } else {
        await progressReportsService.createTerminalReport(formData as any);
      }

      queryClient.invalidateQueries({ queryKey: terminalReportKeys.all });
      queryClient.invalidateQueries({ queryKey: progressReportKeys.all });
      queryClient.invalidateQueries({ queryKey: ["eligible-for-terminal-report"] });

      toast.success("Final Report saved as draft!", {
        description: "Your report progress has been saved. You can resume anytime from My Final Reports.",
      });

      router.push("/research/final-report/my-final-reports");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to save draft.";
      toast.error("Save Draft Error", { description: msg });
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Full Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTrackingId) {
      toast.error("Please select an eligible proposal project.");
      return;
    }

    if (selectedTypeIds.length === 0) {
      toast.error("Please select at least one output type deliverable.");
      return;
    }

    if (!selectedDataCenterId) {
      toast.error("Please select a target repository data center.");
      return;
    }

    if (selectedDataCenterId === "other" && !customDataCenter.trim()) {
      toast.error("Please enter your custom repository name.");
      return;
    }

    if (!checklistCompleted) {
      toast.error("Please confirm the data sharing checklist.");
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("project_tracking", selectedTrackingId);
      formData.append("is_draft", "false");
      formData.append("status", "pending");
      formData.append(
        "data_sharing_checklist_completed",
        checklistCompleted ? "true" : "false"
      );

      if (selectedDataCenterId === "other") {
        formData.append("custom_data_center", customDataCenter.trim());
      } else {
        formData.append("data_center", selectedDataCenterId);
      }

      selectedTypeIds.forEach((typeId) => {
        formData.append("terminal_type", String(typeId));
        const config = typeConfigs[typeId];
        if (config) {
          if (config.upload_mode === "file" && config.file) {
            formData.append(`file_${typeId}`, config.file);
          } else if (config.upload_mode === "link" && config.external_link) {
            formData.append(`external_link_${typeId}`, config.external_link);
          }
        }
      });

      if (existingReport?.id) {
        await progressReportsService.updateTerminalReport(
          existingReport.id,
          formData as any
        );
        toast.success("Final Report resubmitted successfully!", {
          description: "Your updated report is now awaiting committee re-evaluation.",
        });
      } else {
        await progressReportsService.createTerminalReport(formData as any);
        toast.success("Final Report submitted successfully!", {
          description: "Your report is now awaiting grading and evaluation.",
        });
      }

      queryClient.invalidateQueries({ queryKey: terminalReportKeys.all });
      queryClient.invalidateQueries({ queryKey: progressReportKeys.all });
      queryClient.invalidateQueries({ queryKey: ["eligible-for-terminal-report"] });

      router.push("/research/final-report/my-final-reports");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to submit final report.";
      toast.error("Submission Error", { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer
      title={existingReport ? "Resubmit Final Research Report" : "Submit Final Research Report"}
      description="Attach final research output deliverables, select target repository data center, and confirm submission."
      actions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSavingDraft || isSubmitting}
            onClick={() => router.push("/research/final-report/my-final-reports")}
            className="h-9 text-xs font-semibold gap-1.5 border-border text-muted-foreground hover:text-foreground shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancel / Back
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSavingDraft || isSubmitting}
            onClick={handleSaveDraft}
            className="h-9 text-xs font-semibold gap-2 border-border text-foreground hover:bg-accent shadow-2xs"
          >
            {isSavingDraft ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <Save className="w-4 h-4 text-muted-foreground" />
            )}
            Save as Draft
          </Button>
          <Button
            type="submit"
            form="terminal-report-form"
            size="sm"
            disabled={isSavingDraft || isSubmitting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-2 h-9 shadow-2xs"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {existingReport ? "Resubmit Final Report" : "Submit Final Report"}
          </Button>
        </div>
      }
    >
      <div className="w-full max-w-full space-y-6">
        {/* Reviewer Modification Feedback Banner (if resubmitting) */}
        {existingReport?.reviewer_comments && (
          <Card className="border-rose-200 bg-rose-50/70 dark:border-rose-900/50 dark:bg-rose-950/30">
            <CardContent className="p-4 space-y-1 text-xs text-rose-900 dark:text-rose-200">
              <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-300">
                <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
                Reviewer Requested Modifications:
              </div>
              <p className="leading-relaxed pl-6.5 text-rose-800 dark:text-rose-200">
                {existingReport.reviewer_comments}
              </p>
            </CardContent>
          </Card>
        )}

        <form id="terminal-report-form" onSubmit={handleSubmit}>
          {/* Main Proposal Creation Grid (Left minmax(0,1fr), Right 360px) */}
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] items-start">

            {/* ── LEFT COLUMN (Main Form Content Cards) ──────────────────── */}
            <div className="space-y-6 min-w-0">

              {/* STEP 1: Reusable SearchableSelect for Proposal Project */}
              <Card className="overflow-hidden border border-muted-foreground/10 shadow-sm">
                <CardHeader className="border-b bg-slate-50/70 dark:bg-slate-900/30 py-4 px-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <FileText className="h-4.5 w-4.5 text-primary" />
                      1. Select Proposal <span className="text-destructive">*</span>
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {normalizedProjects.length} Eligible Project{normalizedProjects.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-foreground">
                      Choose Proposal <span className="text-destructive">*</span>
                    </Label>
                    <SearchableSelect
                      options={proposalSelectOptions}
                      value={selectedTrackingId}
                      onValueChange={(val) => setSelectedTrackingId(val)}
                      placeholder="Search and choose an eligible proposal..."
                      searchPlaceholder="Search proposals by title or PI..."
                      emptyMessage="No eligible proposals available"
                      disabled={isLoadingProjects}
                    />
                  </div>

                  {/* Selected Proposal Info Box */}
                  {selectedProjectInfo && (
                    <div className="p-5 rounded-2xl border border-primary/20 bg-gradient-to-br from-slate-50/80 via-background to-emerald-50/20 dark:from-slate-900/60 dark:via-background dark:to-emerald-950/20 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                      {/* Header Row: Title & Badge */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-border/50 pb-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Selected Proposal Title
                          </span>
                          <h4 className="font-bold text-sm sm:text-base text-foreground leading-snug">
                            {selectedProjectInfo.title}
                          </h4>
                        </div>
                        <Badge variant="outline" className="self-start sm:self-auto bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 font-bold text-[10px] px-2.5 py-0.5 shrink-0">
                          Ready for Final Report
                        </Badge>
                      </div>

                      {/* Metadata Badges with Copy Buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <CopyBadge label="Reference #" value={selectedProjectInfo.ref} />
                        <CopyBadge label="Tracking ID" value={`#${selectedProjectInfo.id}`} />
                      </div>

                      {/* PI Profile Card with Avatar */}
                      {selectedProjectInfo.pi && (selectedProjectInfo.pi.name || selectedProjectInfo.pi.email) ? (
                        <div className="flex items-center gap-3.5 p-3 rounded-xl bg-background/90 border border-border/60 shadow-2xs">
                          {(() => {
                            const avatarUrl = resolveFileUrl(selectedProjectInfo.pi.avatar);
                            return (
                              <Avatar className="h-10 w-10 rounded-full ring-2 ring-primary/20 shrink-0">
                                {avatarUrl ? (
                                  <AvatarImage
                                    src={avatarUrl}
                                    alt={selectedProjectInfo.pi.name || "PI"}
                                  />
                                ) : null}
                                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                                  {getInitials(selectedProjectInfo.pi.name)}
                                </AvatarFallback>
                              </Avatar>
                            );
                          })()}
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-xs text-foreground truncate">
                                {selectedProjectInfo.pi.name || "Principal Investigator"}
                              </span>
                              <Badge variant="secondary" className="text-[9px] font-semibold px-1.5 py-0 shrink-0">
                                Principal Investigator
                              </Badge>
                            </div>
                            {selectedProjectInfo.pi.dept && (
                              <p className="text-[11px] text-muted-foreground truncate">
                                {selectedProjectInfo.pi.dept}
                              </p>
                            )}
                            {selectedProjectInfo.pi.email && (
                              <p className="text-[11px] text-muted-foreground font-mono truncate">
                                {selectedProjectInfo.pi.email}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* STEP 2: Output Deliverables & Attached Files */}
              <Card className="overflow-hidden border border-muted-foreground/10 shadow-sm">
                <CardHeader className="border-b bg-slate-50/70 dark:bg-slate-900/30 py-4 px-6 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FileCheck className="h-4.5 w-4.5 text-primary" />
                    2. Output Types & Files Uploads <span className="text-destructive">*</span>
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {selectedTypeIds.length} Selected
                  </Badge>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  {isLoadingTypes ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 border rounded-xl bg-muted/20 animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      Loading output types...
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs text-muted-foreground">
                        Select the output types produced by your research project. You will be prompted to upload a file or add a URL link for each selected item:
                      </p>

                      {/* Checkbox Grid for Types */}
                      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                        {terminalReportTypes.map((type: any) => {
                          const typeId = Number(type.id ?? type.pk);
                          const isChecked = selectedTypeIds.some(
                            (id) => Number(id) === typeId
                          );
                          return (
                              <div
                                key={typeId}
                                className={cn(
                                  "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none",
                                  isChecked
                                    ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-2xs"
                                    : "border-border/60 hover:border-border hover:bg-muted/30"
                                )}
                              >
                              <Checkbox
                                id={`type-${typeId}`}
                                checked={isChecked}
                                onCheckedChange={() => handleTypeToggle(typeId, type.name)}
                                className="h-4 w-4 rounded-md"
                              />
                              <Label
                                htmlFor={`type-${typeId}`}
                                className="text-xs font-semibold text-foreground cursor-pointer flex-1 line-clamp-1"
                              >
                                {type.name}
                              </Label>
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

                          {selectedTypeIds.map((typeId) => {
                            const config = typeConfigs[typeId];
                            if (!config) return null;

                            return (
                              <Card key={typeId} className="p-4 border border-muted-foreground/20 bg-card space-y-3">
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
                                        onClick={() =>
                                          handleItemConfigChange(typeId, {
                                            upload_mode: "file",
                                          })
                                        }
                                        className={cn(
                                          "px-3 py-1 text-[10px] font-bold rounded-md transition-all gap-1 inline-flex items-center",
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
                                        onClick={() =>
                                          handleItemConfigChange(typeId, {
                                            upload_mode: "link",
                                          })
                                        }
                                        className={cn(
                                          "px-3 py-1 text-[10px] font-bold rounded-md transition-all gap-1 inline-flex items-center",
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
                                          className="hidden"
                                          onChange={(e) => {
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

                                            {/* Link to View/Download Existing File */}
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

                                            {/* Option to clear selected replacement file and revert to existing file */}
                                            {config.file && config.existing_file_url && (
                                              <button
                                                type="button"
                                                onClick={() => handleItemConfigChange(typeId, { file: null })}
                                                className="text-[10px] font-semibold text-muted-foreground hover:text-destructive underline block pt-0.5"
                                              >
                                                Undo replacement & keep existing file
                                              </button>
                                            )}
                                          </div>

                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              document.getElementById(`file-input-${typeId}`)?.click()
                                            }
                                            className="h-8.5 text-xs font-bold gap-1.5 shrink-0 shadow-2xs"
                                          >
                                            <Upload className="w-3.5 h-3.5" />
                                            {config.file
                                              ? "Change Replacement File"
                                              : config.existing_file_url
                                                ? "Replace File"
                                                : "Choose File"}
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    /* Mode 2: External Link Input */
                                    <div className="space-y-1.5 pt-1">
                                      <Label className="text-[11px] font-semibold text-muted-foreground">
                                        External Repository Link / Resource URL
                                      </Label>
                                      <Input
                                        type="url"
                                        placeholder="https://doi.org/10.xxxx or https://github.com/..."
                                        value={config.external_link}
                                        onChange={(e) =>
                                          handleItemConfigChange(typeId, {
                                            external_link: e.target.value,
                                          })
                                        }
                                        className="text-xs h-10 rounded-xl bg-background font-medium"
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

              {/* STEP 3: Reusable SearchableSelect for Repository Data Center & Compliance */}
              <Card className="overflow-hidden border border-muted-foreground/10 shadow-sm">
                <CardHeader className="border-b bg-slate-50/70 dark:bg-slate-900/30 py-4 px-6">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Database className="h-4.5 w-4.5 text-primary" />
                    3. Repository Data Center & Compliance <span className="text-destructive">*</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">

                  {/* Reusable SearchableSelect for Data Center */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-foreground">
                      Target Repository Data Center <span className="text-destructive">*</span>
                    </Label>
                    <SearchableSelect
                      options={dataCenterSelectOptions}
                      value={selectedDataCenterId}
                      onValueChange={(val) => setSelectedDataCenterId(val)}
                      placeholder="Search and choose repository data center..."
                      searchPlaceholder="Search repository data centers..."
                      disabled={dataCentersQuery.isLoading}
                    />
                  </div>

                  {selectedDataCenterId === "other" && (
                    <div className="space-y-2 pt-1 animate-in fade-in">
                      <Label htmlFor="custom_data_center" className="text-xs font-semibold">
                        Custom Repository Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="custom_data_center"
                        placeholder="Enter custom repository name..."
                        value={customDataCenter}
                        onChange={(e) => setCustomDataCenter(e.target.value)}
                        className="text-xs h-10 rounded-xl bg-background"
                      />
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-start gap-3 p-3.5 rounded-xl border bg-muted/20">
                    <Checkbox
                      id="checklist"
                      checked={checklistCompleted}
                      onCheckedChange={(checked) => setChecklistCompleted(Boolean(checked))}
                      className="mt-0.5 h-4 w-4 rounded-md"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="checklist" className="text-xs font-bold leading-tight cursor-pointer">
                        Confirm Data Sharing & Repository Compliance Checklist <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        I confirm that all ethical guidelines, data privacy clearance, and repository submission protocols have been verified.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── RIGHT SIDEBAR COLUMN (360px - Live Metadata & Submission Progress) ── */}
            <div className="space-y-6 sticky top-6">

              {/* Submission Progress & Checklist Card */}
              <Card className="overflow-hidden border border-muted-foreground/10 shadow-sm">
                <CardHeader className="border-b bg-slate-50/70 dark:bg-slate-900/30 py-4 px-5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      Submission Progress
                    </CardTitle>
                    <Badge
                      variant={completedCount === 4 ? "default" : "secondary"}
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5",
                        completedCount === 4
                          ? "bg-primary text-primary-foreground"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      )}
                    >
                      {completedCount} / 4 Steps Completed
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-4 text-xs">
                  {/* Progress Bar & Percentage */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-muted-foreground">Completion Progress</span>
                      <span className="font-bold font-mono text-primary">{progressPercent}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-2 bg-muted" />
                  </div>

                  <Separator />

                  {/* Checklist Step Items */}
                  <div className="space-y-3.5">
                    {checklistItems.map((item) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">
                          {item.completed ? (
                            <CheckCircle2 className="w-4.5 h-4.5 text-primary" />
                          ) : (
                            <Circle className="w-4.5 h-4.5 text-muted-foreground/40" />
                          )}
                        </div>
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <p
                            className={cn(
                              "font-semibold text-xs leading-snug truncate",
                              item.completed ? "text-foreground" : "text-muted-foreground"
                            )}
                          >
                            {item.label}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {item.sublabel}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Form Action Buttons */}
                  <div className="space-y-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={handleSaveDraft}
                      className="w-full h-9.5 text-xs font-semibold gap-2 border-border text-foreground hover:bg-accent"
                    >
                      <Save className="w-4 h-4 text-muted-foreground" />
                      Save as Draft
                    </Button>

                    <Button
                      type="submit"
                      form="terminal-report-form"
                      disabled={isSubmitting || completedCount < 4}
                      className="w-full h-10 text-xs font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {existingReport ? "Resubmit Final Report" : "Submit Final Report"}
                    </Button>

                    <Link href="/research/final-report/my-final-reports" className="block w-full">
                      <Button variant="ghost" className="w-full text-xs font-medium h-8 text-muted-foreground">
                        Cancel
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

            </div>

          </div>
        </form>
      </div>
    </PageContainer>
  );
}

export default function NewTerminalReportPage() {
  return (
    <Suspense
      fallback={
        <PageContainer title="Loading Final Report Form...">
          <div className="space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </PageContainer>
      }
    >
      <NewTerminalReportForm />
    </Suspense>
  );
}
