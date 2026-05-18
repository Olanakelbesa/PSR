"use client";

import { useEffect, useState, useRef, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  FileText,
  Loader2,
  Save,
  Send,
  UploadCloud,
  X,
} from "lucide-react";

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
import { useCreateConceptNote, useUpdateConceptNote, useSubmitConceptNote } from "@/lib/queries/concept-notes";
import { usePolicyDocumentTypes } from "@/lib/queries/policy-document-types";
import { useThematicAreas } from "@/lib/queries/thematic-area";
import { conceptNoteSchema, type ConceptNoteFormData } from "@/lib/validations";
import { toast } from "sonner";
import { useOrganizations } from "@/lib/queries/organizations";
import { useAuth } from "@/hooks/useAuth";

const MAX_TITLE_LENGTH = 500;
const MAX_SUMMARY_WORDS = 250;

export default function NewConceptNotePage() {
  const router = useRouter();
  const { backendToken } = useAuth();
  const createConceptNoteMutation = useCreateConceptNote(backendToken);
  const updateConceptNoteMutation = useUpdateConceptNote(backendToken);
  const submitConceptNoteMutation = useSubmitConceptNote(backendToken);

  const [draftId, setDraftId] = useState<string | number | null>(null);
  const [autosaveStatus, setAutosaveStatus] = useState<"saving" | "saved" | "failed" | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSavedValuesRef = useRef<any>(null);
  const isFirstRender = useRef(true);
  const isSavingInProgressRef = useRef(false);

  const isPending =
    createConceptNoteMutation.isPending ||
    updateConceptNoteMutation.isPending ||
    submitConceptNoteMutation.isPending;
  const { data: documentTypes = [] } = usePolicyDocumentTypes();
  const { data: thematicAreasResponse, isLoading: isLoadingThematic, error: thematicError } = useThematicAreas();
  const thematicAreas = thematicAreasResponse?.data ?? [];

  console.log("Thematic Areas:", thematicAreas);
  console.log("Thematic Areas Response:", thematicAreasResponse);

  const { data: organizations = [] } = useOrganizations();

  const form = useForm<ConceptNoteFormData>({
    resolver: zodResolver(conceptNoteSchema),
    defaultValues: {
      title: "",
      executiveSummary: "",
      documentType: undefined,
      organization: [],
      thematicAreas: [],
      documentCategory: "new",
      file: undefined,
    },
  });

  const title = form.watch("title") || "";
  const executiveSummary = form.watch("executiveSummary") || "";
  const selectedDocumentType = form.watch("documentType");
  const selectedDocumentCategory = form.watch("documentCategory");
  const selectedOrganizationIds = form.watch("organization") || [];
  const selectedThematicIds = form.watch("thematicAreas") || [];
  const selectedFile = form.watch("file") as File | undefined;

  const selectedOrganizationsList = organizations.filter((org) =>
    selectedOrganizationIds.includes(String(org.id)),
  );
  const selectedAreas = thematicAreas.filter((area) =>
    selectedThematicIds.includes(String(area.id)),
  );
  const wordCount = calculateWordCount(executiveSummary);
  const completionItems = [
    title.trim().length > 0,
    Boolean(selectedDocumentType),
    Boolean(selectedDocumentCategory),
    selectedOrganizationIds.length > 0,
    wordCount > 0 && wordCount <= MAX_SUMMARY_WORDS,
    selectedThematicIds.length > 0,
    Boolean(selectedFile),
  ];
  const completion = Math.round(
    (completionItems.filter(Boolean).length / completionItems.length) * 100,
  );

  const formValues = form.watch();

  const extractIdFromResponse = (res: any): string | number | null => {
    console.log("Extracting ID from response:", res);
    if (!res) return null;
    
    // Check direct properties
    if (res.id !== undefined && res.id !== null) return res.id;
    
    // Check nested "data" wrapper (very common in API clients or custom Axios setup)
    if (res.data) {
      if (res.data.id !== undefined && res.data.id !== null) return res.data.id;
      if (res.data.data && res.data.data.id !== undefined && res.data.data.id !== null) {
        return res.data.data.id;
      }
    }
    
    // Check other nested objects
    if (res.conceptNote && res.conceptNote.id !== undefined && res.conceptNote.id !== null) {
      return res.conceptNote.id;
    }
    
    // If it's a string, maybe it's just the ID
    if (typeof res === "string" || typeof res === "number") return res;
    
    return null;
  };

  const buildRequestPayload = (values: any) => {
    const isFileUpload = values.file instanceof File;

    // Resolve fallback IDs from loaded reference data to guarantee they exist in the DB
    const fallbackDocType = documentTypes[0]?.id || 1;
    const fallbackOrg = organizations[0]?.id || 1;
    const fallbackThematic = thematicAreas[0]?.id || 1;

    const parsedDocType = Number(values.documentType);
    const docTypeVal = isNaN(parsedDocType) || parsedDocType <= 0 ? fallbackDocType : parsedDocType;

    const parsedOrg = values.organization && values.organization.length > 0 ? Number(values.organization[0]) : NaN;
    const orgVal = isNaN(parsedOrg) || parsedOrg <= 0 ? fallbackOrg : parsedOrg;

    const thematicVal = values.thematicAreas && values.thematicAreas.length > 0 
      ? values.thematicAreas.map(Number).filter((n: number) => !isNaN(n) && n > 0)
      : [fallbackThematic];
    
    if (thematicVal.length === 0) {
      thematicVal.push(fallbackThematic);
    }

    if (isFileUpload) {
      const formData = new FormData();
      formData.append("title", values.title || "Untitled Draft");
      formData.append("doc_type", docTypeVal.toString());
      formData.append("executive_summary", values.executiveSummary || "No summary provided.");
      formData.append("organization", orgVal.toString());
      formData.append("document_category", values.documentCategory || "new");
      
      if (values.file) {
        formData.append("file", values.file);
      }

      thematicVal.forEach((id: number) => {
        formData.append("thematicreas", id.toString());
      });

      return formData;
    } else {
      const payload: Record<string, any> = {
        title: values.title || "Untitled Draft",
        doc_type: docTypeVal,
        executive_summary: values.executiveSummary || "No summary provided.",
        thematicreas: thematicVal,
        organization: orgVal,
        document_category: values.documentCategory || "new",
      };

      // Only append string files if needed, but standard file uploads use FormData.
      // We omit "file" key entirely if it's null/undefined to prevent Django REST Framework
      // validation from failing with "This field may not be null" (since file is blank=True but not null=True).
      if (values.file && typeof values.file === "string") {
        payload.file = values.file;
      }

      return payload;
    }
  };

  const hasChanged = (val1: any, val2: any) => {
    if (!val1 || !val2) return true;
    return (
      val1.title !== val2.title ||
      val1.executiveSummary !== val2.executiveSummary ||
      val1.documentType !== val2.documentType ||
      val1.documentCategory !== val2.documentCategory ||
      JSON.stringify(val1.organization) !== JSON.stringify(val2.organization) ||
      JSON.stringify(val1.thematicAreas) !== JSON.stringify(val2.thematicAreas) ||
      val1.file !== val2.file
    );
  };

  const organizationDep = JSON.stringify(formValues.organization);
  const thematicDep = JSON.stringify(formValues.thematicAreas);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const values = form.getValues();
    if (!hasChanged(values, lastSavedValuesRef.current)) {
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      // Validate before autosaving without touching form visual error state in UI
      const result = conceptNoteSchema.safeParse(values);
      if (!result.success) {
        setAutosaveStatus(null);
        return;
      }

      if (isSavingInProgressRef.current) return;
      isSavingInProgressRef.current = true;
      setAutosaveStatus("saving");

      try {
        const payload = buildRequestPayload(values);

        let response;
        if (draftId) {
          response = await updateConceptNoteMutation.mutateAsync({ id: draftId, payload });
        } else {
          response = await createConceptNoteMutation.mutateAsync(payload);
        }

        const returnedId = extractIdFromResponse(response);
        if (returnedId) {
          setDraftId(returnedId);
        } else {
          console.warn("Autosave returned empty ID. Full response:", response);
        }

        lastSavedValuesRef.current = values;
        setAutosaveStatus("saved");
      } catch (error) {
        console.error("Autosave failed:", error);
        setAutosaveStatus("failed");
      } finally {
        isSavingInProgressRef.current = false;
      }
    }, 1500);

    return () => clearTimeout(delayDebounceFn);
  }, [
    formValues.title,
    formValues.executiveSummary,
    formValues.documentType,
    formValues.documentCategory,
    organizationDep,
    thematicDep,
    formValues.file,
    draftId
  ]);

  async function onSubmit(data: ConceptNoteFormData, submitForReview = false) {
    if (!backendToken) return;
    try {
      const payload = buildRequestPayload(data);

      let currentDraftId = draftId;

      if (submitForReview) {
        // Step 1: Ensure draft exists
        if (!currentDraftId) {
          toast.loading("Creating draft for submission...", { id: "submit-flow" });
          const response = await createConceptNoteMutation.mutateAsync(payload);
          currentDraftId = extractIdFromResponse(response);
          if (currentDraftId) {
            setDraftId(currentDraftId);
          } else {
            console.error("Draft creation response failed to yield ID. Full response:", response);
            throw new Error(`Failed to extract concept note ID from response. Response: ${JSON.stringify(response)}`);
          }
        } else {
          // Update draft with latest changes before submission
          toast.loading("Updating draft with latest changes...", { id: "submit-flow" });
          await updateConceptNoteMutation.mutateAsync({ id: currentDraftId, payload });
        }

        // Step 2: Submit the draft
        toast.loading("Submitting concept note for review...", { id: "submit-flow" });
        await submitConceptNoteMutation.mutateAsync(currentDraftId);
        
        toast.success("Concept note successfully submitted for review!", { id: "submit-flow" });
        router.push("/policies/concept-notes/my-concept-note");
      } else {
        // Manual Draft Save
        toast.loading("Saving draft...", { id: "draft-flow" });
        let response;
        if (currentDraftId) {
          response = await updateConceptNoteMutation.mutateAsync({ id: currentDraftId, payload });
        } else {
          response = await createConceptNoteMutation.mutateAsync(payload);
        }
        
        const returnedId = extractIdFromResponse(response);
        if (returnedId) {
          setDraftId(returnedId);
        } else {
          console.warn("Manual draft save returned empty ID. Full response:", response);
        }

        lastSavedValuesRef.current = data;
        toast.success("Draft saved successfully!", { id: "draft-flow" });
      }
    } catch (error: any) {
      console.error("Operation failed:", error);
      toast.error(error?.message || "An error occurred. Please try again.", {
        id: submitForReview ? "submit-flow" : "draft-flow",
      });
    }
  }

  const onInvalid = (errors: any) => {
    console.error("Form validation errors:", errors);
    toast.error("Form validation failed. Please check all fields.");
    
    Object.keys(errors).forEach((key) => {
      const fieldError = errors[key];
      if (fieldError?.message) {
        toast.error(`${key}: ${fieldError.message}`);
      } else if (Array.isArray(fieldError)) {
        fieldError.forEach((err: any) => {
          if (err?.message) toast.error(`${key}: ${err.message}`);
        });
      }
    });
  };

  return (
    <PageContainer
      title="New Concept Note"
      description="Prepare a policy concept note for draft saving or review submission"
      actions={
        <div className="flex items-center gap-3">
          {autosaveStatus && (
            <div className={`flex items-center gap-2 ${autosaveStatus === "failed" ? "" : "rounded-full border shadow-sm"} bg-background px-3 py-1 text-xs font-medium text-muted-foreground `}>
              <span className={`h-2 w-2 rounded-full ${
                autosaveStatus === "saving" ? "bg-amber-500 animate-pulse" :
                autosaveStatus === "saved" ? "bg-emerald-500" :""
              }`} />
              {autosaveStatus === "saving" && "Saving..."}
              {autosaveStatus === "saved" && "Saved"}
            </div>
          )}
          <Button variant="outline" asChild>
            <Link href="/policies/concept-notes/my-concept-note">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      }
    >
      <Form {...form}>
        <form className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] ">
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">Concept details</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Capture the core classification and title used throughout
                      the review process.
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
                          onValueChange={(val) => field.onChange(Number(val))}
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
                          defaultValue={field.value}
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
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">Organization</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Select the organization context for this concept note and
                      choose a university when needed.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <FormField
                  control={form.control}
                  name="organization"
                  render={({ field }) => {
                    const currentValue: string[] = (field.value || []).map(
                      String,
                    );

                    return (
                      <FormItem>
                        <FormLabel>Organization</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <button
                                type="button"
                                className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <span className="flex-1 text-left text-muted-foreground">
                                  {selectedOrganizationsList.length > 0
                                    ? `${selectedOrganizationsList.length} organization${selectedOrganizationsList.length !== 1 ? "s" : ""} selected`
                                    : "Select organizations..."}
                                </span>
                                <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground opacity-50" />
                              </button>
                            </FormControl>
                          </PopoverTrigger>

                          <PopoverContent
                            className="w-[300px] p-0"
                            align="start"
                          >
                            <div className="p-4">
                              {organizations.map((organization) => {
                                const checked = currentValue.includes(
                                  String(organization.id),
                                );
                                return (
                                  <label
                                    key={organization.id}
                                    className="flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-muted"
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
                            {selectedOrganizationsList.map((org) => (
                              <Badge
                                key={org.id}
                                variant="secondary"
                                className="flex items-center gap-2"
                              >
                                {org.name}
                                <button
                                  type="button"
                                  onClick={() =>
                                    field.onChange(
                                      currentValue.filter(
                                        (id) => id !== String(org.id),
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
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
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
                  render={({ field }) => {
                    const handleChange = (
                      e: ChangeEvent<HTMLTextAreaElement>,
                    ) => {
                      field.onChange(e);
                    };

                    return (
                      <FormItem>
                        <FormLabel>Summary</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the policy issue, proposed direction, affected stakeholders, and expected public value..."
                            className="min-h-55 resize-y leading-6"
                            {...field}
                            onChange={handleChange}
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
                    );
                  }}
                />
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">Thematic areas</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Select every area that should inform routing and review
                      assignment.
                    </p>
                  </div>
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
                      <FormLabel>Areas</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <button
                              type="button"
                              className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <span className="flex-1 text-left">
                                {selectedThematicIds.length > 0
                                  ? `${selectedThematicIds.length} area${selectedThematicIds.length !== 1 ? "s" : ""} selected`
                                  : "Select thematic areas"}
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
                                    onCheckedChange={(isChecked) => {
                                      const currentValue = field.value || [];
                                      field.onChange(
                                        isChecked
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
                      {selectedThematicIds.length > 0 && (
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
                                onClick={() => {
                                  field.onChange(
                                    field.value?.filter(
                                      (id) => id !== String(area.id),
                                    ) || [],
                                  );
                                }}
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

            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">Document upload</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Attach the source concept note that reviewers will
                      inspect.
                    </p>
                  </div>
                  <Badge
                    variant={selectedFile ? "default" : "outline"}
                    className="w-fit"
                  >
                    {selectedFile ? "Attached" : "Required"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document File</FormLabel>
                      <FormControl>
                        <div className="rounded-lg border border-dashed bg-muted/20 p-5">
                          <Input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                field.onChange(file);
                              }
                            }}
                            className="hidden"
                          />
                          {selectedFile ? (
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                  <FileText className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium">
                                    {selectedFile.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {(
                                      selectedFile.size /
                                      (1024 * 1024)
                                    ).toFixed(2)}{" "}
                                    MB
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
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
                        Upload the final concept note file for this submission.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Submission readiness
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Completion</span>
                    <span className="font-medium">{completion}%</span>
                  </div>
                  <Progress value={completion} />
                </div>

                <Separator />

                <div className="space-y-3">
                  <ReadinessItem
                    complete={completionItems[0]}
                    label="Title added"
                  />
                  <ReadinessItem
                    complete={completionItems[1]}
                    label="Document type selected"
                  />
                  <ReadinessItem
                    complete={completionItems[2]}
                    label="Category selected"
                  />
                  <ReadinessItem
                    complete={completionItems[3]}
                    label="Summary within limit"
                  />
                  <ReadinessItem
                    complete={completionItems[4]}
                    label="Organization selected"
                  />
                  <ReadinessItem
                    complete={completionItems[5]}
                    label="Thematic area selected"
                  />
                  <ReadinessItem
                    complete={completionItems[6]}
                    label="Document attached"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="rounded-lg border bg-background p-3 shadow-sm">
              <div className="grid gap-2">
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={form.handleSubmit((data) => onSubmit(data, true), onInvalid)}
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Submit
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => onSubmit(form.getValues(), false)}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Draft
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isPending}
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                </div>
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
    <div className="flex items-center gap-3 text-sm">
      <span
        className={
          complete
            ? "flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
            : "flex h-6 w-6 items-center justify-center rounded-full border bg-background text-muted-foreground"
        }
      >
        {complete ? <Check className="h-3.5 w-3.5" /> : null}
      </span>
      <span className={complete ? "font-medium" : "text-muted-foreground"}>
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
