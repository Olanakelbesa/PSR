"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { conceptNoteApi, taxonomyApi } from "@/lib/api/client";
import { conceptNoteSchema, type ConceptNoteFormData } from "@/lib/validations";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import type { Institution, PolicyType } from "@/lib/types";

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

export default function EditConceptNotePage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [thematicAreas, setThematicAreas] = useState<ThematicArea[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);

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

  useEffect(() => {
    // Fetch taxonomies
    setDocumentTypes([
      { id: "policy", name: "Policy" },
      { id: "strategy", name: "Strategy" },
      { id: "guideline", name: "Guideline" },
      { id: "protocol", name: "Protocol" },
      { id: "standard", name: "Standard" },
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

    // Fetch original note
    async function loadNote() {
      try {
        const response = await conceptNoteApi.getConceptNote(params.id as string);
        if (response.success && response.data) {
          const note = response.data;
          form.reset({
            title: note.title,
            executiveSummary: note.background,
            documentType: note.policyType,
            organization: [], // Mock data doesn't have these specific fields, using defaults
            universities: [],
            thematicAreas: [],
            documentCategory: "revision",
            file: undefined, // File can't be pre-filled easily, handled as optional update
          });
        } else {
          toast.error("Concept note not found");
          router.push("/policies/concept-notes");
        }
      } catch (error) {
        toast.error("Failed to load concept note");
      } finally {
        setIsFetching(false);
      }
    }
    loadNote();
  }, [params.id, router, form]);

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
    // File is optional for editing since one might already exist
    true, 
  ];
  const completion = Math.round(
    (completionItems.filter(Boolean).length / completionItems.length) * 100,
  );

  async function onSubmit(data: ConceptNoteFormData, submitForReview = false) {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await conceptNoteApi.updateConceptNote(params.id as string, {
        title: data.title,
        background: data.executiveSummary,
        policyType: data.documentType as PolicyType,
        status: submitForReview ? "submitted" : "draft",
      });
      if (response.success) {
        toast.success(
          submitForReview
            ? "Concept note updated and submitted for review"
            : "Concept note changes saved as draft",
        );
        router.push(`/policies/concept-notes/${params.id}`);
      } else {
        toast.error(response.message || "Failed to update concept note");
      }
    } catch (error) {
      console.error("Failed to update concept note:", error);
      toast.error("An error occurred while updating the concept note");
    } finally {
      setIsLoading(false);
    }
  }

  if (isFetching) {
    return (
      <PageContainer title="Loading...">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Edit Concept Note"
      description="Update your policy concept note and save changes or submit for review"
      actions={
        <Button variant="outline" asChild>
          <Link href={`/policies/concept-notes/${params.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Details
          </Link>
        </Button>
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
                      Update the core classification and title used throughout
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

            <Card className="overflow-hidden shadow-sm border-primary/10">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">Organization</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Select the organization context for this concept note.
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
                              className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
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
                              const checked = field.value?.includes(organization.id) || false;
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
                                        : currentValue.filter((id) => id !== organization.id);
                                      field.onChange(nextValue);
                                      if (!nextValue.includes("University")) {
                                        form.setValue("universities", []);
                                      }
                                    }}
                                  />
                                  <span className="text-sm font-medium">{organization.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )}
                />

                {selectedOrganizationsList.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedOrganizationsList.map((org) => (
                      <Badge key={org.id} variant="secondary" className="gap-1 px-2 py-1">
                        {org.name}
                        <X 
                          className="h-3 w-3 cursor-pointer hover:text-destructive" 
                          onClick={() => form.setValue("organization", selectedOrganizationIds.filter(id => id !== org.id))}
                        />
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
                                className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              >
                                <span className="flex-1 text-left">
                                  {selectedUniversities.length > 0
                                    ? `${selectedUniversities.length} selected`
                                    : "Select university(s)"}
                                </span>
                                <ChevronDown className="h-4 w-4 opacity-50" />
                              </button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-3" align="start">
                            <div className="space-y-2">
                              {universityOptions.map((uni) => (
                                <label key={uni.id} className="flex cursor-pointer items-center gap-3 p-2 hover:bg-muted/50 rounded-md">
                                  <Checkbox
                                    checked={field.value?.includes(uni.name)}
                                    onCheckedChange={(checked) => {
                                      const val = field.value || [];
                                      field.onChange(checked ? [...val, uni.name] : val.filter(v => v !== uni.name));
                                    }}
                                  />
                                  <span className="text-sm font-medium">{uni.name}</span>
                                </label>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden shadow-sm border-primary/10">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Executive summary</CardTitle>
                  <Badge variant={wordCount > MAX_SUMMARY_WORDS ? "destructive" : "outline"}>
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
                          placeholder="Describe the policy issue, proposed direction..."
                          className="min-h-[250px] leading-relaxed resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a concise summary for reviewers.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="overflow-hidden shadow-sm border-primary/10">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="text-lg">Thematic areas</CardTitle>
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
                            <button className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm">
                              <span className="flex-1 text-left">
                                {selectedThematicIds.length > 0 ? `${selectedThematicIds.length} selected` : "Select areas"}
                              </span>
                              <ChevronDown className="h-4 w-4 opacity-50" />
                            </button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-3" align="start">
                          <div className="space-y-2">
                            {thematicAreas.map((area) => (
                              <label key={area.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 cursor-pointer rounded-md">
                                <Checkbox
                                  checked={field.value?.includes(area.id)}
                                  onCheckedChange={(checked) => {
                                    const val = field.value || [];
                                    field.onChange(checked ? [...val, area.id] : val.filter(v => v !== area.id));
                                  }}
                                />
                                <span className="text-sm font-medium">{area.name}</span>
                              </label>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                      {selectedAreas.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-3">
                          {selectedAreas.map((area) => (
                            <Badge key={area.id} variant="secondary" className="gap-1">
                              {area.name}
                              <X className="h-3 w-3 cursor-pointer" onClick={() => field.onChange(field.value?.filter(id => id !== area.id))} />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden shadow-sm border-primary/10">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="text-lg">Document update</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="rounded-lg border-2 border-dashed bg-muted/20 p-8 text-center hover:bg-muted/30 transition-colors cursor-pointer">
                          <Input
                            type="file"
                            className="sr-only"
                            id="file-upload"
                            onChange={(e) => field.onChange(e.target.files?.[0])}
                          />
                          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-3">
                            {selectedFile ? (
                              <>
                                <FileText className="h-10 w-10 text-primary" />
                                <p className="text-sm font-medium">{selectedFile.name}</p>
                                <Button variant="ghost" size="sm" onClick={(e) => { e.preventDefault(); field.onChange(undefined); }}>Remove</Button>
                              </>
                            ) : (
                              <>
                                <UploadCloud className="h-10 w-10 text-muted-foreground" />
                                <p className="text-sm font-medium">Upload a new version of the concept note (Optional)</p>
                                <p className="text-xs text-muted-foreground">PDF, DOCX up to 10MB</p>
                              </>
                            )}
                          </label>
                        </div>
                      </FormControl>
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
                  <ReadinessItem complete={completionItems[0]} label="Clear title provided" />
                  <ReadinessItem complete={completionItems[1]} label="Document type specified" />
                  <ReadinessItem complete={completionItems[2]} label="Category assigned" />
                  <ReadinessItem complete={organizationReady} label="Organization mapped" />
                  <ReadinessItem complete={wordCount > 0 && wordCount <= MAX_SUMMARY_WORDS} label="Summary within 250 words" />
                  <ReadinessItem complete={selectedThematicIds.length > 0} label="Thematic area tagged" />
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2 p-1">
              <Button 
                className="w-full h-11 font-semibold shadow-sm" 
                onClick={form.handleSubmit(data => onSubmit(data, true))}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Submit for PSR Review
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  className="h-10 font-medium" 
                  onClick={form.handleSubmit(data => onSubmit(data, false))}
                  disabled={isLoading}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Draft
                </Button>
                <Button variant="ghost" className="h-10" asChild>
                  <Link href={`/policies/concept-notes/${params.id}`}>Cancel</Link>
                </Button>
              </div>
            </div>
          </aside>
        </form>
      </Form>
    </PageContainer>
  );
}

function ReadinessItem({ complete, label }: { complete: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-[13px]">
      <div className={cn(
        "h-5 w-5 rounded-full flex items-center justify-center shrink-0 border transition-all",
        complete ? "bg-primary border-primary text-primary-foreground shadow-sm" : "bg-muted border-border text-muted-foreground"
      )}>
        {complete && <Check className="h-3 w-3" />}
      </div>
      <span className={cn(complete ? "font-medium text-foreground" : "text-muted-foreground")}>{label}</span>
    </div>
  );
}

function calculateWordCount(text: string) {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}
