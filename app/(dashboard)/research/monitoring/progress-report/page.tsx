"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";

import { PageContainer } from "@/components/layout";
import { DataTable } from "@/components/shared/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function ProgressReportListPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<
    "all" | "on_progress" | "completed" | "terminated"
  >("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formValues, setFormValues] = useState({
    proposal: "",
  });

  const router = useRouter();

  // Fetch projects ready for final submission to populate select options
  const { data: readyProjects } = useReadyForTracking();

  const createMutation = useCreateProjectTracking();

  const queryParams = useMemo(
    () => ({
      page,
      limit: 10,
      search: search || undefined,
      status: status === "all" ? undefined : status,
    }),
    [page, search, status],
  );

  const { data, isLoading, refetch } = useProjectTracking(queryParams);
  const trackingRecords = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 };

  const stats = [
    { label: "Total", value: meta.total },
    {
      label: "On Progress",
      value: trackingRecords.filter((record) => record.status === "on_progress")
        .length,
    },
    {
      label: "Completed",
      value: trackingRecords.filter((record) => record.status === "completed")
        .length,
    },
    {
      label: "Terminated",
      value: trackingRecords.filter((record) => record.status === "terminated")
        .length,
    },
  ];

  const columns = [
    {
      accessorKey: "id",
      header: "Tracking ID",
      cell: ({ row }: any) => (
        <span className="font-mono text-[11px] font-semibold text-primary/80">
          #{row.original.id}
        </span>
      ),
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
            {row.original.referenceNumber || "-"}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "pi",
      header: "PI",
      cell: ({ row }: any) => (
        <div className="max-w-60">
          <div className="font-semibold truncate">
            {row.original.pi?.fullName || "-"}
          </div>
          <div className="text-[11px] text-muted-foreground truncate">
            {row.original.pi?.email || "-"}
          </div>
        </div>
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
      {/* Create Project Tracking Modal */}
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

              createMutation.mutate(
                {
                  proposal: Number(formValues.proposal),
                },
                {
                  onSuccess: () => {
                    setIsDialogOpen(false);
                    setFormValues({
                      proposal: "",
                    });
                  },
                },
              );
            }}
          >
            <div>
              <label className="block text-sm font-medium mb-1">Proposal</label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2"
                value={formValues.proposal}
                onChange={(e) =>
                  setFormValues({
                    ...formValues,
                    proposal: e.target.value,
                  })
                }
                required
              >
                <option value="">Select proposal</option>
                {readyProjects?.map((proj: any) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.referenceNumber || proj.reference_number || proj.id}{" "}
                    {proj.proposalTitle || proj.proposal_title
                      ? `(${proj.proposalTitle || proj.proposal_title})`
                      : ""}
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={createMutation.isPending}>
                Submit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="border-none shadow-sm">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-20" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-12" />
                  </CardContent>
                </Card>
              ))
            : stats.map((item) => (
                <Card key={item.label} className="border-none shadow-sm">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      {item.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black">{item.value}</div>
                  </CardContent>
                </Card>
              ))}
        </div>

        <DataTable
          columns={columns}
          onRowClick={(row) =>
            router.push(`/research/monitoring/progress-report/${row.id}`)
          }
          data={trackingRecords}
          emptyMessage="No project tracking records found"
          emptyDescription="Try changing your search text or status filter."
        />
      </div>
    </PageContainer>
  );
}
