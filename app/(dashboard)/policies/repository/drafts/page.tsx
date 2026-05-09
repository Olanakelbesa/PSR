"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clock,
  ArrowLeft,
  FileText,
  Globe,
  Lock,
  Shield,
  CheckCircle2,
  ExternalLink,
  Calendar,
  ChevronRight,
  Download,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageContainer } from "@/components/layout";
import { cn } from "@/lib/utils";

const PENDING_POLICIES = [
  {
    id: "RP-004",
    serialNumber: "ET_MoE_DIG_004",
    versionCode: "ET_MoE_DIG_004_v1",
    title: "Digital Learning Infrastructure Implementation Framework",
    type: "Framework",
    organization: "MoE – ICT Directorate",
    approvalDate: "2025-09-05",
    effectiveDate: "2025-10-01",
    nextReviewDate: "2027-10-01",
    accessLevel: "internal",
    sourceDraft: "PDD-2024-0091",
    readyToPublish: true,
  },
  {
    id: "RP-006",
    serialNumber: "ET_MoE_HED_006",
    versionCode: "ET_MoE_HED_006_v1",
    title: "Higher Education Access and Quality Assurance Policy",
    type: "Policy",
    organization: "MoE – Higher Education",
    approvalDate: "2025-11-02",
    effectiveDate: "2026-02-01",
    nextReviewDate: "2028-02-01",
    accessLevel: "restricted",
    sourceDraft: "PDD-2025-0012",
    readyToPublish: false,
  },
];

const ACCESS_CONFIG: Record<string, { icon: typeof Globe; label: string; className: string }> = {
  public: { icon: Globe, label: "Public", className: "bg-green-100 text-green-700 border-green-200" },
  internal: { icon: Shield, label: "Internal", className: "bg-blue-100 text-blue-700 border-blue-200" },
  restricted: { icon: Lock, label: "Restricted", className: "bg-red-100 text-red-700 border-red-200" },
};

export default function PendingPublicationPage() {
  const [publishing, setPublishing] = useState<string | null>(null);

  async function handlePublish(id: string) {
    setPublishing(id);
    await new Promise((r) => setTimeout(r, 1200));
    setPublishing(null);
  }

  return (
    <PageContainer
      title="Pending Publication Queue"
      description="Registered policies awaiting publication to the public repository"
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
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Pending Publication", value: PENDING_POLICIES.length, color: "border-amber-200 bg-amber-50/40 text-amber-700" },
            { label: "Ready to Publish", value: PENDING_POLICIES.filter(p => p.readyToPublish).length, color: "border-green-200 bg-green-50/40 text-green-700" },
            { label: "Awaiting Action", value: PENDING_POLICIES.filter(p => !p.readyToPublish).length, color: "border-red-200 bg-red-50/40 text-red-700" },
          ].map((stat) => (
            <Card key={stat.label} className={cn("shadow-sm border", stat.color)}>
              <CardContent className="p-5">
                <p className="text-3xl font-black">{stat.value}</p>
                <p className="text-xs font-medium mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-sm border-primary/10">
          <CardHeader className="border-b bg-muted/30 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <CardTitle className="text-base">Publication Queue</CardTitle>
            </div>
            <CardDescription>Policies that have been registered but not yet published</CardDescription>
          </CardHeader>
          <CardContent className="p-0 divide-y">
            {PENDING_POLICIES.map((policy) => {
              const accessCfg = ACCESS_CONFIG[policy.accessLevel];
              const AccessIcon = accessCfg.icon;
              return (
                <div key={policy.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2.5 rounded-lg bg-amber-50 shrink-0">
                      <FileText className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <p className="text-sm font-semibold">{policy.title}</p>
                      <p className="text-xs text-muted-foreground">{policy.organization}</p>
                      <p className="text-[10px] font-mono text-muted-foreground/70">{policy.serialNumber}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-[10px] py-0">{policy.type}</Badge>
                        <Badge variant="outline" className={cn("text-[10px] py-0 flex items-center gap-1", accessCfg.className)}>
                          <AccessIcon className="h-2.5 w-2.5" />{accessCfg.label}
                        </Badge>
                        <Badge variant="outline" className={cn("text-[10px] py-0", policy.readyToPublish ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200")}>
                          {policy.readyToPublish ? "Ready" : "Needs Action"}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Effective: {policy.effectiveDate}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      size="sm"
                      className={cn("h-8", policy.readyToPublish ? "bg-primary hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed")}
                      onClick={() => policy.readyToPublish && handlePublish(policy.id)}
                      disabled={!policy.readyToPublish || publishing === policy.id}
                    >
                      {publishing === policy.id ? "Publishing..." : "Publish Now"}
                    </Button>
                    <Button variant="outline" size="sm" className="h-8" asChild>
                      <Link href={`/policies/repository/${policy.id}`}>View Details</Link>
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
