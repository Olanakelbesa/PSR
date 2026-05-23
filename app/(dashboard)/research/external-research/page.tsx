"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageContainer } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  BookOpen,
  Globe,
  Building2,
  Database,
  FileText,
  ArrowUpRight,
  Search,
  Users,
  Plus,
  Calendar,
  CheckCircle2,
  XCircle,
  Download,
  MoreHorizontal,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/shared/data-table";
import { cn } from "@/lib/utils";
import { useExternalResearchList } from "@/hooks";

// useExternalResearchList provides live data from the API

export default function ExternalResearchPage() {
  const router = useRouter();

  const categories = [
    {
      title: "Global Health Repositories",
      description: "Access international health data and research findings.",
      resources: [
        {
          name: "WHO Global Health Observatory",
          type: "Database",
          url: "https://www.who.int/data/gho",
        },
        {
          name: "Global Burden of Disease (IHME)",
          type: "Statistics",
          url: "https://www.healthdata.org/gbd",
        },
      ],
    },
    {
      title: "National Research Partners",
      description: "Local institutions and regulatory research bodies.",
      resources: [
        {
          name: "Ethiopian Public Health Institute",
          type: "National",
          url: "https://www.ephi.gov.et",
        },
        {
          name: "AAU Institutional Repository",
          type: "Academic",
          url: "http://etd.aau.edu.et",
        },
      ],
    },
  ];

  const columns = [
    {
      accessorKey: "id",
      header: "Reference ID",
      cell: ({ row }: any) => (
        <span className="font-mono text-[10px] font-bold tracking-widest text-primary/70">
          {row.original.id}
        </span>
      ),
    },
    {
      id: "projectTitle",
      accessorKey: "title",
      header: "Research Title / Institution",
      cell: ({ row }: any) => (
        <div className="max-w-[280px] lg:max-w-[380px]">
          <div className="font-bold text-sm leading-tight text-slate-800 truncate">
            {row.original.title}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1 font-medium">
            Authors: {row.original.authors} | Publisher:{" "}
            {row.original.institution}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "year",
      header: "Year",
      cell: ({ row }: any) => (
        <span className="text-xs font-semibold text-slate-600">
          {row.original.year}
        </span>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }: any) => (
        <Badge
          variant="outline"
          className="bg-slate-50 border-slate-200 text-slate-700 text-[9px] font-bold py-0.5 px-2"
        >
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: "grade",
      header: "Evidence Grade",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1.5">
          {row.original.grade === "good" ? (
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-200/50 text-[9px] font-bold py-0.5 px-2"
            >
              <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600 shrink-0" />
              Verified Good
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-rose-50 text-rose-700 border-rose-200/50 text-[9px] font-bold py-0.5 px-2"
            >
              <XCircle className="h-3 w-3 mr-1 text-rose-600 shrink-0" />
              Poor Grade
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-primary/5"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-52 shadow-xl border-primary/10"
          >
            <DropdownMenuItem asChild>
              <Link
                href={`/research/external-research/${row.original.id}`}
                className="cursor-pointer font-bold text-primary"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Full Entry
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <Download className="h-4 w-4 mr-2 text-muted-foreground" />
              Download Document
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
  const { data, isLoading } = useExternalResearchList();

  return (
    <PageContainer
      title="External Research"
      description="Curated international findings and external repository access for evidence-based policy making."
      actions={
        <Button
          className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
          onClick={() => router.push("/research/external-research/add")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Research Entry
        </Button>
      }
    >
      <div className="space-y-8">
        {/* Table list replacing grid */}

        <DataTable
          columns={columns}
          data={data?.data ?? []}
          searchKey="projectTitle"
          searchPlaceholder="Search title, keywords or publishers..."
          emptyMessage="No external research findings found"
        />
      </div>
    </PageContainer>
  );
}
