"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTerminalReport } from "@/hooks/useProgressReports";
import { TerminalReportEvaluationForm } from "@/components/features/terminal-report/TerminalReportEvaluationForm";

export default function TerminalReportEvaluationPage() {
  const params = useParams();
  const router = useRouter();

  const reportId = useMemo(() => {
    const raw = params?.id;
    return typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : undefined;
  }, [params]);

  const { data: report, isLoading } = useTerminalReport(reportId);

  // ── Loading state ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageContainer title="Loading evaluation workbench...">
        <div className="space-y-6">
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
            <div className="lg:col-span-5 space-y-4">
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  // ── Report Not Found ────────────────────────────────────────────────────
  if (!report) {
    return (
      <PageContainer title="Report Not Found">
        <Card className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <h3 className="font-bold text-amber-900 dark:text-amber-200">Terminal Report Unavailable</h3>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                This terminal report does not exist or you do not have permission to view it.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => router.push("/research/final-report/final-report-approval")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Approval Queue
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Terminal Report Reviewer Evaluation"
      description="Inspect submitted deliverable files, assign per-item dynamic grades, and submit committee closeout decisions."
    >
      <TerminalReportEvaluationForm
        terminalReport={report}
        onSuccess={() =>
          router.push(`/research/final-report/final-report-approval/${report.id}`)
        }
        onCancel={() =>
          router.push(`/research/final-report/final-report-approval/${report.id}`)
        }
      />
    </PageContainer>
  );
}
