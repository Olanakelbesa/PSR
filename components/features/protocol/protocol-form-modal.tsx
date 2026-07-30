"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  CloudUpload,
  Eye,
  FileCheck,
  FileText,
  Loader2,
  Paperclip,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Skeleton } from "@/components/ui/skeleton";
import { PdfViewerDialog } from "@/components/shared/pdf-viewer-dialog";
import { cn } from "@/lib/utils";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { getConceptNoteAttachmentKind } from "@/lib/utils/concept-note-attachments";
import { getManagedProposals, getProposals, protocolService } from "@/api/services";
import type { ProtocolAttachmentRecord, ProtocolRecord } from "@/types/protocol";

interface ProposalOption {
  id: string;
  title: string;
  referenceNumber: string;
  status: string;
}

interface ProtocolFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  protocol?: ProtocolRecord | null;
  initialProposalId?: number | string;
  onSuccess?: (updatedRecord: ProtocolRecord) => void;
}

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function ProtocolFormModal({
  isOpen,
  onOpenChange,
  protocol,
  initialProposalId,
  onSuccess,
}: ProtocolFormModalProps) {
  const isEditMode = Boolean(protocol);

  // Proposal state
  const [proposalOptions, setProposalOptions] = useState<ProposalOption[]>([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState<string>("");

  // Primary protocol file state
  const [protocolFile, setProtocolFile] = useState<File | null>(null);
  const [removeExistingProtocolFile, setRemoveExistingProtocolFile] = useState(false);

  // Supporting documents state
  const [newSupportingFiles, setNewSupportingFiles] = useState<File[]>([]);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<number[]>([]);
  const [removeLegacyOtherDocument, setRemoveLegacyOtherDocument] = useState(false);

  // General state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Preview dialog state
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);

  // Drag state
  const [isDraggingPrimary, setIsDraggingPrimary] = useState(false);
  const [isDraggingSupporting, setIsDraggingSupporting] = useState(false);

  // Fetch proposals for create mode
  const fetchProposals = useCallback(async () => {
    if (isEditMode) return;
    setIsLoadingProposals(true);
    try {
      const itemsMap = new Map<string, any>();
      const submittedProposalIds = new Set<string>();

      // Query approved proposals queue, user's proposals, and existing protocols concurrently
      const [approvedResult, ownProposalsResult, existingProtocolsResult] = await Promise.allSettled([
        getProposals({ limit: 100, queue: "approved" }),
        getProposals({ limit: 100 }),
        protocolService.list({ mine: true, limit: 100 }),
      ]);

      // 0. Process existing protocols (filter out active protocols that are pending or approved)
      if (
        existingProtocolsResult.status === "fulfilled" &&
        existingProtocolsResult.value?.data
      ) {
        existingProtocolsResult.value.data.forEach((prot: any) => {
          const status = String(prot.status || "").toLowerCase();
          if (status !== "rejected") {
            const pId = String(
              prot.proposalId ||
                prot.proposal_id ||
                (typeof prot.proposal === "object" ? prot.proposal?.id : prot.proposal),
            );
            if (pId && pId !== "undefined" && pId !== "null") {
              submittedProposalIds.add(pId);
            }
          }
        });
      }

      // 1. Process approved queue proposals (/v1/proposals?limit=100&queue=approved)
      if (approvedResult.status === "fulfilled" && approvedResult.value?.data) {
        approvedResult.value.data.forEach((p: any) => {
          const idKey = String(p.id || p.proposal?.id);
          if (idKey && idKey !== "undefined" && idKey !== "null") {
            itemsMap.set(idKey, p);
          }
        });
      }

      // 2. Process user's own proposals that are in eligible approved states
      const ELIGIBLE_STATUSES = new Set([
        "screening_approved",
        "approved",
        "protocol_stage",
        "funding_recommendation",
        "ready_for_tracking",
        "project_tracking",
        "final_submission",
        "completed",
      ]);
      if (ownProposalsResult.status === "fulfilled" && ownProposalsResult.value?.data) {
        ownProposalsResult.value.data.forEach((p: any) => {
          const idKey = String(p.id || p.proposal?.id);
          const st = String(p.status || p.workflowState || "").toLowerCase();
          if (
            idKey &&
            idKey !== "undefined" &&
            idKey !== "null" &&
            !itemsMap.has(idKey) &&
            ELIGIBLE_STATUSES.has(st)
          ) {
            itemsMap.set(idKey, p);
          }
        });
      }

      // Filter out proposals that already have an active submitted protocol
      const proposalItems = Array.from(itemsMap.values()).filter((p: any) => {
        const pId = String(p.id || p.proposal?.id);
        return !submittedProposalIds.has(pId);
      });

      const options: ProposalOption[] = proposalItems.map((p: any) => ({
        id: String(p.id || p.proposal?.id),
        title: p.title || p.proposal_title || p.proposal?.title || `Proposal #${p.id}`,
        referenceNumber:
          p.referenceNumber || p.reference_number || p.proposal?.reference_number || `#${p.id}`,
        status: p.status || p.proposal?.status || "UNKNOWN",
      }));
      setProposalOptions(options);
    } catch (err) {
      console.error("Failed to load proposals for protocol modal:", err);
    } finally {
      setIsLoadingProposals(false);
    }
  }, [isEditMode]);

  useEffect(() => {
    if (isOpen) {
      setFormError(null);
      setProtocolFile(null);
      setRemoveExistingProtocolFile(false);
      setNewSupportingFiles([]);
      setRemovedAttachmentIds([]);
      setRemoveLegacyOtherDocument(false);

      if (protocol) {
        setSelectedProposalId(String(protocol.proposal));
      } else {
        setSelectedProposalId(initialProposalId ? String(initialProposalId) : "");
        fetchProposals();
      }
    }
  }, [isOpen, protocol, initialProposalId, fetchProposals]);

  const existingProtocolUrl = resolveFileUrl(protocol?.protocolFile || protocol?.protocol_file);
  const existingProtocolFilename = existingProtocolUrl
    ? existingProtocolUrl.split("/").pop() || "Primary Protocol Document"
    : null;

  const legacyOtherUrl = resolveFileUrl(protocol?.otherDocument || protocol?.other_document);
  const legacyOtherFilename = legacyOtherUrl
    ? legacyOtherUrl.split("/").pop() || "Legacy Supporting Document"
    : null;

  const existingAttachments = (protocol?.attachments || []).filter(
    (att) => !removedAttachmentIds.includes(att.id),
  );

  const handleAddSupportingFiles = (files: FileList | File[] | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    setNewSupportingFiles((prev) => [...prev, ...fileArray]);
  };

  const handleRemoveNewSupportingFile = (index: number) => {
    setNewSupportingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingAttachment = (attId: number) => {
    setRemovedAttachmentIds((prev) => [...prev, attId]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEditMode && !selectedProposalId) {
      setFormError("Please select a research proposal.");
      return;
    }

    const hasPrimaryFile = protocolFile || (existingProtocolUrl && !removeExistingProtocolFile);
    if (!hasPrimaryFile) {
      setFormError("Primary protocol document (.pdf, .doc, .docx) is required.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      let result: ProtocolRecord;
      if (isEditMode && protocol) {
        result = await protocolService.update(protocol.id, {
          protocol_file: protocolFile,
          other_documents: newSupportingFiles.length > 0 ? newSupportingFiles : undefined,
          remove_protocol_file: removeExistingProtocolFile,
          remove_other_document: removeLegacyOtherDocument,
          remove_attachment_ids: removedAttachmentIds.length > 0 ? removedAttachmentIds : undefined,
        });
        toast.success("Protocol files updated successfully!");
      } else {
        result = await protocolService.create({
          proposal: Number(selectedProposalId),
          protocol_file: protocolFile!,
          other_documents: newSupportingFiles.length > 0 ? newSupportingFiles : undefined,
        });
        toast.success("Protocol submitted successfully!");
      }

      onOpenChange(false);
      if (onSuccess) onSuccess(result);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to submit protocol files.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="w-[94vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 overflow-hidden gap-0 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-6 pb-4 border-b bg-slate-50/70 dark:bg-slate-900/40">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5 text-xl font-bold">
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  {isEditMode ? <RefreshCw className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
                </div>
                {isEditMode ? "Update Research Protocol" : "Submit Research Protocol"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground pt-1">
                {isEditMode
                  ? "Manage, replace, or add supporting files for your research protocol."
                  : "Upload the primary protocol document and any optional supporting files."}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Form Body - Scrollable */}
          <form id="protocol-form" onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
            {formError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 p-4 text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            {/* Proposal Picker (Create Mode) */}
            {!isEditMode && (
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground">
                  Research Proposal <span className="text-rose-500">*</span>
                </Label>
                {isLoadingProposals ? (
                  <Skeleton className="h-10 w-full rounded-xl" />
                ) : (
                  <SearchableSelect
                    options={proposalOptions.map((p) => ({
                      value: p.id,
                      label: `${p.title} (${p.referenceNumber})`,
                    }))}
                    value={selectedProposalId}
                    onValueChange={setSelectedProposalId}
                    placeholder="Search eligible research proposal..."
                  />
                )}
              </div>
            )}

            {/* Proposal Info Banner (Edit Mode) */}
            {isEditMode && protocol && (
              <div className="rounded-xl border bg-slate-50/50 dark:bg-slate-900/20 p-3.5 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Target Proposal
                </p>
                <p className="text-sm font-semibold text-foreground line-clamp-1">
                  {protocol.proposalTitle || protocol.proposal_title}
                </p>
                <p className="text-xs font-mono font-medium text-primary">
                  {protocol.referenceNumber || protocol.reference_number}
                </p>
              </div>
            )}

            {/* ── 1. Primary Protocol Document Section ───────────────────────────── */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  Primary Protocol Document <span className="text-rose-500">*</span>
                </Label>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  Required (.pdf, .doc, .docx)
                </span>
              </div>

              {/* Active Primary File Card (if file exists & not removed & no new replacement chosen) */}
              {existingProtocolUrl && !removeExistingProtocolFile && !protocolFile ? (
                <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-primary/20 bg-primary/5 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary shrink-0">
                      <FileCheck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {existingProtocolFilename}
                      </p>
                      <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 font-bold border-primary/30 mt-0.5">
                        Uploaded File
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs font-semibold px-2.5 gap-1.5"
                      onClick={() => setPreviewDoc({ url: existingProtocolUrl, title: existingProtocolFilename || "Protocol Document" })}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-semibold px-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                      onClick={() => setRemoveExistingProtocolFile(true)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Replace / Remove
                    </Button>
                  </div>
                </div>
              ) : protocolFile ? (
                /* Selected New Primary File Card */
                <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/40 p-2 text-emerald-600 shrink-0">
                      <Check className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {protocolFile.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-medium">
                        {formatBytes(protocolFile.size)} · New primary file
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs font-semibold px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => setProtocolFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                /* Primary File Dropzone */
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingPrimary(true);
                  }}
                  onDragLeave={() => setIsDraggingPrimary(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingPrimary(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) setProtocolFile(file);
                  }}
                  className={cn(
                    "relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer bg-slate-50/50 dark:bg-slate-900/20",
                    isDraggingPrimary
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/40 hover:bg-slate-50 dark:hover:bg-slate-900/40",
                  )}
                >
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setProtocolFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="rounded-full bg-primary/10 p-3 text-primary mb-2">
                    <CloudUpload className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-bold text-foreground">
                    Click to browse or drag & drop primary protocol file
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Supports PDF, Word (.pdf, .doc, .docx) up to 25MB
                  </p>
                </div>
              )}
            </div>

            {/* ── 2. Other Supporting Documents Section (Multiple Files) ─────────────── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  Other Supporting Documents <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  Multiple files supported
                </span>
              </div>

              {/* Supporting Files Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingSupporting(true);
                }}
                onDragLeave={() => setIsDraggingSupporting(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingSupporting(false);
                  handleAddSupportingFiles(e.dataTransfer.files);
                }}
                className={cn(
                  "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed transition-all text-center cursor-pointer bg-slate-50/30 dark:bg-slate-900/10",
                  isDraggingSupporting
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/40 hover:bg-slate-50 dark:hover:bg-slate-900/30",
                )}
              >
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.zip,.rar,.png,.jpg,.jpeg"
                  onChange={(e) => handleAddSupportingFiles(e.target.files)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <Paperclip className="h-4 w-4" />
                  <span>Click or drag & drop supporting files</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  PDF, Word, Zip, Images (.pdf, .docx, .zip, .png)
                </p>
              </div>

              {/* List of Existing & Newly Selected Supporting Documents */}
              <div className="space-y-2">
                {/* Legacy single otherDocument if exists */}
                {legacyOtherUrl && !removeLegacyOtherDocument && (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl border bg-card shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {legacyOtherFilename}
                        </p>
                        <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 font-bold">
                          Legacy Attachment
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setPreviewDoc({ url: legacyOtherUrl, title: legacyOtherFilename || "Supporting File" })}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2 text-rose-600 hover:text-rose-700"
                        onClick={() => setRemoveLegacyOtherDocument(true)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Existing Attachments List */}
                {existingAttachments.map((att) => {
                  const url = resolveFileUrl(att.file || att.fileUrl || att.file_url) || "";
                  return (
                    <div key={att.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border bg-card shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {att.filename}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatBytes(att.fileSize || att.file_size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={() => setPreviewDoc({ url, title: att.filename })}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs px-2 text-rose-600 hover:text-rose-700"
                          onClick={() => handleRemoveExistingAttachment(att.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {/* Newly Selected Supporting Files */}
                {newSupportingFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/10 shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatBytes(file.size)} · New file to add
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                      onClick={() => handleRemoveNewSupportingFile(idx)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="p-6 pt-4 border-t bg-slate-50/70 dark:bg-slate-900/40 flex items-center justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" form="protocol-form" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "Saving Updates..." : "Submitting..."}
                </>
              ) : (
                <>{isEditMode ? "Save Protocol Updates" : "Submit Protocol"}</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PdfViewerDialog
        isOpen={!!previewDoc}
        onOpenChange={(open) => !open && setPreviewDoc(null)}
        url={previewDoc?.url ?? ""}
        title={previewDoc?.title ?? "Document Preview"}
      />
    </>
  );
}
