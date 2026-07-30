"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  FileText,
  Link as LinkIcon,
  Upload,
  Database,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Search,
  User,
  X,
  FileCheck,
  Globe,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { useTerminalReportTypes } from "@/hooks/useReference";
import { useDataCenters } from "@/hooks/useFinalSubmissions";
import {
  useEligibleForTerminalReport,
  terminalReportKeys,
  progressReportKeys,
} from "@/hooks/useProgressReports";
import { progressReportsService } from "@/api/services/progress-reports.service";

interface SubmitTerminalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedTrackingId?: number;
  initialValues?: {
    id?: number;
    project_tracking_id?: number;
    main_deliverables?: string;
    data_center_id?: number;
    custom_data_center?: string;
    data_sharing_checklist_completed?: boolean;
    reviewer_comments?: string;
    items?: Array<{
      terminal_type: number;
      file?: string | null;
      external_link?: string | null;
    }>;
  };
}

interface TypeItemConfig {
  terminal_type_id: number;
  name: string;
  upload_mode: "file" | "link";
  file: File | null;
  external_link: string;
  existing_file_url?: string | null;
}

export function SubmitTerminalReportModal({
  isOpen,
  onClose,
  preselectedTrackingId,
  initialValues,
}: SubmitTerminalReportModalProps) {
  const queryClient = useQueryClient();

  // API Hooks
  const { data: eligibleProjects = [], isLoading: isLoadingProjects } =
    useEligibleForTerminalReport({ scope: "my" });
  const { data: terminalReportTypes = [], isLoading: isLoadingTypes } =
    useTerminalReportTypes();
  const dataCentersQuery = useDataCenters();
  const dataCenters = dataCentersQuery.data?.data ?? [];

  // Local Form State
  const [proposalSearch, setProposalSearch] = useState("");
  const [selectedTrackingId, setSelectedTrackingId] = useState<string>("");
  const [mainDeliverables, setMainDeliverables] = useState<string>("");
  const [selectedTypeIds, setSelectedTypeIds] = useState<number[]>([]);
  const [typeConfigs, setTypeConfigs] = useState<Record<number, TypeItemConfig>>({});
  const [selectedDataCenterId, setSelectedDataCenterId] = useState<string>("");
  const [customDataCenter, setCustomDataCenter] = useState<string>("");
  const [checklistCompleted, setChecklistCompleted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync preselected tracking ID or initial values
  useEffect(() => {
    if (preselectedTrackingId) {
      setSelectedTrackingId(String(preselectedTrackingId));
    }
  }, [preselectedTrackingId]);

  useEffect(() => {
    if (initialValues) {
      if (initialValues.project_tracking_id) {
        setSelectedTrackingId(String(initialValues.project_tracking_id));
      }
      if (initialValues.main_deliverables) {
        setMainDeliverables(initialValues.main_deliverables);
      }
      if (initialValues.data_center_id) {
        setSelectedDataCenterId(String(initialValues.data_center_id));
      } else if (initialValues.custom_data_center) {
        setSelectedDataCenterId("other");
        setCustomDataCenter(initialValues.custom_data_center);
      }
      if (initialValues.data_sharing_checklist_completed) {
        setChecklistCompleted(initialValues.data_sharing_checklist_completed);
      }
      if (initialValues.items && initialValues.items.length > 0) {
        const typeIds = initialValues.items.map((it) => it.terminal_type);
        setSelectedTypeIds(typeIds);

        const configs: Record<number, TypeItemConfig> = {};
        initialValues.items.forEach((it) => {
          const typeObj = terminalReportTypes.find(
            (t: any) => (t.id ?? t.pk) === it.terminal_type
          );
          configs[it.terminal_type] = {
            terminal_type_id: it.terminal_type,
            name: typeObj?.name || `Type #${it.terminal_type}`,
            upload_mode: it.external_link ? "link" : "file",
            file: null,
            external_link: it.external_link || "",
            existing_file_url: it.file || null,
          };
        });
        setTypeConfigs(configs);
      }
    }
  }, [initialValues, terminalReportTypes]);

  // Clean list of normalized eligible proposals
  const normalizedProjects = useMemo(() => {
    const list = Array.isArray(eligibleProjects) ? eligibleProjects : [];
    return list.map((item: any) => {
      const p = item.proposal || {};
      const title =
        p.title ||
        item.proposalTitle ||
        item.title ||
        `Project Tracking #${item.id}`;
      const ref =
        p.referenceNumber ||
        p.reference_number ||
        item.reference_number ||
        `PT-${item.id}`;
      const pi = p.pi || item.pi || null;

      return {
        id: String(item.id),
        rawId: item.id,
        title,
        ref,
        pi,
        raw: item,
      };
    });
  }, [eligibleProjects]);

  // Filtered proposal list based on search
  const filteredProjects = useMemo(() => {
    const q = proposalSearch.trim().toLowerCase();
    if (!q) return normalizedProjects;

    return normalizedProjects.filter((proj) => {
      const piName = (proj.pi?.fullName || proj.pi?.full_name || "").toLowerCase();
      return (
        proj.title.toLowerCase().includes(q) ||
        proj.ref.toLowerCase().includes(q) ||
        proj.id.includes(q) ||
        piName.includes(q)
      );
    });
  }, [normalizedProjects, proposalSearch]);

  // Selected project details
  const selectedProject = useMemo(() => {
    if (!selectedTrackingId) return null;
    return (
      normalizedProjects.find((p) => String(p.id) === String(selectedTrackingId)) ||
      null
    );
  }, [normalizedProjects, selectedTrackingId]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTrackingId) {
      toast.error("Please select an eligible proposal project.");
      return;
    }
    if (selectedTypeIds.length === 0) {
      toast.error("Please select at least one terminal output deliverable type.");
      return;
    }
    if (!selectedDataCenterId) {
      toast.error("Please select a target repository data center.");
      return;
    }
    if (selectedDataCenterId === "other" && !customDataCenter.trim()) {
      toast.error("Please enter the custom repository name.");
      return;
    }
    if (!checklistCompleted) {
      toast.error(
        "You must confirm the Data Sharing Checklist before submission."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("project_tracking", selectedTrackingId);
      formData.append("main_deliverables", mainDeliverables);
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

      await progressReportsService.createTerminalReport(formData as any);

      toast.success("Terminal Report submitted successfully!", {
        description: "Your report is now awaiting grading and evaluation.",
      });

      queryClient.invalidateQueries({ queryKey: terminalReportKeys.all });
      queryClient.invalidateQueries({ queryKey: progressReportKeys.all });
      queryClient.invalidateQueries({ queryKey: ["eligible-for-terminal-report"] });

      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to submit terminal report.";
      toast.error("Submission Error", { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-4xl sm:w-full max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border border-border/80 shadow-2xl">
        {/* ── Sleek Modal Header ─────────────────────────────────────────── */}
        <DialogHeader className="p-5 sm:p-6 bg-slate-50/80 dark:bg-slate-900/50 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">
                {initialValues?.id ? "Resubmit Final Research Report" : "Submit Final Research Report"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Attach research deliverables, specify repository data center, and confirm submission.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ── Form Body (Scrollable) ──────────────────────────────────────── */}
        <form
          id="terminal-report-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6"
        >
          {/* Reviewer Feedback Notes (if resubmitting) */}
          {initialValues?.reviewer_comments && (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/70 dark:border-rose-900/50 dark:bg-rose-950/30 text-xs text-rose-800 dark:text-rose-200 space-y-1">
              <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Reviewer Modification Feedback:
              </div>
              <p className="leading-relaxed pl-6">{initialValues.reviewer_comments}</p>
            </div>
          )}

          {/* ── STEP 1: Proposal Selection ───────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                1. Select Proposal Project <span className="text-rose-500">*</span>
              </Label>
              <span className="text-[11px] text-muted-foreground font-medium">
                ({normalizedProjects.length} eligible project{normalizedProjects.length !== 1 ? "s" : ""})
              </span>
            </div>

            {isLoadingProjects ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 border rounded-xl bg-muted/20 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                Loading eligible proposal projects...
              </div>
            ) : normalizedProjects.length === 0 ? (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>No eligible proposals found. (Requires at least one approved progress report)</span>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Search Bar for Quick Filtering */}
                {normalizedProjects.length > 2 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Type to filter list by title, ref #, or PI name..."
                      value={proposalSearch}
                      onChange={(e) => setProposalSearch(e.target.value)}
                      className="pl-8 text-xs h-9 rounded-xl font-medium bg-background"
                    />
                    {proposalSearch && (
                      <button
                        type="button"
                        onClick={() => setProposalSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground font-bold px-1"
                      >
                        ×
                      </button>
                    )}
                  </div>
                )}

                {/* Direct Clean Radio List of Projects */}
                <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                  {filteredProjects.length === 0 ? (
                    <div className="p-3 text-center text-xs text-muted-foreground border rounded-xl">
                      No matching proposals found for "{proposalSearch}"
                    </div>
                  ) : (
                    filteredProjects.map((proj) => {
                      const isSelected = selectedTrackingId === proj.id;
                      return (
                        <div
                          key={proj.id}
                          onClick={() => setSelectedTrackingId(proj.id)}
                          className={`cursor-pointer p-3 rounded-xl border text-xs transition-all flex items-center justify-between gap-3 ${isSelected
                            ? "bg-emerald-50/80 border-emerald-500 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-500 dark:text-emerald-200 shadow-2xs"
                            : "bg-background hover:bg-muted/40 border-border text-foreground"
                            }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Badge
                              variant="outline"
                              className={`font-mono text-[10px] shrink-0 font-bold ${isSelected
                                ? "bg-emerald-600 text-white border-none"
                                : "bg-muted/50 text-muted-foreground"
                                }`}
                            >
                              {proj.ref}
                            </Badge>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold truncate">{proj.title}</span>
                              {proj.pi && (
                                <span className="text-[10px] text-muted-foreground truncate">
                                  PI: {proj.pi.fullName || proj.pi.email}
                                </span>
                              )}
                            </div>
                          </div>

                          <div
                            className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${isSelected
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-border bg-background"
                              }`}
                          >
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── STEP 2: Terminal Output Deliverables ─────────────────────── */}
          <div className="space-y-3 pt-4 border-t">
            <div className="space-y-0.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                2. Terminal Output Deliverables <span className="text-rose-500">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Select output deliverable types and attach a file OR provide an external link for each.
              </p>
            </div>

            {isLoadingTypes ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 border rounded-xl bg-muted/20 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                Loading deliverable types...
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {terminalReportTypes.map((typeObj: any) => {
                  const typeId = typeObj.id ?? typeObj.pk;
                  const isChecked = selectedTypeIds.includes(typeId);
                  return (
                    <div
                      key={typeId}
                      onClick={() => handleTypeToggle(typeId, typeObj.name)}
                      className={`cursor-pointer p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all select-none ${isChecked
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                        : "bg-background hover:bg-muted/50 border-border text-foreground"
                        }`}
                    >
                      <span className="truncate pr-1">{typeObj.name}</span>
                      {isChecked && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Deliverable Config Upload Inputs */}
            {selectedTypeIds.length > 0 && (
              <div className="space-y-3 pt-2">
                {selectedTypeIds.map((typeId) => {
                  const config = typeConfigs[typeId] || {
                    terminal_type_id: typeId,
                    name: `Type #${typeId}`,
                    upload_mode: "file",
                    file: null,
                    external_link: "",
                  };

                  return (
                    <div
                      key={typeId}
                      className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          {config.name} Deliverable
                        </span>

                        <div className="flex items-center gap-1 bg-background p-0.5 rounded-lg border text-xs">
                          <button
                            type="button"
                            onClick={() =>
                              handleItemConfigChange(typeId, { upload_mode: "file" })
                            }
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${config.upload_mode === "file"
                              ? "bg-emerald-600 text-white"
                              : "text-muted-foreground hover:text-foreground"
                              }`}
                          >
                            <Upload className="w-3 h-3 inline mr-1" />
                            Upload File
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleItemConfigChange(typeId, { upload_mode: "link" })
                            }
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${config.upload_mode === "link"
                              ? "bg-emerald-600 text-white"
                              : "text-muted-foreground hover:text-foreground"
                              }`}
                          >
                            <Globe className="w-3 h-3 inline mr-1" />
                            External Link
                          </button>
                        </div>
                      </div>

                      {config.upload_mode === "file" ? (
                        <div className="space-y-1">
                          <Input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files && files[0]) {
                                handleItemConfigChange(typeId, { file: files[0] });
                              }
                            }}
                            className="text-xs bg-background h-9 cursor-pointer"
                          />
                          {config.file && (
                            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 pt-0.5">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Selected File: {config.file.name}
                            </p>
                          )}
                          {config.existing_file_url && !config.file && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 pt-0.5">
                              Existing File:{" "}
                              <a
                                href={config.existing_file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-600 underline font-semibold flex items-center"
                              >
                                View Current File <LinkIcon className="w-3 h-3 ml-1" />
                              </a>
                            </p>
                          )}
                        </div>
                      ) : (
                        <Input
                          type="url"
                          placeholder="https://doi.org/10.xxxx/... or https://repository.org/item"
                          value={config.external_link}
                          onChange={(e) =>
                            handleItemConfigChange(typeId, {
                              external_link: e.target.value,
                            })
                          }
                          className="text-xs bg-background h-9"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── STEP 3: Repository Data Center & Compliance ─────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            {/* Data Center Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                3. Target Repository Data Center <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={selectedDataCenterId}
                onValueChange={(val) => {
                  setSelectedDataCenterId(val);
                  if (val !== "other") setCustomDataCenter("");
                }}
              >
                <SelectTrigger className="w-full h-10 text-xs font-semibold rounded-xl border-border bg-background">
                  <SelectValue placeholder="Select target data center..." />
                </SelectTrigger>
                <SelectContent className="z-[100]">
                  {dataCenters.map((dc: any) => (
                    <SelectItem key={dc.id} value={String(dc.id)} className="text-xs cursor-pointer">
                      {dc.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="other" className="text-xs cursor-pointer font-bold text-emerald-600">
                    Other (Specify Custom Repository)
                  </SelectItem>
                </SelectContent>
              </Select>

              {selectedDataCenterId === "other" && (
                <Input
                  placeholder="Enter custom repository name..."
                  value={customDataCenter}
                  onChange={(e) => setCustomDataCenter(e.target.value)}
                  className="text-xs bg-background h-9 mt-2"
                />
              )}
            </div>

            {/* Checklist Confirmation */}
            <div className="space-y-2 flex flex-col justify-end">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                4. Data Sharing Compliance Confirmation <span className="text-rose-500">*</span>
              </Label>
              <div className="p-3 rounded-xl border border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20 flex items-center gap-2.5 h-10">
                <Checkbox
                  id="checklist"
                  checked={checklistCompleted}
                  onCheckedChange={(checked) => setChecklistCompleted(!!checked)}
                  className="h-4 w-4 data-[state=checked]:bg-emerald-600 border-emerald-400"
                />
                <label
                  htmlFor="checklist"
                  className="text-xs font-bold cursor-pointer select-none text-foreground leading-none"
                >
                  Confirm all Data Sharing Checklist standards are met.
                </label>
              </div>
            </div>
          </div>

          {/* ── STEP 4: Executive Summary ────────────────────────────────── */}
          <div className="space-y-2 pt-4 border-t">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              5. Main Deliverables & Executive Summary <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              rows={3}
              placeholder="Summarize core research achievements, primary outcomes, and policy impacts..."
              value={mainDeliverables}
              onChange={(e) => setMainDeliverables(e.target.value)}
              required
              className="text-xs leading-relaxed bg-background"
            />
          </div>
        </form>

        {/* ── Modal Footer Actions ────────────────────────────────────────── */}
        <DialogFooter className="p-4 sm:px-6 bg-slate-50/80 dark:bg-slate-900/50 border-t border-border/60 shrink-0 flex flex-col-reverse sm:flex-row items-center justify-end gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto text-xs font-semibold h-9"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="terminal-report-form"
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9 min-w-[150px] shadow-sm gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
              </>
            ) : initialValues?.id ? (
              "Resubmit Terminal Report"
            ) : (
              "Submit Terminal Report"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
