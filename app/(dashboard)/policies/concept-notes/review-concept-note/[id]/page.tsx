"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  ClipboardCheck,
  Building2,
  Check,
  AlertCircle,
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
import { ConceptNoteTabs } from "@/components/policies/concept-notes/concept-note-tabs";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useMyReviewDetail } from "@/lib/queries/concept-notes";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";

function formatLabel(value: any, fallback = "N/A") {
  if (!value) return fallback;
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function ConceptNoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { backendToken } = useAuth();
  const id = params.id as string;

  const { data: note, isLoading, isError } = useMyReviewDetail(id);
  const [viewingFile, setViewingFile] = useState<any>(null);

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

  if (isError || !note) {
    return (
      <PageContainer title="Error Loading Concept Note">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold">Failed to load concept note details</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            There was a problem retrieving the details for this concept note. Please verify the URL or try again.
          </p>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" asChild>
              <Link href={`/policies/concept-notes/review-concept-note`}>
                Go to Reviews Queue
              </Link>
            </Button>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  const authorName = note.submittedBy?.fullName || "Anonymous";
  const authorEmail = note.submittedBy?.email || "";
  const authorPhoto = note.submittedBy?.photoUrl;
  const authorInstitution = (note as any).organization?.name || "Ministry of Health";
  const summaryCardRows = [
    { label: "Concept ID", value: note.currentStatus?.conceptId || note.id },
    { label: "Status", value: note.currentStatus?.status },
    { label: "Document Type", value: note.docType?.name || note.documentType?.name },
    { label: "Category", value: note.documentCategory },
    { label: "Organization", value: note.organization?.name },
    { label: "Unit", value: note.unit?.name },
    { label: "Latest Version", value: note.currentStatus?.version || note.versions?.find((version: any) => version.isLatest)?.versionNumber },
  ];
  const initials = authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return (
    <PageContainer
      title={note.title}
      description={`Concept Note #${note.id}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="shadow-sm">
            <Link href="/policies/concept-notes/review-concept-note">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button className="shadow-sm bg-primary hover:bg-primary/90 text-white" asChild>
            <Link href={`/policies/concept-notes/review-concept-note/${note.id}/review`} className="flex items-center px-4 py-2 text-sm font-semibold rounded-md">
              <Check className="mr-2 h-4 w-4" />
              Review
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* Main Content Area */}
        <div className="space-y-6">
          <ConceptNoteTabs note={note} setViewingFile={setViewingFile} />
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <CardTitle className="text-sm font-semibold">
                Concept Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {summaryCardRows.map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-4">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className="text-xs font-medium text-foreground text-right max-w-[160px]">
                    {formatLabel(item.value)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/20">
            <CardHeader className="pb-3 border-b bg-primary/5">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="outline" className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/20 uppercase tracking-wide">
                  {note.currentStatus?.status || "Under Review"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Concept ID</span>
                <span className="text-xs font-mono font-bold">{note.currentStatus?.conceptId || note.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Version</span>
                <Badge variant="secondary" className="text-[10px]">{note.currentStatus?.version || "CN-0001-V1"}</Badge>
              </div>
              <Separator />
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Submitted By</span>
                <div className="flex items-center gap-3 pt-1">
                  <Avatar className="h-9 w-9 border shadow-sm">
                    {authorPhoto && (
                      <AvatarImage src={authorPhoto} alt={authorName} />
                    )}
                    <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold uppercase">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-semibold truncate text-foreground">
                      {authorName}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {authorInstitution}
                    </span>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Submitted</span>
                  <span className="font-medium text-foreground">
                    {note.submittedBy?.submittedAt ? new Date(note.submittedBy.submittedAt).toLocaleDateString() : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated</span>
                  <span className="font-medium text-foreground">
                    {note.submittedBy?.lastUpdated ? new Date(note.submittedBy.lastUpdated).toLocaleDateString() : "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/10">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <CardTitle className="text-sm font-semibold">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-9 text-sm"
                asChild
              >
                <Link href={`/policies/concept-notes/review-concept-note/${note.id}/review`}>
                  <ClipboardCheck className="mr-2 h-4 w-4 text-muted-foreground" />
                  Review Document
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-9 text-sm"
                onClick={() => {
                  if (note.overview?.file) {
                    window.open(resolveFileUrl(note.overview.file) ?? "#", "_blank");
                  } else {
                    toast.error("No attachment file is available.");
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4 text-muted-foreground" />
                Download PDF
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
