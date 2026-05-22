"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ClipboardList,
  FileText,
  AlertCircle,
  Microscope,
  ShieldCheck,
  User,
  Building2,
  Layers,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageContainer } from "@/components/layout";
import { DataTable } from "@/components/shared/data-table";
import { getIndividualReviews, type IndividualReview } from "@/api/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const reviewStatusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: any;
  }
> = {
  pending_review: { label: "Pending Review", variant: "outline", icon: Clock },
  reviewed: { label: "Reviewed", variant: "secondary", icon: CheckCircle2 },
};

const proposalStatusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: any;
  }
> = {
  screening_approved: {
    label: "Screening Approved",
    variant: "secondary",
    icon: CheckCircle2,
  },
  screening_under_review: {
    label: "Screening In Progress",
    variant: "outline",
    icon: Microscope,
  },
  screening_rejected: {
    label: "Screening Rejected",
    variant: "destructive",
    icon: XCircle,
  },
};

type ReviewRow = IndividualReview & {
  organizationName: string;
  unitName: string;
  scoreLabel: string;
};

export default function TechnicalReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const mapToReviewRow = (review: IndividualReview): ReviewRow => ({
    ...review,
    organizationName: review.organization?.name || "—",
    unitName: review.unit?.name || "—",
    scoreLabel:
      typeof review.totalScore === "number" ? `${review.totalScore}` : "0",
  });

  useEffect(() => {
    async function loadReviews() {
      setIsLoading(true);
      try {
        const response = await getIndividualReviews({
          page: 1,
          limit: 100,
          ordering: "-id",
        });
        setReviews((response.data || []).map(mapToReviewRow));
      } catch (error) {
        console.error("Failed to load individual reviews:", error);
        setReviews([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadReviews();
  }, []);

  const stats = useMemo(
    () => [
      {
        label: "Pending Reviews",
        value: reviews.filter(
          (review) => review.reviewStatus === "pending_review",
        ).length,
        icon: Clock,
        color: "text-amber-600",
        bg: "bg-amber-50/50",
      },
      {
        label: "Completed",
        value: reviews.filter((review) => review.reviewStatus === "reviewed")
          .length,
        icon: CheckCircle2,
        color: "text-emerald-600",
        bg: "bg-emerald-50/50",
      },
      {
        label: "Screening Approved",
        value: reviews.filter(
          (review) => review.proposalStatus === "screening_approved",
        ).length,
        icon: Microscope,
        color: "text-blue-600",
        bg: "bg-blue-50/50",
      },
      {
        label: "Total Reviews",
        value: reviews.length,
        icon: ShieldCheck,
        color: "text-slate-600",
        bg: "bg-slate-50/50",
      },
    ],
    [reviews],
  );

  const columns: ColumnDef<ReviewRow>[] = [
    {
      accessorKey: "referenceNumber",
      header: "Reference #",
      cell: ({ row }) => (
        <span className="font-bold text-primary">
          {row.original.referenceNumber}
        </span>
      ),
    },
    {
      accessorKey: "proposalTitle",
      header: "Proposal Title",
      cell: ({ row }) => (
        <div className="max-w-[380px]">
          <p className="font-semibold text-sm line-clamp-1">
            {row.original.proposalTitle}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase line-clamp-1">
              {row.original.principalInvestigator || "—"}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "principalInvestigator",
      header: "Principal Investigator",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {row.original.principalInvestigator || "—"}
          </span>
          <span className="text-[10px] text-muted-foreground font-bold uppercase">
            {row.original.reviewStatus === "reviewed"
              ? "Completed Review"
              : "Awaiting Evaluation"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "organizationName",
      header: "Organization",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-pre-line break-word">
          {row.original.organizationName}
        </span>
      ),
    },
    {
      accessorKey: "unitName",
      header: "Unit",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-pre-line break-word">
          {row.original.unitName}
        </span>
      ),
    },
    {
      accessorKey: "proposalStatus",
      header: "Proposal Status",
      cell: ({ row }) => {
        const config = proposalStatusConfig[row.original.proposalStatus] ?? {
          label: row.original.proposalStatus || "Unknown",
          variant: "outline" as const,
          icon: AlertCircle,
        };
        const Icon = config.icon;
        return (
          <Badge
            variant={config.variant}
            className="gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase"
          >
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "reviewStatus",
      header: "Review Status",
      cell: ({ row }) => {
        const config = reviewStatusConfig[row.original.reviewStatus] ?? {
          label: row.original.reviewStatus || "Unknown",
          variant: "outline" as const,
          icon: AlertCircle,
        };
        const Icon = config.icon;
        return (
          <Badge
            variant={config.variant}
            className="gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase"
          >
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "scoreLabel",
      header: "Total Score",
      cell: ({ row }) => (
        <span className="text-sm font-bold text-foreground">
          {row.original.scoreLabel}
        </span>
      ),
    },
    {
      accessorKey: "submittedDate",
      header: "Submitted Date",
      cell: ({ row }) => (
        <span className="text-xs font-medium text-muted-foreground">
          {row.original.submittedDate
            ? new Date(row.original.submittedDate).toLocaleDateString()
            : "—"}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link
                href={`/research/proposals/technical-reviews/${row.original.id}`}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Review
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href={`/research/proposals/technical-reviews/${row.original.id}/review`}
                className="text-primary font-medium"
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                Technical Review
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <PageContainer
      title="Technical Reviews"
      description="Review individual screening-assigned technical evaluations from the backend review register."
    >
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-none shadow-md">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-12" />
                  </CardContent>
                </Card>
              ))
            : stats.map((stat, i) => (
                <Card
                  key={i}
                  className="group relative overflow-hidden border-none shadow-md hover:shadow-lg transition-all"
                >
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 w-1",
                      stat.bg.replace("/50", ""),
                    )}
                  />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <stat.icon className={cn("h-4 w-4", stat.color)} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black">{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-[500px] w-full rounded-xl" />
          ) : (
            <DataTable
              columns={columns}
              data={reviews}
              searchKey="proposalTitle"
              searchPlaceholder="Search by title or PI..."
              filterOptions={[
                {
                  key: "reviewStatus",
                  label: "Review Status",
                  options: [
                    { value: "pending_review", label: "Pending Review" },
                    { value: "reviewed", label: "Reviewed" },
                  ],
                },
                {
                  key: "proposalStatus",
                  label: "Proposal Status",
                  options: [
                    {
                      value: "screening_approved",
                      label: "Screening Approved",
                    },
                    {
                      value: "screening_under_review",
                      label: "Screening In Progress",
                    },
                    {
                      value: "screening_rejected",
                      label: "Screening Rejected",
                    },
                  ],
                },
              ]}
              onRowClick={(row) =>
                router.push(`/research/proposals/technical-reviews/${row.id}`)
              }
              emptyMessage="No technical reviews found"
              emptyDescription="No individual reviews were returned from the backend yet."
            />
          )}
        </div>
      </div>
    </PageContainer>
  );
}
