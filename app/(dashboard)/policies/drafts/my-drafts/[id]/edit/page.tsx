"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  Save,
  Send,
  UploadCloud,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageContainer } from "@/components/layout";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useConceptNoteDetail, useConceptNotes } from "@/lib/queries/concept-notes";
import { usePolicyDraft } from "@/lib/queries/policy-drafts";
import { usePolicyDocumentTypes } from "@/lib/queries/policy-document-types";
import { useOrganizationTypes } from "@/lib/queries/organization-types";
import { toast } from "sonner";
import { MAX_FILE_SIZE, MAX_FILE_SIZE_MB } from "@/lib/constants";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";

type DraftFormState = {
  title: string;
  conceptNote: string;
  docType: string;
  organization: string;
};

const DEFAULT_FORM: DraftFormState = {
  title: "",
  conceptNote: "",
  docType: "",
  organization: "",
};


const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

type FilePreview = {
  name: string;
  size: number;
  type: string;
};

function normalizeDraftPayload(rawDraft: any) {
  const conceptNoteId = String(
    rawDraft?.conceptNote?.id ??
      rawDraft?.concept_note?.id ??
      rawDraft?.concept_note ??
      "",
  );

  const docTypeId = String(
    rawDraft?.docType?.id ??
      rawDraft?.doc_type?.id ??
      rawDraft?.doc_type ??
      rawDraft?.document_type?.id ??
      "",
  );

  const organizationId = String(
    rawDraft?.organization?.id ??
      rawDraft?.organization_id ??
      rawDraft?.organization ??
      "",
  );

  return {
    title: typeof rawDraft?.title === "string" ? rawDraft.title : "",
    conceptNoteId,
    docTypeId,
    organizationId,
    fileUrl: rawDraft?.file || rawDraft?.overview?.file || null,
  };
}

function formatApiError(error: any, fallback: string) {
  const apiError =
    error?.response?.data?.error ?? error?.response?.data ?? error?.errors;
  if (apiError?.details) {
    const detailMessages = Object.entries(apiError.details)
      .map(([field, messages]) => {
        const formattedField = field
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (value) => value.toUpperCase());
        const messageText = Array.isArray(messages)
          ? messages.join(", ")
          : String(messages);
        return `${formattedField}: ${messageText}`;
      })
      .join("\n");

    if (detailMessages) {
      return detailMessages;
    }
  }

  return (
    apiError?.message ||
    error?.response?.data?.message ||
    (error?.message && error.message !== "[object Object]"
      ? error.message
      : fallback)
  );
}

function makeDraftFormData(
  formState: DraftFormState,
  conceptNoteId: string,
  selectedFile: File | FilePreview | null,
) {
  const formData = new FormData();
  formData.append("title", formState.title.trim());
  formData.append("concept_note", conceptNoteId);
  formData.append("doc_type", formState.docType);
  formData.append("organization", formState.organization);

  if (selectedFile instanceof File) {
    formData.append("draft_file", selectedFile);
  }

  return formData;
}

