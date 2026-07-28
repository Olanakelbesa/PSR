"use client";

import { useCallback, useMemo, useState } from "react";
import {
  BarChart3,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  XCircle,
  PlayCircle,
  Search,
  PlusCircle,
  ArrowRight,
  FileText,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { DataTable } from "@/components/shared/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  useProjectTracking,
  useReadyForTracking,
  useCreateProjectTracking,
} from "@/hooks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useRouter } from "next/dist/client/components/navigation";
import { cn } from "@/lib/utils";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { toast } from "sonner";

const statusLabels = {
  on_progress: "On Progress",
  completed: "Completed Successfully",
  terminated: "Terminated without Completion",
} as const;

const statusClasses = {
  on_progress: "bg-sky-50 text-sky-700 border-sky-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  terminated: "bg-rose-50 text-rose-700 border-rose-200",
} as const;

type StatFilter = "all" | "on_progress" | "completed" | "terminated" | "ready_for_tracking";

const ALL_VALUE = "all";

function ReferenceCell({ refNum }: { refNum: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!refNum || refNum === "-") return;
    navigator.clipboard.writeText(refNum);
    setCopied(true);
    toast.success("Reference number copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!refNum || refNum === "-") {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  return (
    <div className="inline-flex items-center gap-1.5 bg-muted/60 hover:bg-muted dark:bg-muted/40 px-2 py-0.5 rounded-md border border-border/50 transition-colors max-w-fit">
      <span className="font-mono text-xs font-bold text-primary truncate">
        {refNum}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground shrink-0"
        onClick={handleCopy}
        title="Copy reference number"
      >
        {copied ? (
          <Check className="h-3 w-3 text-emerald-500" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}

function TrackingIdCell({ id }: { id: string | number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!id) return;
    const valueToCopy = String(id).replace(/^#/, "");
    navigator.clipboard.writeText(valueToCopy);
    setCopied(true);
    toast.success("Tracking ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!id) return <span className="text-xs text-muted-foreground">-</span>;

  return (
    <div className="inline-flex items-center gap-1.5 bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 transition-colors max-w-fit">
      <span className="font-mono text-xs font-bold text-primary truncate">
        #{id}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-3.5 w-3.5 p-0 text-muted-foreground hover:text-foreground shrink-0"
        onClick={handleCopy}
        title="Copy tracking ID"
      >
        {copied ? (
          <Check className="h-3 w-3 text-emerald-500" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}

function PICell({ pi }: { pi: any }) {
  if (!pi) return <span className="text-xs text-muted-foreground">-</span>;
  const name =
    typeof pi === "string"
      ? pi
      : pi.fullName || pi.full_name || pi.name || pi.email || "PI";
  const email = typeof pi === "object" ? pi.email : null;
  const rawPhoto =
    typeof pi === "object"
      ? pi.photo || pi.photo_url || pi.photoUrl || pi.avatarUrl
      : null;
  const avatarUrl = resolveFileUrl(rawPhoto) || undefined;
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "PI";

  return (
    <div className="flex items-center gap-2.5 min-w-[170px]">
      <Avatar className="h-8 w-8 border border-border/60 shrink-0">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
        <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-bold text-foreground truncate">{name}</span>
        {email && <span className="text-[10px] text-muted-foreground truncate">{email}</span>}
      </div>
    </div>
  );
}

export default function ProgressReportListPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatFilter>(ALL_VALUE);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isReadyDialogOpen, setIsReadyDialogOpen] = useState(false);
  const [readySearchQuery, setReadySearchQuery] = useState("");
  const [formValues, setFormValues] = useState({ proposal: "" });

  const router = useRouter();

  const { data: readyProjects } = useReadyForTracking();
  const createMutation = useCreateProjectTracking();

  const applyStatusFilter = useCallback((filter: StatFilter) => {
    if (filter === "ready_for_tracking") {
      setIsReadyDialogOpen(true);
      return;
    }
    setStatusFilter((current) => (current === filter ? ALL_VALUE : filter));
  }, []);

  const queryParams = useMemo(
    () => ({
      page: 1,
      limit: 100,
      scope: "my",
      search: search || undefined,
      status: statusFilter !== ALL_VALUE && statusFilter !== "ready_for_tracking" ? statusFilter : undefined,
    }),
    [search, statusFilter],
  );

  const { data, isLoading } = useProjectTracking(queryParams);
  const trackingRecords = data?.data ?? [];
  const stats = (data?.meta as Record<string, unknown>)?.statistics as
    | { total: number; onProgress: number; completed: number; terminated: number }
    | undefined;

  const filteredTrackingRecords = useMemo(() => {
    let list = trackingRecords;
    const query = search.trim().toLowerCase();
    if (query) {
      list = list.filter((r: any) => {
        const title = (r.proposalTitle || r.proposal?.title || "").toLowerCase();
        const ref = (r.referenceNumber || r.reference_number || r.proposal?.reference_number || "").toLowerCase();
        const piName = (r.pi?.fullName || r.pi?.full_name || r.pi?.name || r.pi?.email || "").toLowerCase();
        const idStr = String(r.id || "");
        return title.includes(query) || ref.includes(query) || piName.includes(query) || idStr.includes(query);
      });
    }
    return list;
  }, [trackingRecords, search]);

  const filteredReadyProjects = useMemo(() => {
    if (!readyProjects) return [];
    const query = readySearchQuery.trim().toLowerCase();
    if (!query) return readyProjects;
    return readyProjects.filter((proj: any) => {
      const ref = (proj.referenceNumber || proj.reference_number || "").toLowerCase();
      const title = (proj.proposalTitle || proj.proposal_title || "").toLowerCase();
      const pi = (proj.piName || proj.pi_name || "").toLowerCase();
      return ref.includes(query) || title.includes(query) || pi.includes(query);
    });
  }, [readyProjects, readySearchQuery]);

  const handleStartTracking = (proposalId: number | string) => {
    createMutation.mutate(
      { proposal: Number(proposalId) },
      {
        onSuccess: () => {
          setIsReadyDialogOpen(false);
          setIsDialogOpen(false);
          setFormValues({ proposal: "" });
          toast.success("Project tracking initialized successfully.");
        },
      },
    );
  };

  const statCards = useMemo(
    () => [
      {
        key: "all" as StatFilter,
        label: "Total",
        value: stats?.total ?? 0,
        icon: BarChart3,
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20",
        activeRing: "ring-primary/50 border-primary/40",
        sub: "All tracking records",
      },
      {
        key: "ready_for_tracking" as StatFilter,
        label: "Ready for Tracking",
        value: readyProjects?.length ?? 0,
        icon: PlayCircle,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        activeRing: "ring-amber-500/60 border-amber-300",
        sub: "Funded proposals to track",
      },
      {
        key: "on_progress" as StatFilter,
        label: "On Progress",
        value: stats?.onProgress ?? 0,
        icon: Clock,
        color: "text-sky-600",
        bg: "bg-sky-50",
        border: "border-sky-200",
        activeRing: "ring-sky-500/60 border-sky-300",
        sub: "Active projects",
      },
      {
        key: "completed" as StatFilter,
        label: "Completed",
        value: stats?.completed ?? 0,
        icon: CheckCircle2,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        activeRing: "ring-emerald-500/60 border-emerald-300",
        sub: "Successfully completed",
      },
      {
        key: "terminated" as StatFilter,
        label: "Terminated",
        value: stats?.terminated ?? 0,
        icon: XCircle,
        color: "text-rose-600",
        bg: "bg-rose-50",
        border: "border-rose-200",
        activeRing: "ring-rose-500/60 border-rose-300",
        sub: "Terminated early",
      },
    ],
    [stats, readyProjects],
  );

  const columns = [
    {
      accessorKey: "referenceNumber",
      header: "Reference",
      cell: ({ row }: any) => (
        <ReferenceCell
          refNum={
            row.original.referenceNumber ||
            row.original.reference_number ||
            row.original.proposal?.reference_number ||
            "-"
          }
        />
      ),
    },
    {
      accessorKey: "id",
      header: "Tracking ID",
      cell: ({ row }: any) => <TrackingIdCell id={row.original.id} />,
    },
    {
      accessorKey: "proposalTitle",
      header: "Proposal",
      cell: ({ row }: any) => (
        <div className="max-w-[320px]">
          <div className="font-semibold truncate">
            {row.original.proposalTitle || row.original.proposal?.title || "-"}
          </div>
          <div className="text-[11px] text-muted-foreground truncate">
            {row.original.referenceNumber || row.original.reference_number || "-"}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "pi",
      header: "Principal Investigator",
      cell: ({ row }: any) => (
        <PICell
          pi={
            row.original.pi ||
            row.original.principalInvestigator ||
            row.original.proposal?.created_by
          }
        />
      ),
    },
    {
      accessorKey: "totalAwardAmount",
      header: "Award Amount",
      cell: ({ row }: any) => (
        <span className="font-mono text-[12px] font-semibold">
          {row.original.totalAwardAmount
            ? `ETB ${Number(row.original.totalAwardAmount).toLocaleString()}`
            : "-"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => {
        const value = row.original.status as keyof typeof statusLabels;
        return (
          <Badge variant="outline" className={statusClasses[value]}>
            {statusLabels[value]}
          </Badge>
        );
      },
    },
    {
      accessorKey: "generalStatus",
      header: "General Status",
      cell: ({ row }: any) => (
        <Badge
          variant="outline"
          className="bg-muted text-muted-foreground border-muted"
        >
          {row.original.generalStatus
            ? row.original.generalStatus
                .replace(/_/g, " ")
                .replace(/\b\w/g, (letter: string) => letter.toUpperCase())
            : "-"}
        </Badge>
      ),
    },
  ];

  return (
    <PageContainer
      title="Project Tracking"
      description="Track funded proposals that have been opened for monitoring and follow-up."
      actions={
        <Button onClick={() => setIsDialogOpen(true)}>
          Create Project Tracking
        </Button>
      }
    >
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Project Tracking</DialogTitle>
            <DialogDescription>
              Select a proposal to create a project tracking record for it.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!formValues.proposal) {
                toast.error("Please select a proposal.");
                return;
              }
              createMutation.mutate(
                { proposal: Number(formValues.proposal) },
                {
                  onSuccess: () => {
                    setIsDialogOpen(false);
                    setFormValues({ proposal: "" });
                    toast.success("Project tracking initialized successfully.");
                  },
                },
              );
            }}
          >
            <div>
              <label className="block text-sm font-medium mb-1.5">Proposal</label>
              <SearchableSelect
                value={formValues.proposal}
                onValueChange={(val) => setFormValues({ ...formValues, proposal: val })}
                placeholder="Search and select proposal..."
                searchPlaceholder="Search by proposal title or reference number..."
                additionalOptions={readyProjects ?? []}
                getOptionValue={(proj: any) => String(proj.id)}
                getOptionLabel={(proj: any) => {
                  const ref = proj.referenceNumber || proj.reference_number || `#${proj.id}`;
                  const title = proj.proposalTitle || proj.proposal_title || "Untitled proposal";
                  return `${ref} · ${title}`;
                }}
                selectedLabel={
                  readyProjects
                    ? (() => {
                        const sel = readyProjects.find((p: any) => String(p.id) === formValues.proposal);
                        if (!sel) return undefined;
                        const ref = sel.referenceNumber || sel.reference_number || `#${sel.id}`;
                        const title = sel.proposalTitle || sel.proposal_title || "Untitled proposal";
                        return `${ref} · ${title}`;
                      })()
                    : undefined
                }
              />
            </div>
            <DialogFooter className="pt-2">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={createMutation.isPending || !formValues.proposal}>
                {createMutation.isPending ? "Creating..." : "Submit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ready for Project Tracking Dialog */}
      <Dialog open={isReadyDialogOpen} onOpenChange={setIsReadyDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-6">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-600">
              <PlayCircle className="h-5 w-5" />
              <DialogTitle>Proposals Ready for Project Tracking</DialogTitle>
            </div>
            <DialogDescription>
              Funded proposals eligible to create a project tracking record.
            </DialogDescription>
          </DialogHeader>

          <div className="relative my-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search ready proposals by title, ref #, or PI..."
              value={readySearchQuery}
              onChange={(e) => setReadySearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[50vh]">
            {filteredReadyProjects.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
                <FileText className="mx-auto h-8 w-8 opacity-40 mb-2" />
                <p className="text-sm font-medium">No proposals ready for project tracking</p>
                <p className="text-xs text-muted-foreground">
                  {readySearchQuery.trim()
                    ? "No proposals match your search query."
                    : "Proposals must complete funding decisions before tracking."}
                </p>
              </div>
            ) : (
              filteredReadyProjects.map((proj: any) => {
                const ref = proj.referenceNumber || proj.reference_number || `#${proj.id}`;
                const title = proj.proposalTitle || proj.proposal_title || "Untitled Proposal";
                const pi = proj.piName || proj.pi_name;

                return (
                  <div
                    key={proj.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-card hover:border-amber-300 hover:shadow-sm transition-all"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs bg-amber-50 text-amber-800 border-amber-200">
                          {ref}
                        </Badge>
                        {pi && (
                          <span className="text-xs text-muted-foreground truncate">
                            PI: {pi}
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-sm line-clamp-1">{title}</h4>
                    </div>
                    <Button
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 gap-1.5 shadow-xs"
                      disabled={createMutation.isPending}
                      onClick={() => handleStartTracking(proj.id)}
                    >
                      <PlusCircle className="h-4 w-4" />
                      Track Now
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter className="mt-3 border-t pt-3">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          {isLoading
            ? Array.from({ length: 5 }).map((_, index) => (
                <Card key={index} className="border-none shadow-sm">
                  <CardContent className="flex items-center gap-4 p-5">
                    <Skeleton className="h-11 w-11 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-7 w-16" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </CardContent>
                </Card>
              ))
            : statCards.map((stat) => {
                const isActive = statusFilter === stat.key;
                return (
                  <Card
                    key={stat.key}
                    role="button"
                    tabIndex={0}
                    onClick={() => applyStatusFilter(stat.key)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        applyStatusFilter(stat.key);
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
                        <div className="text-2xl font-black">{stat.value}</div>
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

        {statusFilter !== ALL_VALUE && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusFilter(ALL_VALUE)}
              className="h-7 text-xs"
            >
              Clear filter
            </Button>
          </div>
        )}

        <DataTable
          columns={columns}
          searchKey="proposalTitle"
          searchPlaceholder="Search project title, reference, or PI..."
          searchValue={search}
          onSearchChange={setSearch}
          initialColumnVisibility={{ referenceNumber: false }}
          onRowClick={(row) =>
            router.push(`/research/monitoring/progress-report/${row.id}`)
          }
          data={filteredTrackingRecords}
          emptyMessage="No project tracking records found"
          emptyDescription="Try changing your search text or status filter."
        />
      </div>
    </PageContainer>
  );
}
