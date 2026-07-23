"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  RefreshCcw,
  Upload,
  User as UserIcon,
  AlertCircle,
  Paperclip,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PdfViewer, PdfViewerDialog, WordViewer } from "@/components/shared";
import { protocolService, getProposalById } from "@/api/services";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { getConceptNoteAttachmentKind } from "@/lib/utils/concept-note-attachments";
import type { ProtocolRecord } from "@/types/protocol";
import type { Proposal } from "@/types/proposal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function formatDate(dateString?: string) {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

function FilePicker({
  id,
  label,
  accept,
  file,
  onChange,
  error,
  required,
}: {
  id: string;
  label: string;
  accept?: string;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-semibold">
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </Label>
      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-4 transition-colors hover:bg-muted/40",
          error && "border-rose-500 bg-rose-50/20",
        )}
      >
        {file ? (
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-hidden">
              <FileText className="h-5 w-5 shrink-0 text-primary" />
              <span className="truncate text-sm font-medium">{file.name}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(null)}
              className="text-xs text-rose-600 hover:text-rose-700"
            >
              Remove
            </Button>
          </div>
        ) : (
          <label
            htmlFor={id}
            className="flex cursor-pointer flex-col items-center gap-1.5 py-2 text-center"
          >
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Choose file</span>
            <span className="text-xs text-muted-foreground">
              PDF, DOC, DOCX, or XLSX
            </span>
          </label>
        )}
        <Input
          id={id}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => {
            const nextFile = event.target.files?.[0] ?? null;
            onChange(nextFile);
            event.target.value = "";
          }}
        />
      </div>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

function EmbeddedViewer({ url, title }: { url: string; title: string }) {
  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
        <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium text-muted-foreground">No document attached</p>
      </div>
    );
  }

  const kind = getConceptNoteAttachmentKind(url);

  if (kind === "pdf") {
    return (
      <div className="overflow-hidden rounded-xl border border-primary/20 shadow-sm">
        <PdfViewer url={url} title={title} className="h-[750px]" />
      </div>
    );
  }

  if (kind === "word") {
    return (
      <div className="overflow-hidden rounded-xl border border-primary/20 bg-[#ededed] shadow-sm">
        <WordViewer url={url} title={title} className="h-[750px]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-muted/10 p-16 text-center">
      <FileText className="h-12 w-12 text-primary" />
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">
          This document type cannot be embedded inline.
        </p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
      >
        <ExternalLink className="h-4 w-4" />
        Open Document in New Tab
      </a>
    </div>
  );
}

