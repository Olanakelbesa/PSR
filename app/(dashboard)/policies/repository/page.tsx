"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import {
  Search,
  Library,
  FileCheck2,
  FileClock,
  Download,
  Plus,
  Pencil,
  ArrowUpDown,
  Loader2,
  Globe,
  Lock,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  downloadRemoteFile,
  extractFileName,
} from "@/lib/utils/resolve-file-url";
import { tokenStorage } from "@/lib/axios";

import {
  usePolicyRepository,
  useRecordPolicyDownload,
  type PolicyRepositoryItem,
  type PolicyRepositoryResponse,
} from "@/lib/queries/policy-repository";
import { usePolicyDocumentTypes } from "@/lib/queries/policy-document-types";

type RepositoryQueueFilter = "all" | "ready" | "published" | "unpublished";
type RepositoryStatistics = NonNullable<
  PolicyRepositoryResponse["meta"]["statistics"]
>;

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
  const [queueFilter, setQueueFilter] =
    useState<RepositoryQueueFilter>("all");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const { data: docTypes = [] } = usePolicyDocumentTypes();
  const recordDownload = useRecordPolicyDownload();

  const mappedPublishStatus = useMemo(() => {
    if (queueFilter === "published") return true;
    if (queueFilter === "unpublished") return false;
    return undefined;
  }, [queueFilter]);

  const { data: repositoryResponse, isLoading } = usePolicyRepository({
    search: search || undefined,
    access_level: accessFilter !== "all" ? accessFilter : undefined,
    publish_status: mappedPublishStatus,
    source_draft__doc_type: typeFilter !== "all" ? typeFilter : undefined,
    limit: 100,
  });

  const policiesList = repositoryResponse?.data ?? [];
  const totalItems = repositoryResponse?.meta?.total ?? policiesList.length;
  const statistics: RepositoryStatistics | undefined =
    repositoryResponse?.meta?.statistics;

  const stats = useMemo(() => {
    const publishedFromList = policiesList.filter(
      (p) => p.status === "Published",
    ).length;
    const unpublishedFromList = policiesList.filter(
      (p) => p.status !== "Published",
    ).length;

    return {
      total: statistics?.totalRegistered ?? totalItems,
      readyForRegistration: statistics?.readyForRegistration ?? 0,
      published: statistics?.published ?? publishedFromList,
      unpublished: statistics?.unpublished ?? unpublishedFromList,
    };
  }, [policiesList, statistics, totalItems]);

  const applyQueueFilter = (filter: RepositoryQueueFilter) => {
    if (filter === "ready") {
      router.push("/policies/repository/create");
      return;
    }
    setQueueFilter((current) => (current === filter ? "all" : filter));
  };

  const handleDownload = useCallback(
    async (policy: PolicyRepositoryItem, event?: React.MouseEvent) => {
      event?.stopPropagation();

      if (!policy.draftFile) {
        toast.error("No document file is available for this policy.");
        return;
      }

      setDownloadingId(policy.id);
      try {
        let fileUrl = policy.draftFile;

        try {
          const result = await recordDownload.mutateAsync(policy.id);
          fileUrl = result.draftFile ?? fileUrl;
        } catch {
          // Still download if the count endpoint is unavailable.
        }

        await downloadRemoteFile(
          fileUrl,
          extractFileName(policy.draftFile),
          { token: tokenStorage.get() },
        );
      } catch {
        toast.error("Failed to download document.");
      } finally {
        setDownloadingId(null);
      }
    },
    [recordDownload],
  );

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
        accessorKey: "downloadCount",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-0 font-semibold hover:bg-transparent"
          >
            Downloads
            <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="tabular-nums text-sm font-medium text-muted-foreground">
            {row.original.downloadCount ?? 0}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const policy = row.original;
          const isDownloading = downloadingId === policy.id;
          return (
            <div
              className="flex justify-end gap-1.5"
              onClick={(event) => event.stopPropagation()}
            >
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 px-2.5"
                asChild
              >
                <Link href={`/policies/repository/${policy.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Link>
              </Button>
              {policy.draftFile ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 px-2.5 text-primary hover:bg-muted"
                  disabled={isDownloading}
                  title="Download document"
                  onClick={(event) => void handleDownload(policy, event)}
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Download
                </Button>
              ) : null}
            </div>
          );
        },
      },
    ],
    [downloadingId, handleDownload],
  );

  const toolbar = (
    <div className="flex flex-col gap-4 bg-card p-4 rounded-xl border shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Policy registry</p>
          <p className="text-xs text-muted-foreground">
            {queueFilter === "published"
              ? "Showing published policies"
              : queueFilter === "unpublished"
                ? "Showing unpublished policies"
                : `${totalItems} polic${totalItems === 1 ? "y" : "ies"} found`}
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

          {(queueFilter === "published" || queueFilter === "unpublished") && (
            <Button
              variant="outline"
              size="sm"
              className="h-10"
              onClick={() => setQueueFilter("all")}
            >
              Clear status filter
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  const statCards: Array<{
    key: RepositoryQueueFilter;
    label: string;
    value: number;
    icon: typeof Library;
    color: string;
    bg: string;
    border: string;
    activeRing: string;
    sub: string;
  }> = [
    {
      key: "all",
      label: "Total registered",
      value: stats.total,
      icon: Library,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
      activeRing: "ring-primary/50 border-primary/40",
      sub: "In the policy registry",
    },
    {
      key: "ready",
      label: "Ready for Repository registration",
      value: stats.readyForRegistration,
      icon: FileCheck2,
      color: "text-teal-600",
      bg: "bg-teal-50",
      border: "border-teal-200",
      activeRing: "ring-teal-500/60 border-teal-300",
      sub: "Approved drafts awaiting registration",
    },
    {
      key: "published",
      label: "Published",
      value: stats.published,
      icon: Globe,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200",
      activeRing: "ring-green-500/60 border-green-300",
      sub: "Live in the public registry",
    },
    {
      key: "unpublished",
      label: "Unpublished",
      value: stats.unpublished,
      icon: FileClock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      activeRing: "ring-amber-500/60 border-amber-300",
      sub: "Registered but not yet published",
    },
  ];

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
          {statCards.map((stat) => {
            const isActive = queueFilter === stat.key;

            return (
              <Card
                key={stat.key}
                role="button"
                tabIndex={0}
                onClick={() => applyQueueFilter(stat.key)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    applyQueueFilter(stat.key);
                  }
                }}
                className={cn(
                  "cursor-pointer border shadow-sm transition-all hover:shadow-md",
                  stat.border,
                  isActive && cn("ring-2 shadow-md", stat.activeRing),
                )}
              >
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={cn("shrink-0 rounded-xl p-3", stat.bg)}>
                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                  </div>
                  <div>
                    <div className="text-2xl font-black">
                      {isLoading ? (
                        <Skeleton className="h-8 w-12" />
                      ) : (
                        stat.value
                      )}
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                      {stat.sub}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
