"use client";

import { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
};

const TABS: TaxonomyTabConfig[] = [
  {
    kind: TaxonomyKind.THEMATIC_AREAS,
    value: "thematic",
    title: "Thematic Areas",
    description: "Research and policy thematic areas used in proposals and screening.",
    icon: Tags,
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
    kind: TaxonomyKind.ORGANIZATION_TYPES,
    value: "organization-types",
    title: "Organization Types",
    description: "Organization categories such as ministries, universities, and agencies.",
    icon: Building2,
    showCode: true,
  },
];

type FormState = {
  name: string;
  code: string;
  description: string;
};

const emptyForm: FormState = {
  name: "",
  code: "",
  description: "",
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<TaxonomyItem | null>(null);
  const [editingItem, setEditingItem] = useState<TaxonomyItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [codeTouched, setCodeTouched] = useState(false);

  const debouncedSearch = useDebounce(search, 400);
  const { data, isLoading, isFetching, refetch, isError, error } = useTaxonomyItems(
    config.kind,
    { search: debouncedSearch || undefined, limit: 100 },
  );
  const createMutation = useCreateTaxonomyItem(config.kind);
  const updateMutation = useUpdateTaxonomyItem(config.kind);
  const deleteMutation = useDeleteTaxonomyItem(config.kind);

  const items = data?.data ?? [];

  const dialogTitle = editingItem ? `Edit ${config.title.slice(0, -1)}` : `Add ${config.title.slice(0, -1)}`;

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

    if (config.showCode) {
      const code = (form.code.trim() || slugifyCode(name)).replace(/_/g, "-");
      if (!code) {
        toast.error("Code is required.");
        return null;
      }
      return {
        name,
        code,
        description: form.description.trim() || null,
      };
    }

    return {
      name,
      description: form.description.trim() || null,
    };
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

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>{config.title}</CardTitle>
              <CardDescription>{config.description}</CardDescription>
            </div>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={`Search ${config.title.toLowerCase()}...`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Button>
          </div>

          {isError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {(error as { message?: string })?.message ?? "Failed to load items."}
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  {config.showCode && <TableHead>Code</TableHead>}
                  <TableHead>Description</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={config.showCode ? 4 : 3}
                      className="py-10 text-center text-muted-foreground"
                    >
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={config.showCode ? 4 : 3}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No items found.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      {config.showCode && (
                        <TableCell>
                          <code className="rounded bg-muted px-2 py-1 text-xs">
                            {item.code ?? "—"}
                          </code>
                        </TableCell>
                      )}
                      <TableCell className="max-w-md truncate text-muted-foreground">
                        {item.description || "—"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(item)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteCandidate(item)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              Changes are saved to the backend reference data API.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor={`${config.value}-name`}>Name *</Label>
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
              />
            </div>
            {config.showCode && (
              <div className="space-y-2">
                <Label htmlFor={`${config.value}-code`}>Code *</Label>
                <Input
                  id={`${config.value}-code`}
                  value={form.code}
                  onChange={(event) => {
                    setCodeTouched(true);
                    setForm((prev) => ({ ...prev, code: slugifyCode(event.target.value) }));
                  }}
                  placeholder="e.g. moh"
                />
              </div>
            )}
            {!config.showCode && config.kind !== TaxonomyKind.RESEARCH_TYPES && (
              <div className="space-y-2">
                <Label htmlFor={`${config.value}-description`}>Description</Label>
                <Textarea
                  id={`${config.value}-description`}
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveItem}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteCandidate} onOpenChange={() => setDeleteCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &quot;{deleteCandidate?.name}&quot;. This action
              cannot be undone if the item is not referenced elsewhere.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete
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
      title="Taxonomy Management"
      description="Manage reference classification data used across proposals, organizations, and screening."
    >
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>Need full organization records?</span>
        <Link href="/organizations" className="inline-flex items-center gap-1 text-primary hover:underline">
          Manage organizations
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid h-auto w-full max-w-3xl grid-cols-2 gap-1 md:grid-cols-4">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.title}</span>
              <span className="sm:hidden">{tab.title.split(" ")[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <TaxonomyPanel config={tab} />
          </TabsContent>
        ))}
      </Tabs>
    </PageContainer>
  );
}
