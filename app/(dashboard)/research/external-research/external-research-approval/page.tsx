"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock3,
  Search,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/shared/data-table";
import { useExternalResearchList, useUpdateExternalResearch } from "@/hooks";
import { toast } from "sonner";

type ReviewDecision = "approved" | "rejected";

export default function ExternalResearchApprovalPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [decision, setDecision] = useState<ReviewDecision>("approved");
  const [remarks, setRemarks] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const { data, isLoading } = useExternalResearchList({
    approval_status: "pending",
    search,
  });
  const updateMutation = useUpdateExternalResearch();

  const pendingCount =
    data?.data?.filter(
      (item) => (item.approval_status ?? "pending") === "pending",
    ).length ?? 0;

  const rows = useMemo(() => data?.data ?? [], [data]);

  const openReviewDialog = (
    id: string | number,
    nextDecision: ReviewDecision,
  ) => {
    setSelectedId(id);
    setDecision(nextDecision);
    setRemarks("");
    setIsOpen(true);
  };

  const submitReview = async () => {
    if (selectedId === null) return;

    try {
      await updateMutation.mutateAsync({
        id: selectedId,
        values: {
          approval_status: decision,
          approval_remarks: remarks,
        },
      });
      toast.success(
        `External research ${decision === "approved" ? "approved" : "rejected"}.`,
      );
      setIsOpen(false);
    } catch {
      toast.error("Unable to save the review decision.");
    }
  };

  const columns = [
    {
      accessorKey: "title",
      header: "Submission",
      cell: ({ row }: any) => (
        <div className="max-w-[320px] space-y-1">
          <div className="font-bold text-sm text-slate-900 truncate">
            {row.original.title}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {row.original.institution} ·{" "}
            {row.original.uploaded_by_name ?? "Unknown submitter"}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "uploaded_at",
      header: "Submitted",
      cell: ({ row }: any) => (
        <span className="text-xs text-muted-foreground">
          {row.original.uploaded_at
            ? new Date(row.original.uploaded_at).toLocaleDateString()
            : "-"}
        </span>
      ),
    },
    {
      accessorKey: "approval_status",
      header: "Status",
      cell: () => (
        <Badge
          variant="outline"
          className="bg-amber-50 border-amber-200 text-amber-700 text-[9px] font-bold uppercase tracking-wide"
        >
          Pending
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }: any) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            asChild
            onClick={(event: React.MouseEvent) => event.stopPropagation()}
          >
            <Link
              href={`/research/external-research/external-research-approval/${row.original.id}`}
            >
              <Eye className="mr-2 h-4 w-4" />
              Review
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-primary/5"
                onClick={(event) => event.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 shadow-xl border-primary/10"
            >
              <DropdownMenuItem asChild>
                <Link
                  href={`/research/external-research/external-research-approval/${row.original.id}`}
                  className="cursor-pointer font-bold text-primary"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Review Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={(event) => {
                  event.stopPropagation();
                  openReviewDialog(row.original.id, "approved");
                }}
              >
                <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />
                Quick Approve
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={(event) => {
                  event.stopPropagation();
                  openReviewDialog(row.original.id, "rejected");
                }}
              >
                <XCircle className="h-4 w-4 mr-2 text-rose-600" />
                Quick Reject
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="External Research Approval"
      description="Review external research submissions and mark them approved or rejected."
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                  Pending
                </p>
                <p className="text-2xl font-black text-slate-900">
                  {pendingCount}
                </p>
              </div>
              <Clock3 className="h-9 w-9 text-amber-500" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                  Approval Queue
                </p>
                <p className="text-2xl font-black text-slate-900">
                  {rows.length}
                </p>
              </div>
              <CheckCircle2 className="h-9 w-9 text-emerald-500" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                  Search
                </p>
                <p className="text-sm text-muted-foreground">
                  Filter by title or institution
                </p>
              </div>
              <Search className="h-9 w-9 text-slate-400" />
            </CardContent>
          </Card>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={rows}
        searchKey="title"
        searchPlaceholder="Search pending submissions..."
        emptyMessage={
          isLoading
            ? "Loading pending submissions..."
            : "No pending external research submissions."
        }
        onRowClick={(item: any) =>
          router.push(
            `/research/external-research/external-research-approval/${item.id}`,
          )
        }
      />


      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision === "approved" ? "Approve" : "Reject"} submission
            </DialogTitle>
            <DialogDescription>
              Add a brief review note before saving the decision.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="approval-remarks">Remarks</Label>
            <Textarea
              id="approval-remarks"
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Leave a note for the submitter or record the review reason."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitReview} disabled={updateMutation.isPending}>
              {decision === "approved" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
