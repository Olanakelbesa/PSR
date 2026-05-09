"use client";

import { useEffect, useState, type ChangeEvent } from "react";
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
import { conceptNoteApi } from "@/lib/api/client";
import { taxonomyApi } from "@/lib/api/client";
import { conceptNoteSchema, type ConceptNoteFormData } from "@/lib/validations";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import type { Institution } from "@/lib/types";

interface DocumentType {
  id: string;
  name: string;
}

interface ThematicArea {
  id: string;
  name: string;
}

type OrganizationId = "MoH" | "Agency" | "University" | "Other";

interface OrganizationOption {
  id: OrganizationId;
  name: string;
}

const ORGANIZATION_OPTIONS = [
  { id: "MoH", name: "MoH" },
  { id: "Agency", name: "Agency" },
  { id: "University", name: "University" },
  { id: "Other", name: "Other" },
] as const satisfies readonly OrganizationOption[];

const MAX_TITLE_LENGTH = 500;
const MAX_SUMMARY_WORDS = 250;

export default function NewConceptNotePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [thematicAreas, setThematicAreas] = useState<ThematicArea[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);

  useEffect(() => {
    // TODO: Fetch document types and thematic areas from API
    // For now, using placeholder data
    setDocumentTypes([
      { id: "1", name: "Policy" },
      { id: "2", name: "Strategy" },
      { id: "3", name: "Guideline" },
    ]);
    setThematicAreas([
      { id: "1", name: "Education" },
      { id: "2", name: "Health" },
      { id: "3", name: "Environmental" },
      { id: "4", name: "Economic" },
    ]);

    taxonomyApi.getInstitutions().then((response) => {
      if (response.success && response.data) {
        setInstitutions(response.data);
      }
    });
  }, []);

  const form = useForm<ConceptNoteFormData>({
    resolver: zodResolver(conceptNoteSchema),
    defaultValues: {
      title: "",
      executiveSummary: "",
      documentType: "",
      organization: [],
      universities: [],
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
  const selectedUniversities = form.watch("universities") || [];
  const selectedThematicIds = form.watch("thematicAreas") || [];
  const selectedFile = form.watch("file") as File | undefined;

  const showUniversityField = selectedOrganizationIds.includes("University");
  const universityOptions = institutions.filter(
    (institution) => institution.type === "academic",
  );
  const selectedOrganizationsList = ORGANIZATION_OPTIONS.filter((org) =>
    selectedOrganizationIds.includes(org.id),
  );
  const selectedAreas = thematicAreas.filter((area) =>
    selectedThematicIds.includes(area.id),
  );
  const wordCount = calculateWordCount(executiveSummary);
  const organizationReady =
    selectedOrganizationIds.length > 0 &&
    (!showUniversityField || selectedUniversities.length > 0);
  const completionItems = [
    title.trim().length > 0,
    Boolean(selectedDocumentType),
    Boolean(selectedDocumentCategory),
    organizationReady,
    wordCount > 0 && wordCount <= MAX_SUMMARY_WORDS,
    selectedThematicIds.length > 0,
    Boolean(selectedFile),
  ];
  const completion = Math.round(
    (completionItems.filter(Boolean).length / completionItems.length) * 100,
  );

  async function onSubmit(data: ConceptNoteFormData, submitForReview = false) {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await conceptNoteApi.createConceptNote({
        ...data,
        status: submitForReview ? "submitted" : "draft",
      });
      if (response.success) {
        toast.success(
          submitForReview
            ? "Concept note created and submitted for review"
            : "Concept note saved as draft",
        );
        router.push("/policies/concept-notes");
      } else {
        toast.error(response.message || "Failed to create concept note");
      }
    } catch (error) {
      console.error("Failed to create concept note:", error);
      toast.error("An error occurred while creating the concept note");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PageContainer
      title="New Concept Note"
      description="Prepare a policy concept note for draft saving or review submission"
      actions={
        <Button variant="outline" asChild>
          <Link href="/policies/concept-notes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      }
    >
      <Form {...form}>
        <form className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
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
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="w-full"
                        >
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select document type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {documentTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
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
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <button
                              type="button"
                              className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <span className="flex-1 text-left">
                                {selectedOrganizationIds.length > 0
                                  ? `${selectedOrganizationIds.length} organization${selectedOrganizationIds.length !== 1 ? "s" : ""} selected`
                                  : "Select organization(s)"}
                              </span>
                              <ChevronDown className="h-4 w-4 opacity-50" />
                            </button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-3" align="start">
                          <div className="space-y-2">
                            {ORGANIZATION_OPTIONS.map((organization) => {
                              const checked =
                                field.value?.includes(organization.id) || false;
                              return (
                                <label
                                  key={organization.id}
                                  className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-muted/50"
                                >
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(isChecked) => {
                                      const currentValue = field.value || [];
                                      const nextValue = isChecked
                                        ? [...currentValue, organization.id]
                                        : currentValue.filter(
                                            (id) => id !== organization.id,
                                          );
                                      field.onChange(nextValue);

                                      if (!nextValue.includes("University")) {
                                        form.setValue("universities", []);
                                      }
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
                        Select one or more organizations relevant to the concept
                        note.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedOrganizationsList.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedOrganizationsList.map((organization) => (
                      <Badge
                        key={organization.id}
                        variant="secondary"
                        className="flex items-center gap-2"
                      >
                        {organization.name}
                        <button
                          type="button"
                          onClick={() => {
                            form.setValue(
                              "organization",
                              selectedOrganizationIds.filter(
                                (id) => id !== organization.id,
                              ),
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

                {showUniversityField && (
                  <FormField
                    control={form.control}
                    name="universities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Universities</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <button
                                type="button"
                                className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <span className="flex-1 text-left">
                                  {selectedUniversities.length > 0
                                    ? `${selectedUniversities.length} universit${selectedUniversities.length === 1 ? "y" : "ies"} selected`
                                    : "Select university(s)"}
                                </span>
                                <ChevronDown className="h-4 w-4 opacity-50" />
                              </button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-3" align="start">
                            <div className="space-y-2">
                              {universityOptions.map((institution) => {
                                const checked =
                                  field.value?.includes(institution.name) ||
                                  false;

                                return (
                                  <label
                                    key={institution.id}
                                    className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-muted/50"
                                  >
                                    <Checkbox
                                      checked={checked}
                                      onCheckedChange={(isChecked) => {
                                        const currentValue = field.value || [];
                                        field.onChange(
                                          isChecked
                                            ? [
                                                ...currentValue,
                                                institution.name,
                                              ]
                                            : currentValue.filter(
                                                (name) =>
                                                  name !== institution.name,
                                              ),
                                        );
                                      }}
                                    />
                                    <span className="text-sm font-medium">
                                      {institution.name}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Choose one or more academic institutions when
                          University is selected.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {selectedUniversities.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedUniversities.map((university) => (
                      <Badge
                        key={university}
                        variant="secondary"
                        className="flex items-center gap-2"
                      >
                        {university}
                        <button
                          type="button"
                          onClick={() => {
                            form.setValue(
                              "universities",
                              selectedUniversities.filter(
                                (name) => name !== university,
                              ),
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
                                field.value?.includes(area.id) || false;
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
                                          ? [...currentValue, area.id]
                                          : currentValue.filter(
                                              (id) => id !== area.id,
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
                                      (id) => id !== area.id,
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
                            id="concept-note-file"
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                field.onChange(file);
                              }
                            }}
                            className="sr-only"
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
                                <Button variant="outline" size="sm" asChild>
                                  <label
                                    htmlFor="concept-note-file"
                                    className="cursor-pointer"
                                  >
                                    Replace
                                  </label>
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
                            <label
                              htmlFor="concept-note-file"
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
                            </label>
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
                  disabled={isLoading}
                  onClick={form.handleSubmit((data) => onSubmit(data, true))}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Submit for Review
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    onClick={form.handleSubmit((data) => onSubmit(data, false))}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Draft
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isLoading}
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
