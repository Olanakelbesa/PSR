"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { extractFileName, resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { MAX_FILE_SIZE_MB } from "@/lib/constants";
import {
  countWords,
  CONCEPT_NOTE_SUMMARY_TEXTAREA_CLASS,
} from "@/lib/utils/word-count";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Check,
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
import {
  useCreateConceptNote,
  useSubmitConceptNote,
  useUpdateConceptNote,
} from "@/lib/queries/concept-notes";
import { usePolicyDocumentTypes } from "@/lib/queries/policy-document-types";
// thematic areas removed from concept notes
import { conceptNoteSchema, type ConceptNoteFormData } from "@/lib/validations";
import { toast } from "sonner";
import { useOrganizations } from "@/lib/queries/organizations";
import { useUnits } from "@/lib/queries/units";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  useConceptNoteProfileDefaults,
  withProfileOrganization,
  withProfileUnit,
} from "@/hooks/useConceptNoteProfileDefaults";
import {
  CONCEPT_NOTE_ATTACHMENT_ACCEPT,
  isConceptNoteAllowedAttachment,
} from "@/lib/utils/concept-note-attachments";

const MAX_TITLE_LENGTH = 500;

export default function NewConceptNotePage() {
  const router = useRouter();
  const { backendToken } = useAuth();
  const { user: currentUser } = useCurrentUser();
  const createConceptNoteMutation = useCreateConceptNote();
  const updateConceptNoteMutation = useUpdateConceptNote(backendToken);
  const submitConceptNoteMutation = useSubmitConceptNote(backendToken);

  const [draftId, setDraftId] = useState<string | number | null>(null);
  const [autosaveStatus, setAutosaveStatus] = useState<
    "saving" | "saved" | "failed" | null
  >(null);
  const [isDraftSubmitting, setIsDraftSubmitting] = useState(false);
  const [isSubmitSubmitting, setIsSubmitSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSavedValuesRef = useRef<any>(null);
  const isFirstRender = useRef(true);
  const isSavingInProgressRef = useRef(false);

  const { data: documentTypes = [] } = usePolicyDocumentTypes();
  // Thematic areas removed — frontend no longer loads or selects them

  const { data: organizations = [], isLoading: isLoadingOrganizations } =
    useOrganizations();
  const isReferenceDataReady =
    documentTypes.length > 0 && organizations.length > 0;

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

  const title = form.watch("title") || "";
  const executiveSummary = form.watch("executiveSummary") || "";
  const selectedDocumentType = form.watch("documentType");
  const selectedDocumentCategory = form.watch("documentCategory");
  const selectedOrganization = form.watch("organization") || "";
  const selectedUnit = form.watch("unit") || "";
  const selectedFile = form.watch("file") as File | undefined;
  const selectedStrategicObjectives = form.watch("strategicObjectives") || [];

  const organizationForUnits =
    selectedOrganization ||
    (currentUser?.organization?.id ? String(currentUser.organization.id) : "");

  const { data: units = [], isLoading: isLoadingUnits } = useUnits(
    organizationForUnits ? [organizationForUnits] : null,
  );

  const { profileOrganization, profileUnit } = useConceptNoteProfileDefaults({
    form,
    organizations,
    units,
    isLoadingOrganizations,
    isLoadingUnits,
    onlyWhenEmpty: true,
    enabled: true,
    resetKey: "new",
  });

  const organizationOptions = useMemo(
    () => withProfileOrganization(organizations, profileOrganization),
    [organizations, profileOrganization],
  );

  const unitOptions = useMemo(
    () => withProfileUnit(units, profileUnit),
    [units, profileUnit],
  );

  const previousOrganizationRef = useRef<string>("");

  // Clear unit only when the user changes organization, not during initial autofill.
  useEffect(() => {
    const previousOrganization = previousOrganizationRef.current;

    if (!selectedOrganization) {
      previousOrganizationRef.current = "";
      return;
    }

    if (
      previousOrganization &&
      previousOrganization !== selectedOrganization
    ) {
      form.setValue("unit", "");
    }

    previousOrganizationRef.current = selectedOrganization;

    if (selectedUnit && units.length > 0) {
      const isValid = units.some((unit) => String(unit.id) === selectedUnit);
      if (!isValid) {
        form.setValue("unit", "");
      }
    }
  }, [selectedOrganization, units, selectedUnit, form]);
  
  const completionItems = [
    title.trim().length > 0,
    Boolean(selectedDocumentType),
    Boolean(selectedDocumentCategory),
    Boolean(selectedOrganization),
    selectedStrategicObjectives.length > 0,
    countWords(executiveSummary) > 0,
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
      if (
        res.data.data &&
        res.data.data.id !== undefined &&
        res.data.data.id !== null
      ) {
        return res.data.data.id;
      }
    }

    // Check other nested objects
    if (
      res.conceptNote &&
      res.conceptNote.id !== undefined &&
      res.conceptNote.id !== null
    ) {
      return res.conceptNote.id;
    }

    // If it's a string, maybe it's just the ID
    if (typeof res === "string" || typeof res === "number") return res;

    return null;
  };

  const buildRequestPayload = (values: any) => {
    if (!isReferenceDataReady) {
      throw new Error("Reference data is still loading. Please try again in a moment.");
    }

    const isFileUpload = values.file instanceof File;
    const rawStrategicObjectives: Array<string | number> = Array.isArray(
      values.strategicObjectives,
    )
      ? (values.strategicObjectives as Array<string | number>)
      : [];
    const strategicObjectiveIds: number[] = rawStrategicObjectives.map(
      (objectiveId) => String(objectiveId),
    ).map((objectiveId) => Number(objectiveId));

    // Resolve fallback IDs from loaded reference data to guarantee they exist in the DB
    const fallbackDocType = documentTypes[0]?.id;
    const fallbackOrg = organizations[0]?.id;

    const parsedDocType = Number(values.documentType);
    const docTypeVal =
      isNaN(parsedDocType) || parsedDocType <= 0
        ? fallbackDocType
        : parsedDocType;

    const parsedOrg = values.organization ? Number(values.organization) : NaN;
    const orgVal =
      Number.isNaN(parsedOrg) || parsedOrg <= 0 ? fallbackOrg : parsedOrg;

    const parsedUnit = values.unit ? Number(values.unit) : NaN;
    const unitVal =
      !Number.isNaN(parsedUnit) && parsedUnit > 0 ? parsedUnit : null;

    if (!docTypeVal || !orgVal) {
      throw new Error("Please select a valid document type and organization before saving.");
    }

    // Thematic areas removed — do not include them in payload

    if (isFileUpload) {
      const formData = new FormData();
      formData.append("title", values.title || "Untitled Draft");
      formData.append("doc_type", docTypeVal.toString());
      formData.append(
        "executive_summary",
        values.executiveSummary || "No summary provided.",
      );
      formData.append("organization", orgVal.toString());
      formData.append("document_category", values.documentCategory || "new");
      if (unitVal) {
        formData.append("unit", String(unitVal));
      }

      for (const objectiveId of strategicObjectiveIds) {
        formData.append("strategic_objective_ids", String(objectiveId));
      }

      if (values.file) {
        formData.append("file", values.file);
      }

      // No thematic areas to append

      return formData;
    } else {
      const payload: Record<string, any> = {
        title: values.title || "Untitled Draft",
        doc_type: docTypeVal,
        executive_summary: values.executiveSummary || "No summary provided.",
        // thematicreas removed
        organization: orgVal,
        document_category: values.documentCategory || "new",
        strategic_objective_ids: strategicObjectiveIds,
      };
      if (unitVal) {
        payload.unit = unitVal;
      }

      return payload;
    }
  };

  const persistDraft = async (values: ConceptNoteFormData) => {
    const payload = buildRequestPayload(values);

    if (draftId) {
      await updateConceptNoteMutation.mutateAsync({
        id: draftId,
        payload,
      });
      return draftId;
    }

    const response = await createConceptNoteMutation.mutateAsync(payload);
    const returnedId = extractIdFromResponse(response);
    if (returnedId) {
      setDraftId(returnedId);
    }
    return returnedId;
  };

  const hasChanged = (val1: any, val2: any) => {
    if (!val1 || !val2) return true;
    return (
      val1.title !== val2.title ||
      val1.executiveSummary !== val2.executiveSummary ||
      val1.documentType !== val2.documentType ||
      val1.documentCategory !== val2.documentCategory ||
      val1.unit !== val2.unit ||
      JSON.stringify(val1.organization) !== JSON.stringify(val2.organization) ||
      JSON.stringify(val1.strategicObjectives || []) !==
        JSON.stringify(val2.strategicObjectives || []) ||
      
      val1.file !== val2.file
    );
  };

  const strategicObjectivesDep = JSON.stringify(selectedStrategicObjectives);
  

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
      if (isSavingInProgressRef.current) return;

      if (!isReferenceDataReady) return;

      isSavingInProgressRef.current = true;
      setAutosaveStatus("saving");

      try {
        const savedId = await persistDraft(values);
        if (!savedId) {
          console.warn("Autosave returned empty ID. Full response:", values);
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
    formValues.unit,
    selectedOrganization,
    strategicObjectivesDep,
    formValues.file,
    draftId,
  ]);

  async function onSubmit(data: ConceptNoteFormData, submitForReview = false) {
    try {
      // Guard: file is required by the backend before submission
      if (submitForReview && !(data.file instanceof File)) {
        toast.error(
          "Please upload a concept note document (PDF or DOCX) before submitting for review.",
          { id: "submit-flow", duration: 5000 },
        );
        return;
      }

      if (submitForReview) {
        toast.loading("Saving concept note...", { id: "submit-flow" });
        const submittableId = await persistDraft(data);

        if (!submittableId) {
          throw new Error("Could not save concept note before submission.");
        }

        toast.loading("Submitting concept note for review...", {
          id: "submit-flow",
        });
        await submitConceptNoteMutation.mutateAsync(submittableId);

        toast.success("Concept note successfully submitted for review!", {
          id: "submit-flow",
        });
        router.push("/policies/concept-notes/my-concept-note");
      } else {
        toast.loading("Saving draft...", { id: "draft-flow" });
        if (!draftId && !data.title.trim()) {
          toast.error("Enter a title first so the draft can be created.", {
            id: "draft-flow",
          });
          return;
        }

        const savedId = await persistDraft(data);
        lastSavedValuesRef.current = data;
        if (savedId && !draftId) {
          router.replace(`/policies/concept-notes/my-concept-note/edit/${savedId}`);
        }
        toast.success("Draft saved successfully!", { id: "draft-flow" });
      }
    } catch (error: any) {
      console.error("Operation failed:", error);
      toast.error(error?.message || "An error occurred. Please try again.", {
        id: submitForReview ? "submit-flow" : "draft-flow",
      });
    } finally {
      if (submitForReview) {
        setIsSubmitSubmitting(false);
      } else {
        setIsDraftSubmitting(false);
      }
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
            <div
              className={`flex items-center gap-2 ${autosaveStatus === "failed" ? "" : "rounded-full border shadow-sm"} bg-background px-3 py-1 text-xs font-medium text-muted-foreground `}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  autosaveStatus === "saving"
                    ? "bg-amber-500 animate-pulse"
                    : autosaveStatus === "saved"
                      ? "bg-emerald-500"
                      : ""
                }`}
              />
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
                            <SelectItem value="old">Old Policy</SelectItem>
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

                <StrategicObjectivesField />
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">Organization</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Pre-filled from your profile. Change the organization or
                      unit if this concept note belongs elsewhere.
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
                        value={field.value || ""}
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
                            <SelectItem key={organization.id} value={String(organization.id)}>
                              {organization.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Defaults to your organization. You can select a different
                        one if needed.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem className="pt-2">
                      <FormLabel>Unit / Department</FormLabel>
                      <Select
                        disabled={!organizationForUnits || isLoadingUnits}
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue
                              placeholder={
                                !organizationForUnits
                                  ? "Select organization first"
                                  : isLoadingUnits
                                    ? "Loading units..."
                                    : "Select a unit/department..."
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {unitOptions.map((unitOption) => (
                            <SelectItem
                              key={unitOption.id}
                              value={String(unitOption.id)}
                            >
                              {unitOption.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Defaults to your unit or department. You can change it if
                        needed.
                      </FormDescription>
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
                      <CardTitle className="text-lg">Executive summary</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Summarize the purpose, policy problem, and intended
                        response.
                      </p>
                    </div>
                    <Badge variant="outline" className="w-fit">
                      {countWords(executiveSummary)} words
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
                            className={CONCEPT_NOTE_SUMMARY_TEXTAREA_CLASS}
                            {...field}
                            onChange={handleChange}
                          />
                        </FormControl>
                        <FormDescription>
                          Summarize the policy issue and proposed response.
                        </FormDescription>
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
                            accept={CONCEPT_NOTE_ATTACHMENT_ACCEPT}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (!isConceptNoteAllowedAttachment(file)) {
                                toast.error(
                                  "Only PDF and Word (.doc, .docx) files are allowed.",
                                );
                                e.target.value = "";
                                return;
                              }
                              field.onChange(file);
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
                                <p className="block text-xs text-muted-foreground m-0">
                                  PDF or Word (.doc, .docx) up to {MAX_FILE_SIZE_MB}MB
                                </p>
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
                    label="Organization selected"
                  />
                  <ReadinessItem
                    complete={completionItems[4]}
                    label="Strategic objectives selected"
                  />
                  <ReadinessItem
                    complete={completionItems[5]}
                    label="Summary within limit"
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
                  disabled={isSubmitSubmitting}
                  onClick={form.handleSubmit(
                    async (data) => {
                      setIsSubmitSubmitting(true);
                      await onSubmit(data, true);
                    },
                    onInvalid,
                  )}
                >
                  {isSubmitSubmitting ? (
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
                    disabled={isDraftSubmitting || autosaveStatus === "saving"}
                    onClick={form.handleSubmit(
                      async (data) => {
                        setIsDraftSubmitting(true);
                        await onSubmit(data, false);
                      },
                      onInvalid,
                    )}
                  >
                    {isDraftSubmitting || autosaveStatus === "saving" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Draft
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isDraftSubmitting || isSubmitSubmitting}
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
