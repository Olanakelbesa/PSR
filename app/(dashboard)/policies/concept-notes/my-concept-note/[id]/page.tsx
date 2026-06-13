"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Send,
  Calendar,
  Download,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

import { PdfViewerDialog } from "@/components/shared";
import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConceptNoteTabs } from "@/components/policies/concept-notes/concept-note-tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/hooks";
import { useConceptNoteDetail, useSubmitConceptNote } from "@/lib/queries/concept-notes";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
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
  const statusKey = String(currentStatus).toLowerCase().replace(/[\s-]+/g, "_");
  const submittedAt =
    note.submittedBy?.submittedAt ??
    note.versions?.[0]?.createdAt ??
    new Date().toISOString();
  const lastUpdated = note.submittedBy?.lastUpdated ?? submittedAt;
  const executiveSummary = note.overview?.executiveSummary ?? "";
  const submittedByName = note.submittedBy?.fullName ?? "Unknown";
  const submittedByImage = resolveFileUrl(note.submittedBy?.photoUrl) ?? "";
  const submittedByOrganization = note.organization?.name ?? "Unknown Organization";
  const isDraft = String(currentStatus).toLowerCase() === "draft";
  const isRevisionRequired = statusKey === "revision_required";

  return (
    <PageContainer
      title={note.title || "Untitled Concept Note"}
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
              <Link href={`/policies/concept-notes/my-concept-note/edit/${note.id}`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
          {isRevisionRequired && (
            <Button
              asChild
              className="shadow-sm bg-amber-600 hover:bg-amber-700"
            >
              <Link href={`/policies/concept-notes/my-concept-note/edit/${note.id}`}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Resubmit Concept Note
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
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">Organization</span>
                <span className="text-sm font-medium text-right">
                  {note.organization?.name ?? "Unknown"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">Unit</span>
                <span className="text-sm font-medium text-right">
                  {note.unit?.name ?? "Unknown"}
                </span>
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
                  <Link href={`/policies/concept-notes/my-concept-note/edit/${note.id}`}>
                    <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
                    Edit Concept
                  </Link>
                </Button>
              )}
              {isRevisionRequired && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-9 text-sm"
                  asChild
                >
                  <Link href={`/policies/concept-notes/my-concept-note/edit/${note.id}`}>
                    <RefreshCw className="mr-2 h-4 w-4 text-muted-foreground" />
                    Resubmit Proposal
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

      <PdfViewerDialog
        isOpen={!!viewingFile}
        onOpenChange={(open) => !open && setViewingFile(null)}
        url={viewingFile?.url || ""}
        title={viewingFile?.name || note.title}
      />
    </PageContainer>
  );
}
