"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarDays,
  ExternalLink,
  FileCheck2,
  FileText,
  Loader2,
  MoreHorizontal,
  Upload,
  X,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getManagedProposals,
  getProposals,
  protocolService,
} from "@/api/services";
import { useDebounce } from "@/hooks/useDebounce";
import { protocolUploadSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";
import type { ProtocolRecord } from "@/types/protocol";
import { toast } from "sonner";

type ProposalOption = {
  id: string;
  title: string;
  referenceNumber: string;
  status: string;
};

const ALL_VALUE = "all";

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

function fileLink(value?: string | null) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/bff")) return value;
  if (value.startsWith("/")) return `/bff${value}`;
  return `/bff/${value}`;
}

function FilePicker({
  id,
  label,
  required,
  accept,
  file,
  onChange,
  error,
}: {
  id: string;
  label: string;
  required?: boolean;
  accept?: string;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </Label>
      <div
        className={cn(
          "rounded-xl border border-dashed p-4 transition-colors",
          error
            ? "border-rose-500 bg-rose-50/30"
            : "border-muted-foreground/25",
        )}
      >
        {file ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <FileText className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => onChange(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <label
            htmlFor={id}
            className="flex cursor-pointer flex-col items-center gap-2 py-2 text-center"
          >
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Choose file</span>
            <span className="text-xs text-muted-foreground">
              PDF, DOC, DOCX, or XLSX
            </span>
          </label>
        )}
        <Input
          id={id}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => {
            const nextFile = event.target.files?.[0] ?? null;
            onChange(nextFile);
            event.target.value = "";
          }}
        />
      </div>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

export default function ProtocolPage() {
  const [rows, setRows] = useState<ProtocolRecord[]>([]);
  const [proposals, setProposals] = useState<ProposalOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProposals, setIsLoadingProposals] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "update">("create");
  const [searchInput, setSearchInput] = useState("");
  const [proposalFilter, setProposalFilter] = useState(ALL_VALUE);
  const [selectedProposalId, setSelectedProposalId] = useState("");
  const [selectedProtocol, setSelectedProtocol] =
    useState<ProtocolRecord | null>(null);
  const [protocolFile, setProtocolFile] = useState<File | null>(null);
  const [otherDocument, setOtherDocument] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<{
    proposalId?: string;
    protocolFile?: string;
  }>({});

  const debouncedSearch = useDebounce(searchInput, 350);

  const loadProtocols = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await protocolService.list({
        page: 1,
        limit: 100,
        search: debouncedSearch.trim() || undefined,
        proposal:
          proposalFilter !== ALL_VALUE ? Number(proposalFilter) : undefined,
        ordering: "-created_at",
      });
      setRows(response.data ?? []);
    } catch (error) {
      console.error("Failed to load protocols:", error);
      setRows([]);
      toast.error("Failed to load protocol submissions");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, proposalFilter]);

  useEffect(() => {
    loadProtocols();
  }, [loadProtocols]);

  useEffect(() => {
    async function loadProposalOptions() {
      setIsLoadingProposals(true);
      try {
        const [mine, managed] = await Promise.allSettled([
          getProposals({ page: 1, limit: 100 }),
          getManagedProposals({ page: 1, limit: 100 }),
        ]);

        const merged = new Map<string, ProposalOption>();

        const addRows = (items: Array<Record<string, unknown>>) => {
          for (const item of items) {
            const id = String(item.id);
            if (!id || merged.has(id)) continue;
            merged.set(id, {
              id,
              title: String(item.title ?? "Untitled proposal"),
              referenceNumber: String(
                item.referenceNumber ?? item.reference_number ?? id,
              ),
              status: String(item.status ?? item.statusDisplay ?? "unknown"),
            });
          }
        };

        if (mine.status === "fulfilled")
          addRows(mine.value.data as Array<Record<string, unknown>>);
        if (managed.status === "fulfilled") {
          addRows(managed.value.data as Array<Record<string, unknown>>);
        }

        const eligible = Array.from(merged.values()).filter((item) => {
          const status = item.status.toLowerCase();
          return status === "protocol_stage";
        });

        setProposals(eligible.length ? eligible : Array.from(merged.values()));
      } catch (error) {
        console.error("Failed to load proposals:", error);
        setProposals([]);
        toast.error("Failed to load proposals for selection");
      } finally {
        setIsLoadingProposals(false);
      }
    }

    loadProposalOptions();
  }, []);

  const stats = useMemo(
    () => [
      {
        label: "Total Submissions",
        value: rows.length,
        icon: FileCheck2,
      },
      {
        label: "With Protocol File",
        value: rows.filter((row) => row.protocolFile || row.protocol_file)
          .length,
        icon: FileText,
      },
      {
        label: "With Other Document",
        value: rows.filter((row) => row.otherDocument || row.other_document)
          .length,
        icon: Upload,
      },
    ],
    [rows],
  );

  const resetUploadForm = () => {
    setModalMode("create");
    setSelectedProtocol(null);
    setSelectedProposalId("");
    setProtocolFile(null);
    setOtherDocument(null);
    setFormErrors({});
  };

  const openUploadModal = () => {
    resetUploadForm();
    setModalMode("create");
    setIsUploadModalOpen(true);
  };

  const openUpdateModal = (protocol: ProtocolRecord) => {
    setModalMode("update");
    setSelectedProtocol(protocol);
    setSelectedProposalId(String(protocol.proposal));
    setProtocolFile(null);
    setOtherDocument(null);
    setFormErrors({});
    setIsUploadModalOpen(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      if (modalMode === "update") {
        if (!selectedProtocol) {
          toast.error("Select a protocol record to update.");
          return;
        }

        if (!protocolFile && !otherDocument) {
          setFormErrors({
            protocolFile: "Choose at least one file to update.",
          });
          toast.error("Choose at least one file to update.");
          return;
        }

        await protocolService.update(selectedProtocol.id, {
          protocol_file: protocolFile ?? undefined,
          other_document: otherDocument ?? undefined,
        });

        toast.success("Protocol updated successfully");
      } else {
        const validation = protocolUploadSchema.safeParse({
          proposalId: selectedProposalId,
          protocolFile,
          otherDocument,
        });

        if (!validation.success) {
          const fieldErrors = validation.error.flatten().fieldErrors;
          setFormErrors({
            proposalId: fieldErrors.proposalId?.[0],
            protocolFile: fieldErrors.protocolFile?.[0],
          });
          toast.error("Please complete the required fields before uploading.");
          return;
        }

        setFormErrors({});

        await protocolService.create({
          proposal: Number(validation.data.proposalId),
          protocol_file: validation.data.protocolFile,
          other_document: validation.data.otherDocument ?? undefined,
        });

        toast.success("Protocol uploaded successfully");
      }

      resetUploadForm();
      setIsUploadModalOpen(false);
      await loadProtocols();
    } catch (error) {
      console.error("Failed to save protocol:", error);
      toast.error(
        modalMode === "update"
          ? "Failed to update protocol"
          : "Failed to upload protocol",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: ColumnDef<ProtocolRecord>[] = [
    {
      accessorKey: "reference_number",
      header: "Reference",
      cell: ({ row }) => (
        <span className="font-bold text-primary">
          {row.original.referenceNumber ||
            row.original.reference_number ||
            `#${row.original.proposal}`}
        </span>
      ),
    },
    {
      accessorKey: "proposal_title",
      header: "Proposal",
      cell: ({ row }) => (
        <div className="max-w-[320px]">
          <p className="line-clamp-1 text-sm font-semibold">
            {row.original.proposalTitle ||
              row.original.proposal_title ||
              "Untitled proposal"}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Proposal ID {row.original.proposal}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "protocol_file",
      header: "Protocol File",
      cell: ({ row }) => {
        const url = fileLink(
          row.original.protocolFile || row.original.protocol_file,
        );
        return url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "other_document",
      header: "Other Document",
      cell: ({ row }) => {
        const url = fileLink(
          row.original.otherDocument || row.original.other_document,
        );
        return url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "uploaded_by_name",
      header: "Uploaded By",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.uploadedByName || row.original.uploaded_by_name || "—"}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Uploaded",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatDate(row.original.createdAt || row.original.created_at)}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const protocolUrl = fileLink(
          row.original.protocolFile || row.original.protocol_file,
        );
        const otherUrl = fileLink(
          row.original.otherDocument || row.original.other_document,
        );

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(event) => event.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  href={`/research/proposals/my-proposals/${row.original.proposal}/edit`}
                >
                  Edit proposal details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openUpdateModal(row.original)}>
                Update protocol document
              </DropdownMenuItem>
              {protocolUrl ? (
                <DropdownMenuItem asChild>
                  <a href={protocolUrl} target="_blank" rel="noreferrer">
                    Open protocol file
                  </a>
                </DropdownMenuItem>
              ) : null}
              {otherUrl ? (
                <DropdownMenuItem asChild>
                  <a href={otherUrl} target="_blank" rel="noreferrer">
                    Open other document
                  </a>
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <PageContainer
      title="Protocol"
      description="Select a proposal and upload the study protocol and any supporting documents."
      actions={
        <Button onClick={openUploadModal}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Protocol
        </Button>
      }
    >
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="border-none shadow-sm">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-12" />
                  </CardContent>
                </Card>
              ))
            : stats.map((stat) => (
                <Card key={stat.label} className="border-none shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <stat.icon className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black">{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            searchPlaceholder="Search by proposal title or reference..."
            filterOptions={[
              {
                key: "proposal",
                label: "Proposal",
                value: proposalFilter,
                onValueChange: setProposalFilter,
                placeholder: "Filter by proposal",
                allValue: ALL_VALUE,
                allLabel: "All proposals",
                options: proposals.map((proposal) => ({
                  value: proposal.id,
                  label: `${proposal.referenceNumber} · ${proposal.title}`,
                })),
              },
            ]}
            emptyMessage="No protocol submissions found"
            emptyDescription="Upload a protocol file for a proposal to get started."
          />
        )}
      </div>

      <Dialog
        open={isUploadModalOpen}
        onOpenChange={(open) => {
          setIsUploadModalOpen(open);
          if (!open) resetUploadForm();
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              {modalMode === "update" ? "Update Protocol" : "Upload Protocol"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "update"
                ? "Replace one or more files for this existing protocol record to move the proposal forward."
                : "Choose a protocol-stage proposal, attach the protocol file, and optionally upload another supporting document."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Proposal <span className="text-rose-500">*</span>
                </Label>
                {modalMode === "update" ? (
                  <div className="rounded-xl border bg-muted/30 px-3 py-2 text-sm">
                    {selectedProtocol
                      ? `${selectedProtocol.referenceNumber || `#${selectedProtocol.proposal}`} · ${selectedProtocol.proposalTitle || "Untitled proposal"}`
                      : "Selected protocol record"}
                  </div>
                ) : (
                  <Select
                    value={selectedProposalId}
                    onValueChange={(value) => {
                      setSelectedProposalId(value);
                      if (formErrors.proposalId) {
                        setFormErrors((current) => ({
                          ...current,
                          proposalId: undefined,
                        }));
                      }
                    }}
                    disabled={isLoadingProposals}
                  >
                    <SelectTrigger
                      className={cn(formErrors.proposalId && "border-rose-500")}
                    >
                      <SelectValue
                        placeholder={
                          isLoadingProposals
                            ? "Loading proposals..."
                            : "Select a protocol-stage proposal"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {proposals.map((proposal) => (
                        <SelectItem key={proposal.id} value={proposal.id}>
                          {proposal.referenceNumber} · {proposal.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {formErrors.proposalId ? (
                  <p className="text-xs text-rose-600">
                    {formErrors.proposalId}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {modalMode === "update"
                      ? "Use this to replace the current protocol files after editing the proposal details."
                      : "Only proposals in the protocol stage are shown here."}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-1">
              <FilePicker
                id="modal-protocol-file"
                label={
                  modalMode === "update"
                    ? "Replace Protocol File"
                    : "Protocol File"
                }
                required={modalMode === "create"}
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                file={protocolFile}
                onChange={(file) => {
                  setProtocolFile(file);
                  if (formErrors.protocolFile) {
                    setFormErrors((current) => ({
                      ...current,
                      protocolFile: undefined,
                    }));
                  }
                }}
                error={formErrors.protocolFile}
              />

              <FilePicker
                id="modal-other-document"
                label={
                  modalMode === "update"
                    ? "Replace Other Document"
                    : "Other Document"
                }
                accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
                file={otherDocument}
                onChange={setOtherDocument}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsUploadModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {modalMode === "update" ? "Updating..." : "Uploading..."}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {modalMode === "update"
                    ? "Update Protocol"
                    : "Upload Protocol"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
