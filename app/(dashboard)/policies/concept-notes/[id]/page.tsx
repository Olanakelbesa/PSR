"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Send,
  FileText,
  User,
  Calendar,
  Clock,
  Building,
  Tag,
  BookOpen,
  Download,
  ClipboardCheck,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageContainer } from "@/components/layout";
import { StatusBadge } from "@/components/shared";
import { conceptNoteApi } from "@/lib/api/client";
import { POLICY_TYPES } from "@/lib/constants";
import type { ConceptNote } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ConceptNoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [note, setNote] = useState<ConceptNote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadNote() {
      try {
        const response = await conceptNoteApi.getConceptNote(
          params.id as string
        );
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
    if (!note) return;
    setIsSubmitting(true);
    try {
      const response = await conceptNoteApi.submitConceptNote(note.id);
      if (response.success) {
        toast.success("Concept note successfully submitted for PSR review.");
        setNote(response.data!);
      }
    } catch (error) {
      toast.error("Failed to submit concept note");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Loading...">
        <div className="space-y-6">
          <div className="h-32 bg-muted animate-pulse rounded-xl" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 h-96 bg-muted animate-pulse rounded-xl" />
            <div className="h-96 bg-muted animate-pulse rounded-xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!note) {
    return null;
  }

  return (
    <PageContainer
      title="Concept Note Details"
      description={`Viewing Concept Note: ${note.id}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="shadow-sm">
            <Link href="/policies/concept-notes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          {note.status === "draft" && (
            <>
              <Button
                variant="outline"
                asChild
                className="border-primary/20 text-primary hover:bg-primary/10 shadow-sm"
              >
                <Link href={`/policies/concept-notes/${note.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="shadow-sm">
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? "Submitting..." : "Submit for Review"}
              </Button>
            </>
          )}
          {(note.status === "submitted" || note.status === "under_review") && (
            <Button asChild className="bg-primary hover:bg-primary/90 shadow-sm">
              <Link href={`/policies/concept-notes/${note.id}/review`}>
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Review
              </Link>
            </Button>
          )}
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Left Column: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-muted">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <CardTitle className="text-xl leading-tight">
                    {note.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-mono text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {note.id}
                    </span>
                    <Badge
                      variant="outline"
                      className="font-mono text-[10px] bg-primary/5 text-primary border-primary/20"
                    >
                      v1.0.0
                    </Badge>
                  </div>
                </div>
                <StatusBadge type="policy" status={note.status} />
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Executive Summary
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {note.background}
                </p>
              </div>

              <Separator className="bg-muted/50" />

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" /> Thematic Areas
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">Health Systems</Badge>
                  <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">Digital Policy</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Supporting Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              {note.attachments && note.attachments.length > 0 ? (
                <div className="space-y-3">
                  {note.attachments.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-all"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-sm font-medium truncate">
                            {file.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="shrink-0 gap-2">
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 border border-dashed rounded-lg bg-muted/20">
                  <p className="text-sm text-muted-foreground italic">
                    No supporting files attached to this concept note.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Meta Info */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Document Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Document Type</span>
                <Badge variant="secondary" className="font-medium bg-muted">
                  {POLICY_TYPES[note.policyType]?.label || note.policyType}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Category</span>
                <Badge variant="outline" className="font-medium text-blue-600 bg-blue-50 border-blue-200">
                  New Proposal
                </Badge>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-muted-foreground">Author</span>
                    <span className="text-sm font-medium">
                      {note.createdBy.firstName} {note.createdBy.lastName}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-muted-foreground">Organization</span>
                    <span className="text-sm font-medium text-right">
                      {note.createdBy.institution || "Ministry of Health"}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-muted-foreground">Submitted On</span>
                    <span className="text-sm font-medium">
                      {new Date(note.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-muted-foreground">Last Update</span>
                    <span className="text-sm font-medium">
                      {new Date(note.updatedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews Preview (if any) */}
          {note.reviews && note.reviews.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center justify-between">
                  Reviewer Feedback
                  <Badge variant="secondary" className="font-normal">{note.reviews.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {note.reviews.map((review) => (
                  <div key={review.id} className="p-3 bg-muted/30 rounded-lg border space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                            {review.reviewer.firstName[0]}
                            {review.reviewer.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-semibold">
                          {review.reviewer.firstName} {review.reviewer.lastName}
                        </span>
                      </div>
                      <Badge
                        className={cn(
                          "text-[10px]",
                          review.recommendation === "approve"
                            ? "bg-green-500 hover:bg-green-600"
                            : review.recommendation === "revise"
                            ? "bg-orange-500 hover:bg-orange-600"
                            : "bg-red-500 hover:bg-red-600"
                        )}
                      >
                        {review.recommendation === "approve"
                          ? "Approved"
                          : review.recommendation === "revise"
                          ? "Revision"
                          : "Rejected"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground italic">"{review.comments}"</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
