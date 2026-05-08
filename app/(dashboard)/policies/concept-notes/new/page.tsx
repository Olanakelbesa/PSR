"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save, Send, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageContainer } from "@/components/layout";
import { conceptNoteApi } from "@/lib/api/client";
import { conceptNoteSchema, type ConceptNoteFormData } from "@/lib/validations";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

interface DocumentType {
  id: string;
  name: string;
}

interface ThematicArea {
  id: string;
  name: string;
}

export default function NewConceptNotePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [thematicAreas, setThematicAreas] = useState<ThematicArea[]>([]);
  const [wordCount, setWordCount] = useState(0);

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
  }, []);

  const form = useForm<ConceptNoteFormData>({
    resolver: zodResolver(conceptNoteSchema),
    defaultValues: {
      title: "",
      executiveSummary: "",
      documentType: "",
      thematicAreas: [],
      documentCategory: "new",
      file: undefined,
    },
  });

  async function onSubmit(data: ConceptNoteFormData, submitForReview = false) {
    if (!user) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("executiveSummary", data.executiveSummary);
      formData.append("documentType", data.documentType);
      formData.append("documentCategory", data.documentCategory);
      formData.append("file", data.file);
      data.thematicAreas.forEach((area) => {
        formData.append("thematicAreas", area);
      });

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

  const calculateWordCount = (text: string) => {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  };

  return (
    <PageContainer
      title="New Concept Note"
      description="Create a new policy concept note"
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
        <form className="space-y-6 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Provide the title, document type, and category
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter concept note title"
                        maxLength={500}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A clear, descriptive title for the policy concept note
                      (max 500 characters). {field.value?.length || 0}/500
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        <SelectTrigger>
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
                      Choose the policy document classification
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
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="new">New Policy</SelectItem>
                        <SelectItem value="revision">Revision</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Indicate if this is a new policy or a revision of an
                      existing policy
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
              <CardDescription>
                Provide a comprehensive summary of the concept note (max 250
                words)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="executiveSummary"
                render={({ field }) => {
                  const handleChange = (
                    e: React.ChangeEvent<HTMLTextAreaElement>,
                  ) => {
                    field.onChange(e);
                    setWordCount(calculateWordCount(e.target.value));
                  };
                  return (
                    <FormItem>
                      <FormLabel>Summary</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a comprehensive summary of the policy concept (max 250 words)..."
                          className="min-h-[200px]"
                          {...field}
                          onChange={handleChange}
                        />
                      </FormControl>
                      <FormDescription>
                        Word count: {wordCount}/250
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thematic Areas</CardTitle>
              <CardDescription>
                Select the relevant thematic areas for this policy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="thematicAreas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Areas</FormLabel>
                    <div className="space-y-3">
                      <Select
                        value={field.value?.[0] || ""}
                        onValueChange={(value) => {
                          const currentValue = field.value || [];
                          if (currentValue.includes(value)) {
                            field.onChange(
                              currentValue.filter((id) => id !== value),
                            );
                          } else {
                            field.onChange([...currentValue, value]);
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select thematic areas" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {thematicAreas.map((area) => (
                            <SelectItem key={area.id} value={area.id}>
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={
                                    field.value?.includes(area.id) || false
                                  }
                                  onCheckedChange={() => {}}
                                  className="pointer-events-none"
                                />
                                {area.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {field.value && field.value.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {field.value.map((selectedId) => {
                            const area = thematicAreas.find(
                              (a) => a.id === selectedId,
                            );
                            return area ? (
                              <div
                                key={selectedId}
                                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                              >
                                {area.name}
                                <button
                                  type="button"
                                  onClick={() =>
                                    field.onChange(
                                      field.value.filter(
                                        (id) => id !== selectedId,
                                      ),
                                    )
                                  }
                                  className="ml-1 hover:text-blue-900 font-bold"
                                >
                                  ×
                                </button>
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                    <FormDescription>
                      Select at least one thematic area
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Document Upload</CardTitle>
              <CardDescription>
                Attach the concept note document
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="file"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document File</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-4">
                        <Input
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              field.onChange(file);
                            }
                          }}
                          className="cursor-pointer"
                        />
                        {field.value && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <Check className="h-4 w-4" />
                            <span>{(field.value as File).name}</span>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Upload the concept note document (PDF, DOC, DOCX, or TXT,
                      max 10MB)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={form.handleSubmit((data) => onSubmit(data, false))}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save as Draft
            </Button>
            <Button
              type="button"
              disabled={isLoading}
              onClick={form.handleSubmit((data) => onSubmit(data, true))}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              Submit for Review
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </PageContainer>
  );
}
