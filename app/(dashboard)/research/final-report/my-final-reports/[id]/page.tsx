"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FileText,
  Paperclip,
  Activity,
  Briefcase,
  User,
  Hash,
  AlertCircle,
  Wallet,
  Building,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useProgressReport } from "@/hooks";

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatCurrency(value?: string | number | null) {
  const amount = Number(value ?? 0);
  return `ETB ${Number.isFinite(amount) ? amount.toLocaleString() : "0"}`;
}

export default function MyFinalReportDetailPage() {
  const params = useParams();
  const router = useRouter();

  const routeId = params.id;
  const reportId = Array.isArray(routeId) ? routeId[0] : routeId;

  const { data: report, isLoading, isError, refetch } = useProgressReport(reportId);

  if (isLoading) {
    return (
      <PageContainer title="Loading Details...">
        <div className="space-y-6">
          <Skeleton className="h-[120px] w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !report) {
    return (
      <PageContainer title="Error Loading Details">
        <Card className="border-rose-200 bg-rose-50/40 shadow-sm max-w-2xl mx-auto my-12">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-14 text-center">
            <div className="rounded-full bg-rose-100 p-4 text-rose-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold">Unable to load progress report details.</p>
              <p className="text-sm text-muted-foreground">
                The record could not be retrieved. It may have been deleted or you lack permission.
              </p>
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => router.push("/research/final-report/my-final-reports")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to List
              </Button>
              <Button onClick={() => void refetch()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Progress Report Detail"
      description={`Record ID: PR-${report.id}`}
      actions={
        <Button
          variant="outline"
          onClick={() => router.push("/research/final-report/my-final-reports")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to List
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Header Summary Card */}
        <Card className="border border-muted-foreground/15 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
              <div className="space-y-1">
                <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 shadow-none capitalize">
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  {report.status}
                </Badge>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-snug mt-2">
                  {report.report_name || "Untitled Report"}
                </h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold shrink-0">
                <Calendar className="h-4 w-4" />
                <span>Submitted: {formatDate(report.submitted_at)}</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Info Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="shadow-sm border-muted/60">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-lg">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount Used</p>
                <h3 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
                  {formatCurrency(report.amount_used)}
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-muted/60">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Project Window</p>
                <h3 className="text-sm font-semibold tracking-tight text-slate-800 mt-1">
                  {formatDate(report.start_date)} - {formatDate(report.end_date)}
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-muted/60">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Project Tracking ID</p>
                <h3 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
                  #{report.project_tracking}
                </h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Area */}
        <div className="grid gap-6 lg:grid-cols-[1fr_340px] items-start">
          <div className="space-y-6">
            {/* Activities Card */}
            <Card className="border border-muted-foreground/15 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="flex gap-2 items-center text-base font-bold text-slate-900">
                  <FileText className="h-5 w-5 text-primary" />
                  Main Activities Achieved
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-line bg-slate-50/50 border p-4 rounded-xl">
                  {report.main_activities_achieved || "No activities described."}
                </p>
              </CardContent>
            </Card>

            {/* Attachment Card */}
            {report.attachment && (
              <Card className="border border-muted-foreground/15 shadow-sm">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="flex gap-2 items-center text-base font-bold text-slate-900">
                    <Paperclip className="h-5 w-5 text-slate-600" />
                    Attached File
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 flex items-center justify-between bg-slate-50/40 p-4 rounded-xl border m-5">
                  <div className="flex items-center gap-2 text-sm text-slate-700 font-medium truncate">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <span className="truncate">Progress Report Attachment</span>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={report.attachment} target="_blank" rel="noreferrer">
                      <Paperclip className="mr-1.5 h-3.5 w-3.5" />
                      View Document
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <Card className="border border-muted-foreground/15 shadow-sm">
              <CardHeader className="border-b bg-slate-50/80">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Project Context
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4 text-sm">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground block">Project Title</span>
                  <p className="font-bold text-slate-900 leading-snug">
                    {report.project_tracking_title || "Untitled Project"}
                  </p>
                </div>
                
                <Separator />

                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground font-medium flex items-center gap-1">
                    <Hash className="h-3.5 w-3.5" /> Project Tracking ID
                  </span>
                  <Badge variant="outline" className="font-bold border-slate-300">
                    #{report.projectTracking?.projectTrackingId ?? report.project_tracking}
                  </Badge>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground font-medium flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> Proposal ID
                  </span>
                  <Badge variant="outline" className="font-bold border-slate-300">
                    #{report.projectTracking?.proposalId ?? "-"}
                  </Badge>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground font-medium flex items-center gap-1">
                    <Building className="h-3.5 w-3.5" /> Project Status
                  </span>
                  <Badge className="bg-slate-100 text-slate-700 shadow-none border-none font-semibold text-xs capitalize">
                    {report.projectTracking?.status ?? "-"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </PageContainer>
  );
}