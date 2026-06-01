"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Globe,
  Lock,
  Shield,
  Download,
  ExternalLink,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageContainer } from "@/components/layout";
import { cn } from "@/lib/utils";
import { extractFileName } from "@/lib/utils/resolve-file-url";

import { DraftTabs } from "@/components/policies/drafts/draft-tabs";
import {
  mapPolicyRepositoryDetail,
  usePolicyRepositoryDetail,
} from "@/lib/queries/policy-repository";

const ACCESS_CONFIG: Record<
  string,
  { icon: typeof Globe; label: string; className: string }
> = {
  public: {
    icon: Globe,
    label: "Public",
    className:
      "bg-green-100 text-green-700 border-green-200 hover:bg-green-100",
  },
  internal: {
    icon: Shield,
    label: "Internal",
    className: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
  },
  restricted: {
    icon: Lock,
    label: "Restricted",
    className: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100",
  },
};

function formatDisplayDate(value?: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function RepositoryDetailPage() {
  const params = useParams();
  const policyId = (params as { id?: string })?.id;

  const {
    data: detailResponse,
    isLoading,
    isError,
    error,
  } = usePolicyRepositoryDetail(policyId ?? "");

  const policy = useMemo(() => {
    if (!detailResponse?.data) return null;
    return mapPolicyRepositoryDetail(detailResponse.data, extractFileName);
  }, [detailResponse]);

  if (isLoading) {
    return (
      <PageContainer title="Loading policy details…">
        <div className="space-y-6">
          <div className="h-48 animate-pulse rounded-xl bg-muted" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 h-96 animate-pulse rounded-xl bg-muted" />
            <div className="h-96 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (isError || !policy) {
    return (
      <PageContainer title="Policy not found">
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Lock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="text-lg font-bold">Document not accessible</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {(error as Error)?.message ??
              "This policy does not exist or you do not have permission to view it."}
          </p>
          <Button variant="outline" size="sm" asChild className="mt-4">
            <Link href="/policies/repository">Back to registry</Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  const accessCfg =
    ACCESS_CONFIG[policy.accessLevel] ?? ACCESS_CONFIG.public;
  const AccessIcon = accessCfg.icon;
  const downloadUrl = policy.draftFile || policy.documentUrl;

  return (
    <PageContainer
      title={policy.title}
      description={`${policy.serialNumber || policy.versionCode} · ${policy.type}`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-primary/20 shadow-sm hover:bg-primary/5"
          >
            <Link href="/policies/repository">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Repository
            </Link>
          </Button>
          {downloadUrl && (
            <Button
              size="sm"
              className="bg-primary text-white shadow-sm hover:bg-primary/90"
              asChild
            >
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Download
              </a>
            </Button>
          )}
        </div>
      }
    >
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <DraftTabs draft={policy} mode="repository" />
        </div>

        <aside className="space-y-6 text-sm lg:sticky lg:top-20">
          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="border-b bg-primary/5 pb-3 text-left">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">
                Publication status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-muted-foreground">
                  Status
                </span>
                <Badge
                  className={cn(
                    "text-[10px] font-bold uppercase",
                    policy.publishStatus
                      ? "border-green-200 bg-green-100 text-green-700 hover:bg-green-100"
                      : "border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-100",
                  )}
                >
                  {policy.publishStatusLabel}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-muted-foreground">
                  Access level
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "flex items-center gap-1 text-[10px] font-bold uppercase",
                    accessCfg.className,
                  )}
                >
                  <AccessIcon className="h-3 w-3" />
                  {policy.accessLevelLabel}
                </Badge>
              </div>
              <Separator />
              <div className="space-y-2 text-xs font-medium text-muted-foreground">
                <div className="flex justify-between">
                  <span>Effective</span>
                  <span className="font-semibold text-foreground">
                    {formatDisplayDate(policy.effectiveDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Next review</span>
                  <span className="font-semibold text-amber-600">
                    {formatDisplayDate(policy.nextReviewDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Period</span>
                  <span className="font-semibold text-foreground">
                    {policy.operationalPeriod || "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 shadow-sm">
            <CardHeader className="border-b bg-muted/30 pb-3 text-left">
              <CardTitle className="text-sm font-semibold">
                Quick actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-3">
              {downloadUrl ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-full justify-start text-sm"
                  asChild
                >
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="mr-2 h-4 w-4 text-muted-foreground" />
                    Download document
                  </a>
                </Button>
              ) : (
                <p className="px-2 py-1 text-xs text-muted-foreground">
                  No document file attached.
                </p>
              )}
              {policy.sourceDraft && (
                <div className="flex items-start gap-2 px-2 py-1 text-xs text-muted-foreground">
                  <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Source draft:{" "}
                    <span className="font-medium text-foreground">
                      {policy.sourceDraft}
                    </span>
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
