"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import {
  Search,
  Library,
  FileText,
  Globe,
  Lock,
  Shield,
  Download,
  Building2,
  Plus,
  ArrowUpDown,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/layout";
import { DataTable } from "@/components/shared/data-table";
import { cn } from "@/lib/utils";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";

import {
  usePolicyRepository,
  type PolicyRepositoryItem,
} from "@/lib/queries/policy-repository";
import { usePolicyDocumentTypes } from "@/lib/queries/policy-document-types";

const ACCESS_ICONS: Record<
  string,
  { icon: typeof Globe; label: string; className: string }
> = {
  public: {
    icon: Globe,
    label: "Public",
    className:
      "bg-green-100 text-green-700 border-green-200 hover:bg-green-100",
  },
  internal: {
    icon: Shield,
    label: "Internal",
    className: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
  },
  restricted: {
    icon: Lock,
    label: "Restricted",
    className: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100",
  },
};

function formatDate(value?: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function RepositoryDashboardPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");
  const [publishFilter, setPublishFilter] = useState("all");

  const { data: docTypes = [] } = usePolicyDocumentTypes();

  const mappedPublishStatus = useMemo(() => {
    if (publishFilter === "published") return true;
    if (publishFilter === "unpublished") return false;
    return undefined;
  }, [publishFilter]);

  const { data: repositoryResponse, isLoading } = usePolicyRepository({
    search: search || undefined,
    access_level: accessFilter !== "all" ? accessFilter : undefined,
    publish_status: mappedPublishStatus,
    source_draft__doc_type: typeFilter !== "all" ? typeFilter : undefined,
    limit: 100,
  });

  const policiesList = repositoryResponse?.data ?? [];
  const totalItems = repositoryResponse?.meta?.total ?? policiesList.length;

  const stats = useMemo(() => {
    const publishedCount = policiesList.filter(
      (p) => p.status === "Published",
    ).length;

    const uniqueOrgs = new Set<string>();
    const uniqueTypes = new Set<string>();
    policiesList.forEach((p) => {
      if (p.organizationName) uniqueOrgs.add(p.organizationName);
      if (p.docType) uniqueTypes.add(p.docType);
    });

    return {
      total: totalItems,
      published: publishedCount,
      orgs: uniqueOrgs.size,
      types: uniqueTypes.size,
    };
  }, [policiesList, totalItems]);

  const columns: ColumnDef<PolicyRepositoryItem>[] = useMemo(
    () => [
      {
        accessorKey: "draftPolicy",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-0 font-semibold hover:bg-transparent"
          >
            Policy
            <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
          </Button>
        ),
        cell: ({ row }) => {
          const policy = row.original;
          return (
            <div className="min-w-[240px] max-w-[360px] py-1">
              <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                {policy.draftPolicy}
              </p>
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                {policy.organizationName || "—"}
              </p>
              <p className="mt-1 w-fit rounded border border-dashed bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {policy.serialNumber || policy.versionCode || "—"}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "docType",
        header: "Type",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="text-[10px] font-bold uppercase"
          >
            {row.original.docType || "—"}
          </Badge>
        ),
      },
      {
        accessorKey: "accessLevel",
        header: "Access",
        cell: ({ row }) => {
          const accessKey = (row.original.accessLevel ?? "public").toLowerCase();
          const accessCfg = ACCESS_ICONS[accessKey] ?? ACCESS_ICONS.public;
          const AccessIcon = accessCfg.icon;
          return (
            <Badge
              variant="outline"
              className={cn(
                "flex w-fit items-center gap-1 text-[10px] font-bold",
                accessCfg.className,
              )}
            >
              <AccessIcon className="h-2.5 w-2.5" />
              {accessCfg.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "effectiveDate",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 font-semibold hover:bg-transparent"
          >
            Effective
            <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {formatDate(row.original.effectiveDate)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const isPublished = row.original.status === "Published";
          return (
            <Badge
              className={cn(
                "text-[10px] font-bold",
                isPublished
                  ? "border border-green-200 bg-green-100 text-green-700 hover:bg-green-100"
                  : "border border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-100",
              )}
            >
              {row.original.status}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const policy = row.original;
          if (!policy.draftFile) return null;
          return (
            <div
              className="flex justify-end"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 text-primary hover:bg-muted"
                asChild
              >
                <a
                  href={resolveFileUrl(policy.draftFile) ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Download document"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            </div>
          );
        },
      },
    ],
    [],
  );

  const toolbar = (
    <div className="flex flex-col gap-4 bg-card p-4 rounded-xl border shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Policy registry</p>
          <p className="text-xs text-muted-foreground">
            {totalItems} polic{totalItems === 1 ? "y" : "ies"} found
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search title, serial, org…"
              className="h-10 w-full pl-9 sm:w-60 focus-visible:ring-primary/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-10 w-40 focus:ring-primary/20">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {docTypes.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={accessFilter} onValueChange={setAccessFilter}>
            <SelectTrigger className="h-10 w-32 focus:ring-primary/20">
              <SelectValue placeholder="Access" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All access</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="restricted">Restricted</SelectItem>
            </SelectContent>
          </Select>

          <Select value={publishFilter} onValueChange={setPublishFilter}>
            <SelectTrigger className="h-10 w-36 focus:ring-primary/20">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="unpublished">Unpublished</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  return (
    <PageContainer
      title="Policy Repository"
      description="National Policy Knowledge Management System — registered, versioned, and published policy documents"
      actions={
        <Button
          asChild
          className="bg-primary text-white shadow-md hover:bg-primary/90"
        >
          <Link href="/policies/repository/create">
            <Plus className="mr-2 h-4 w-4" />
            Register Policy
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total registered",
              value: stats.total,
              icon: Library,
              color: "text-primary",
              bg: "bg-primary/10",
              border: "border-primary/20",
            },
            {
              label: "Published",
              value: stats.published,
              icon: Globe,
              color: "text-green-600",
              bg: "bg-green-50",
              border: "border-green-200",
            },
            {
              label: "Organizations",
              value: stats.orgs,
              icon: Building2,
              color: "text-blue-600",
              bg: "bg-blue-50",
              border: "border-blue-200",
            },
            {
              label: "Document types",
              value: stats.types,
              icon: FileText,
              color: "text-purple-600",
              bg: "bg-purple-50",
              border: "border-purple-200",
            },
          ].map((stat) => (
            <Card key={stat.label} className={cn("border shadow-sm", stat.border)}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className={cn("shrink-0 rounded-xl p-3", stat.bg)}>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <div>
                  <p className="text-2xl font-black">{stat.value}</p>
                  <p className="text-xs font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {isLoading ? (
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
            <Skeleton className="h-10 w-full max-w-md" />
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={policiesList}
            toolbar={toolbar}
            onRowClick={(policy) =>
              router.push(`/policies/repository/${policy.id}`)
            }
            emptyMessage="No policies match your criteria"
            emptyDescription="Try adjusting your filters or search term."
          />
        )}
      </div>
    </PageContainer>
  );
}
