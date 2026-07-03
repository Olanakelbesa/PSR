"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Check,
  FileText,
  Loader2,
  RefreshCw,
  Save,
  Send,
  UploadCloud,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { extractFileName, resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { MAX_FILE_SIZE_MB, MAX_CONCEPT_NOTE_SUMMARY_WORDS } from "@/lib/constants";
import {
  countWords,
  CONCEPT_NOTE_SUMMARY_TEXTAREA_CLASS,
  getSummaryWordCountStatus,
} from "@/lib/utils/word-count";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { PageContainer } from "@/components/layout";
import { StrategicObjectivesField } from "@/components/policies/concept-notes/strategic-objectives-field";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizations } from "@/lib/queries/organizations";
import { useUnits } from "@/lib/queries/units";
import {
  useConceptNoteDetail,
  useResubmitConceptNote,
  useSubmitConceptNote,
  useUpdateConceptNote,
} from "@/lib/queries/concept-notes";
import { usePolicyDocumentTypes } from "@/lib/queries/policy-document-types";
// thematic areas removed from concept notes
import { conceptNoteSchema, type ConceptNoteFormData } from "@/lib/validations";
import { toast } from "sonner";
import {
  CONCEPT_NOTE_ATTACHMENT_ACCEPT,
  isConceptNoteAllowedAttachment,
} from "@/lib/utils/concept-note-attachments";

const MAX_TITLE_LENGTH = 500;
const MAX_SUMMARY_WORDS = MAX_CONCEPT_NOTE_SUMMARY_WORDS;

