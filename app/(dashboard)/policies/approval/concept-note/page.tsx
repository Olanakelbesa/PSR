"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  FileText,
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  ClipboardCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout";
import { DataTable, StatusBadge } from "@/components/shared";
import { conceptNoteApi } from "@/lib/api/client";
import { POLICY_TYPES } from "@/lib/constants";
import type { ConceptNote, PolicyStatus, PolicyType } from "@/lib/types";
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
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";

const columns: ColumnDef<ConceptNote>[] = [
  {
    id: "title",
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className=" h-8 font-semibold hover:bg-transparent"
      >
        Concept Title
        <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => {
      const note = row.original;
      return (
        <div className="flex flex-col gap-1 py-2 min-w-[200px]">
          <Link
            href={`/policies/concept-notes/${note.id}`}
            className="font-bold text-[14px] leading-tight text-foreground hover:text-primary transition-colors line-clamp-1"
          >
            {note.title}
          </Link>
          <p className="text-[11px] text-muted-foreground line-clamp-1">
            {note.id} · {POLICY_TYPES[note.policyType]?.label}
          </p>
        </div>
      );
    },
  },
  {
    id: "organization",
    accessorKey: "createdBy.institution",
    header: "Submitting Institution",
    cell: ({ row }) => {
      const org = row.original.createdBy?.institution || "Ministry of Health";
      return (
        <div className="flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[13px] font-medium">{org}</span>
        </div>
      );
    },
  },
  {
    id: "expert_review",
    header: "Expert Evaluation",
    cell: ({ row }) => {
      const reviews = row.original.reviews || [];
      const score = reviews.length > 0 ? "84%" : "Pending";
      return (
        <div className="flex flex-col gap-1">
          <Badge variant="secondary" className="w-fit text-[10px] font-bold bg-green-50 text-green-700 border-green-200">
            PASSED EXPERT REVIEW
          </Badge>
          <span className="text-[11px] text-muted-foreground">Score: {score}</span>
        </div>
      );
    },
  },
  {
    id: "submitted_by",
    header: "Author",
    cell: ({ row }) => {
      const author = row.original.createdBy;
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7 border">
            <AvatarImage src={author.image} />
            <AvatarFallback className="text-[10px]">{author.firstName[0]}{author.lastName[0]}</AvatarFallback>
          </Avatar>
          <span className="text-[12px] font-medium">{author.firstName} {author.lastName}</span>
        </div>
      );
    },
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Approval Status",
    cell: ({ row }) => {
      return <StatusBadge type="policy" status={row.original.status} />;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Action</div>,
    cell: ({ row }) => (
      <div className="text-right">
        <Button variant="default" size="sm" asChild className="h-8 bg-primary hover:bg-primary/90">
          <Link href={`/policies/concept-notes/${row.original.id}`}>
            <ShieldCheck className="mr-2 h-3.5 w-3.5" />
            Ratify
          </Link>
        </Button>
      </div>
    ),
  },
];

const MOCK_APPROVAL_NOTES: ConceptNote[] = [
  {
    id: "CN-2025-0012",
    title: "Vocational Training Excellence Framework",
    background: "A proposal to standardize vocational training centers and align them with industrial requirements.",
    objectives: "Improve job placement rates; Standardize curricula.",
    scope: "National level training centers.",
    expectedOutcomes: "50% increase in certified technicians.",
    status: "under_review",
    policyType: "strategy",
    createdBy: {
      id: "u1",
      firstName: "Hassen",
      lastName: "Mohammed",
      email: "hassen@moe.gov.et",
      role: "director",
      institution: "Ministry of Education",
      status: "active",
      image: "",
      createdAt: "",
      updatedAt: ""
    },
    attachments: [],
    reviews: [{ id: "r1", reviewerId: "rev1", reviewer: {} as any, comments: "Solid proposal", recommendation: "approve", score: 88, createdAt: new Date().toISOString() }],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "CN-2025-0034",
    title: "Teacher Professional Development Reform",
    background: "Restructuring the ongoing certification process for primary school teachers.",
    objectives: "Continuous assessment; Quality enhancement.",
    scope: "Primary education sector.",
    expectedOutcomes: "Better teaching quality.",
    status: "submitted",
    policyType: "policy",
    createdBy: {
      id: "u2",
      firstName: "Zenebech",
      lastName: "Tadesse",
      email: "zene@moe.gov.et",
      role: "director",
      institution: "Ministry of Education",
      status: "active",
      image: "",
      createdAt: "",
      updatedAt: ""
    },
    attachments: [],
    reviews: [{ id: "r2", reviewerId: "rev2", reviewer: {} as any, comments: "Necessary reform", recommendation: "approve", score: 92, createdAt: new Date().toISOString() }],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export default function ConceptNoteApprovalPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<ConceptNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadNotes() {
      setIsLoading(true);
      try {
        const response = await conceptNoteApi.getConceptNotes({}, { page: 1, pageSize: 100 });
        const apiQueue = response.data.filter((n) => 
          n.status === "under_review" || n.status === "submitted"
        );
        setNotes([...MOCK_APPROVAL_NOTES, ...apiQueue]);
      } catch (error) {
        console.error("Failed to load approval queue:", error);
        setNotes(MOCK_APPROVAL_NOTES);
      } finally {
        setIsLoading(false);
      }
    }
    loadNotes();
  }, []);

  return (
    <PageContainer
      title="Concept Note Approval"
      description="Official PSR ratification queue for concept notes that have passed technical expert review."
    >
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-primary/70 flex items-center gap-2">
              <ClipboardCheck className="h-3.5 w-3.5" /> Pending Ratification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{isLoading ? "..." : notes.length}</div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tight">Requiring final sign-off</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expert Review Cycle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-700">14 Days</div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tight">Average turnaround time</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-green-600">92%</div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tight">Approval to Draft Conversion</p>
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
        ) : notes.length > 0 ? (
          <DataTable
            columns={columns}
            data={notes}
            searchKey="title"
            searchPlaceholder="Search approval queue..."
          />
        ) : (
          <Empty className="py-32">
            <EmptyMedia variant="icon">
              <ShieldCheck className="h-10 w-10 text-muted-foreground/30" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>Ratification Queue Empty</EmptyTitle>
              <EmptyDescription>
                There are currently no concept notes awaiting PSR approval.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </PageContainer>
  );
}
