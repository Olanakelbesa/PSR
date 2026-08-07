"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Tags,
  FileType,
  Building2,
  FlaskConical,
  Loader2,
  RefreshCw,
  ExternalLink,
  FileCheck,
  FolderTree,
  FileText,
  ShieldCheck,
  Users,
  Award,
  FileCheck2,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useCreateTaxonomyItem,
  useDeleteTaxonomyItem,
  useTaxonomyItems,
  useUpdateTaxonomyItem,
} from "@/hooks/useTaxonomy";
import {
  TaxonomyKind,
  type TaxonomyItem,
  type TaxonomyWritePayload,
} from "@/api/services/taxonomy.service";
import { cn } from "@/lib/utils";

type TaxonomyTabConfig = {
  kind: TaxonomyKind;
  value: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  showCode?: boolean;
  showParentThematic?: boolean;
  showScoreValue?: boolean;
  showActiveState?: boolean;
};

const TABS: TaxonomyTabConfig[] = [
  {
    kind: TaxonomyKind.THEMATIC_AREAS,
    value: "thematic",
    title: "Thematic Areas",
    description: "Research and policy thematic areas used across proposals and screening.",
    icon: Tags,
  },
  {
    kind: TaxonomyKind.SUB_THEMATIC_AREAS,
    value: "sub-thematic",
    title: "Sub-Thematic Areas",
    description: "Sub-categories mapped under parent thematic areas.",
    icon: FolderTree,
    showParentThematic: true,
  },
  {
    kind: TaxonomyKind.RESEARCH_AREAS,
    value: "research-areas",
    title: "Research Areas",
    description: "Research focus areas for investigator profiles and proposals.",
    icon: FlaskConical,
  },
  {
    kind: TaxonomyKind.RESEARCH_TYPES,
    value: "study-types",
    title: "Research Types",
    description: "Research study types such as clinical trials and social science.",
    icon: FileType,
  },
  {
    kind: TaxonomyKind.POLICY_DOCUMENT_TYPES,
    value: "policy-types",
    title: "Policy Document Types",
    description: "Document types like Policy Briefs, Strategies, Guidelines, and Frameworks.",
    icon: FileCheck,
    showActiveState: true,
  },
  {
    kind: TaxonomyKind.PROPOSAL_TYPES,
    value: "proposal-types",
    title: "Proposal Types",
    description: "Proposal call types such as Regular, Special Call, or Targeted Research.",
    icon: FileText,
  },
  {
    kind: TaxonomyKind.IRB_CLEARANCE_TYPES,
    value: "irb-types",
    title: "IRB Clearance Types",
    description: "Ethical clearance review types (Full Review, Expedited, Exempt).",
    icon: ShieldCheck,
    showActiveState: true,
  },
  {
    kind: TaxonomyKind.ORGANIZATION_TYPES,
    value: "organization-types",
    title: "Organization Types",
    description: "Organization categories such as ministries, universities, and agencies.",
    icon: Building2,
    showCode: true,
  },
  {
    kind: TaxonomyKind.TEAM_MEMBER_ROLES,
    value: "team-roles",
    title: "Team Member Roles",
    description: "Roles like Principal Investigator, Biostatistician, or Data Collector.",
    icon: Users,
  },
  {
    kind: TaxonomyKind.TERMINAL_REPORT_GRADES,
    value: "report-grades",
    title: "Terminal Report Grades",
    description: "Evaluation grades and scores for terminal research project reports.",
    icon: Award,
    showScoreValue: true,
    showActiveState: true,
  },
  {
    kind: TaxonomyKind.OUTPUT_TYPES,
    value: "output-types",
    title: "Output Types",
    description: "Research outputs like Final Reports, Policy Guidelines, or Datasets.",
    icon: FileCheck2,
    showActiveState: true,
  },
];

type FormState = {
  name: string;
  code: string;
  description: string;
  score_value: number;
  thematic_area: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  name: "",
  code: "",
  description: "",
  score_value: 0,
  thematic_area: "",
  is_active: true,
};

