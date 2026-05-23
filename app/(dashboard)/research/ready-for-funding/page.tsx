"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Eye,
  DollarSign,
  Clock,
  TrendingUp,
  ShieldCheck,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import {
  readyForFundingService,
  type ReadyForFundingItem,
} from "@/api/services/ready-for-funding.service";

export default function ReadyForFundingPage() {
  const router = useRouter();

  const [rows, setRows] = useState<ReadyForFundingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ==========================================================================
  // Load data from backend
  // ==========================================================================
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await readyForFundingService.list({
          page: 1,
          limit: 100,
        });

        setRows(res.data ?? []);
      } catch (err) {
        console.error("Failed to load ready-for-funding:", err);
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  // ==========================================================================
  // Stats
  // ==========================================================================
  const pendingDecisions = rows.filter(
    (row) => row.fundingDecisionStatus === "pending",
  ).length;

  const stats = [
    {
      label: "Ready for Funding",
      value: rows.length,
      icon: ShieldCheck,
      color: "text-blue-600",
      bg: "bg-blue-600",
      desc: "Approved proposals awaiting funding",
    },
    {
      label: "Pending Decisions",
      value: pendingDecisions,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-600",
      desc: "Funding decisions to complete",
    },
    {
      label: "Total Funding Requested",
      value: `ETB ${(rows.reduce((s, r) => s + (r.budgetRequested || 0), 0) / 1_000_000).toFixed(1)}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-600",
      desc: "Combined request",
    },
    {
      label: "Avg Score",
      value:
        rows.length > 0
          ? `${(rows.reduce((s, r) => s + r.averageScore, 0) / rows.length).toFixed(1)}`
          : "0",
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary",
      desc: "Screening average",
    },
  ];

  // ==========================================================================
  // Table columns
  // ==========================================================================
  const columns: ColumnDef<ReadyForFundingItem>[] = [
    {
      accessorKey: "referenceNumber",
      header: "Reference",
      cell: ({ row }) => (
        <span className="font-bold text-primary">
          {row.original.referenceNumber}
        </span>
      ),
    },
    {
      accessorKey: "proposalTitle",
      header: "Proposal",
      cell: ({ row }) => (
        <div className="max-w-[420px]">
          <p className="font-bold text-sm line-clamp-2">
            {row.original.proposalTitle}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase mt-1 whitespace-pre-line">
            {row.original.organization}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "pi",
      header: "Principal Investigator",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold">
            {row.original.pi.fullName}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {row.original.pi.email}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "budgetRequested",
      header: "Budget",
      cell: ({ row }) => (
        <div className="font-bold">
          ETB {row.original.budgetRequested?.toLocaleString() || 0}
        </div>
      ),
    },
    {
      accessorKey: "averageScore",
      header: "Score",
      cell: ({ row }) => (
        <Badge className="bg-blue-50 text-blue-700 border-blue-200">
          {row.original.averageScorePercentage}%
        </Badge>
      ),
    },
    {
      accessorKey: "fundingDecisionStatus",
      header: "Decision",
      cell: ({ row }) => {
        const status = row.original.fundingDecisionStatus || "pending";
        const statusClasses = cn(
          "rounded-full px-2 py-1 text-[11px] font-semibold",
          status === "approved"
            ? "bg-emerald-50 text-emerald-700"
            : status === "rejected"
            ? "bg-red-50 text-red-700"
            : "bg-amber-50 text-amber-700",
        );

        return <span className={statusClasses}>{status.replace(/_/g, " ")}</span>;
      },
    },
    {
      accessorKey: "needIrbEthicalClearance",
      header: "IRB",
      cell: ({ row }) => (
        <Badge
          className={cn(
            "rounded-full px-2 py-1 text-[11px] font-semibold",
            row.original.needIrbEthicalClearance
              ? "bg-slate-100 text-slate-800"
              : "bg-blue-50 text-blue-700",
          )}
        >
          {row.original.needIrbEthicalClearance ? "Yes" : "No"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                router.push(
                  `/research/ready-for-funding/${row.original.screeningId}`,
                )
              }
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-emerald-600"
              onClick={() =>
                router.push(
                  `/research/ready-for-funding/${row.original.screeningId}`,
                )
              }
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Funding Decision
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];


  return (
    <PageContainer
      title="Ready for Funding"
      description="Screened proposals awaiting funding decision"
    >
      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))
            : stats.map((s, i) => (
                <Card key={i} className="relative overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-xs uppercase">
                      {s.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{s.value}</div>
                    <p className="text-[10px] text-muted-foreground">
                      {s.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            searchKey="proposalTitle"
            searchPlaceholder="Search proposals..."
            onRowClick={(row) =>
              router.push(
                `/research/ready-for-funding/${row.screeningId}`,
              )
            }
            emptyMessage="No proposals ready for funding"
            emptyDescription="No approved proposals found."
          />
        )}
      </div>
    </PageContainer>
  );
}