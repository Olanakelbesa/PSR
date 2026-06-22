"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import {
  Download,
  FileText,
  FolderUp,
  Library,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { DataTable } from "@/components/shared/data-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAttachments,
  useCreateAttachment,
  useDeleteAttachment,
  useUpdateAttachment,
} from "@/hooks";
import { tokenStorage } from "@/api/client";
import type { AttachmentRecord } from "@/types/attachments";
import { extractFileName, resolveFileUrl, downloadRemoteFile } from "@/lib/utils/resolve-file-url";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ACCEPTED_FILE_TYPES = ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type AttachmentRow = AttachmentRecord & {
  searchText: string;
};

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function documentTypeLabel(value?: string | null) {
  if (!value) return "—";
  if (value === "pdf") return "PDF";
  if (value === "doc") return "DOC / DOCX";
  return value.toUpperCase();
}

function documentTypeBadgeClass(value?: string | null) {
  if (value === "pdf") return "border-blue-200 bg-blue-50 text-blue-700";
  if (value === "doc") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function isAllowedFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension === "pdf" || extension === "doc" || extension === "docx";
}

function openAttachmentFile(attachment: AttachmentRecord) {
  const url = resolveFileUrl(attachment.attachment);
  if (!url) {
    toast.error("File URL is unavailable.");
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

async function downloadAttachmentFile(attachment: AttachmentRecord) {
  try {
    await downloadRemoteFile(
      attachment.attachment,
      extractFileName(attachment.attachment),
      { token: tokenStorage.get() },
    );
  } catch {
    toast.error("Failed to download file.");
  }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function AttachmentFormModal({
  open,
  mode,
  initialValues,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: AttachmentRecord | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { title: string; file?: File | null }) => void;
  isPending: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const hasNewFile = !!file;
  const hasExistingFile =
    mode === "edit" && !!initialValues?.attachment && !hasNewFile;
  const hasFileSelected = hasNewFile || hasExistingFile;
  const displayFileName = hasNewFile
    ? file.name
    : hasExistingFile
      ? extractFileName(initialValues?.attachment)
      : null;

  const clearFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (nextFile: File | null) => {
    setFile(nextFile);
    clearFileInput();
  };

  useEffect(() => {
    if (!open) return;
    setTitle(initialValues?.title ?? "");
    setFile(null);
    clearFileInput();
  }, [open, initialValues, mode]);

  const resetForm = () => {
    setTitle("");
    setFile(null);
    clearFileInput();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setTitle(initialValues?.title ?? "");
      setFile(null);
      clearFileInput();
    } else {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }

    if (mode === "create" && !file) {
      toast.error("Please upload a PDF or Word document.");
      return;
    }

    if (file && !isAllowedFile(file)) {
      toast.error("Only PDF, DOC, and DOCX files are allowed.");
      return;
    }

    onSubmit({ title: title.trim(), file });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl p-0 shadow-2xl">
        <DialogHeader className="border-b px-6 py-5 text-left">
          <DialogTitle className="flex items-center gap-2">
            <FolderUp className="h-5 w-5 text-primary" />
            {mode === "create" ? "Add Attachment" : "Edit Attachment"}
          </DialogTitle>
          <DialogDescription>
            Register a downloadable document with a title. Supported formats are
            PDF and Word documents.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 px-6 py-6">
          <div className="grid gap-2">
            <Label htmlFor="attachment_title" className="text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="attachment_title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Proposal Cover Page Template"
              className="h-11 rounded-xl"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="attachment_file" className="text-sm font-medium">
              File{" "}
              {mode === "create" ? (
                <span className="text-destructive">*</span>
              ) : (
                <span className="text-muted-foreground">(optional)</span>
              )}
            </Label>
            <div
              className={cn(
                "rounded-2xl border p-4 transition-colors",
                hasFileSelected
                  ? "border-primary/20 bg-primary/5"
                  : "border-dashed border-muted-foreground/20 bg-slate-50",
              )}
            >
              <input
                ref={fileInputRef}
                id="attachment_file"
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                className="hidden"
                onChange={(event) =>
                  handleFileChange(event.target.files?.[0] ?? null)
                }
              />

              {!hasFileSelected ? (
                <label
                  htmlFor="attachment_file"
                  className="flex cursor-pointer flex-col items-center gap-2 py-4 text-center"
                >
                  <div className="rounded-2xl border border-primary/10 bg-white p-3 text-primary shadow-sm">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">
                      Choose a file to upload
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOC, or DOCX only
                    </p>
                  </div>
                </label>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-white text-primary shadow-sm">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {displayFileName}
                      </p>
                      {hasNewFile ? (
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)} · Ready to upload
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Current file · replace to update
                        </p>
                      )}
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-wider",
                          hasNewFile
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-blue-200 bg-blue-50 text-blue-700",
                        )}
                      >
                        {hasNewFile ? "New file" : "Uploaded"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {hasNewFile ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive"
                        onClick={() => handleFileChange(null)}
                        aria-label="Remove selected file"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Replace
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        <DialogFooter className="px-6 py-5">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button className="px-5" onClick={handleSubmit} disabled={isPending}>
            {isPending
              ? "Saving..."
              : mode === "create"
                ? "Save Attachment"
                : "Update Attachment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ResearchAttachmentsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] =
    useState<AttachmentRecord | null>(null);

  const { data, isLoading } = useAttachments({
    page: 1,
    limit: 100,
    ordering: "-date_of_upload",
  });

  const createMutation = useCreateAttachment();
  const updateMutation = useUpdateAttachment();
  const deleteMutation = useDeleteAttachment();

  const attachments = useMemo<AttachmentRow[]>(
    () =>
      (data?.data ?? []).map((item) => ({
        ...item,
        searchText: [item.title, item.documentType, item.attachment]
          .join(" ")
          .toLowerCase(),
      })),
    [data?.data],
  );

  const totalAttachments = data?.meta?.total ?? attachments.length;
  const pdfCount = attachments.filter((item) => item.documentType === "pdf").length;
  const docCount = attachments.filter((item) => item.documentType === "doc").length;

  const columns = useMemo<ColumnDef<AttachmentRow>[]>(
    () => [
      {
        id: "searchText",
        accessorFn: (row) => row.searchText,
        cell: () => null,
        enableHiding: true,
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/10 bg-primary/5 text-primary shadow-sm">
              <Paperclip className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                {row.original.title}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Research attachment registry
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "documentType",
        header: "Document Type",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={documentTypeBadgeClass(row.original.documentType)}
          >
            {documentTypeLabel(row.original.documentType)}
          </Badge>
        ),
      },
      {
        accessorKey: "dateOfUpload",
        header: "Uploaded",
        cell: ({ row }) => (
          <span className="text-sm text-slate-700">
            {formatDate(row.original.dateOfUpload)}
          </span>
        ),
      },
      {
        accessorKey: "attachment",
        header: "File",
        cell: ({ row }) => (
          <p className="line-clamp-1 max-w-[220px] text-sm font-medium text-slate-700">
            {extractFileName(row.original.attachment)}
          </p>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div
            className="flex justify-end"
            onClick={(event) => event.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    href={resolveFileUrl(row.original.attachment) ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Open File
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => void downloadAttachmentFile(row.original)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setSelectedAttachment(row.original);
                    setEditOpen(true);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => {
                    setSelectedAttachment(row.original);
                    setDeleteOpen(true);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <PageContainer
      title="Attachments"
      description="Manage downloadable research forms and document templates in PDF or Word format."
      actions={
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Attachment
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="overflow-hidden border border-muted-foreground/10 shadow-sm">
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Total Attachments
                </p>
                <p className="mt-1 text-2xl font-black text-slate-900">
                  {totalAttachments}
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
                  PDF Documents
                </p>
                <p className="mt-1 text-2xl font-black text-slate-900">
                  {pdfCount}
                </p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                <FileText className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border border-muted-foreground/10 shadow-sm">
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Word Documents
                </p>
                <p className="mt-1 text-2xl font-black text-slate-900">
                  {docCount}
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                <Paperclip className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <Card className="overflow-hidden border border-muted-foreground/10 shadow-sm">
            <div className="space-y-4 p-5">
              <Skeleton className="h-10 w-[340px] rounded-xl" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full rounded-2xl" />
                ))}
              </div>
            </div>
          </Card>
        ) : (
          <DataTable
            columns={columns}
            data={attachments}
            searchKey="searchText"
            searchPlaceholder="Search attachments by title, type, or file name..."
            initialColumnVisibility={{ searchText: false }}
            emptyMessage="No attachments found"
            emptyDescription="Use Add Attachment to upload the first PDF or Word document."
            onRowClick={openAttachmentFile}
          />
        )}
      </div>

      <AttachmentFormModal
        open={createOpen}
        mode="create"
        onOpenChange={setCreateOpen}
        isPending={createMutation.isPending}
        onSubmit={async ({ title, file }) => {
          if (!file) return;

          try {
            await createMutation.mutateAsync({ title, attachment: file });
            toast.success("Attachment saved successfully.");
            setCreateOpen(false);
          } catch (error: unknown) {
            const message =
              (error as { message?: string })?.message ||
              "Failed to save attachment.";
            toast.error(message);
          }
        }}
      />

      <AttachmentFormModal
        open={editOpen}
        mode="edit"
        initialValues={selectedAttachment}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setSelectedAttachment(null);
        }}
        isPending={updateMutation.isPending}
        onSubmit={async ({ title, file }) => {
          if (!selectedAttachment) return;

          try {
            await updateMutation.mutateAsync({
              id: selectedAttachment.id,
              values: {
                title,
                ...(file ? { attachment: file } : {}),
              },
            });
            toast.success("Attachment updated successfully.");
            setEditOpen(false);
            setSelectedAttachment(null);
          } catch (error: unknown) {
            const message =
              (error as { message?: string })?.message ||
              "Failed to update attachment.";
            toast.error(message);
          }
        }}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete attachment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="font-semibold text-foreground">
                {selectedAttachment?.title}
              </span>{" "}
              from the registry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!selectedAttachment) return;

                try {
                  await deleteMutation.mutateAsync(selectedAttachment.id);
                  toast.success("Attachment deleted.");
                  setDeleteOpen(false);
                  setSelectedAttachment(null);
                } catch (error: unknown) {
                  const message =
                    (error as { message?: string })?.message ||
                    "Failed to delete attachment.";
                  toast.error(message);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
