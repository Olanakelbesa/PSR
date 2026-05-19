"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Send,
  Calendar,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Printer,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Building2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/layout";
import { ConceptNoteTabs } from "@/components/policies/concept-notes/concept-note-tabs";
import { toast } from "sonner";
import { useAuth } from "@/hooks";
import { useConceptNoteDetail, useSubmitConceptNote } from "@/lib/queries/concept-notes";
import { useState } from "react";

export default function ConceptNoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { backendToken } = useAuth();
  const id = params.id as string | undefined;

  const [viewingFile, setViewingFile] = useState<{
    name: string;
    url: string;
  } | null>(null);

  // ── Data fetching — hooks called at top level ────────────────────────────────
  const {
    data: note,
    isLoading,
    isError,
    refetch,
  } = useConceptNoteDetail(id, backendToken);

  const submitMutation = useSubmitConceptNote(backendToken);

  // ── Submit handler ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!note) return;
    try {
      await submitMutation.mutateAsync(note.id);
      toast.success("Concept note successfully submitted for PSR review.");
    } catch {
      toast.error("Failed to submit concept note. Please try again.");
    }
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageContainer title="Loading...">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (isError || !note) {
    return (
      <PageContainer title="Concept Note">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-12 text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
          <p className="font-semibold text-foreground">
            Failed to load concept note
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Please check your connection and try again.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </PageContainer>
    );
  }

  // ── Derived display values ───────────────────────────────────────────────────
  const submittedBy = note.submittedBy ?? {};
  const conceptId = note.currentStatus?.conceptId ?? note.id;
  const currentVersion =
    note.currentStatus?.version ??
    note.versions?.find((v: any) => v.isLatest)?.versionNumber ??
    "v1.0.0";
  const currentStatus = note.currentStatus?.status ?? "Unknown";
  const submittedAt =
    note.submittedBy?.submittedAt ??
    note.versions?.[0]?.createdAt ??
    new Date().toISOString();
  const lastUpdated = note.submittedBy?.lastUpdated ?? submittedAt;
  const executiveSummary = note.overview?.executiveSummary ?? "";
  const submittedByName = note.submittedBy?.fullName ?? "Unknown";
  const submittedByImage = note.submittedBy?.photoUrl ?? "";
  const submittedByOrganization = "Ministry of Health";
  const isDraft = String(currentStatus).toLowerCase() === "draft";

  return (
    <PageContainer
      title={note.title}
      description={`${conceptId} · ${currentVersion} · ${submittedByName}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="shadow-sm">
            <Link href="/policies/concept-notes/my-concept-note">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          {isDraft && (
            <Button
              variant="outline"
              asChild
              className="shadow-sm border-primary/20 text-primary hover:bg-primary/5"
            >
              <Link href={`/policies/concept-notes/my-concept-note/${note.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* Main Content */}
        <div className="space-y-6">
          <ConceptNoteTabs note={note} setViewingFile={setViewingFile} />
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
          <Card className="shadow-sm border-primary/20">
            <CardHeader className="pb-3 border-b bg-primary/5">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="secondary" className="text-[10px] uppercase">
                  {currentStatus}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Concept ID</span>
                <span className="text-xs font-mono font-bold">{conceptId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Version</span>
                <Badge variant="secondary" className="text-[10px]">
                  {currentVersion}
                </Badge>
              </div>
              <Separator />
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Submitted By
                </span>
                <div className="flex items-center gap-3 pt-1">
                  <Avatar className="h-9 w-9 border shadow-sm">
                    <AvatarImage src={submittedByImage} />
                    <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                      {submittedByName
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((p: string) => p[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-semibold truncate text-foreground">
                      {submittedByName}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {submittedByOrganization}
                    </span>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Submitted</span>
                  <span className="font-medium text-foreground">
                    {new Date(submittedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated</span>
                  <span className="font-medium text-foreground">
                    {new Date(lastUpdated).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/10">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2">
              {isDraft && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-9 text-sm"
                  asChild
                >
                  <Link href={`/policies/concept-notes/my-concept-note/${note.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
                    Edit Concept
                  </Link>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-9 text-sm"
              >
                <Download className="mr-2 h-4 w-4 text-muted-foreground" />
                Download PDF
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-9 text-sm"
              >
                <ExternalLink className="mr-2 h-4 w-4 text-muted-foreground" />
                Share Concept
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* File Preview Dialog */}
      <Dialog open={!!viewingFile} onOpenChange={() => setViewingFile(null)}>
        <DialogContent className="max-w-5xl h-[90vh] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="p-0 border-b bg-background">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 px-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 border rounded-md bg-muted/50 p-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-medium px-2">100%</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-medium px-1">Page 1 / 1</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 gap-1.5">
                  <Printer className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Print</span>
                </Button>
                <Button variant="outline" size="sm" className="h-8 gap-1.5">
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Full Screen</span>
                </Button>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 bg-primary"
                  onClick={() => setViewingFile(null)}
                >
                  Close Preview
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 bg-slate-200/50 flex justify-center items-start overflow-auto p-4 sm:p-8">
            <div className="shadow-2xl bg-white w-full max-w-[800px] min-h-[1100px] p-8 sm:p-16 space-y-8 text-slate-800 animate-in fade-in zoom-in-95 duration-300">
              <div className="text-center space-y-4 border-b-4 border-primary pb-8">
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                    <Building2 className="w-10 h-10 text-primary" />
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter leading-tight">
                  Federal Democratic Republic of Ethiopia
                </h1>
                <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wide text-muted-foreground">
                  {submittedByOrganization}
                </h2>
              </div>

              <div className="py-8 sm:py-12 text-center space-y-6">
                <h3 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight uppercase">
                  {note.title}
                </h3>
                <div className="flex justify-center gap-8 py-4">
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">
                      Serial Number
                    </p>
                    <p className="text-sm font-mono font-bold">{conceptId}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">
                      Version
                    </p>
                    <p className="text-sm font-mono font-bold">{currentVersion}</p>
                  </div>
                </div>
                <div className="inline-block px-6 py-2 border-2 border-slate-900 font-black text-lg">
                  OFFICIAL CONCEPT DOCUMENT
                </div>
              </div>

              <div className="space-y-6 text-justify">
                <p className="font-bold text-lg border-l-4 border-primary pl-4 uppercase tracking-wide">
                  1. Executive Summary
                </p>
                <p className="leading-relaxed text-sm sm:text-base">
                  {executiveSummary}
                </p>
              </div>

              <div className="pt-24 mt-auto">
                <div className="flex justify-between items-end border-t pt-8">
                  <div className="space-y-4">
                    <div className="h-12 w-48 bg-slate-100 rounded-sm border-b-2 border-slate-300 italic flex items-center justify-center text-slate-400 text-xs">
                      Electronic Signature Verified
                    </div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">
                      Authorized PSR Officer
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-xs font-bold uppercase">Registry Timestamp</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {new Date(submittedAt).toLocaleString()} UTC
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-3 border-t bg-muted/5 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewingFile(null)}
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (viewingFile) {
                  const link = document.createElement("a");
                  link.href = viewingFile.url;
                  link.download = viewingFile.name;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
