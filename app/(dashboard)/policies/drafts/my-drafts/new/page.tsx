"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  FileText,
  Loader2,
  Save,
  Send,
  UploadCloud,
  X,
  Plus,
} from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageContainer } from "@/components/layout";
import { policyApi, conceptNoteApi } from "@/lib/api/client";
import { policyDocumentSchema, type PolicyDocumentFormData } from "@/lib/validations";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { POLICY_TYPES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import type { ConceptNote } from "@/lib/types";
import { Separator } from "@radix-ui/react-separator";

const MOCK_CONCEPTS: any[] = [
  {
    id: "CN-2024-001",
    title: "National Digital Literacy Framework 2025",
    policyType: "policy",
    background: "Addressing the digital divide in rural primary schools.",
    status: "approved",
    createdAt: new Date().toISOString(),
  },
  {
    id: "CN-2024-002",
    title: "Higher Education Quality Assurance Standards",
    policyType: "standard",
    background: "Standardizing accreditation processes for private universities.",
    status: "approved",
    createdAt: new Date().toISOString(),
  },
  {
    id: "CN-2024-003",
    title: "Vocational Training Integration Strategy",
    policyType: "strategy",
    background: "Aligning TVET programs with industrial market demands.",
    status: "approved",
    createdAt: new Date().toISOString(),
  }
];

export default function NewPolicyDraftPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<PolicyDocumentFormData>({
    resolver: zodResolver(policyDocumentSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "policy",
      category: "Education",
    },
  });

  const [approvedConcepts, setApprovedConcepts] = useState<ConceptNote[]>([]);
  const [isLoadingConcepts, setIsLoadingConcepts] = useState(true);

  useEffect(() => {
    async function loadApprovedConcepts() {
      try {
        const response = await conceptNoteApi.getConceptNotes({ status: "approved" });
        const apiConcepts = response?.data || [];
        setApprovedConcepts([...apiConcepts, ...MOCK_CONCEPTS]);
      } catch (error) {
        console.error("Failed to load approved concepts:", error);
        setApprovedConcepts(MOCK_CONCEPTS);
      } finally {
        setIsLoadingConcepts(false);
      }
    }
    loadApprovedConcepts();
  }, []);

  const handleConceptSelect = (conceptId: string) => {
    const concept = approvedConcepts.find((c) => c.id === conceptId);
    if (concept) {
      form.setValue("title", concept.title);
      form.setValue("type", concept.policyType);
      // form.setValue("category", concept.category); // If concept has category
    }
  };

  async function onSubmit(data: PolicyDocumentFormData, submitForReview = false) {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await policyApi.createPolicy({
        ...data,
        status: submitForReview ? "under_review" : "draft",
        // In a real app, we'd handle the file upload separately or as part of a FormData
      });
      
      if (response.success) {
        toast.success(
          submitForReview
            ? "Policy draft submitted for expert review"
            : "Policy draft saved successfully"
        );
        router.push("/policies/drafts");
      } else {
        toast.error(response.message || "Failed to create policy draft");
      }
    } catch (error) {
      console.error("Failed to create policy draft:", error);
      toast.error("An error occurred while creating the policy draft");
    } finally {
      setIsLoading(false);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error("File size must be less than 20MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  return (
    <PageContainer
      title="Create Policy Draft"
      description="Formalize your policy proposal into a comprehensive draft for expert evaluation."
      actions={
        <Button variant="outline" asChild className="shadow-sm">
          <Link href="/policies/drafts/my-drafts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      }
    >
      <Form {...form}>
        <form className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <Card className="shadow-sm overflow-hidden border-primary/10">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Concept Note Identity
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                <div className="space-y-2">
                  <FormLabel className="font-bold">Select Approved Concept Note <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={handleConceptSelect}>
                    <FormControl>
                      <SelectTrigger className="h-11 shadow-sm focus:ring-primary/20">
                        <SelectValue placeholder={isLoadingConcepts ? "Loading approved concepts..." : "Choose an approved concept note..."} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {approvedConcepts.length > 0 ? (
                        approvedConcepts.map((concept) => (
                          <SelectItem key={concept.id} value={concept.id}>
                            <div className="flex flex-col py-1">
                              <span className="font-bold">{concept.title}</span>
                              <span className="text-[10px] text-muted-foreground uppercase">{concept.id} · {POLICY_TYPES[concept.policyType]?.label || concept.policyType}</span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-muted-foreground">No approved concept notes found.</div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>The draft will be linked to this approved concept note.</FormDescription>
                </div>

                {form.watch("title") && (
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Imported Title</p>
                        <p className="text-sm font-black text-foreground">{form.watch("title")}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Policy Type</p>
                        <Badge variant="outline" className="bg-background">
                          {POLICY_TYPES[form.watch("type")]?.label.toUpperCase() || form.watch("type").toUpperCase()}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Target Category</p>
                        <p className="text-sm font-medium">{form.watch("category")}</p>
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
                  Description & Scope
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Detailed Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Summarize the core problem this policy addresses and the proposed solutions..."
                          className="min-h-[160px] leading-relaxed shadow-sm focus-visible:ring-primary/20"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>At least 50 characters describing the intent of this draft.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="shadow-sm overflow-hidden border-primary/10">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <UploadCloud className="h-5 w-5 text-primary" />
                  Draft Document Upload
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                   <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl py-12 px-6 bg-muted/5 border-muted-foreground/20 hover:border-primary/50 transition-colors cursor-pointer relative">
                      <Input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                      />
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <UploadCloud className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-sm font-bold text-foreground">Click or drag to upload the full draft</h3>
                      <p className="text-[11px] text-muted-foreground mt-1">PDF, DOCX up to 20MB</p>
                   </div>

                   {selectedFile && (
                     <div className="flex items-center justify-between p-3 rounded-lg border bg-emerald-50/30 border-emerald-200">
                        <div className="flex items-center gap-3">
                           <FileText className="h-5 w-5 text-emerald-600" />
                           <div className="flex flex-col">
                              <span className="text-xs font-bold text-emerald-900 line-clamp-1">{selectedFile.name}</span>
                              <span className="text-[10px] text-emerald-700">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                           </div>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                          onClick={() => setSelectedFile(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                     </div>
                   )}
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card className="shadow-md border-primary/10 overflow-hidden xl:sticky xl:top-20 xl:self-start">
               <CardHeader className="bg-primary text-primary-foreground py-4">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider">Submission Actions</CardTitle>
               </CardHeader>
               <CardContent className="pt-6 space-y-4">
                  <Button 
                    type="button" 
                    className="w-full h-11" 
                    disabled={isLoading}
                    onClick={form.handleSubmit((data) => onSubmit(data, true))}
                  >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Submit for Expert Review
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full h-11 border-primary/20 text-primary hover:bg-primary/5" 
                    disabled={isLoading}
                    onClick={form.handleSubmit((data) => onSubmit(data, false))}
                  >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save as Draft
                  </Button>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Requirements</h4>
                    <ul className="space-y-2">
                       <li className="flex items-center gap-2 text-xs text-slate-600">
                          <div className={cn("h-4 w-4 rounded-full flex items-center justify-center", form.watch("title").length >= 10 ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground")}>
                            {form.watch("title").length >= 10 ? <Plus className="h-3 w-3" /> : <div className="h-1 w-1 bg-current rounded-full" />}
                          </div>
                          Title (Min 10 chars)
                       </li>
                       <li className="flex items-center gap-2 text-xs text-slate-600">
                          <div className={cn("h-4 w-4 rounded-full flex items-center justify-center", form.watch("description").length >= 50 ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground")}>
                            {form.watch("description").length >= 50 ? <Plus className="h-3 w-3" /> : <div className="h-1 w-1 bg-current rounded-full" />}
                          </div>
                          Description (Min 50 chars)
                       </li>
                       <li className="flex items-center gap-2 text-xs text-slate-600">
                          <div className={cn("h-4 w-4 rounded-full flex items-center justify-center", selectedFile ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground")}>
                            {selectedFile ? <Plus className="h-3 w-3" /> : <div className="h-1 w-1 bg-current rounded-full" />}
                          </div>
                          Draft Document Upload
                       </li>
                    </ul>
                  </div>
               </CardContent>
            </Card>

            <Card className="bg-muted/30 border-dashed">
               <CardContent className="pt-6">
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Once submitted for Expert Review, this document will be scored against the official PSR checklist. You can monitor the progress in your dashboard.
                  </p>
               </CardContent>
            </Card>
          </aside>
        </form>
      </Form>
    </PageContainer>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
