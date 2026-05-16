"use client";

import { useState, useEffect } from "react";
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

const MOCK_POLICY = {
  id: "RP-001",
  serialNumber: "ET_MoE_EDU_001",
  versionCode: "ET_MoE_EDU_001_v1",
  title: "Education Sector Development Programme VI (ESDP VI)",
  type: "Strategy",
  organization: "Ministry of Education",
  approvalDate: "2025-03-15",
  effectiveDate: "2025-04-01",
  nextReviewDate: "2027-04-01",
  operationalPeriod: "2 years",
  publishStatus: true,
  accessLevel: "public",
  downloads: 324,
  views: 1450,
  description:
    "The Education Sector Development Programme VI (ESDP VI) provides a comprehensive strategic framework for improving access, equity, quality, and relevance of education at all levels in Ethiopia from 2025 to 2030.",
  thematicAreas: ["Basic Education", "Quality Assurance", "Teacher Development", "Digital Learning"],
  sourceDraft: "PDD-2024-0081",
  // Map fields for generic Tabs component
  executiveSummary: "The Education Sector Development Programme VI (ESDP VI) provides a comprehensive strategic framework for improving access, equity, quality, and relevance of education at all levels in Ethiopia from 2025 to 2030.",
  versionHistory: [
    { 
      version: "v1.0.0", 
      date: "2025-03-15T10:00:00Z", 
      author: { firstName: "PSR", lastName: "System" }, 
      description: "Initial registration after PSR ratification.", 
      status: "current",
      size: "5.2 MB"
    }
  ],
  timeline: [
    { date: "2024-06-01", label: "Concept Note Submitted", status: "done" },
    { date: "2024-07-15", label: "Expert Review Completed", status: "done" },
    { date: "2024-08-02", label: "PSR Approved Concept Note", status: "done" },
    { date: "2024-10-10", label: "Policy Draft Submitted", status: "done" },
    { date: "2024-11-25", label: "Checklist Review Completed (Score: 91%)", status: "done" },
    { date: "2025-01-14", label: "PSR Ratified Draft", status: "done" },
    { date: "2025-03-15", label: "Registered in Repository", status: "done" },
    { date: "2025-04-01", label: "Published — Effective Date", status: "done" },
    { date: "2027-04-01", label: "Scheduled Review", status: "upcoming" },
  ]
};

const ACCESS_CONFIG: Record<string, { icon: typeof Globe; label: string; className: string }> = {
  public: { icon: Globe, label: "Public", className: "bg-green-100 text-green-700 border-green-200" },
  internal: { icon: Shield, label: "Internal", className: "bg-blue-100 text-blue-700 border-blue-200" },
  restricted: { icon: Lock, label: "Restricted", className: "bg-red-100 text-red-700 border-red-200" },
};

export default function RepositoryDetailPage() {
  const params = useParams();
  const accessCfg = ACCESS_CONFIG[MOCK_POLICY.accessLevel];
  const AccessIcon = accessCfg.icon;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

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

  return (
    <PageContainer
      title={MOCK_POLICY.title}
      description={`${MOCK_POLICY.serialNumber} · ${MOCK_POLICY.type} · ${MOCK_POLICY.organization}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/policies/repository">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Repository
            </Link>
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary/90">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <DraftTabs draft={MOCK_POLICY} mode="repository" />
        </div>

        <aside className="space-y-6 text-sm">
          <Card className="shadow-sm border-primary/20">
            <CardHeader className="pb-3 border-b bg-primary/5">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">Publication Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge className={cn(
                  "text-[10px] uppercase font-bold",
                  MOCK_POLICY.publishStatus
                    ? "bg-green-100 text-green-700 border-green-200"
                    : "bg-amber-100 text-amber-700 border-amber-200"
                )}>
                  {MOCK_POLICY.publishStatus ? "Published" : "Unpublished"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Access Level</span>
                <Badge variant="outline" className={cn("text-[10px] uppercase font-bold flex items-center gap-1", accessCfg.className)}>
                  <AccessIcon className="h-3 w-3" />
                  {accessCfg.label}
                </Badge>
              </div>
              <Separator />
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between"><span>Effective</span><span className="font-medium text-foreground">{MOCK_POLICY.effectiveDate}</span></div>
                <div className="flex justify-between"><span>Next Review</span><span className="font-medium text-amber-600">{MOCK_POLICY.nextReviewDate}</span></div>
                <div className="flex justify-between"><span>Period</span><span className="font-medium text-foreground">{MOCK_POLICY.operationalPeriod}</span></div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/10">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <CardTitle className="text-sm font-semibold">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2">
              {[
                { href: `/policies/drafts/${MOCK_POLICY.sourceDraft}`, label: "Source Draft", icon: ExternalLink },
                { href: "#", label: "Download Document", icon: Download },
                { href: "#", label: "Share Link", icon: ExternalLink },
              ].map((link, idx) => (
                <Button key={idx} variant="ghost" size="sm" className="w-full justify-start h-9 text-sm" asChild>
                  <Link href={link.href}>
                    <link.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {link.label}
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
