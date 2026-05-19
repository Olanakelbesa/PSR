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

import { DraftTabs } from "@/components/policies/drafts/draft-tabs";
import { usePolicyRepositoryDetail } from "@/lib/queries/policy-repository";

const ACCESS_CONFIG: Record<string, { icon: typeof Globe; label: string; className: string }> = {
  public: { icon: Globe, label: "Public", className: "bg-green-100 text-green-700 border-green-200 hover:bg-green-100" },
  internal: { icon: Shield, label: "Internal", className: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100" },
  restricted: { icon: Lock, label: "Restricted", className: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100" },
};

export default function RepositoryDetailPage() {
  const params = useParams();
  const policyId = (params as any)?.id;

  // Fetch registered policy details from backend
  const { data: detailResponse, isLoading } = usePolicyRepositoryDetail(policyId);
  const detailData = detailResponse?.data;

  // Map API response to UI model expected by tabs and details aside
  const policy = useMemo(() => {
    if (!detailData) return null;

    const accessLevelClean = (detailData.publicationStatus?.accessLevel || "public").toLowerCase();
    const docTypeLabel = detailData.registryMetadata?.documentType || "Policy Document";

    return {
      id: detailData.id,
      title: detailData.overview?.title || "Registered Policy",
      serialNumber: detailData.registryMetadata?.serialNumber || "",
      versionCode: detailData.registryMetadata?.versionCode || "",
      type: docTypeLabel,
      organization: detailData.registryMetadata?.organizationName || "Addis Ababa Science and Technology University",
      approvalDate: detailData.registryMetadata?.approvalDate || "",
      effectiveDate: detailData.registryMetadata?.effectiveDate || "",
      operationalPeriod: detailData.registryMetadata?.operationalPeriod || detailData.publicationStatus?.period || "",
      nextReviewDate: detailData.registryMetadata?.nextReviewDate || detailData.publicationStatus?.nextReview || "",
      publishStatus: detailData.publicationStatus?.status === "Published",
      accessLevel: accessLevelClean,
      description: detailData.overview?.policyDescription || "",
      executiveSummary: detailData.overview?.policyDescription || "",
      draftFile: detailData.overview?.draftFile || "",
      sourceDraft: detailData.registryMetadata?.sourceDraft || "",
      thematicAreas: detailData.thematicAreas?.map((t: any) => t.name) || [],
      versionHistory: [
        { 
          version: detailData.registryMetadata?.versionCode || "V1", 
          date: detailData.registryMetadata?.approvalDate || new Date().toISOString(), 
          author: { firstName: "PSR", lastName: "System" }, 
          description: "Initial registration after PSR ratification.", 
          status: "current",
          size: "Official Version"
        }
      ],
      timeline: [
        { date: detailData.registryMetadata?.approvalDate || "", label: "PSR Ratified Draft", status: "done" },
        { date: detailData.registryMetadata?.effectiveDate || "", label: "Registered in Repository", status: "done" },
        { date: detailData.registryMetadata?.nextReviewDate || "", label: "Scheduled Review", status: "upcoming" },
      ]
    };
  }, [detailData]);

  if (isLoading) {
    return (
      <PageContainer title="Loading Policy Details...">
        <div className="space-y-6">
          <div className="h-48 bg-muted animate-pulse rounded-xl" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 h-96 bg-muted animate-pulse rounded-xl" />
            <div className="h-96 bg-muted animate-pulse rounded-xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!policy) {
    return (
      <PageContainer title="Policy Not Found">
        <div className="p-12 text-center border rounded-xl border-dashed">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-bold">Document Not Accessible</h2>
          <p className="text-sm text-muted-foreground mt-1">
            This policy does not exist or you do not have permission to view it.
          </p>
          <Button variant="outline" size="sm" asChild className="mt-4">
            <Link href="/policies/repository">Back to Registry</Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  const accessCfg = ACCESS_CONFIG[policy.accessLevel] || ACCESS_CONFIG.public;
  const AccessIcon = accessCfg.icon;

  return (
    <PageContainer
      title={policy.title}
      description={`${policy.serialNumber || policy.versionCode} · ${policy.type} · ${policy.organization}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="shadow-sm border-primary/20 hover:bg-primary/5">
            <Link href="/policies/repository">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Repository
            </Link>
          </Button>
          {policy.draftFile && (
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white shadow-sm" asChild>
              <a href={policy.draftFile} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Download
              </a>
            </Button>
          )}
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] items-start">
        <div className="space-y-6">
          <DraftTabs draft={policy} mode="repository" />
        </div>

        <aside className="space-y-6 text-sm lg:sticky lg:top-20">
          <Card className="shadow-sm border-primary/20">
            <CardHeader className="pb-3 border-b bg-primary/5 text-left">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">Publication Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Status</span>
                <Badge className={cn(
                  "text-[10px] uppercase font-bold",
                  policy.publishStatus
                    ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100"
                    : "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100"
                )}>
                  {policy.publishStatus ? "Published" : "Unpublished"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Access Level</span>
                <Badge variant="outline" className={cn("text-[10px] uppercase font-bold flex items-center gap-1", accessCfg.className)}>
                  <AccessIcon className="h-3 w-3" />
                  {accessCfg.label}
                </Badge>
              </div>
              <Separator />
              <div className="space-y-2 text-xs text-muted-foreground font-medium">
                <div className="flex justify-between"><span>Effective</span><span className="font-semibold text-foreground">{policy.effectiveDate || "Pending"}</span></div>
                <div className="flex justify-between"><span>Next Review</span><span className="font-semibold text-amber-600">{policy.nextReviewDate || "Pending"}</span></div>
                <div className="flex justify-between"><span>Period</span><span className="font-semibold text-foreground">{policy.operationalPeriod || "Not Specified"}</span></div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/10">
            <CardHeader className="pb-3 border-b bg-muted/30 text-left">
              <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2">
              {policy.draftFile && (
                <Button variant="ghost" size="sm" className="w-full justify-start h-9 text-sm" asChild>
                  <a href={policy.draftFile} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4 text-muted-foreground" />
                    Download Document
                  </a>
                </Button>
              )}
              {policy.sourceDraft && (
                <Button variant="ghost" size="sm" className="w-full justify-start h-9 text-sm text-left" disabled>
                  <span className="flex items-center">
                    <ExternalLink className="mr-2 h-4 w-4 text-muted-foreground" />
                    Source: {policy.sourceDraft}
                  </span>
                </Button>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
