"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PageContainer } from "@/components/layout";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { conceptNoteApi } from "@/lib/api/client";
import type { ConceptNote } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ConceptNoteReviewPage() {
  const params = useParams();
  const router = useRouter();
  const [note, setNote] = useState<ConceptNote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Review Form State
  const [comments, setComments] = useState("");
  const [decision, setDecision] = useState<"approve" | "revise" | "reject" | null>(null);

  useEffect(() => {
    async function loadNote() {
      try {
        const response = await conceptNoteApi.getConceptNote(params.id as string);
        if (response.success && response.data) {
          setNote(response.data);
        } else {
          router.push("/policies/concept-notes");
        }
      } catch (error) {
        console.error("Failed to load concept note:", error);
        router.push("/policies/concept-notes");
      } finally {
        setIsLoading(false);
      }
    }
    loadNote();
  }, [params.id, router]);

  const handleSubmit = async () => {
    if (!decision) {
      toast.error("Please select an expert decision before submitting.");
      return;
    }
    if (!comments.trim()) {
      toast.error("Please provide review comments justifying your decision.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call to create ConceptReview record and notify proposer
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      toast.success("Review successfully submitted and recorded.");
      router.push(`/policies/concept-notes/${params.id}`);
    } catch (error) {
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Loading Review Workspace...">
        <div className="space-y-6">
          <div className="h-32 bg-muted animate-pulse rounded-xl" />
          <div className="h-96 bg-muted animate-pulse rounded-xl" />
        </div>
      </PageContainer>
    );
  }

  if (!note) return null;

  return (
    <PageContainer
      title="Expert Review Workspace"
      description={`Stage 2: Evaluating Concept Note - ${note.id}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="shadow-sm">
            <Link href={`/policies/concept-notes/${note.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel Review
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        
        {/* Left Column: Review Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="bg-muted/30 border-b">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Expert Assessment</CardTitle>
              </div>
              <CardDescription>
                Provide detailed feedback on the concept note. This will be shared with the proposer.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  1. Comprehensive Feedback
                </Label>
                <Textarea 
                  placeholder="Detail your findings, methodological critiques, and alignment with national strategies..."
                  className="resize-none min-h-[200px] text-sm"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  2. Supporting Documents (Optional)
                </Label>
                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-foreground">Click to upload annotated files</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOCX up to 10MB</p>
                </div>
              </div>

            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" /> 3. Final Expert Decision
              </CardTitle>
              <CardDescription>Select the outcome of this evaluation phase.</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                className="grid gap-4 sm:grid-cols-3" 
                value={decision || ""}
                onValueChange={(val: any) => setDecision(val)}
              >
                <div>
                  <RadioGroupItem value="approve" id="approve" className="peer sr-only" />
                  <Label
                    htmlFor="approve"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-muted hover:text-accent-foreground peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:bg-green-50 [&:has([data-state=checked])]:border-green-500 cursor-pointer transition-all"
                  >
                    <CheckCircle2 className="mb-3 h-6 w-6 text-green-500" />
                    <span className="font-semibold text-green-700">Accepted</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="revise" id="revise" className="peer sr-only" />
                  <Label
                    htmlFor="revise"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-muted hover:text-accent-foreground peer-data-[state=checked]:border-orange-500 peer-data-[state=checked]:bg-orange-50 [&:has([data-state=checked])]:border-orange-500 cursor-pointer transition-all"
                  >
                    <AlertCircle className="mb-3 h-6 w-6 text-orange-500" />
                    <span className="font-semibold text-orange-700">Partial Acceptance</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="reject" id="reject" className="peer sr-only" />
                  <Label
                    htmlFor="reject"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-muted hover:text-accent-foreground peer-data-[state=checked]:border-red-500 peer-data-[state=checked]:bg-red-50 [&:has([data-state=checked])]:border-red-500 cursor-pointer transition-all"
                  >
                    <XCircle className="mb-3 h-6 w-6 text-red-500" />
                    <span className="font-semibold text-red-700">Reject</span>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
            <CardFooter className="bg-muted/30 pt-6 border-t">
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                className="w-full h-12 text-md font-semibold bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column: Reference Info */}
        <div className="space-y-6 lg:sticky lg:top-6">
          <Card className="shadow-sm">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Document Reference</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <p className="font-bold text-sm leading-tight text-foreground">{note.title}</p>
                <span className="text-xs text-primary font-mono mt-1 block">{note.id}</span>
              </div>
              
              <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground leading-relaxed line-clamp-6">
                {note.background}
              </div>

              {note.attachments && note.attachments.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-semibold mb-2">Original Files</p>
                  <div className="space-y-2">
                    {note.attachments.map((file) => (
                      <div key={file.id} className="flex items-center gap-2 p-2 border rounded hover:bg-muted/30 cursor-pointer transition-colors">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-xs truncate">{file.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="bg-blue-50/50 rounded-lg p-4 text-xs text-blue-800 border border-blue-100 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-500 shrink-0" />
            <p>
              Your review timestamp and decision will be permanently recorded in the system audit log and the proposer will be notified immediately.
            </p>
          </div>
        </div>

      </div>
    </PageContainer>
  );
}
