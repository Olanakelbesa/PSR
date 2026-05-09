"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Globe,
  Lock,
  Shield,
  Download,
  Eye,
  Calendar,
  Clock,
  History,
  GitBranch,
  Building2,
  Tag,
  CheckCircle2,
  ExternalLink,
  File,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Printer,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer } from "@/components/layout";
import { cn } from "@/lib/utils";

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
};

const TIMELINE = [
  { date: "2024-06-01", label: "Concept Note Submitted", status: "done" },
  { date: "2024-07-15", label: "Expert Review Completed", status: "done" },
  { date: "2024-08-02", label: "PSR Approved Concept Note", status: "done" },
  { date: "2024-10-10", label: "Policy Draft Submitted", status: "done" },
  { date: "2024-11-25", label: "Checklist Review Completed (Score: 91%)", status: "done" },
  { date: "2025-01-14", label: "PSR Ratified Draft", status: "done" },
  { date: "2025-03-15", label: "Registered in Repository", status: "done" },
  { date: "2025-04-01", label: "Published — Effective Date", status: "done" },
  { date: "2027-04-01", label: "Scheduled Review", status: "upcoming" },
];

const VERSION_HISTORY = [
  { version: "v1", date: "2025-03-15", author: "PSR System", changes: "Initial registration after PSR ratification.", current: true },
];

const ACCESS_CONFIG: Record<string, { icon: typeof Globe; label: string; className: string }> = {
  public: { icon: Globe, label: "Public", className: "bg-green-100 text-green-700 border-green-200" },
  internal: { icon: Shield, label: "Internal", className: "bg-blue-100 text-blue-700 border-blue-200" },
  restricted: { icon: Lock, label: "Restricted", className: "bg-red-100 text-red-700 border-red-200" },
};

