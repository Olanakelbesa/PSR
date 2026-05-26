"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
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
import {
  useConceptNotes,
  useConceptNoteDetail,
} from "@/lib/queries/concept-notes";
import { usePolicyDocumentTypes } from "@/lib/queries/policy-document-types";
import { useOrganizationTypes } from "@/lib/queries/organization-types";
import { toast } from "sonner";

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

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

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
  selectedFile: File | null,
) {
  const formData = new FormData();
  formData.append("title", formState.title.trim());
  formData.append("concept_note", conceptNoteId);
  formData.append("doc_type", formState.docType);
  formData.append("organization", formState.organization);

  if (selectedFile) {
    formData.append("draft_file", selectedFile);
  }

  return formData;
}

function draftSignature(formState: DraftFormState, selectedFile: File | null) {
  return JSON.stringify({
    title: formState.title.trim(),
    conceptNote: formState.conceptNote,
    docType: formState.docType,
    organization: formState.organization,
    file: selectedFile
      ? {
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type,
        }
      : null,
  });
}

export default function NewPolicyDraftPage() {
  const router = useRouter();
  const { backendToken } = useAuth();
  const queryClient = useQueryClient();

  const [selectedConceptId, setSelectedConceptId] = useState("");
  const [formState, setFormState] = useState<DraftFormState>(DEFAULT_FORM);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [createdDraftId, setCreatedDraftId] = useState<number | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const initializationInFlightRef = useRef(false);
  const autosaveTimerRef = useRef<number | null>(null);
  const lastSavedSignatureRef = useRef<string>("");

  const { data: approvedConceptsRes, isLoading: isLoadingConcepts } =
    useConceptNotes({ current_status: "policy_draft_ready" }, backendToken);
  const approvedConcepts = approvedConceptsRes?.data || [];
  const { data: policyDocumentTypes = [] } = usePolicyDocumentTypes();
  const { data: organizationTypes = [] } = useOrganizationTypes();

  const selectedConceptSummary = useMemo(
    () =>
      approvedConcepts.find((item) => String(item.id) === selectedConceptId) ||
      null,
    [approvedConcepts, selectedConceptId],
  );

  const { data: selectedConceptDetail, isLoading: isLoadingConceptDetail } =
    useConceptNoteDetail(selectedConceptId, backendToken);

  const selectedDocTypeName = useMemo(() => {
    const docTypeId = Number(formState.docType);
    if (!docTypeId) return "Unknown";

    return (
      policyDocumentTypes.find((item) => item.id === docTypeId)?.name ||
      selectedConceptDetail?.docType?.name ||
      selectedConceptSummary?.docType?.name ||
      "Unknown"
    );
  }, [
    formState.docType,
    policyDocumentTypes,
    selectedConceptDetail,
    selectedConceptSummary,
  ]);

  const selectedOrganizationName = useMemo(() => {
    const organizationId = Number(formState.organization);
    if (!organizationId) return "Unknown";

    return (
      organizationTypes.find((item) => item.id === organizationId)?.name ||
      selectedConceptDetail?.organization?.name ||
      selectedConceptSummary?.organization?.name ||
      "Unknown"
    );
  }, [
    formState.organization,
    organizationTypes,
    selectedConceptDetail,
    selectedConceptSummary,
  ]);

  const currentSignature = draftSignature(formState, selectedFile);
  const canAutoCreateDraft = Boolean(
    selectedConceptId &&
    selectedFile &&
    formState.docType &&
    formState.organization,
  );

  useEffect(() => {
    if (!selectedConceptId) {
      setFormState(DEFAULT_FORM);
      setSelectedFile(null);
      setCreatedDraftId(null);
      setLastSavedAt(null);
      lastSavedSignatureRef.current = "";
      return;
    }

    setFormState((prev) => ({
      ...prev,
      conceptNote: selectedConceptId,
    }));
    setCreatedDraftId(null);
    setLastSavedAt(null);
    lastSavedSignatureRef.current = "";
  }, [selectedConceptId]);

  useEffect(() => {
    if (!selectedConceptId || !selectedConceptDetail) {
      return;
    }

    setFormState((prev) => ({
      ...prev,
      conceptNote: selectedConceptId,
      title: prev.title || selectedConceptDetail.title || "",
      docType:
        prev.docType ||
        (selectedConceptDetail.docType?.id
          ? String(selectedConceptDetail.docType.id)
          : ""),
      organization:
        prev.organization ||
        (selectedConceptDetail.organization?.id
          ? String(selectedConceptDetail.organization.id)
          : ""),
    }));
  }, [selectedConceptId, selectedConceptDetail]);

  useEffect(() => {
    let cancelled = false;

    const initializeDraft = async () => {
      if (
        !selectedConceptId ||
        !selectedConceptSummary ||
        !canAutoCreateDraft ||
        createdDraftId ||
        isLocked ||
        initializationInFlightRef.current
      ) {
        return;
      }

      initializationInFlightRef.current = true;
      setIsInitializing(true);

      try {
        const checkRes = await apiClient.get(API_ENDPOINTS.POLICY_DRAFTS.LIST, {
          params: { concept_note: selectedConceptId },
        });

        const existingDrafts = checkRes.data?.data || checkRes.data || [];

        if (cancelled) {
          return;
        }

        if (Array.isArray(existingDrafts) && existingDrafts.length > 0) {
          const draft = existingDrafts[0];
          const draftId = Number(draft.id);

          await apiClient.patch(
            API_ENDPOINTS.POLICY_DRAFTS.UPDATE(draftId),
            makeDraftFormData(formState, selectedConceptId, selectedFile),
            { headers: { "Content-Type": "multipart/form-data" } },
          );

          if (cancelled) {
            return;
          }

          setCreatedDraftId(draftId);
          lastSavedSignatureRef.current = currentSignature;
          setLastSavedAt(new Date().toISOString());
          toast.success(
            "Existing policy draft updated for the selected concept note.",
          );
          return;
        }

        const createRes = await apiClient.post(
          API_ENDPOINTS.POLICY_DRAFTS.CREATE,
          makeDraftFormData(formState, selectedConceptId, selectedFile),
          { headers: { "Content-Type": "multipart/form-data" } },
        );

        if (cancelled) {
          return;
        }

        const draft = createRes.data?.data || createRes.data;
        const draftId = Number(draft?.id);
        if (!draftId) {
          throw new Error("Invalid draft ID returned from server.");
        }

        setCreatedDraftId(draftId);
        lastSavedSignatureRef.current = currentSignature;
        setLastSavedAt(new Date().toISOString());
        toast.success("Policy draft created from the selected concept note.");
      } catch (error: any) {
        if (!cancelled) {
          toast.error(formatApiError(error, "Failed to create policy draft."));
        }
      } finally {
        if (!cancelled) {
          initializationInFlightRef.current = false;
          setIsInitializing(false);
        }
      }
    };

    void initializeDraft();

    return () => {
      cancelled = true;
    };
  }, [
    selectedConceptId,
    selectedConceptSummary,
    formState.title,
    formState.conceptNote,
    formState.docType,
    formState.organization,
    selectedFile,
    currentSignature,
    createdDraftId,
    isLocked,
  ]);

  useEffect(() => {
    if (
      !createdDraftId ||
      isLocked ||
      isInitializing ||
      !formState.title.trim() ||
      !formState.conceptNote ||
      !formState.docType ||
      !formState.organization
    ) {
      return;
    }

    if (lastSavedSignatureRef.current === currentSignature) {
      return;
    }

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(async () => {
      try {
        setIsAutosaving(true);
        await apiClient.patch(
          API_ENDPOINTS.POLICY_DRAFTS.UPDATE(createdDraftId),
          makeDraftFormData(formState, selectedConceptId, selectedFile),
          { headers: { "Content-Type": "multipart/form-data" } },
        );
        lastSavedSignatureRef.current = currentSignature;
        setLastSavedAt(new Date().toISOString());
      } catch (error: any) {
        toast.error(
          formatApiError(error, "Failed to autosave the policy draft."),
        );
      } finally {
        setIsAutosaving(false);
      }
    }, 850);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [
    createdDraftId,
    currentSignature,
    formState,
    selectedFile,
    isInitializing,
    isLocked,
  ]);

  const handleConceptSelect = (conceptId: string) => {
    setSelectedConceptId(conceptId);

    const selectedConcept = approvedConcepts.find(
      (item) => String(item.id) === conceptId,
    );

    setFormState((prev) => ({
      ...prev,
      conceptNote: conceptId,
      title: selectedConcept?.title || "",
      docType: selectedConcept?.docType?.id
        ? String(selectedConcept.docType.id)
        : "",
      organization: selectedConcept?.organization?.id
        ? String(selectedConcept.organization.id)
        : "",
    }));
  };

  const validateAndSetFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size must be less than 20MB.");
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

  const ensureDraftId = async () => {
    if (createdDraftId) {
      return createdDraftId;
    }

    if (!selectedConceptId || !selectedConceptSummary) {
      return null;
    }

    const checkRes = await apiClient.get(API_ENDPOINTS.POLICY_DRAFTS.LIST, {
      params: { concept_note: selectedConceptId },
    });
    const existingDrafts = checkRes.data?.data || checkRes.data || [];
    if (Array.isArray(existingDrafts) && existingDrafts.length > 0) {
      const draftId = Number(existingDrafts[0].id);
      setCreatedDraftId(draftId);
      return draftId;
    }

    const createRes = await apiClient.post(
      API_ENDPOINTS.POLICY_DRAFTS.CREATE,
      makeDraftFormData(formState, selectedConceptId, selectedFile),
      { headers: { "Content-Type": "multipart/form-data" } },
    );

    const draft = createRes.data?.data || createRes.data;
    const draftId = Number(draft?.id);
    if (!draftId) {
      throw new Error("Invalid draft ID returned from server.");
    }

    setCreatedDraftId(draftId);
    return draftId;
  };

  const persistLatestChanges = async () => {
    const draftId = await ensureDraftId();
    if (!draftId) {
      throw new Error("Please select an approved concept note.");
    }

    await apiClient.patch(
      API_ENDPOINTS.POLICY_DRAFTS.UPDATE(draftId),
      makeDraftFormData(formState, selectedConceptId, selectedFile),
      { headers: { "Content-Type": "multipart/form-data" } },
    );

    lastSavedSignatureRef.current = currentSignature;
    setLastSavedAt(new Date().toISOString());
    return draftId;
  };

  const handleSubmitDraft = async () => {
    if (isLocked) {
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
      const draftId = await ensureDraftId();
      if (!draftId) {
        throw new Error("Please select an approved concept note.");
      }

      await apiClient.post(API_ENDPOINTS.POLICY_DRAFTS.SUBMIT(draftId));

      const selectedConceptKey = String(selectedConceptId);
      queryClient.setQueriesData({ queryKey: ["concept-notes"] }, (current: any) => {
        if (!current) return current;

        const filterOutSelectedConcept = (items: any[]) =>
          items.filter((item) => String(item?.id) !== selectedConceptKey);

        if (Array.isArray(current)) {
          return filterOutSelectedConcept(current);
        }

        if (Array.isArray(current.data)) {
          return {
            ...current,
            data: filterOutSelectedConcept(current.data),
          };
        }

        return current;
      });

      setIsLocked(true);
      toast.success("Policy draft submitted for review.");
      router.push("/policies/drafts/my-drafts");
    } catch (error: any) {
      toast.error(formatApiError(error, "Failed to submit the policy draft."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusLabel = isLocked
    ? "Submitted"
    : isInitializing
      ? "Creating draft..."
      : isAutosaving
        ? "Autosaving..."
        : lastSavedAt
          ? "Saved"
          : "Ready";

  return (
    <PageContainer
      title="Create Policy Draft"
      description="Start from an approved concept note, auto-fill the draft, and let changes save automatically."
      actions={
        <Button variant="outline" asChild className="shadow-sm">
          <Link href="/policies/drafts/my-drafts">
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
                  disabled={isLocked}
                >
                  <SelectTrigger className="h-11 shadow-sm focus:ring-primary/20">
                    <SelectValue
                      placeholder={
                        isLoadingConcepts
                          ? "Loading approved concept notes..."
                          : "Choose an approved concept note..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedConcepts.length > 0 ? (
                      approvedConcepts.map((concept) => (
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
                  The selected concept note prefills title, document type, and
                  organization. You can adjust these values before submitting.
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
                        {selectedConceptSummary?.title ||
                          selectedConceptDetail?.title ||
                          "Concept Note"}
                      </p>
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
                <div className="space-y-2 ">
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
                    disabled={isLocked}
                  />
                </div>
              </div>

              <div className=" grid grid-cols-1 lg:grid-cols-2 w-full">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    Doc Type
                  </label>
                  <Select
                    value={formState.docType}
                    onValueChange={(value) =>
                      setFormState((prev) => ({
                        ...prev,
                        docType: value,
                      }))
                    }
                    disabled={isLocked}
                  >
                    <SelectTrigger className="h-11 shadow-sm focus:ring-primary/20">
                      <SelectValue placeholder="Choose a policy document type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {policyDocumentTypes.length > 0 ? (
                        policyDocumentTypes.map((type) => (
                          <SelectItem key={type.id} value={String(type.id)}>
                            <div className="flex flex-col py-1 text-left">
                              <span className="font-bold">{type.name}</span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-muted-foreground">
                          No policy document types found.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    Organization
                  </label>
                  <Select
                    value={formState.organization}
                    onValueChange={(value) =>
                      setFormState((prev) => ({
                        ...prev,
                        organization: value,
                      }))
                    }
                    disabled={isLocked}
                  >
                    <SelectTrigger className="h-11 shadow-sm focus:ring-primary/20">
                      <SelectValue placeholder="Choose an organization type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {organizationTypes.length > 0 ? (
                        organizationTypes.map((type) => (
                          <SelectItem key={type.id} value={String(type.id)}>
                            <div className="flex flex-col py-1 text-left">
                              <span className="font-bold">{type.name}</span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-muted-foreground">
                          No organization types found.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                {!selectedFile ? (
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center border-2 border-dashed rounded-xl py-12 px-6 bg-muted/5 transition-all cursor-pointer relative",
                      isDragging
                        ? "border-primary bg-primary/5 scale-[1.01]"
                        : "border-muted-foreground/20 hover:border-primary/50",
                      isLocked && "pointer-events-none opacity-60",
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <p>Document Upload</p>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      disabled={isLocked}
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
                        : "Click or drag to upload a draft document"}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      PDF, DOC, or DOCX up to 20MB
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
                      disabled={isLocked}
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
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)}{" "}
                              MB
                            </Badge>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                              {selectedFile.type
                                .split("/")
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
                          disabled={isLocked}
                        >
                          <UploadCloud className="mr-2 h-3.5 w-3.5" />
                          Replace
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-9 px-4 text-destructive hover:text-destructive hover:bg-destructive/5 font-bold text-xs"
                          onClick={() => setSelectedFile(null)}
                          disabled={isLocked}
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
                    {statusLabel}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {lastSavedAt
                    ? `Last saved ${new Date(lastSavedAt).toLocaleString()}`
                    : "Waiting for draft initialization."}
                </p>
              </div>

              <Button
                type="button"
                className="w-full h-11"
                disabled={
                  isSubmitting ||
                  isLocked ||
                  isInitializing ||
                  isLoadingConcepts ||
                  isLoadingConceptDetail ||
                  !selectedConceptId
                }
                onClick={handleSubmitDraft}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isLocked ? "Submitted" : "Submit Draft"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-primary/20 text-primary hover:bg-primary/5"
                disabled={
                  isLocked || isInitializing || isAutosaving || !createdDraftId
                }
                onClick={async () => {
                  try {
                    setIsAutosaving(true);
                    await persistLatestChanges();
                    toast.success("Draft saved.");
                  } catch (error: any) {
                    toast.error(
                      formatApiError(error, "Failed to save the draft."),
                    );
                  } finally {
                    setIsAutosaving(false);
                  }
                }}
              >
                {isAutosaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Now
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
                Selecting an approved concept note seeds the draft details. You
                can update any prefilled field, upload the policy draft file,
                then save or submit when ready.
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