export default function EditPolicyDraftPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { backendToken } = useAuth();
  const queryClient = useQueryClient();

  const [selectedConceptId, setSelectedConceptId] = useState("");
  const [formState, setFormState] = useState<DraftFormState>(DEFAULT_FORM);
  const [selectedFile, setSelectedFile] = useState<File | FilePreview | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastAutosavedFileSignatureRef = useRef<string>("");

  const { data: rawDraft, isLoading: isLoadingPolicy } = usePolicyDraft(id);
  const { data: approvedConceptsRes, isLoading: isLoadingConcepts } =
    useConceptNotes({ current_status: "policy_draft_ready" }, backendToken);
  const approvedConcepts = approvedConceptsRes?.data || [];
  const { data: policyDocumentTypes = [] } = usePolicyDocumentTypes();
  const { data: organizationTypes = [] } = useOrganizationTypes();

  const normalizedDraft = useMemo(
    () => normalizeDraftPayload(rawDraft),
    [rawDraft],
  );

  const draftStatusValue = String(
    rawDraft?.currentStatus?.status ||
    rawDraft?.current_status ||
    rawDraft?.status ||
    "draft",
  )
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  const canEditDraft =
    draftStatusValue === "draft" ||
    draftStatusValue === "resubmission_required" ||
    draftStatusValue === "revision_requested";
  const canResubmitDraft =
    draftStatusValue === "resubmission_required" ||
    draftStatusValue === "revision_requested";
  const canSubmitDraft = draftStatusValue === "draft";

  const draftConceptId = normalizedDraft.conceptNoteId || selectedConceptId;
  const { data: currentConceptDetail } = useConceptNoteDetail(
    draftConceptId,
    backendToken,
  );

  const conceptNoteOptions = useMemo(() => {
    if (!rawDraft?.conceptNote && !rawDraft?.concept_note) {
      return approvedConcepts;
    }

    const currentConcept = rawDraft.conceptNote || rawDraft.concept_note;
    const currentConceptId = String(
      typeof currentConcept === "object" && currentConcept !== null
        ? currentConcept.id
        : currentConcept ?? "",
    );

    if (!currentConceptId) {
      return approvedConcepts;
    }

    const existsInList = approvedConcepts.some(
      (item) => String(item.id) === currentConceptId,
    );

    if (existsInList) {
      return approvedConcepts;
    }

    return [
      {
        id: currentConceptId,
        title:
          (typeof currentConcept === "object" && currentConcept !== null
            ? currentConcept.title
            : undefined) ||
          currentConceptDetail?.title ||
          "Existing concept note",
        docType:
          typeof currentConcept === "object" && currentConcept !== null
            ? currentConcept.docType
            : currentConceptDetail?.docType ?? null,
        organization:
          typeof currentConcept === "object" && currentConcept !== null
            ? currentConcept.organization
            : currentConceptDetail?.organization ?? null,
      },
      ...approvedConcepts,
    ];
  }, [approvedConcepts, currentConceptDetail, rawDraft]);

  const selectedConceptSummary = useMemo(
    () =>
      conceptNoteOptions.find(
        (item) => String(item.id) === selectedConceptId,
      ) || null,
    [conceptNoteOptions, selectedConceptId],
  );

  const selectedDocTypeName = useMemo(() => {
    const docTypeId = Number(formState.docType);
    if (!docTypeId) return "Unknown";
    return (
      policyDocumentTypes.find((item) => item.id === docTypeId)?.name ||
      "Unknown"
    );
  }, [formState.docType, policyDocumentTypes]);

  const selectedOrganizationName = useMemo(() => {
    const organizationId = Number(formState.organization);
    if (!organizationId) return "Unknown";
    return (
      organizationTypes.find((item) => item.id === organizationId)?.name ||
      "Unknown"
    );
  }, [formState.organization, organizationTypes]);

  useEffect(() => {
    if (!rawDraft) return;

    const conceptId = String(
      (typeof rawDraft.conceptNote === "object" && rawDraft.conceptNote !== null
        ? rawDraft.conceptNote.id
        : rawDraft.conceptNote ?? rawDraft.concept_note) ?? "",
    );

    const docTypeId = String(
      (typeof rawDraft.docType === "object" && rawDraft.docType !== null
        ? rawDraft.docType.id
        : rawDraft.docType ?? rawDraft.doc_type) ?? "",
    );

    const organizationId = String(
      (typeof rawDraft.organization === "object" && rawDraft.organization !== null
        ? rawDraft.organization.id
        : rawDraft.organization ?? rawDraft.organization_id ?? rawDraft.organizationId) ?? "",
    );

    setSelectedConceptId(conceptId || normalizedDraft.conceptNoteId);
    setFormState({
      title: rawDraft.title || "",
      conceptNote: normalizedDraft.conceptNoteId || conceptId,
      docType: docTypeId,
      organization: organizationId,
    });

    // Support multiple possible file keys and shapes returned by backend
    const resolveUrl = (val: any): string | null => {
      if (!val) return null;
      if (typeof val === "string") return resolveFileUrl(val);
      if (typeof val === "object") {
        if (val.url) return resolveFileUrl(val.url);
        if (val.path) return resolveFileUrl(val.path);
        if (val.submitted_file) return resolveUrl(val.submitted_file);
        if (val.file) return resolveUrl(val.file);
      }
      return null;
    };

    const candidates = [
      rawDraft.draft_file,
      rawDraft.file,
      rawDraft.overview?.file,
      rawDraft.latest_version,
      rawDraft.latest_version?.submitted_file,
      rawDraft.latest_version?.submittedFile,
      rawDraft.latest_version?.file,
      rawDraft.versions?.[0],
      rawDraft.versions?.[0]?.submitted_file,
      rawDraft.versions?.[0]?.file,
    ];

    let fileUrl: string | null = null;
    for (const c of candidates) {
      const url = resolveUrl(c);
      if (url) {
        fileUrl = url;
        break;
      }
    }

    if (fileUrl) {
      setSelectedFile({
        name:
          String(normalizedDraft.fileUrl).split("/").pop() || "Draft_Document.pdf",
        size: 0,
        type: "application/pdf",
      });
      return;
    }

    setSelectedFile(null);
    lastAutosavedFileSignatureRef.current = "";
  }, [rawDraft, normalizedDraft.conceptNoteId]);

  useEffect(() => {
    if (!currentConceptDetail || !draftConceptId) {
      return;
    }

    setFormState((prev) => ({
      ...prev,
      conceptNote: prev.conceptNote || draftConceptId,
      docType:
        prev.docType ||
        (currentConceptDetail.docType?.id
          ? String(currentConceptDetail.docType.id)
          : ""),
      organization:
        prev.organization ||
        (currentConceptDetail.organization?.id
          ? String(currentConceptDetail.organization.id)
          : ""),
    }));
  }, [currentConceptDetail, draftConceptId]);

  useEffect(() => {
    if (!(selectedFile instanceof File)) {
      return;
    }

    if (!canEditDraft) {
      return;
    }

    if (
      !selectedConceptId ||
      !formState.title.trim() ||
      !formState.docType ||
      !formState.organization
    ) {
      return;
    }

    const currentFileSignature = `${selectedFile.name}-${selectedFile.size}-${selectedFile.type}-${selectedFile.lastModified}`;

    if (lastAutosavedFileSignatureRef.current === currentFileSignature) {
      return;
    }

    const autosaveTimeout = window.setTimeout(async () => {
      try {
        await apiClient.patch(
          API_ENDPOINTS.POLICY_DRAFTS.UPDATE(id),
          makeDraftFormData(formState, selectedConceptId, selectedFile),
          { headers: { "Content-Type": "multipart/form-data" } },
        );
        lastAutosavedFileSignatureRef.current = currentFileSignature;
        toast.success("Draft autosaved after file upload.");
      } catch (error: any) {
        toast.error(
          formatApiError(error, "Failed to autosave the policy draft."),
        );
      }
    }, 500);

    return () => window.clearTimeout(autosaveTimeout);
  }, [formState, id, selectedConceptId, selectedFile, canEditDraft]);

  const handleConceptSelect = (conceptId: string) => {
    setSelectedConceptId(conceptId);
    const concept = conceptNoteOptions.find(
      (item) => String(item.id) === conceptId,
    );

    if (concept) {
      setFormState((prev) => ({
        ...prev,
        title: concept.title || "",
        conceptNote: conceptId,
        docType: String(concept.docType?.id || ""),
        organization: String(concept.organization?.id || ""),
      }));
      setSelectedFile(null);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File size must be less than ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error("Invalid file type. Please upload PDF or DOCX.");
      return;
    }

    setSelectedFile(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleSave = async () => {
    if (isSaving || isSubmitting) {
      return;
    }

    if (!canEditDraft) {
      toast.error("This draft is locked. Only drafts and resubmission-required drafts can be edited.");
      return;
    }

    if (!selectedConceptId) {
      toast.error("Please select an approved concept note.");
      return;
    }

    if (
      !formState.title.trim() ||
      !formState.conceptNote ||
      !formState.docType ||
      !formState.organization
    ) {
      toast.error("Please complete the draft fields before submitting.");
      return;
    }

    setIsSaving(true);
    try {
      const formData = makeDraftFormData(
        formState,
        selectedConceptId,
        selectedFile,
      );
      await apiClient.patch(API_ENDPOINTS.POLICY_DRAFTS.UPDATE(id), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Policy draft updated successfully");
      router.push(`/policies/drafts/my-drafts/${id}`);
    } catch (error: any) {
      toast.error(
        formatApiError(
          error,
          "An error occurred while updating the policy draft",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (isSaving || isSubmitting) {
      return;
    }

    if (!canEditDraft) {
      toast.error("This draft is locked. Only drafts and resubmission-required drafts can be submitted.");
      return;
    }

    if (!selectedConceptId) {
      toast.error("Please select an approved concept note.");
      return;
    }

    if (
      !formState.title.trim() ||
      !formState.conceptNote ||
      !formState.docType ||
      !formState.organization
    ) {
      toast.error("Please complete the draft fields before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (canSubmitDraft) {
        await apiClient.post(API_ENDPOINTS.POLICY_DRAFTS.SUBMIT(id));
      } else {
        await apiClient.post(API_ENDPOINTS.POLICY_DRAFTS.RESUBMIT(id));
      }

      // Invalidate caches so UI reflects backend state after submit/resubmit
      queryClient.invalidateQueries({ queryKey: ["policy-draft", id] });
      queryClient.invalidateQueries({ queryKey: ["policy-drafts"] });
      queryClient.invalidateQueries({ queryKey: ["policy-drafts-manage"] });

      toast.success(
        canSubmitDraft
          ? "Policy draft submitted for expert review"
          : "Policy draft resubmitted for expert review",
      );
      router.push("/policies/drafts/my-drafts");
    } catch (error: any) {
      toast.error(
        formatApiError(
          error,
          canSubmitDraft
            ? "An error occurred while submitting the policy draft"
            : "An error occurred while resubmitting the policy draft",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingPolicy || isLoadingConcepts) {
    return (
      <PageContainer title="Loading Draft...">
        <div className="h-96 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading policy draft details...
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={canEditDraft ? "Edit Policy Draft" : "Locked Policy Draft"}
      description={
        canEditDraft
          ? "Update the draft from an approved concept note and resubmit when ready."
          : "This draft has already been submitted. Only drafts returned for resubmission can be edited."
      }
      actions={
        <Button variant="outline" asChild className="shadow-sm">
          <Link href={`/policies/drafts/my-drafts/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Card className="shadow-sm overflow-hidden border-primary/10">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Approved Concept Note
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Select Approved Concept Note{" "}
                  <span className="text-destructive">*</span>
                </label>
                <Select
                  value={selectedConceptId}
                  onValueChange={handleConceptSelect}
                  disabled={!canEditDraft}
                >
                  <SelectTrigger className="h-11 shadow-sm focus:ring-primary/20">
                    {selectedConceptSummary ? (
                      <div className="flex items-center gap-2 min-w-0 text-left">
                        <span className="truncate font-medium">
                          {selectedConceptSummary.title}
                        </span>
                        <span className="shrink-0 text-[10px] text-muted-foreground uppercase">
                          ID: {selectedConceptSummary.id}
                        </span>
                      </div>
                    ) : (
                      <SelectValue
                        placeholder={
                          isLoadingConcepts
                            ? "Loading approved concept notes..."
                            : "Choose an approved concept note..."
                        }
                      />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {conceptNoteOptions.length > 0 ? (
                      conceptNoteOptions.map((concept) => (
                        <SelectItem key={concept.id} value={String(concept.id)}>
                          <div className="flex flex-col py-1 text-left">
                            <span className="font-bold">{concept.title}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">
                              ID: {concept.id} ·{" "}
                              {concept.docType?.name || "Concept Note"}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        No approved concept notes found.
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  The selected concept note will seed the draft fields and can
                  be edited after auto-fill.
                </p>
              </div>

              {selectedConceptId && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">
                        Selected Concept
                      </p>
                      <p className="text-sm font-black text-foreground">
                        {selectedConceptSummary?.title || "Concept Note"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">
                        Concept Note ID
                      </p>
                      <Badge variant="outline" className="bg-background">
                        {selectedConceptId}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">
                        Document Type
                      </p>
                      <p className="text-sm font-medium">
                        {selectedDocTypeName}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">
                        Organization
                      </p>
                      <p className="text-sm font-medium">
                        {selectedOrganizationName}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm overflow-hidden border-primary/10">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Draft Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-foreground">
                    Title
                  </label>
                  <Input
                    value={formState.title}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Policy draft title"
                      disabled={!canEditDraft}
                  />
                </div>
              </div>



              <div className="space-y-4">
                <div className="text-sm font-semibold text-foreground">
                  Document Upload
                </div>
                {!selectedFile ? (
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center border-2 border-dashed rounded-xl py-12 px-6 bg-muted/5 transition-all cursor-pointer relative",
                      isDragging
                        ? "border-primary bg-primary/5 scale-[1.01]"
                        : "border-muted-foreground/20 hover:border-primary/50",
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => canEditDraft && fileInputRef.current?.click()}
                  >
                    <Input
                      ref={fileInputRef}
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      disabled={!canEditDraft}
                    />
                    <div
                      className={cn(
                        "h-12 w-12 rounded-full flex items-center justify-center mb-4 transition-transform duration-300",
                        isDragging
                          ? "bg-primary text-primary-foreground scale-110"
                          : "bg-primary/10 text-primary",
                      )}
                    >
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">
                      {isDragging
                        ? "Drop the file here"
                        : "Click or drag to upload a revised draft"}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      PDF, DOC, or DOCX up to {MAX_FILE_SIZE_MB}MB
                    </p>
                  </div>
                ) : (
                  <div className="p-6 rounded-xl border-2 border-primary/20 bg-primary/2 relative group overflow-hidden">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                    />

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center shadow-sm shrink-0">
                          <FileText className="h-7 w-7 text-primary" />
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-sm font-bold text-foreground truncate">
                            {selectedFile.name}
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-background font-mono px-1.5 py-0"
                            >
                              {selectedFile.size
                                ? (selectedFile.size / (1024 * 1024)).toFixed(2)
                                : "0.00"}{" "}
                              MB
                            </Badge>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                              {selectedFile.type
                                ?.split("/")
                                .pop()
                                ?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 px-4 border-primary/20 text-primary hover:bg-primary/5 font-bold text-xs"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={!canEditDraft}
                        >
                          <UploadCloud className="mr-2 h-3.5 w-3.5" />
                          Re-upload
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-9 px-4 text-destructive hover:text-destructive hover:bg-destructive/5 font-bold text-xs"
                          onClick={() => {
                            setSelectedFile(null);
                            lastAutosavedFileSignatureRef.current = "";
                          }}
                          disabled={!canEditDraft}
                        >
                          <X className="mr-2 h-3.5 w-3.5" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-10 xl:h-fit">
          <Card className="shadow-md border-primary/10 overflow-hidden">
            <CardHeader className="bg-primary text-primary-foreground py-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider">
                Submission Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline" className="bg-background">
                    {canResubmitDraft
                      ? "Resubmission Required"
                      : canSubmitDraft
                      ? "Draft"
                      : "Locked"}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {canResubmitDraft
                    ? "Update the draft, then resubmit it for expert review when ready."
                    : canSubmitDraft
                    ? "You can update this draft before submission."
                    : "Submitted drafts are locked. Only drafts and drafts returned for resubmission can be edited."}
                </p>
              </div>

              {canSubmitDraft && (
                <Button
                  type="button"
                  className="w-full h-11 bg-primary hover:bg-primary/90"
                  disabled={!canEditDraft || isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Submit
                </Button>
              )}

              {canResubmitDraft && (
                <Button
                  type="button"
                  className="w-full h-11"
                  disabled={!canEditDraft || isSaving || isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSaving || isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Resubmit
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-primary/20 text-primary hover:bg-primary/5"
                disabled={!canEditDraft || isSaving || isSubmitting}
                onClick={handleSave}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {canEditDraft ? "Update Draft" : "Locked"}
              </Button>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                  Requirements
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-xs text-slate-600">
                    <div
                      className={cn(
                        "h-4 w-4 rounded-full flex items-center justify-center",
                        formState.title.trim()
                          ? "bg-green-100 text-green-600"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {formState.title.trim() ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <div className="h-1 w-1 bg-current rounded-full" />
                      )}
                    </div>
                    Title
                  </li>
                  <li className="flex items-center gap-2 text-xs text-slate-600">
                    <div
                      className={cn(
                        "h-4 w-4 rounded-full flex items-center justify-center",
                        formState.conceptNote
                          ? "bg-green-100 text-green-600"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {formState.conceptNote ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <div className="h-1 w-1 bg-current rounded-full" />
                      )}
                    </div>
                    Concept note, doc type, and organization IDs
                  </li>
                  <li className="flex items-center gap-2 text-xs text-slate-600">
                    <div
                      className={cn(
                        "h-4 w-4 rounded-full flex items-center justify-center",
                        selectedFile
                          ? "bg-green-100 text-green-600"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {selectedFile ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <div className="h-1 w-1 bg-current rounded-full" />
                      )}
                    </div>
                    Draft file is optional
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/30 border-dashed">
            <CardContent className="pt-6">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                This page mirrors the concept-note-driven draft flow. Selecting
                a concept note updates the form fields, and both update and
                submit actions keep working against the same draft ID.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}

function cn(...inputs: Array<string | false | null | undefined>) {
  return inputs.filter(Boolean).join(" ");
}