export default function EditConceptNotePage() {
  const router = useRouter();
  const params = useParams();
  const conceptNoteId = Array.isArray(params.id)
    ? params.id[0]
    : String(params.id);
  const { backendToken } = useAuth();
  const updateMutation = useUpdateConceptNote(backendToken);
  const submitMutation = useSubmitConceptNote(backendToken);
  const resubmitMutation = useResubmitConceptNote(backendToken);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ConceptNoteFormData>({
    resolver: zodResolver(conceptNoteSchema),
    defaultValues: {
      title: "",
      executiveSummary: "",
      documentType: undefined,
      organization: "",
      unit: "",
      documentCategory: "new",
      strategicObjectives: [],
      file: undefined,
    },
  });

  const {
    data: conceptNote,
    isLoading: isLoadingNote,
    isError: isNoteError,
    refetch: refetchNote,
  } = useConceptNoteDetail(conceptNoteId, backendToken);

  const { data: documentTypes = [], isLoading: isLoadingDocumentTypes } =
    usePolicyDocumentTypes();
  // Thematic areas removed — frontend no longer loads or selects them
  const { data: organizations = [], isLoading: isLoadingOrganizations } =
    useOrganizations();

  const documentTypeOptions = useMemo(() => {
    if (!conceptNote?.docType) return documentTypes;

    const currentDocumentTypeId = String(conceptNote.docType.id);
    const hasCurrentDocumentType = documentTypes.some(
      (type) => String(type.id) === currentDocumentTypeId,
    );

    if (hasCurrentDocumentType) return documentTypes;

    return [conceptNote.docType, ...documentTypes];
  }, [conceptNote, documentTypes]);

  const organizationOptions = useMemo(() => {
    if (!conceptNote?.organization) return organizations;

    const currentOrganizationId = String(conceptNote.organization.id);
    const hasCurrentOrganization = organizations.some(
      (organization) => String(organization.id) === currentOrganizationId,
    );

    if (hasCurrentOrganization) return organizations;

    return [conceptNote.organization, ...organizations];
  }, [conceptNote, organizations]);

  const isRevisionRequired =
    String(conceptNote?.currentStatus?.status ?? "")
      .toLowerCase()
      .replace(/[\s-]+/g, "_") === "revision_required";
  const isEditableState =
    String(conceptNote?.currentStatus?.status ?? "")
      .toLowerCase()
      .replace(/[\s-]+/g, "_") === "draft" || isRevisionRequired;
  const submitActionLabel = isRevisionRequired
    ? "Resubmit Proposal"
    : "Submit for Review";

  useEffect(() => {
    if (!conceptNote) return;

    const latestVersionFile =
      conceptNote.versions?.find((version) => Boolean(version.file))?.file ??
      null;
    const existingUrl = conceptNote.overview?.file ?? latestVersionFile ?? null;

    const loadedStrategicObjectives = Array.isArray(
      (conceptNote as any).strategicObjectives,
    )
      ? (conceptNote as any).strategicObjectives.map((objective: any) =>
          String(objective.id),
        )
      : Array.isArray((conceptNote as any).strategic_objectives)
        ? (conceptNote as any).strategic_objectives.map((objective: any) =>
            String(objective.id),
          )
        : [];

    form.reset({
      title: String(conceptNote.title ?? ""),
      executiveSummary: String(conceptNote.overview?.executiveSummary ?? ""),
      // Preserve numeric id when present; avoid treating 0 as missing
      documentType:
        conceptNote.docType && conceptNote.docType.id != null
          ? Number(conceptNote.docType.id)
          : undefined,
      organization: conceptNote.organization
        ? String(conceptNote.organization.id)
        : "",
      // Use explicit null/undefined check to avoid accidental falsy clears
      unit:
        conceptNote.unit && conceptNote.unit.id != null
          ? String(conceptNote.unit.id)
          : "",
      // thematicAreas removed from concept notes
      documentCategory:
        conceptNote.documentCategory === "revision" ? "revision" : "new",
      strategicObjectives: loadedStrategicObjectives,
      file: undefined,
    });
    setExistingFileUrl(resolveFileUrl(existingUrl));

    if (loadedStrategicObjectives.length > 0) {
      form.setValue("strategicObjectives", loadedStrategicObjectives, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
    }

    if (conceptNote.organization?.id != null) {
      form.setValue("organization", String(conceptNote.organization.id), {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
    }

    if (conceptNote.unit?.id != null) {
      form.setValue("unit", String(conceptNote.unit.id), {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
    }
  }, [conceptNote, form]);

  const title = form.watch("title") || "";
  const executiveSummary = form.watch("executiveSummary") || "";
  const selectedDocumentType = form.watch("documentType");
  const selectedDocumentCategory = form.watch("documentCategory");
  const selectedDocumentTypeValue = selectedDocumentType
    ? String(selectedDocumentType)
    : conceptNote?.docType?.id != null
      ? String(conceptNote.docType.id)
      : "";
  const selectedOrganization =
    form.watch("organization") ||
    (conceptNote?.organization?.id != null
      ? String(conceptNote.organization.id)
      : "");
  const selectedUnit =
    form.watch("unit") ||
    (conceptNote?.unit?.id != null ? String(conceptNote.unit.id) : "");
  const selectedFile = form.watch("file") as File | undefined;
  const selectedStrategicObjectives = form.watch("strategicObjectives") || [];

  const selectedDocumentTypeName = useMemo(() => {
    if (!selectedDocumentType) return null;
    return (
      documentTypes.find((type) => type.id === selectedDocumentType)?.name ??
      `Document type ${selectedDocumentType}`
    );
  }, [documentTypes, selectedDocumentType]);

  const selectedDocumentCategoryLabel = useMemo(() => {
    if (selectedDocumentCategory === "new") return "New Policy";
    if (selectedDocumentCategory === "revision") return "Revision";
    return null;
  }, [selectedDocumentCategory]);

  const { data: units = [], isLoading: isLoadingUnits } = useUnits(
    selectedOrganization ? [selectedOrganization] : null,
  );

  // Re-apply select values after reference data (document types, units)
  // have loaded so Select components display the correct selection.
  useEffect(() => {
    if (!conceptNote) return;

    if (documentTypeOptions && documentTypeOptions.length > 0) {
      if (conceptNote.docType && conceptNote.docType.id != null) {
        form.setValue("documentType", Number(conceptNote.docType.id));
      }
    }

    if (units && units.length > 0) {
      if (conceptNote.unit && conceptNote.unit.id != null) {
        const match = units.some(
          (u) => String(u.id) === String(conceptNote.unit!.id),
        );
        if (match) {
          form.setValue("unit", String(conceptNote.unit.id));
          return;
        }
      }
    }
  }, [conceptNote, documentTypeOptions, units, form]);

  useEffect(() => {
    if (!selectedOrganization) {
      form.setValue("unit", "");
      return;
    }

    if (!selectedUnit || isLoadingUnits) return;

    const isValid = units.some((unit) => String(unit.id) === selectedUnit);
    if (!isValid) {
      form.setValue("unit", "");
    }
  }, [form, selectedOrganization, selectedUnit, units, isLoadingUnits]);

  useEffect(() => {
    if (!selectedOrganization) {
      form.setValue("unit", "");
    }
  }, [form, selectedOrganization]);

  const wordCount = countWords(executiveSummary);
  const summaryWordStatus = getSummaryWordCountStatus(wordCount, MAX_SUMMARY_WORDS);
  const completionItems = [
    title.trim().length > 0,
    Boolean(selectedDocumentType),
    Boolean(selectedDocumentCategory),
    Boolean(selectedOrganization),
    selectedStrategicObjectives.length > 0,
    Boolean(selectedUnit),
    wordCount > 0 && !summaryWordStatus.isOverLimit,
    Boolean(selectedFile || existingFileUrl),
  ];
  const completion = Math.round(
    (completionItems.filter(Boolean).length / completionItems.length) * 100,
  );

  const isLoading =
    isLoadingNote || isLoadingDocumentTypes || isLoadingOrganizations;

  const buildRequestPayload = (values: ConceptNoteFormData) => {
    const fallbackDocType = documentTypes[0]?.id || 1;
    const fallbackOrg = organizations[0]?.id || 1;

    const parsedDocType = Number(values.documentType);
    const docTypeVal =
      Number.isNaN(parsedDocType) || parsedDocType <= 0
        ? fallbackDocType
        : parsedDocType;

    const parsedOrg = values.organization ? Number(values.organization) : NaN;
    const orgVal =
      Number.isNaN(parsedOrg) || parsedOrg <= 0 ? fallbackOrg : parsedOrg;

    // Thematic areas removed — do not include them in payload

    const payload = new FormData();
    payload.append("title", values.title || "Untitled Draft");
    payload.append("doc_type", String(docTypeVal));
    payload.append(
      "executive_summary",
      values.executiveSummary || "No summary provided.",
    );
    payload.append("organization", String(orgVal));
    payload.append("document_category", values.documentCategory || "new");

    const strategicObjectiveIds = Array.isArray(values.strategicObjectives)
      ? values.strategicObjectives.map((objectiveId) => Number(objectiveId))
      : [];

    strategicObjectiveIds.forEach((objectiveId) => {
      payload.append("strategic_objective_ids", String(objectiveId));
    });

    const parsedUnit = values.unit ? Number(values.unit) : NaN;
    if (!Number.isNaN(parsedUnit) && parsedUnit > 0) {
      payload.append("unit", String(parsedUnit));
    }

    // No thematic areas to append

    if (values.file instanceof File) {
      payload.append("file", values.file);
    }

    return payload;
  };

  const handleSubmit = async (
    data: ConceptNoteFormData,
    submitForReview = false,
  ) => {
    if (!backendToken) return;

    if (submitForReview && !selectedFile && !existingFileUrl) {
      toast.error("Please upload a concept note document before submitting.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = buildRequestPayload(data);
      await updateMutation.mutateAsync({ id: conceptNoteId, payload });

      if (submitForReview) {
        if (isRevisionRequired) {
          await resubmitMutation.mutateAsync({ id: conceptNoteId });
          toast.success("Concept note updated and resubmitted successfully.");
        } else {
          await submitMutation.mutateAsync(conceptNoteId);
          toast.success("Concept note updated and submitted for review.");
        }
      } else {
        toast.success("Concept note updated successfully.");
      }

      router.push(`/policies/concept-notes/my-concept-note/${conceptNoteId}`);
    } catch (error: any) {
      const message =
        error?.response?.data?.error?.message ??
        error?.message ??
        "Failed to update concept note.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Loading...">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <Card className="h-40 animate-pulse rounded-xl border-muted bg-muted/30" />
            <Card className="h-56 animate-pulse rounded-xl border-muted bg-muted/30" />
            <Card className="h-64 animate-pulse rounded-xl border-muted bg-muted/30" />
          </div>
          <Card className="h-80 animate-pulse rounded-xl border-muted bg-muted/30" />
        </div>
      </PageContainer>
    );
  }

  if (isNoteError) {
    return (
      <PageContainer title="Edit Concept Note">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-12 text-center">
          <p className="font-semibold text-destructive">
            Failed to load concept note
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => refetchNote()}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Edit Concept Note">
      <Form {...form}>
        <form className="grid gap-5 md:grid-cols-4">
          <div className="space-y-5 col-span-3">
            <Card className="overflow-hidden shadow-sm border-primary/10">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">Concept details</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Capture the classification and category for this concept
                      note.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter concept note title"
                          maxLength={MAX_TITLE_LENGTH}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a short, clear title for this concept note.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-5 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="documentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Type</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(Number(value))
                          }
                          value={selectedDocumentTypeValue}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select document type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {documentTypeOptions.map((type) => (
                              <SelectItem key={type.id} value={String(type.id)}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the policy document classification.
                          {selectedDocumentTypeName ? (
                            <span className="mt-1 block text-xs text-muted-foreground">
                              Current selection: {selectedDocumentTypeName}
                            </span>
                          ) : null}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="documentCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="new">New Policy</SelectItem>
                            <SelectItem value="revision">Revision</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Mark whether this starts fresh or updates an existing
                          policy.
                          {selectedDocumentCategoryLabel ? (
                            <span className="mt-1 block text-xs text-muted-foreground">
                              Current selection: {selectedDocumentCategoryLabel}
                            </span>
                          ) : null}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <StrategicObjectivesField />
              </CardContent>
            </Card>

            <Card className="overflow-hidden shadow-sm border-primary/10">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">Organization</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Select the organization context and the matching unit.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <FormField
                  control={form.control}
                  name="organization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization</FormLabel>
                      <Select
                        value={selectedOrganization}
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue("unit", "");
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select organization..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {organizationOptions.map((organization) => (
                            <SelectItem
                              key={organization.id}
                              value={String(organization.id)}
                            >
                              {organization.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the organization responsible for this concept
                        note.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit / Department</FormLabel>
                      <Select
                        disabled={!selectedOrganization || isLoadingUnits}
                        onValueChange={field.onChange}
                        value={selectedUnit}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue
                              placeholder={
                                !selectedOrganization
                                  ? "Select organization first"
                                  : isLoadingUnits
                                    ? "Loading units..."
                                    : "Select a unit/department..."
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit.id} value={String(unit.id)}>
                              {unit.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the unit associated with the selected
                        organization.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="overflow-hidden shadow-sm border-primary/10">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">Executive summary</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Summarize the purpose, policy problem, and intended
                      response.
                    </p>
                  </div>
                  <Badge
                    variant={
                      summaryWordStatus.isOverLimit ? "destructive" : "outline"
                    }
                    className="w-fit"
                  >
                    {summaryWordStatus.badgeLabel}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="executiveSummary"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the policy issue, proposed direction, affected stakeholders, and expected public value..."
                          className={CONCEPT_NOTE_SUMMARY_TEXTAREA_CLASS}
                          {...field}
                        />
                      </FormControl>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <FormDescription>
                          Summarize the policy issue and proposed response. Up
                          to about 2 pages (~{MAX_SUMMARY_WORDS} words) is
                          supported.
                        </FormDescription>
                        <span
                          className={
                            summaryWordStatus.isOverLimit
                              ? "text-xs font-medium text-destructive"
                              : "text-xs text-muted-foreground"
                          }
                        >
                          {summaryWordStatus.hintLabel}
                        </span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="overflow-hidden shadow-sm border-primary/10">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-lg">Document update</CardTitle>
                  <Badge
                    variant={
                      selectedFile || existingFileUrl ? "default" : "outline"
                    }
                  >
                    {selectedFile || existingFileUrl ? "Attached" : "Optional"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="rounded-lg border-2 border-dashed bg-muted/20 p-8 text-center transition-colors hover:bg-muted/30">
                          <Input
                            ref={fileInputRef}
                            type="file"
                            accept={CONCEPT_NOTE_ATTACHMENT_ACCEPT}
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (!file) return;
                              if (!isConceptNoteAllowedAttachment(file)) {
                                toast.error(
                                  "Only PDF and Word (.doc, .docx) files are allowed.",
                                );
                                event.target.value = "";
                                return;
                              }
                              field.onChange(file);
                            }}
                          />

                          {selectedFile ? (
                            <div className="flex flex-col items-center gap-3">
                              <FileText className="h-10 w-10 text-primary" />
                              <p className="text-sm font-medium">
                                {selectedFile.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(selectedFile.size / (1024 * 1024)).toFixed(2)}{" "}
                                MB
                              </p>
                              <div className="flex flex-wrap justify-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  Replace
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => field.onChange(undefined)}
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ) : existingFileUrl ? (
                            <div className="flex flex-col items-center gap-3">
                              <FileText className="h-10 w-10 text-primary" />
                              <div className="space-y-1">
                                <p className="text-sm font-medium">
                                  {extractFileName(existingFileUrl)}
                                </p>
                                <a
                                  href={existingFileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-primary underline underline-offset-2"
                                >
                                  Open current file
                                </a>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                upload updated concept note document
                              </Button>
                            </div>
                          ) : (
                            <div
                              onClick={() => fileInputRef.current?.click()}
                              className="flex cursor-pointer flex-col items-center justify-center gap-3 py-8 text-center"
                            >
                              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-background text-muted-foreground shadow-sm">
                                <UploadCloud className="h-6 w-6" />
                              </span>
                              <span className="space-y-1">
                                <span className="block text-sm font-medium">
                                  Choose a document to upload
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                  PDF or Word (.doc, .docx) up to {MAX_FILE_SIZE_MB}MB
                                </span>
                              </span>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Upload a replacement file if the concept note changed.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4 col-span-1 md:sticky md:top-20 md:h-fit md:self-start">
            <Card className="shadow-sm border-primary/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Review readiness</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span>Overall Completion</span>
                    <span>{completion}%</span>
                  </div>
                  <Progress value={completion} className="h-2" />
                </div>
                <Separator />
                <div className="space-y-2.5">
                  <ReadinessItem
                    complete={completionItems[0]}
                    label="Clear title provided"
                  />
                  <ReadinessItem
                    complete={completionItems[1]}
                    label="Document type specified"
                  />
                  <ReadinessItem
                    complete={completionItems[2]}
                    label="Category assigned"
                  />
                  <ReadinessItem
                    complete={completionItems[3]}
                    label="Organization mapped"
                  />
                  <ReadinessItem
                    complete={completionItems[4]}
                    label="Strategic objectives selected"
                  />
                  <ReadinessItem
                    complete={completionItems[5]}
                    label="Unit selected"
                  />
                  <ReadinessItem
                    complete={completionItems[6]}
                    label="Summary within limit"
                  />
                  <ReadinessItem
                    complete={completionItems[7]}
                    label="Document attached"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2 p-1">
              <Button
                className="h-11 w-full font-semibold shadow-sm"
                onClick={form.handleSubmit((data) => handleSubmit(data, true))}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {submitActionLabel}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-10 font-medium"
                  onClick={form.handleSubmit((data) =>
                    handleSubmit(data, false),
                  )}
                  disabled={isSaving}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Draft
                </Button>
                <Button variant="ghost" className="h-10" asChild>
                  <Link
                    href={`/policies/concept-notes/my-concept-note/${conceptNoteId}`}
                  >
                    Cancel
                  </Link>
                </Button>
              </div>
            </div>
          </aside>
        </form>
      </Form>
    </PageContainer>
  );
}

function ReadinessItem({
  complete,
  label,
}: {
  complete: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2.5 text-[13px]">
      <div
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
          complete
            ? "border-primary bg-primary text-primary-foreground shadow-sm"
            : "border-border bg-muted text-muted-foreground",
        )}
      >
        {complete && <Check className="h-3 w-3" />}
      </div>
      <span
        className={cn(
          complete ? "font-medium text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </div>
  );
}