function slugifyCode(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function TaxonomyPanel({ config }: { config: TaxonomyTabConfig }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<TaxonomyItem | null>(null);
  const [editingItem, setEditingItem] = useState<TaxonomyItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [codeTouched, setCodeTouched] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  // Reset pagination to page 1 on search change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading, isFetching, refetch, isError, error } = useTaxonomyItems(
    config.kind,
    { search: debouncedSearch || undefined, page, limit },
  );

  // Fetch parent thematic areas if this panel is for Sub-Thematic Areas
  const { data: parentThematicsData } = useTaxonomyItems(TaxonomyKind.THEMATIC_AREAS, {
    limit: 100,
  });
  const parentThematicItems = parentThematicsData?.data ?? [];

  const createMutation = useCreateTaxonomyItem(config.kind);
  const updateMutation = useUpdateTaxonomyItem(config.kind);
  const deleteMutation = useDeleteTaxonomyItem(config.kind);

  const items = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, limit, total: items.length, totalPages: 1 };

  const dialogTitle = editingItem
    ? `Edit ${config.title.slice(0, -1)}`
    : `Add ${config.title.slice(0, -1)}`;

  const openCreate = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setCodeTouched(false);
    setDialogOpen(true);
  };

  const openEdit = (item: TaxonomyItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      code: item.code ?? "",
      description: item.description ?? "",
      score_value: item.score_value ?? 0,
      thematic_area: item.thematic_area ? String(item.thematic_area) : "",
      is_active: item.is_active ?? item.active ?? true,
    });
    setCodeTouched(true);
    setDialogOpen(true);
  };

  const buildPayload = (): TaxonomyWritePayload | null => {
    const name = form.name.trim();
    if (!name) {
      toast.error("Name is required.");
      return null;
    }

    const payload: TaxonomyWritePayload = {
      name,
      description: form.description.trim() || null,
      is_active: form.is_active,
      active: form.is_active,
    };

    if (config.showCode) {
      const code = (form.code.trim() || slugifyCode(name)).replace(/_/g, "-");
      if (!code) {
        toast.error("Code is required.");
        return null;
      }
      payload.code = code;
    }

    if (config.showParentThematic) {
      if (form.thematic_area) {
        payload.thematic_area = Number(form.thematic_area);
      }
    }

    if (config.showScoreValue) {
      payload.score_value = Number(form.score_value) || 0;
    }

    return payload;
  };

  const saveItem = async () => {
    const payload = buildPayload();
    if (!payload) return;

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, data: payload });
        toast.success("Item updated successfully.");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Item created successfully.");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? "Failed to save item.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;

    try {
      await deleteMutation.mutateAsync(deleteCandidate.id);
      toast.success("Item deleted successfully.");
      setDeleteCandidate(null);
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? "Failed to delete item.");
    }
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    if (items.length === 0) {
      toast.info("No items available to export.");
      return;
    }
    const headers = ["ID", "Name", "Code", "Description", "Score Value", "Active State"];
    const csvRows = [headers.join(",")];

    items.forEach((item) => {
      const row = [
        item.id,
        `"${(item.name || "").replace(/"/g, '""')}"`,
        `"${(item.code || "").replace(/"/g, '""')}"`,
        `"${(item.description || "").replace(/"/g, '""')}"`,
        item.score_value ?? "",
        item.is_active ?? item.active ?? true ? "Active" : "Inactive",
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${config.value}_taxonomy_export.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${items.length} items to CSV.`);
  };

  const startRecord = meta.total === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, meta.total);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <config.icon className="h-5 w-5 text-primary" />
                {config.title}
              </CardTitle>
              <CardDescription className="text-xs">{config.description}</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2 text-xs font-bold shadow-2xs">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2 text-xs font-bold shadow-2xs">
                <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Top Search & Actions Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={`Search ${config.title.toLowerCase()}...`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <Button size="sm" onClick={openCreate} className="gap-2 bg-primary text-white font-bold cursor-pointer text-xs">
              <Plus className="h-4 w-4" />
              Add New {config.title.slice(0, -1)}
            </Button>
          </div>

          {isError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {(error as { message?: string })?.message ?? "Failed to load items."}
            </div>
          )}

          {/* Standardized Data Table */}
          <div className="overflow-x-auto rounded-xl border border-border/80">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="font-bold text-xs">Name</TableHead>
                  {config.showCode && <TableHead className="font-bold text-xs">Code</TableHead>}
                  {config.showParentThematic && <TableHead className="font-bold text-xs">Parent Thematic Area</TableHead>}
                  {config.showScoreValue && <TableHead className="font-bold text-xs">Score Weight</TableHead>}
                  {config.showActiveState && <TableHead className="font-bold text-xs">Status</TableHead>}
                  <TableHead className="font-bold text-xs">Description</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-muted-foreground"
                    >
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-primary" />
                      Loading taxonomy items...
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-muted-foreground text-xs font-semibold"
                    >
                      No reference items found for {config.title}.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => {
                    const parentName =
                      item.thematic_area_name ||
                      parentThematicItems.find((p) => String(p.id) === String(item.thematic_area))?.name;

                    const isActiveState = item.is_active ?? item.active ?? true;

                    return (
                      <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-bold text-xs text-foreground">{item.name}</TableCell>

                        {config.showCode && (
                          <TableCell>
                            <code className="rounded bg-muted px-2 py-0.5 text-[11px] font-mono font-extrabold text-primary">
                              {item.code ?? "—"}
                            </code>
                          </TableCell>
                        )}

                        {config.showParentThematic && (
                          <TableCell>
                            {parentName ? (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold text-[10px]">
                                {parentName}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                        )}

                        {config.showScoreValue && (
                          <TableCell>
                            <Badge variant="outline" className="font-mono font-extrabold text-xs">
                              {item.score_value ?? 0} pts
                            </Badge>
                          </TableCell>
                        )}

                        {config.showActiveState && (
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] font-extrabold uppercase px-2 py-0.5 gap-1",
                                isActiveState
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-300 dark:text-emerald-400"
                                  : "bg-slate-500/10 text-slate-500 border-slate-300"
                              )}
                            >
                              {isActiveState ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Active
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3 text-slate-400" /> Inactive
                                </>
                              )}
                            </Badge>
                          </TableCell>
                        )}

                        <TableCell className="max-w-md truncate text-xs text-muted-foreground">
                          {item.description || "—"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(item)} className="cursor-pointer">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Item
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive cursor-pointer"
                                onClick={() => setDeleteCandidate(item)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Item
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* ── Responsive Server-Side Pagination Footer ─────────────────── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 text-xs text-muted-foreground border-t">
            <div>
              Showing <strong className="text-foreground">{startRecord}</strong> to{" "}
              <strong className="text-foreground">{endRecord}</strong> of{" "}
              <strong className="text-foreground">{meta.total}</strong> items
            </div>

            <div className="flex items-center gap-4">
              {/* Rows Per Page Selector */}
              <div className="flex items-center gap-2">
                <span className="font-medium text-xs">Rows per page:</span>
                <Select
                  value={String(limit)}
                  onValueChange={(val) => {
                    setLimit(Number(val));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-16 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50, 100].map((pageSize) => (
                      <SelectItem key={pageSize} value={String(pageSize)}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Page Controls */}
              <div className="flex items-center gap-1">
                <span className="font-bold text-xs text-foreground mr-1">
                  Page {meta.page} of {meta.totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg cursor-pointer"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  title="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg cursor-pointer"
                  disabled={page >= meta.totalPages || isLoading}
                  onClick={() => setPage((prev) => prev + 1)}
                  title="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <config.icon className="h-5 w-5 text-primary" />
              {dialogTitle}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Changes are updated directly in the backend reference data API.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor={`${config.value}-name`} className="text-xs font-bold">
                Name *
              </Label>
              <Input
                id={`${config.value}-name`}
                value={form.name}
                onChange={(event) => {
                  const name = event.target.value;
                  setForm((prev) => ({
                    ...prev,
                    name,
                    code: config.showCode && !codeTouched ? slugifyCode(name) : prev.code,
                  }));
                }}
                className="text-xs"
              />
            </div>

            {config.showCode && (
              <div className="space-y-2">
                <Label htmlFor={`${config.value}-code`} className="text-xs font-bold">
                  Code *
                </Label>
                <Input
                  id={`${config.value}-code`}
                  value={form.code}
                  onChange={(event) => {
                    setCodeTouched(true);
                    setForm((prev) => ({ ...prev, code: slugifyCode(event.target.value) }));
                  }}
                  placeholder="e.g. moh"
                  className="text-xs font-mono"
                />
              </div>
            )}

            {config.showParentThematic && (
              <div className="space-y-2">
                <Label className="text-xs font-bold">Parent Thematic Area</Label>
                <SearchableSelect<TaxonomyItem>
                  value={form.thematic_area}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, thematic_area: val }))}
                  options={parentThematicItems}
                  getOptionValue={(item) => String(item.id)}
                  getOptionLabel={(item) => item.name}
                  placeholder="Select parent thematic area..."
                  searchPlaceholder="Search thematic areas..."
                  emptyMessage="No thematic areas available"
                  noResultsMessage="No thematic areas found"
                  limit={100}
                />
              </div>
            )}

            {config.showScoreValue && (
              <div className="space-y-2">
                <Label htmlFor={`${config.value}-score`} className="text-xs font-bold">
                  Score Weight (Points)
                </Label>
                <Input
                  id={`${config.value}-score`}
                  type="number"
                  value={form.score_value}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, score_value: Number(event.target.value) }))
                  }
                  placeholder="e.g. 100"
                  className="text-xs font-mono"
                />
              </div>
            )}

            {config.showActiveState && (
              <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
                <div className="space-y-0.5 text-xs">
                  <span className="font-bold text-foreground block">Active Status</span>
                  <span className="text-muted-foreground text-[11px]">
                    Active items appear in submission forms. Inactive items are archived.
                  </span>
                </div>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(val) => setForm((prev) => ({ ...prev, is_active: val }))}
                />
              </div>
            )}

            {config.kind !== TaxonomyKind.RESEARCH_TYPES && config.kind !== TaxonomyKind.TEAM_MEMBER_ROLES && (
              <div className="space-y-2">
                <Label htmlFor={`${config.value}-description`} className="text-xs font-bold">
                  Description
                </Label>
                <Textarea
                  id={`${config.value}-description`}
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  rows={3}
                  className="text-xs"
                />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={saveItem}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-primary text-white font-bold cursor-pointer"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Modal */}
      <AlertDialog open={!!deleteCandidate} onOpenChange={() => setDeleteCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Delete taxonomy item?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This will permanently remove &quot;{deleteCandidate?.name}&quot;. This action cannot be undone if the item is not referenced elsewhere.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold cursor-pointer"
              onClick={confirmDelete}
            >
              Delete Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function TaxonomyPage() {
  const [activeTab, setActiveTab] = useState(TABS[0].value);

  return (
    <PageContainer
      title="Taxonomy & Reference Data Management"
      description="Manage reference classification datasets used across proposals, policy drafts, IRB clearance, and system reports."
    >
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>Need full organization records?</span>
        <Link href="/organizations" className="inline-flex items-center gap-1 text-primary hover:underline font-semibold">
          Manage organizations
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {/* Mobile Dropdown Category Switcher */}
        <div className="sm:hidden mb-2">
          <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Select Category
          </Label>
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="h-10 text-xs font-bold bg-card border-border/80 shadow-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TABS.map((tab) => (
                <SelectItem key={tab.value} value={tab.value} className="text-xs font-bold py-2">
                  <div className="flex items-center gap-2">
                    <tab.icon className="h-4 w-4 text-primary shrink-0" />
                    <span>{tab.title}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tablet / Desktop Horizontal Scrollable Pill Tabs */}
        <div className="hidden sm:block overflow-x-auto max-w-full p-1 rounded-2xl bg-muted/60 border border-border/80">
          <TabsList className="flex h-auto w-max justify-start gap-1 bg-transparent p-0">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="gap-2 px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap shrink-0 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs cursor-pointer transition-all"
              >
                <tab.icon className="h-4 w-4 shrink-0" />
                <span>{tab.title}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <TaxonomyPanel config={tab} />
          </TabsContent>
        ))}
      </Tabs>
    </PageContainer>
  );
}