export default function RepositoryDetailPage() {
  const params = useParams();
  const accessCfg = ACCESS_CONFIG[MOCK_POLICY.accessLevel];
  const AccessIcon = accessCfg.icon;

  return (
    <PageContainer
      title={MOCK_POLICY.title}
      description={`${MOCK_POLICY.serialNumber} · ${MOCK_POLICY.type} · ${MOCK_POLICY.organization}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/policies/repository">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Repository
            </Link>
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* Main content */}
        <div className="space-y-6">
          <Tabs defaultValue="overview">
            <TabsList className="h-10 w-full justify-start border-b bg-transparent rounded-none p-0 gap-0">
              {[
                { value: "overview", label: "Overview", icon: FileText },
                { value: "document", label: "Document", icon: File },
                { value: "timeline", label: "Timeline", icon: Clock },
                { value: "versions", label: "Versions", icon: GitBranch },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent"
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="mt-6 space-y-5">
              <Card className="shadow-sm border-primary/10">
                <CardHeader className="border-b bg-muted/30 pb-4">
                  <CardTitle className="text-base">Policy Description</CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <p className="text-sm leading-relaxed text-muted-foreground">{MOCK_POLICY.description}</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-primary/10">
                <CardHeader className="border-b bg-muted/30 pb-4">
                  <CardTitle className="text-base">Registry Metadata</CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <dl className="grid gap-4 sm:grid-cols-2">
                    {[
                      { label: "Serial Number", value: MOCK_POLICY.serialNumber },
                      { label: "Version Code", value: MOCK_POLICY.versionCode },
                      { label: "Document Type", value: MOCK_POLICY.type },
                      { label: "Source Draft", value: MOCK_POLICY.sourceDraft },
                      { label: "Approval Date", value: MOCK_POLICY.approvalDate },
                      { label: "Effective Date", value: MOCK_POLICY.effectiveDate },
                      { label: "Operational Period", value: MOCK_POLICY.operationalPeriod },
                      { label: "Next Review Date", value: MOCK_POLICY.nextReviewDate },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1">
                        <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.label}</dt>
                        <dd className="text-sm font-semibold font-mono">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-primary/10">
                <CardHeader className="border-b bg-muted/30 pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" /> Thematic Areas
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 flex flex-wrap gap-2">
                  {MOCK_POLICY.thematicAreas.map((area) => (
                    <Badge key={area} variant="secondary" className="px-3 py-1 text-sm">{area}</Badge>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Document / PDF Reader */}
            <TabsContent value="document" className="mt-6 space-y-4">
              <Card className="shadow-lg border-primary/20 overflow-hidden bg-muted/5">
                <CardHeader className="bg-background border-b py-3 px-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 border rounded-md bg-muted/50 p-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><ZoomOut className="h-4 w-4" /></Button>
                        <span className="text-xs font-medium px-2">100%</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><ZoomIn className="h-4 w-4" /></Button>
                      </div>
                      <Separator orientation="vertical" className="h-6" />
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><ChevronLeft className="h-4 w-4" /></Button>
                        <span className="text-xs font-medium px-1">Page 1 / 12</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><ChevronRight className="h-4 w-4" /></Button>
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
                      <Button size="sm" className="h-8 gap-1.5 bg-primary">
                        <Download className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Download PDF</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 bg-slate-200/50 flex justify-center items-start overflow-auto min-h-[600px] max-h-[800px]">
                  {/* PDF Simulation */}
                  <div className="my-8 shadow-2xl bg-white w-full max-w-[800px] min-h-[1100px] p-16 space-y-8 text-slate-800">
                    <div className="text-center space-y-4 border-b-4 border-primary pb-8">
                      <div className="flex justify-center mb-4">
                         <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                            <Building2 className="w-10 h-10 text-primary" />
                         </div>
                      </div>
                      <h1 className="text-3xl font-black uppercase tracking-tighter">Federal Democratic Republic of Ethiopia</h1>
                      <h2 className="text-xl font-bold uppercase tracking-wide text-muted-foreground">{MOCK_POLICY.organization}</h2>
                    </div>

                    <div className="py-12 text-center space-y-6">
                      <h3 className="text-4xl font-black text-slate-900 leading-tight">
                        {MOCK_POLICY.title}
                      </h3>
                      <div className="flex justify-center gap-8 py-4">
                        <div className="text-left">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Serial Number</p>
                          <p className="text-sm font-mono font-bold">{MOCK_POLICY.serialNumber}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Version</p>
                          <p className="text-sm font-mono font-bold">{MOCK_POLICY.versionCode}</p>
                        </div>
                      </div>
                      <div className="inline-block px-6 py-2 border-2 border-slate-900 font-black text-lg">
                        OFFICIAL POLICY DOCUMENT
                      </div>
                    </div>

                    <div className="space-y-6 text-justify">
                      <p className="font-bold text-lg border-l-4 border-primary pl-4">1. Executive Summary</p>
                      <p className="leading-relaxed">
                        {MOCK_POLICY.description}
                      </p>
                      <p className="leading-relaxed">
                        This document serves as the primary governance framework for {MOCK_POLICY.thematicAreas.join(", ")} within the national education system. It outlines the strategic objectives, implementation methodologies, and oversight mechanisms required to achieve the stated outcomes within the operational period of {MOCK_POLICY.effectiveDate} to {MOCK_POLICY.nextReviewDate}.
                      </p>
                      
                      <p className="font-bold text-lg border-l-4 border-primary pl-4">2. Legal Framework</p>
                      <p className="leading-relaxed italic text-slate-600">
                        "In exercise of the powers conferred by the Council of Ministers, this policy is hereby registered and published as an official instrument of the Ministry of Education, effective immediately."
                      </p>
                    </div>

                    <div className="pt-24 mt-auto">
                      <div className="flex justify-between items-end border-t pt-8">
                        <div className="space-y-4">
                          <div className="h-12 w-48 bg-slate-100 rounded-sm border-b-2 border-slate-300 italic flex items-center justify-center text-slate-400 text-xs">
                            Electronic Signature Verified
                          </div>
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">Authorized PSR Officer</p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-xs font-bold uppercase">Registry Timestamp</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{MOCK_POLICY.approvalDate} 14:30:00 UTC</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Timeline */}
            <TabsContent value="timeline" className="mt-6">
              <Card className="shadow-sm border-primary/10">
                <CardHeader className="border-b bg-muted/30 pb-4">
                  <CardTitle className="text-base">Policy Lifecycle Audit Trail</CardTitle>
                  <CardDescription>Complete traceability from concept note to publication</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="relative">
                    {TIMELINE.map((event, index) => (
                      <div key={index} className="flex gap-4 pb-6 last:pb-0">
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            "h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10",
                            event.status === "done"
                              ? "bg-primary border-primary text-primary-foreground"
                              : "bg-amber-100 border-amber-400 text-amber-600"
                          )}>
                            {event.status === "done"
                              ? <CheckCircle2 className="h-4 w-4" />
                              : <Clock className="h-4 w-4" />
                            }
                          </div>
                          {index < TIMELINE.length - 1 && (
                            <div className={cn("w-0.5 flex-1 mt-1", event.status === "done" ? "bg-primary/30" : "bg-border border-dashed")} />
                          )}
                        </div>
                        <div className="pt-1 pb-2">
                          <p className={cn("text-sm font-semibold", event.status === "upcoming" && "text-amber-700")}>{event.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {event.date}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Versions */}
            <TabsContent value="versions" className="mt-6">
              <Card className="shadow-sm border-primary/10">
                <CardHeader className="border-b bg-muted/30 pb-4">
                  <CardTitle className="text-base">Version History</CardTitle>
                  <CardDescription>Track all revisions of this policy document</CardDescription>
                </CardHeader>
                <CardContent className="p-0 divide-y">
                  {VERSION_HISTORY.map((v) => (
                    <div key={v.version} className="p-5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/5 rounded-md">
                          <GitBranch className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold font-mono">{v.version}</p>
                            {v.current && <Badge className="text-[10px] bg-primary">Current</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{v.changes}</p>
                          <p className="text-xs text-muted-foreground">{v.date} · {v.author}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-3 w-3 mr-1" /> Download
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>


          </Tabs>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <Card className="shadow-sm border-primary/20">
            <CardHeader className="pb-3 border-b bg-primary/5">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">Publication Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className={cn(
                  "text-xs",
                  MOCK_POLICY.publishStatus
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-amber-100 text-amber-700 border border-amber-200"
                )}>
                  {MOCK_POLICY.publishStatus ? "Published" : "Unpublished"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Access Level</span>
                <Badge variant="outline" className={cn("text-xs flex items-center gap-1", accessCfg.className)}>
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
                { href: `/policies/drafts/${MOCK_POLICY.sourceDraft}`, label: "Source Draft", icon: FileText },
                { href: "#", label: "Download Document", icon: Download },
                { href: "#", label: "Share Link", icon: ExternalLink },
              ].map((link) => (
                <Button key={link.label} variant="ghost" size="sm" className="w-full justify-start h-9 text-sm" asChild>
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
