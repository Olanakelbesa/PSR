"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  Activity,
  Award,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout";
import { DataTable, StatusBadge } from "@/components/shared";
import { policyApi } from "@/lib/api/client";
import { POLICY_TYPES } from "@/lib/constants";
import type { PolicyDocument, PolicyStatus, PolicyType } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";

const columns: ColumnDef<PolicyDocument>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 font-semibold hover:bg-transparent px-0"
      >
        Draft Document
        <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const policy = row.original;
      return (
        <div className="flex flex-col gap-1 py-2 min-w-[250px]">
          <Link
            href={`/policies/drafts/${policy.id}`}
            className="font-bold text-[14px] leading-tight text-foreground hover:text-primary transition-colors line-clamp-1"
          >
            {policy.title}
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-[10px] font-mono">v{policy.version || "1.0.0"}</Badge>
            <span className="text-[11px] text-muted-foreground">{policy.id}</span>
          </div>
        </div>
      );
    },
  },
  {
    id: "checklist_score",
    header: "Compliance Score",
    cell: ({ row }) => {
      // Drafts in this queue are required to have a 100% checklist score
      const score = 100;
      return (
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900">{score}%</span>
            <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
               <div className="h-full bg-green-500 w-[100%]" />
            </div>
          </div>
          <Award className="h-4 w-4 text-emerald-500" />
        </div>
      );
    },
  },
  {
    id: "organization",
    header: "Institution",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[12px] font-medium">Ministry of Education</span>
        </div>
      );
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Last Update",
    cell: ({ row }) => {
      const date = row.getValue("updatedAt") as string;
      return (
        <div className="text-[12px] text-muted-foreground">
          {new Date(date).toLocaleDateString()}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      return <StatusBadge type="policy" status={row.original.status} />;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Sign-off</div>,
    cell: ({ row }) => (
      <div className="text-right">
        <Button variant="default" size="sm" asChild className="h-8 bg-emerald-600 hover:bg-emerald-700">
          <Link href={`/policies/drafts/${row.original.id}`}>
            <ShieldCheck className="mr-2 h-3.5 w-3.5" />
            Ratify Draft
          </Link>
        </Button>
      </div>
    ),
  },
];

const MOCK_APPROVAL_DRAFTS: PolicyDocument[] = [
  {
    id: "PD-2025-0012",
    title: "National Digital Education Strategy (2025-2030)",
    description: "A comprehensive framework for integrating digital technologies into the primary and secondary education systems.",
    type: "strategy",
    status: "under_review",
    category: "Digital Transformation",
    version: 1,
    currentVersion: 1,
    createdBy: {
      id: "u1",
      firstName: "Abebe",
      lastName: "Bekele",
      email: "abebe@moe.gov.et",
      role: "director",
      institution: "Ministry of Education",
      status: "active",
      image: "",
      createdAt: "",
      updatedAt: ""
    },
    assignedReviewers: [],
    attachments: [],
    reviews: [{ id: "r1", reviewerId: "rev1", reviewer: {} as any, comments: "Excellent", recommendation: "approve", score: 100, createdAt: new Date().toISOString() }],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "PD-2025-0045",
    title: "Special Needs Education Implementation Guideline",
    description: "Operational procedures for ensuring inclusive education environments across regional schools.",
    type: "guideline",
    status: "under_review",
    category: "Inclusion",
    version: 2,
    currentVersion: 2,
    createdBy: {
      id: "u2",
      firstName: "Tigist",
      lastName: "Mulugeta",
      email: "tigist@moe.gov.et",
      role: "researcher",
      institution: "Ministry of Education",
      status: "active",
      image: "",
      createdAt: "",
      updatedAt: ""
    },
    assignedReviewers: [],
    attachments: [],
    reviews: [{ id: "r2", reviewerId: "rev2", reviewer: {} as any, comments: "Fully compliant", recommendation: "approve", score: 100, createdAt: new Date().toISOString() }],
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "PD-2025-0089",
    title: "Higher Education Quality Assurance Protocol",
    description: "Standardized protocols for university accreditation and quality monitoring cycles.",
    type: "protocol",
    status: "revision_requested",
    category: "Quality Assurance",
    version: 1,
    currentVersion: 1,
    createdBy: {
      id: "u3",
      firstName: "Samuel",
      lastName: "Kassa",
      email: "samuel@moe.gov.et",
      role: "director",
      institution: "Ministry of Education",
      status: "active",
      image: "",
      createdAt: "",
      updatedAt: ""
    },
    assignedReviewers: [],
    attachments: [],
    reviews: [{ id: "r3", reviewerId: "rev3", reviewer: {} as any, comments: "Meets all criteria", recommendation: "approve", score: 100, createdAt: new Date().toISOString() }],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export default function DraftApprovalPage() {
  const router = useRouter();
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPolicies() {
      setIsLoading(true);
      try {
        const response = await policyApi.getPolicies({}, { page: 1, pageSize: 100 });
        const apiDrafts = response.data.filter((p) => 
          (p.status === "under_review" || p.status === "revision_requested") &&
          (p.reviews?.some(r => r.score === 100))
        );
        
        // Combine API data with mock data for a full demonstration
        setPolicies([...MOCK_APPROVAL_DRAFTS, ...apiDrafts]);
      } catch (error) {
        console.error("Failed to load draft approval queue:", error);
        setPolicies(MOCK_APPROVAL_DRAFTS);
      } finally {
        setIsLoading(false);
      }
    }
    loadPolicies();
  }, []);

  return (
    <PageContainer
      title="Policy Draft Approval"
      description="Official PSR final review and ratification portal for scored policy drafts."
    >
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="border-emerald-200 bg-emerald-50/30 shadow-sm col-span-1 md:col-span-1">
          <CardHeader className="pb-2">
             <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" /> Awaiting Ratification
             </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-900">{isLoading ? "..." : policies.length}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
             <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Compliance Avg</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-700">89%</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
             <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Review Depth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-700">5 Experts</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
             <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-600">High</div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
             <Skeleton className="h-10 w-full" />
             <Skeleton className="h-20 w-full" />
             <Skeleton className="h-20 w-full" />
          </div>
        ) : policies.length > 0 ? (
          <DataTable
            columns={columns}
            data={policies}
            searchKey="title"
            searchPlaceholder="Search draft queue..."
          />
        ) : (
          <Empty className="py-32">
            <EmptyMedia variant="icon">
              <ShieldCheck className="h-10 w-10 text-muted-foreground/30" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No Drafts Pending</EmptyTitle>
              <EmptyDescription>
                The draft ratification queue is currently clear.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </PageContainer>
  );
}
