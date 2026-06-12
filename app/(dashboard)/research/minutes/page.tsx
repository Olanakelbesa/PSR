"use client";

import { useMemo, useRef, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import {
  CalendarDays,
  FileText,
  Filter,
  FolderUp,
  Library,
  Plus,
  Search,
  Upload,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import { useCreateMinute, useMinutes } from "@/hooks";
import type { MinuteRecord } from "@/types/minutes";

type MinuteRow = MinuteRecord & {
  searchText: string;
};

function resolveFileUrl(filePath?: string | null) {
  if (!filePath) return "#";
  if (/^https?:\/\//i.test(filePath)) return filePath;
  if (filePath.startsWith("/bff")) return filePath;
  if (filePath.startsWith("/")) return `/bff${filePath}`;
  return `/bff/${filePath}`;
}

function extractFileName(filePath?: string | null) {
  if (!filePath) return "No file";
  return filePath.split("/").pop() || filePath;
}

const minuteColumns: ColumnDef<MinuteRow>[] = [
  {
    id: "searchText",
    accessorFn: (row) => [row.budgetYear, row.file].join(" ").toLowerCase(),
    cell: () => null,
    enableHiding: true,
  },
  {
    accessorKey: "budgetYear",
    header: "Budget Year",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/10 bg-primary/5 text-primary shadow-sm">
          <CalendarDays className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">
            {row.original.budgetYear}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Minutes register year
          </p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "file",
    header: "File",
    cell: ({ row }) => {
      const fileName = extractFileName(row.original.file);

      return (
        <div className="space-y-1">
          <p className="line-clamp-1 text-sm font-medium text-slate-700">
            {fileName}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Uploaded minutes document
          </p>
        </div>
      );
    },
  },
  {
    id: "action",
    header: "Action",
    cell: ({ row }) => (
      <div className="flex justify-end">
        <Button
          asChild
          variant="ghost"
          className="h-10 rounded-xl bg-slate-50 px-4 text-xs font-bold uppercase tracking-widest hover:bg-primary/5 hover:text-primary"
        >
          <Link
            href={resolveFileUrl(row.original.file)}
            target="_blank"
            rel="noreferrer"
          >
            Open File
          </Link>
        </Button>
      </div>
    ),
  },
];

function MinuteCreateModal({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { budget_year: string; file: File }) => void;
  isPending: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [budgetYear, setBudgetYear] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const resetForm = () => {
    setBudgetYear("");
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      resetForm();
    }
  };

  const handleSubmit = () => {
    if (!budgetYear.trim()) {
      toast.error("Budget year is required.");
      return;
    }

    if (!file) {
      toast.error("Please upload the minutes file.");
      return;
    }

    onSubmit({ budget_year: budgetYear.trim(), file });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl  p-0 shadow-2xl">
        <DialogHeader className="border-b bg-slate-50/80 px-6 py-5 text-left">
          <DialogTitle className="flex items-center gap-2">
            <FolderUp className="h-5 w-5 text-primary" />
            Register Minutes
          </DialogTitle>
          <DialogDescription>
            Upload a signed minutes document and attach it to the correct budget
            year.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 px-6 py-6">
          <div className="grid gap-2">
            <Label htmlFor="budget_year" className="text-sm font-medium">
              Budget Year <span className="text-destructive">*</span>
            </Label>
            <Input
              id="budget_year"
              value={budgetYear}
              onChange={(event) => setBudgetYear(event.target.value)}
              placeholder="e.g. 2026"
              className="h-11 rounded-xl"
              inputMode="numeric"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="minutes_file" className="text-sm font-medium">
              File <span className="text-destructive">*</span>
            </Label>
            <div className="rounded-2xl border border-dashed border-muted-foreground/20 bg-slate-50 p-4">
              <input
                ref={fileInputRef}
                id="minutes_file"
                type="file"
                className="hidden"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {file ? file.name : "No file selected"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Upload the minutes document as PDF, DOC, DOCX, or image.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose File
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-slate-700">
            The record will be saved directly to the minutes registry. Keep the
            uploaded file readable and named clearly for later retrieval.
          </div>
        </div>

        <Separator />

        <DialogFooter className="px-6 py-5">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
          >
            Cancel
          </Button>
          <Button
            className="px-5"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Save Minutes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function MinutesPage() {
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useMinutes({
    page: 1,
    limit: 100,
    ordering: "-id",
  });

  const createMutation = useCreateMinute();

  const minutes = useMemo<MinuteRow[]>(
    () =>
      (data?.data ?? []).map((item) => ({
        ...item,
        searchText: [item.budgetYear, item.file].join(" ").toLowerCase(),
      })),
    [data?.data],
  );

  const totalMinutes = data?.meta?.total ?? minutes.length;

  return (
    <PageContainer
      title="Minutes"
      description="Manage approved meeting minutes and attach the official document for each budget year."
      actions={
        <Button
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Minutes
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="overflow-hidden border border-muted-foreground/10 shadow-sm">
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Total Records
                </p>
                <p className="mt-1 text-2xl font-black text-slate-900">
                  {totalMinutes}
                </p>
              </div>
              <div className="rounded-2xl bg-primary/5 p-3 text-primary">
                <Library className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border border-muted-foreground/10 shadow-sm">
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Latest Budget Year
                </p>
                <p className="mt-1 text-2xl font-black text-slate-900">
                  {minutes[0]?.budgetYear || "-"}
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                <CalendarDays className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border border-muted-foreground/10 shadow-sm">
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Search Ready
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  Budget year and file name search
                </p>
              </div>
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                <Search className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <Card className="overflow-hidden border border-muted-foreground/10 shadow-sm">
            <div className="space-y-4 p-5">
              <div className="flex items-center justify-between gap-4">
                <Skeleton className="h-10 w-[340px] rounded-xl" />
                <Skeleton className="h-10 w-[130px] rounded-xl" />
              </div>
              <div className="space-y-3">
                {[...Array(5)].map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full rounded-2xl" />
                ))}
              </div>
            </div>
          </Card>
        ) : (
          <DataTable
            columns={minuteColumns}
            data={minutes}
            searchKey="searchText"
            searchPlaceholder="Search minutes by budget year or file name..."
            initialColumnVisibility={{
              searchText: false,
            }}
            emptyMessage="No minutes found"
            emptyDescription="Use Add Minutes to upload the first record."
          />
        )}
      </div>

      <MinuteCreateModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        isPending={createMutation.isPending}
        onSubmit={async (values) => {
          try {
            await createMutation.mutateAsync(values);
            toast.success("Minutes record saved successfully.");
            setCreateOpen(false);
          } catch (error: any) {
            const message =
              error?.response?.data?.message ||
              error?.message ||
              "Failed to save minutes record.";
            toast.error(message);
          }
        }}
      />
    </PageContainer>
  );
}
