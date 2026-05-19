"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  FileText,
  Loader2,
  RefreshCw,
  Save,
  Send,
  UploadCloud,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { useAuth } from "@/hooks/useAuth";
import { useOrganizations } from "@/lib/queries/organizations";
import { useUnits } from "@/lib/queries/units";
import {
  useConceptNoteDetail,
  useSubmitConceptNote,
  useUpdateConceptNote,
} from "@/lib/queries/concept-notes";
import { usePolicyDocumentTypes } from "@/lib/queries/policy-document-types";
import { useThematicAreas } from "@/lib/queries/thematic-area";
import { conceptNoteSchema, type ConceptNoteFormData } from "@/lib/validations";
import { toast } from "sonner";

const MAX_TITLE_LENGTH = 500;
const MAX_SUMMARY_WORDS = 250;

export default function EditConceptNotePage() {
  const router = useRouter();
  const params = useParams();
  const conceptNoteId = Array.isArray(params.id)
    ? params.id[0]
    : String(params.id);
  const { backendToken } = useAuth();
  const updateMutation = useUpdateConceptNote(backendToken);
  const submitMutation = useSubmitConceptNote(backendToken);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ConceptNoteFormData>({
    resolver: zodResolver(conceptNoteSchema),
    defaultValues: {
      title: "",
      executiveSummary: "",
      documentType: undefined,
      organization: [],
      unit: "",
      thematicAreas: [],
      documentCategory: "new",
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
  const { data: thematicAreasResponse, isLoading: isLoadingThematicAreas } =
    useThematicAreas();
  const thematicAreas = thematicAreasResponse?.data ?? [];
  const { data: organizations = [], isLoading: isLoadingOrganizations } =
    useOrganizations();

  useEffect(() => {
    if (!conceptNote) return;

    form.reset({
      title: conceptNote.title ?? "",
      executiveSummary: conceptNote.overview?.executiveSummary ?? "",
      documentType: conceptNote.docType?.id,
      organization: conceptNote.organization
        ? [String(conceptNote.organization.id)]
        : [],
      unit: conceptNote.unit ? String(conceptNote.unit.id) : "",
      thematicAreas:
        conceptNote.overview?.thematicAreas?.map((area) => String(area.id)) ??
        [],
      documentCategory: conceptNote.documentCategory ?? "new",
      file: undefined,
    });
    setExistingFileUrl(conceptNote.overview?.file ?? null);
  }, [conceptNote, form]);

  const title = form.watch("title") || "";
  const executiveSummary = form.watch("executiveSummary") || "";
  const selectedDocumentType = form.watch("documentType");
  const selectedDocumentCategory = form.watch("documentCategory");
  const selectedOrganizationIds = form.watch("organization") || [];
  const selectedUnit = form.watch("unit") || "";
  const selectedThematicIds = form.watch("thematicAreas") || [];
  const selectedFile = form.watch("file") as File | undefined;

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

  const selectedOrganizationsList = useMemo(
    () =>
      organizations.filter((organization) =>
        selectedOrganizationIds.includes(String(organization.id)),
      ),
    [organizations, selectedOrganizationIds],
  );

  const selectedAreas = useMemo(
    () =>
      thematicAreas.filter((area) =>
        selectedThematicIds.includes(String(area.id)),
      ),
    [thematicAreas, selectedThematicIds],
  );

  const { data: units = [], isLoading: isLoadingUnits } = useUnits(
    selectedOrganizationIds,
  );

  useEffect(() => {
    if (!selectedUnit) return;

    const isValid = units.some((unit) => String(unit.id) === selectedUnit);
    if (!isValid) {
      form.setValue("unit", "");
    }
  }, [form, selectedUnit, units]);

  useEffect(() => {
    if (selectedOrganizationIds.length === 0) {
      form.setValue("unit", "");
    }
  }, [form, selectedOrganizationIds]);

  const wordCount = calculateWordCount(executiveSummary);
  const completionItems = [
    title.trim().length > 0,
    Boolean(selectedDocumentType),
    Boolean(selectedDocumentCategory),
    selectedOrganizationIds.length > 0,
    Boolean(selectedUnit),
    wordCount > 0 && wordCount <= MAX_SUMMARY_WORDS,
    selectedThematicIds.length > 0,
    Boolean(selectedFile || existingFileUrl),
  ];
  const completion = Math.round(
    (completionItems.filter(Boolean).length / completionItems.length) * 100,
  );

  const isLoading =
    isLoadingNote ||
    isLoadingDocumentTypes ||
    isLoadingThematicAreas ||
    isLoadingOrganizations;

  const buildRequestPayload = (values: ConceptNoteFormData) => {
    const fallbackDocType = documentTypes[0]?.id || 1;
    const fallbackOrg = organizations[0]?.id || 1;
    const fallbackThematic = thematicAreas[0]?.id || 1;

    const parsedDocType = Number(values.documentType);
    const docTypeVal =
      Number.isNaN(parsedDocType) || parsedDocType <= 0
        ? fallbackDocType
        : parsedDocType;

    const parsedOrg =
      values.organization && values.organization.length > 0
        ? Number(values.organization[0])
        : NaN;
    const orgVal =
      Number.isNaN(parsedOrg) || parsedOrg <= 0 ? fallbackOrg : parsedOrg;

    const thematicVal =
      values.thematicAreas && values.thematicAreas.length > 0
        ? values.thematicAreas
            .map(Number)
            .filter((id) => !Number.isNaN(id) && id > 0)
        : [fallbackThematic];

    if (thematicVal.length === 0) {
      thematicVal.push(fallbackThematic);
    }

    const payload = new FormData();
    payload.append("title", values.title || "Untitled Draft");
    payload.append("doc_type", String(docTypeVal));
    payload.append(
      "executive_summary",
      values.executiveSummary || "No summary provided.",
    );
    payload.append("organization", String(orgVal));
    payload.append("document_category", values.documentCategory || "new");

    const parsedUnit = values.unit ? Number(values.unit) : NaN;
    if (!Number.isNaN(parsedUnit) && parsedUnit > 0) {
      payload.append("unit", String(parsedUnit));
    }

    thematicVal.forEach((id) => {
      payload.append("thematicreas", String(id));
    });

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
        await submitMutation.mutateAsync(conceptNoteId);
        toast.success("Concept note updated and submitted for review.");
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
    <PageContainer
      title="Edit Concept Note"
      description="Update the existing concept note fields and save or resubmit it."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="shadow-sm">
            <Link
              href={`/policies/concept-notes/my-concept-note/${conceptNoteId}`}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button
            onClick={form.handleSubmit((data) => handleSubmit(data, true))}
            disabled={isSaving}
            className="shadow-sm"
          >
            <Send className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Submit for Review"}
          </Button>
        </div>
      }
    >
      <Form {...form}>
        <form className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <Card className="overflow-hidden shadow-sm border-primary/10">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">Concept details</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Update the title and document type.
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
                      <div className="flex items-center justify-between gap-3">
                        <FormLabel>Title</FormLabel>
                        <span className="text-xs text-muted-foreground">
                          {field.value?.length || 0}/{MAX_TITLE_LENGTH}
                        </span>
                      </div>
                      <FormControl>
                        <Input
                          placeholder="Enter concept note title"
                          maxLength={MAX_TITLE_LENGTH}
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Use a clear title reviewers can scan quickly.
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
                          value={field.value ? String(field.value) : undefined}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select document type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {documentTypes.map((type) => (
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
                  render={({ field }) => {
                    const currentValue = (field.value || []).map(String);

                    return (
                      <FormItem>
                        <FormLabel>Organization</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <button
                                type="button"
                                className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                              >
                                <span className="flex-1 text-left text-muted-foreground">
                                  {selectedOrganizationsList.length > 0
                                    ? `${selectedOrganizationsList.length} organization${selectedOrganizationsList.length !== 1 ? "s" : ""} selected`
                                    : "Select organization(s)"}
                                </span>
                                <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground opacity-50" />
                              </button>
                            </FormControl>
                          </PopoverTrigger>

                          <PopoverContent className="w-75 p-0" align="start">
                            <div className="p-4">
                              {organizations.map((organization) => {
                                const checked = currentValue.includes(
                                  String(organization.id),
                                );
                                return (
                                  <label
                                    key={organization.id}
                                    className="flex cursor-pointer items-center space-x-2 rounded p-2 hover:bg-muted"
                                  >
                                    <Checkbox
                                      checked={checked}
                                      onCheckedChange={(isChecked) => {
                                        const idStr = String(organization.id);
                                        const nextValue = isChecked
                                          ? Array.from(
                                              new Set([...currentValue, idStr]),
                                            )
                                          : currentValue.filter(
                                              (id) => id !== idStr,
                                            );
                                        field.onChange(nextValue);
                                      }}
                                    />
                                    <span className="text-sm font-medium">
                                      {organization.name}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </PopoverContent>
                        </Popover>

                        <FormDescription>
                          Select one or more organizations relevant to the
                          concept note.
                        </FormDescription>

                        {selectedOrganizationsList.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-3">
                            {selectedOrganizationsList.map((organization) => (
                              <Badge
                                key={organization.id}
                                variant="secondary"
                                className="flex items-center gap-2"
                              >
                                {organization.name}
                                <button
                                  type="button"
                                  onClick={() =>
                                    field.onChange(
                                      currentValue.filter(
                                        (id) => id !== String(organization.id),
                                      ),
                                    )
                                  }
                                  className="ml-1 hover:opacity-70"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit / Department</FormLabel>
                      <Select
                        disabled={
                          selectedOrganizationsList.length === 0 ||
                          isLoadingUnits
                        }
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue
                              placeholder={
                                selectedOrganizationsList.length === 0
                                  ? "Select organization(s) first"
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
                      wordCount > MAX_SUMMARY_WORDS ? "destructive" : "outline"
                    }
                    className="w-fit"
                  >
                    {wordCount}/{MAX_SUMMARY_WORDS} words
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
                          className="min-h-55 resize-y leading-6"
                          {...field}
                        />
                      </FormControl>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <FormDescription>
                          Keep the summary concise enough for reviewer triage.
                        </FormDescription>
                        <span
                          className={
                            wordCount > MAX_SUMMARY_WORDS
                              ? "text-xs font-medium text-destructive"
                              : "text-xs text-muted-foreground"
                          }
                        >
                          {MAX_SUMMARY_WORDS - wordCount} words remaining
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
                  <CardTitle className="text-lg">Thematic areas</CardTitle>
                  <Badge variant="outline" className="w-fit">
                    {selectedThematicIds.length} selected
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="thematicAreas"
                  render={({ field }) => (
                    <FormItem>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <button
                              type="button"
                              className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <span className="flex-1 text-left">
                                {selectedThematicIds.length > 0
                                  ? `${selectedThematicIds.length} selected`
                                  : "Select areas"}
                              </span>
                              <ChevronDown className="h-4 w-4 opacity-50" />
                            </button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-3" align="start">
                          <div className="space-y-2">
                            {thematicAreas.map((area) => {
                              const checked =
                                field.value?.includes(String(area.id)) || false;
                              return (
                                <label
                                  key={area.id}
                                  className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-muted/50"
                                >
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(checkedValue) => {
                                      const currentValue = field.value || [];
                                      field.onChange(
                                        checkedValue
                                          ? [...currentValue, String(area.id)]
                                          : currentValue.filter(
                                              (id) => id !== String(area.id),
                                            ),
                                      );
                                    }}
                                  />
                                  <span className="text-sm font-medium">
                                    {area.name}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>

                      <FormDescription>
                        Select at least one thematic area.
                      </FormDescription>

                      {selectedAreas.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-3">
                          {selectedAreas.map((area) => (
                            <Badge
                              key={area.id}
                              variant="secondary"
                              className="flex items-center gap-2"
                            >
                              {area.name}
                              <button
                                type="button"
                                onClick={() =>
                                  field.onChange(
                                    field.value?.filter(
                                      (id) => id !== String(area.id),
                                    ) || [],
                                  )
                                }
                                className="ml-1 hover:opacity-70"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
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
                            accept=".pdf,.doc,.docx,.txt"
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) {
                                field.onChange(file);
                              }
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
                                Replace file
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
                                  PDF, DOC, DOCX, or TXT up to 10MB
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

          <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
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
                    label="Unit selected"
                  />
                  <ReadinessItem
                    complete={completionItems[5]}
                    label="Summary within limit"
                  />
                  <ReadinessItem
                    complete={completionItems[6]}
                    label="Thematic area tagged"
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
                Submit for Review
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

function calculateWordCount(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

function extractFileName(url?: string | null) {
  if (!url) return "Current document";
  try {
    const parsed = new URL(url);
    const fileName = parsed.pathname.split("/").filter(Boolean).pop();
    return fileName ? decodeURIComponent(fileName) : "Current document";
  } catch {
    const fileName = url.split("/").filter(Boolean).pop();
    return fileName || "Current document";
  }
}
