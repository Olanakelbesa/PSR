"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  Building2,
  Calendar,
  Check,
  Download,
  FileCode2,
  FileText,
  Globe,
  Tag,
  TrendingUp,
  User,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFinalSubmission } from "@/hooks";
import { cn } from "@/lib/utils";

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function resolveFileUrl(filePath?: string | null) {
  if (!filePath) return null;
  if (/^https?:\/\//i.test(filePath)) return filePath;
  if (filePath.startsWith("/api/proxy")) return filePath;
  if (filePath.startsWith("/")) return `/api/proxy${filePath}`;
  return `/api/proxy/${filePath}`;
}

function fileNameFromPath(filePath?: string | null) {
  if (!filePath) return "No file attached";
  return filePath.split("/").pop() || filePath;
}

function LoadingState() {
  return (
    <PageContainer
      title="Research Repository"
      description="Loading final submission..."
    >
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-72 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-56 rounded-3xl" />
          <Skeleton className="h-52 rounded-3xl" />
        </div>
      </div>
    </PageContainer>
  );
}

function NotFoundState() {
  return (
    <PageContainer title="Research Not Found">
      <div className="py-16 text-center">
        <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <h3 className="text-base font-bold text-foreground">
          Final submission not found
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          The requested record does not exist or has been archived.
        </p>
        <Button asChild className="mt-6">
          <Link href="/research/repository">Back to Repository</Link>
        </Button>
      </div>
    </PageContainer>
  );
}

export default function ResearchRepositoryDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const { data: item, isLoading } = useFinalSubmission(id);

  if (isLoading) {
    return <LoadingState />;
  }

  if (!item) {
    return <NotFoundState />;
  }

  const reportUrl = resolveFileUrl(item.full_report);
  const statusTone =
    item.status === "approved"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : item.status === "rejected"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <PageContainer
      title={item.title}
      description={`Final submission reference: ${item.ndmc_submission_reference || `FS-${item.id}`}`}
      actions={
        <Button asChild variant="outline" className="bg-white shadow-sm">
          <Link href="/research/repository">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Archive
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 rounded-3xl border border-muted-foreground/10 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <BadgeCheck className="h-4 w-4 text-emerald-600" />
            PSR Verified Record
          </div>
          <Badge
            className={cn(
              "border text-[10px] font-bold uppercase tracking-wide shadow-none",
              statusTone,
            )}
          >
            {item.status.replace(/_/g, " ")}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="overflow-hidden rounded-[1.5rem] border border-muted-foreground/10 bg-white shadow-sm">
              <CardContent className="space-y-6 p-6 md:p-8">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                  <Tag className="h-3.5 w-3.5" />
                  Final Submission Overview
                </div>

                <h1 className="text-xl font-bold leading-snug text-slate-900 md:text-2xl">
                  {item.title}
                </h1>

                <div className="flex flex-col gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-8">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/5 text-primary font-bold text-sm">
                      {item.submitted_by_name?.split(" ").pop()?.[0] || (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-muted-foreground">
                        Submitted by
                      </span>
                      <span className="mt-0.5 block text-xs font-bold text-slate-900">
                        {item.submitted_by_name || "PSR user"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-muted-foreground">
                        Funding Proposal
                      </span>
                      <span className="mt-0.5 block text-xs font-semibold text-slate-900">
                        #{item.fundedproposal}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-muted-foreground">
                        Submission Date
                      </span>
                      <span className="mt-0.5 block text-xs font-semibold text-slate-900">
                        {formatDate(item.submission_date)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-[1.5rem] border border-muted-foreground/10 bg-white shadow-sm">
              <CardHeader className="border-b p-6 md:p-8">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                  <FileText className="h-5 w-5 text-primary" />
                  Submission Narrative
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6 md:p-8">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Abstract
                  </h4>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                    {item.abstract || "No abstract provided."}
                  </p>
                </div>

                <div className="space-y-2 border-t pt-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Executive Summary
                  </h4>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                    {item.executive_summary || "No executive summary provided."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-[1.5rem] border border-emerald-200/50 bg-emerald-50/[0.15] shadow-sm">
              <CardContent className="flex items-start gap-4 p-6 md:p-8">
                <div className="shrink-0 rounded-2xl bg-emerald-100 p-3 text-emerald-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold uppercase tracking-tight text-emerald-800">
                    Data Sharing
                  </h4>
                  <p className="text-xs font-medium leading-relaxed text-emerald-700/90">
                    {item.data_sharing_checklist_completed
                      ? "Data sharing checklist completed for this submission."
                      : "Data sharing checklist not marked as completed."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="overflow-hidden rounded-[1.5rem] border border-muted-foreground/10 bg-white shadow-sm">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Submission Specs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Version
                  </span>
                  <Badge
                    variant="secondary"
                    className="bg-slate-100 text-slate-700 font-semibold text-[10px] px-2.5"
                  >
                    {item.version ?? 1}
                  </Badge>
                </div>

                <div className="flex items-center justify-between py-1 border-t border-slate-50">
                  <span className="text-xs font-medium text-muted-foreground">
                    Output Type
                  </span>
                  <Badge
                    variant="secondary"
                    className="bg-slate-100 text-slate-700 font-semibold text-[10px] px-2.5"
                  >
                    #{item.output_type}
                  </Badge>
                </div>

                <div className="flex items-center justify-between py-1 border-t border-slate-50">
                  <span className="text-xs font-medium text-muted-foreground">
                    Data Center
                  </span>
                  <Badge
                    variant="secondary"
                    className="bg-slate-100 text-slate-700 font-semibold text-[10px] px-2.5"
                  >
                    {item.data_center ? `#${item.data_center}` : "Not set"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between py-1 border-t border-slate-50">
                  <span className="text-xs font-medium text-muted-foreground">
                    Checklist
                  </span>
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                    <Check className="h-4 w-4 shrink-0" />
                    {item.data_sharing_checklist_completed
                      ? "Completed"
                      : "Incomplete"}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-[1.5rem] border border-muted-foreground/10 bg-white shadow-sm">
              <CardHeader className="border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  <FileCode2 className="h-4 w-4 text-primary" />
                  Reference Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                {item.doi ? (
                  <a
                    href={item.doi}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-2xl border p-3 transition-colors hover:bg-slate-50/70"
                  >
                    <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900">DOI</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {item.doi}
                      </p>
                    </div>
                  </a>
                ) : null}

                {item.external_link ? (
                  <a
                    href={item.external_link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-2xl border p-3 transition-colors hover:bg-slate-50/70"
                  >
                    <div className="rounded-lg bg-slate-100 p-2.5 text-slate-600">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900">
                        External Link
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {item.external_link}
                      </p>
                    </div>
                  </a>
                ) : null}
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-[1.5rem] border border-muted-foreground/10 bg-white shadow-md">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Document Access
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                {[
                  { label: "Full Report", file: item.full_report },
                  { label: "Policy Brief", file: item.policy_brief },
                  {
                    label: "Supplementary Document",
                    file: item.supplementary_document,
                  },
                ].map((entry) => {
                  const fileUrl = resolveFileUrl(entry.file);

                  return (
                    <div
                      key={entry.label}
                      className="flex items-center gap-3 rounded-2xl border p-3 hover:bg-slate-50/70"
                    >
                      <div className="shrink-0 rounded-lg bg-primary/10 p-2.5 text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900">
                          {entry.label}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {fileNameFromPath(entry.file)}
                        </p>
                      </div>
                      {fileUrl ? (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                        >
                          <a href={fileUrl} target="_blank" rel="noreferrer">
                            Open
                          </a>
                        </Button>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-600"
                        >
                          Missing
                        </Badge>
                      )}
                    </div>
                  );
                })}

                <Button
                  asChild
                  className="h-11 w-full bg-primary text-xs font-bold uppercase tracking-wider text-white hover:bg-primary/95"
                >
                  <a href={reportUrl ?? "#"} target="_blank" rel="noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Download Full Report
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