export default function ProtocolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const protocolId = Number(params?.id);

  const [protocol, setProtocol] = useState<ProtocolRecord | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Update modal state
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [protocolFile, setProtocolFile] = useState<File | null>(null);
  const [otherDocument, setOtherDocument] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal dialog preview state
  const [dialogDoc, setDialogDoc] = useState<{ url: string; title: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!protocolId || Number.isNaN(protocolId)) {
      setIsError(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);

    try {
      const record = await protocolService.getById(protocolId);
      setProtocol(record);

      if (record.proposal) {
        try {
          const propDetail = await getProposalById(String(record.proposal));
          setProposal(propDetail);
        } catch {
          // Ignore proposal detail load error — basic info comes with protocol record
        }
      }
    } catch (err) {
      console.error("Failed to load protocol detail:", err);
      setIsError(true);
      toast.error("Failed to load protocol submission");
    } finally {
      setIsLoading(false);
    }
  }, [protocolId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateSubmit = async () => {
    if (!protocol) return;

    if (!protocolFile && !otherDocument) {
      setFormError("Please select at least one file to update.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const updated = await protocolService.update(protocol.id, {
        protocol_file: protocolFile ?? undefined,
        other_document: otherDocument ?? undefined,
      });

      setProtocol(updated);
      toast.success("Protocol files updated successfully!");
      setIsUpdateModalOpen(false);
      setProtocolFile(null);
      setOtherDocument(null);
    } catch (err) {
      console.error("Failed to update protocol:", err);
      toast.error("Failed to update protocol files.");
      setFormError("Failed to update files. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const protocolUrl = resolveFileUrl(protocol?.protocolFile || protocol?.protocol_file);
  const otherUrl = resolveFileUrl(protocol?.otherDocument || protocol?.other_document);

  const displayRef =
    protocol?.referenceNumber ||
    protocol?.reference_number ||
    proposal?.referenceNumber ||
    `#${protocol?.proposal ?? protocolId}`;

  const displayTitle =
    protocol?.proposalTitle ||
    protocol?.proposal_title ||
    proposal?.title ||
    "Protocol Submission";

  if (isLoading) {
    return (
      <PageContainer
        title="Protocol Details"
        description="Loading protocol submission..."
      >
        <div className="space-y-6">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <div className="grid gap-6 sm:grid-cols-3">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <Skeleton className="h-[600px] rounded-xl" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !protocol) {
    return (
      <PageContainer
        title="Protocol Details"
        description="Protocol record not found"
      >
        <Card className="border-rose-200 bg-rose-50/40">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <AlertCircle className="h-10 w-10 text-rose-500" />
            <div>
              <p className="text-lg font-semibold">Protocol record unavailable</p>
              <p className="text-sm text-muted-foreground">
                The requested protocol submission could not be loaded.
              </p>
            </div>
            <Button onClick={() => router.push("/research/protocol")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Protocols
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={displayRef}
      description={`Protocol submission for proposal "${displayTitle}"`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/research/protocol")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            variant="outline"
            asChild
          >
            <Link href={`/research/proposals/my-proposals/${protocol.proposal}`}>
              <Eye className="mr-2 h-4 w-4" />
              View Proposal Details
            </Link>
          </Button>
          <Button onClick={() => setIsUpdateModalOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Update Protocol Files
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Summary Info Cards */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          {/* Proposal Info */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wider font-semibold">
                Associated Proposal
              </CardDescription>
              <CardTitle className="text-base font-bold line-clamp-1">
                {displayTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ref #:</span>
                <span className="font-semibold text-primary">{displayRef}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Stage:</span>
                <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700">
                  Protocol Stage
                </Badge>
              </div>
              <div className="pt-1">
                <Link
                  href={`/research/proposals/my-proposals/${protocol.proposal}`}
                  className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                >
                  Go to proposal page
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Protocol File Summary */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wider font-semibold">
                Protocol File
              </CardDescription>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                {protocolUrl ? "Protocol Attached" : "No File"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Uploaded:</span>
                <span>{formatDate(protocol.createdAt || protocol.created_at)}</span>
              </div>
              {protocolUrl ? (
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() =>
                      setDialogDoc({
                        url: protocolUrl,
                        title: `${displayRef} — Protocol File`,
                      })
                    }
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    Full Screen
                  </Button>
                  <a
                    href={protocolUrl}
                    download
                    className="inline-flex h-8 items-center justify-center rounded-md border bg-background px-3 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Download
                  </a>
                </div>
              ) : (
                <p className="text-muted-foreground">No protocol file uploaded yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Other Document Summary */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wider font-semibold">
                Other Document
              </CardDescription>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-blue-600" />
                {otherUrl ? "Supporting Doc Attached" : "None Attached"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Uploaded By:</span>
                <span>{protocol.uploadedByName || protocol.uploaded_by_name || "—"}</span>
              </div>
              {otherUrl ? (
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() =>
                      setDialogDoc({
                        url: otherUrl,
                        title: `${displayRef} — Other Document`,
                      })
                    }
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    Full Screen
                  </Button>
                  <a
                    href={otherUrl}
                    download
                    className="inline-flex h-8 items-center justify-center rounded-md border bg-background px-3 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Download
                  </a>
                </div>
              ) : (
                <p className="text-muted-foreground">No additional document attached.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Embedded Viewer Tabs */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b bg-muted/20 py-4">
            <CardTitle className="text-lg font-bold">Document Preview</CardTitle>
            <CardDescription>
              Preview attached protocol files directly in the browser.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {protocolUrl && otherUrl ? (
              <Tabs defaultValue="protocol" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="protocol" className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Protocol File
                  </TabsTrigger>
                  <TabsTrigger value="other" className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-blue-600" />
                    Other Document
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="protocol">
                  <EmbeddedViewer
                    url={protocolUrl}
                    title={`${displayRef} — Protocol File`}
                  />
                </TabsContent>
                <TabsContent value="other">
                  <EmbeddedViewer
                    url={otherUrl}
                    title={`${displayRef} — Other Document`}
                  />
                </TabsContent>
              </Tabs>
            ) : protocolUrl ? (
              <EmbeddedViewer
                url={protocolUrl}
                title={`${displayRef} — Protocol File`}
              />
            ) : otherUrl ? (
              <EmbeddedViewer
                url={otherUrl}
                title={`${displayRef} — Other Document`}
              />
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
                <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="font-medium text-muted-foreground">No documents attached</p>
                <Button
                  className="mt-4"
                  onClick={() => setIsUpdateModalOpen(true)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Protocol Files
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Update Files Dialog */}
      <Dialog
        open={isUpdateModalOpen}
        onOpenChange={(open) => {
          setIsUpdateModalOpen(open);
          if (!open) {
            setProtocolFile(null);
            setOtherDocument(null);
            setFormError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              Update Protocol Files
            </DialogTitle>
            <DialogDescription>
              Replace the attached protocol file or supporting document for proposal{" "}
              <span className="font-semibold text-foreground">{displayRef}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <FilePicker
              id="detail-protocol-file"
              label="Replace Protocol File"
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              file={protocolFile}
              onChange={setProtocolFile}
            />

            <FilePicker
              id="detail-other-document"
              label="Replace Other Document"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
              file={otherDocument}
              onChange={setOtherDocument}
            />

            {formError ? (
              <p className="text-xs font-semibold text-rose-600">{formError}</p>
            ) : null}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsUpdateModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Update Protocol
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full screen preview dialog */}
      <PdfViewerDialog
        isOpen={!!dialogDoc}
        onOpenChange={(open) => !open && setDialogDoc(null)}
        url={dialogDoc?.url ?? ""}
        title={dialogDoc?.title ?? "Document Preview"}
      />
    </PageContainer>
  );
}
