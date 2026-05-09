"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Archive,
  FileText,
  Globe,
  Lock,
  Shield,
  Download,
  Eye,
  Calendar,
  RotateCcw,
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
import { PageContainer } from "@/components/layout";
import { cn } from "@/lib/utils";

const ARCHIVED_POLICIES = [
  {
    id: "RP-ARC-001",
    serialNumber: "ET_MoE_EDU_000",
    versionCode: "ET_MoE_EDU_000_v1",
    title: "Education Sector Development Programme V (ESDP V)",
    type: "Strategy",
    organization: "Ministry of Education",
    approvalDate: "2020-03-01",
    effectiveDate: "2020-04-01",
    archivedDate: "2025-03-31",
    archivedReason: "Superseded by ESDP VI",
    accessLevel: "public",
    downloads: 1205,
    views: 6780,
  },
  {
    id: "RP-ARC-002",
    serialNumber: "ET_MoE_TCH_001",
    versionCode: "ET_MoE_TCH_001_v1",
    title: "Teacher Recruitment and Deployment Policy (2018)",
    type: "Policy",
    organization: "Ministry of Education",
    approvalDate: "2018-07-15",
    effectiveDate: "2018-09-01",
    archivedDate: "2025-05-01",
    archivedReason: "Revised and replaced by Teacher Professional Development Policy",
    accessLevel: "public",
    downloads: 872,
    views: 4340,
  },
];

const ACCESS_CONFIG: Record<string, { icon: typeof Globe; label: string; className: string }> = {
  public: { icon: Globe, label: "Public", className: "bg-green-100 text-green-700 border-green-200" },
  internal: { icon: Shield, label: "Internal", className: "bg-blue-100 text-blue-700 border-blue-200" },
  restricted: { icon: Lock, label: "Restricted", className: "bg-red-100 text-red-700 border-red-200" },
};

export default function ArchivedPoliciesPage() {
  return (
    <PageContainer
      title="Archived Policies"
      description="Historical policy documents that have been superseded, replaced, or retired from active service"
      actions={
        <Button variant="outline" asChild>
          <Link href="/policies/repository">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Repository
          </Link>
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Summary */}
        <Card className="shadow-sm border-slate-200 bg-slate-50/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-slate-200">
              <Archive className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-black">{ARCHIVED_POLICIES.length}</p>
              <p className="text-xs text-muted-foreground">Archived policies — available for historical reference but no longer in force</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/10">
          <CardHeader className="border-b bg-muted/30 pb-4">
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4 text-slate-600" />
              <CardTitle className="text-base">Policy Archive</CardTitle>
            </div>
            <CardDescription>These policies are no longer active but remain accessible for audit and reference purposes.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 divide-y">
            {ARCHIVED_POLICIES.map((policy) => {
              const accessCfg = ACCESS_CONFIG[policy.accessLevel];
              const AccessIcon = accessCfg.icon;
              return (
                <div key={policy.id} className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2.5 rounded-lg bg-slate-100 shrink-0">
                      <FileText className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{policy.title}</p>
                        <Badge variant="outline" className="text-[10px] py-0 bg-slate-100 text-slate-600 border-slate-300">Archived</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{policy.organization}</p>
                      <p className="text-[10px] font-mono text-muted-foreground/70">{policy.serialNumber}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-[10px] py-0">{policy.type}</Badge>
                        <Badge variant="outline" className={cn("text-[10px] py-0 flex items-center gap-1", accessCfg.className)}>
                          <AccessIcon className="h-2.5 w-2.5" />{accessCfg.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Effective: {policy.effectiveDate}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 bg-slate-100 rounded px-2 py-1 w-fit border border-slate-200">
                        <Archive className="h-3 w-3" />
                        <span>Archived {policy.archivedDate} — {policy.archivedReason}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button variant="outline" size="sm" className="h-8" asChild>
                      <Link href={`/policies/repository/${policy.id}`}>
                        <Eye className="h-3 w-3 mr-1" /> View
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8">
                      <Download className="h-3 w-3 mr-1" /> Download
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
