"use client";

import { useState, useRef, useMemo } from "react";
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
import { PageContainer } from "@/components/layout";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import { useConceptNotes } from "@/lib/queries/concept-notes";
import { policyDocumentSchema, type PolicyDocumentFormData } from "@/lib/validations";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { POLICY_TYPES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@radix-ui/react-separator";

export default function NewPolicyDraftPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<any | null>(null);

  const [createdDraftId, setCreatedDraftId] = useState<number | null>(null);

  const { data: conceptNotesRes, isLoading: isLoadingConcepts } = useConceptNotes({
    current_status: "policy_draft_ready",
  });

  const approvedConcepts = conceptNotesRes?.data || [];

  const form = useForm<PolicyDocumentFormData>({
    resolver: zodResolver(policyDocumentSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "policy",
      category: "Education",
    },
  });

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleConceptSelect = (conceptId: string) => {
    const concept = approvedConcepts.find((c) => String(c.id) === String(conceptId));
    if (concept) {
      setSelectedConcept(concept);
      form.setValue("title", concept.title);
      
      const mappedType = (
        {
          "Policy": "policy",
          "Strategy": "strategy",
          "Strategy/Framework": "strategy",
          "Guideline": "guideline",
          "Guideline/Manual": "guideline",
          "Protocol": "protocol",
          "Standard": "standard",
          "Directive": "directive",
        } as Record<string, string>
      )[concept.docType?.name || ""] || "policy";
      
      form.setValue("type", mappedType as any);
    }
  };

  async function onSubmit(data: PolicyDocumentFormData, submitForReview = false) {
    if (!user) return;
    
    if (!selectedConcept) {
      toast.error("Please select an approved concept note.");
      return;
    }

    if (!selectedFile) {
      toast.error("Please upload a draft document before submitting.");
      return;
    }

    setIsLoading(true);
    try {
      let draftId = createdDraftId;

      // 1. Check if a draft already exists for this concept note in database
      if (!draftId) {
        const checkRes = await apiClient.get(
          `${API_ENDPOINTS.POLICY_DRAFTS.LIST}?concept_note=${selectedConcept.id}`
        );
        const existingDrafts = checkRes.data?.data || checkRes.data;
        if (existingDrafts && existingDrafts.length > 0) {
          draftId = existingDrafts[0].id;
          setCreatedDraftId(draftId);
        }
      }

      // 2. If it exists, update it with patch; otherwise, create a new one
      if (draftId) {
        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("draft_file", selectedFile);

        await apiClient.patch(API_ENDPOINTS.POLICY_DRAFTS.UPDATE(draftId), formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("concept_note", String(selectedConcept.id));
        formData.append("doc_type", String(selectedConcept.docType?.id || 1));
        formData.append("organization", String(selectedConcept.organization?.id || 1));
        formData.append("draft_file", selectedFile);

        const createRes = await apiClient.post(API_ENDPOINTS.POLICY_DRAFTS.CREATE, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        const draft = createRes.data?.data || createRes.data;
        draftId = draft?.id;

        if (!draftId) {
          throw new Error("Invalid draft ID returned from server");
        }
        setCreatedDraftId(draftId);
      }

      // 3. Submit if requested
      if (submitForReview) {
        await apiClient.post(API_ENDPOINTS.POLICY_DRAFTS.SUBMIT(draftId));
        toast.success("Policy draft submitted for expert review");
        router.push("/policies/drafts/my-drafts");
      } else {
        toast.success("Policy draft saved successfully");
      }
    } catch (error: any) {
      console.error("Failed to process policy draft:", error);
      
      let errorMessage = "An error occurred while creating the policy draft";
      const apiError = error.errors || error.response?.data?.error;
      
      if (apiError) {
        if (apiError.details) {
          const detailMessages = Object.entries(apiError.details)
            .map(([field, msgs]) => {
              const formattedField = field
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase());
              const messages = Array.isArray(msgs) ? msgs.join(", ") : String(msgs);
              return `${formattedField}: ${messages}`;
            })
            .join("\n");
          
          if (detailMessages) {
            errorMessage = detailMessages;
          } else {
            errorMessage = apiError.message || errorMessage;
          }
        } else {
          errorMessage = apiError.message || errorMessage;
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message && error.message !== "[object Object]") {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File size must be less than 20MB");
      return;
    }
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload PDF or DOCX.");
      return;
    }
    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
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
                          <SelectItem key={concept.id} value={String(concept.id)}>
                            <div className="flex flex-col py-1">
                              <span className="font-bold">{concept.title}</span>
                              <span className="text-[10px] text-muted-foreground uppercase">
                                {concept.id} · {concept.docType?.name || "Concept Note"}
                              </span>
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
                  <UploadCloud className="h-5 w-5 text-primary" />
                  Draft Document Upload
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                   {!selectedFile ? (
                     <div 
                       className={cn(
                         "flex flex-col items-center justify-center border-2 border-dashed rounded-xl py-12 px-6 bg-muted/5 transition-all cursor-pointer relative",
                         isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-muted-foreground/20 hover:border-primary/50"
                       )}
                       onDragOver={handleDragOver}
                       onDragLeave={handleDragLeave}
                       onDrop={handleDrop}
                       onClick={() => fileInputRef.current?.click()}
                     >
                        <Input
                          ref={fileInputRef}
                          type="file"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                        />
                        <div className={cn(
                          "h-12 w-12 rounded-full flex items-center justify-center mb-4 transition-transform duration-300",
                          isDragging ? "bg-primary text-primary-foreground scale-110" : "bg-primary/10 text-primary"
                        )}>
                          <UploadCloud className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground">
                          {isDragging ? "Drop the file here" : "Click or drag to upload the full draft"}
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-1">PDF, DOCX up to 20MB</p>
                     </div>
                   ) : (
                     <div className="p-6 rounded-xl border-2 border-primary/20 bg-primary/[0.02] relative group overflow-hidden">
                        <Input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                        />
                        
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center shadow-sm">
                                 <FileText className="h-7 w-7 text-primary" />
                              </div>
                              <div className="flex flex-col gap-1">
                                 <span className="text-sm font-bold text-foreground line-clamp-1">{selectedFile.name}</span>
                                 <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px] bg-background font-mono px-1.5 py-0">
                                       {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                                       {selectedFile.type.split('/').pop()?.toUpperCase()}
                                    </span>
                                 </div>
                              </div>
                           </div>
                           
                           <div className="flex items-center gap-2">
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                className="h-9 px-4 border-primary/20 text-primary hover:bg-primary/5 font-bold text-xs"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                 <UploadCloud className="mr-2 h-3.5 w-3.5" />
                                 Re-upload
                              </Button>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm"
                                className="h-9 px-4 text-destructive hover:text-destructive hover:bg-destructive/5 font-bold text-xs"
                                onClick={() => setSelectedFile(null)}
                              >
                                 <X className="mr-2 h-3.5 w-3.5" />
                                 Remove
                              </Button>
                           </div>
                        </div>

                        <div className="absolute -right-4 -bottom-4 opacity-[0.03] rotate-12">
                           <FileText className="h-24 w-24" />
                        </div>
                     </div>
                   )}
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-10 xl:h-fit ">
            <Card className="shadow-md border-primary/10 overflow-hidden">
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
                    Submit
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
