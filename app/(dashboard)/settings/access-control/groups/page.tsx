"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  RefreshCw,
  Search,
  Layers,
  PencilLine,
  Trash2,
  MoreVertical,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useCreateGroup,
  useDeleteGroup,
  usePermissionCatalog,
  useGroups,
  useUpdateGroup,
} from "@/hooks/useRoles";
import { getGroupById } from "@/api/services/roles.service";
import type { PermissionCatalogItem } from "@/api/services/roles.service";
import type { Group } from "@/api/services/roles.service";
import { PERMISSIONS } from "@/lib/permissions";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type GroupFormState = {
  name: string;
  permissionIds: number[];
};

const emptyForm: GroupFormState = {
  name: "",
  permissionIds: [],
};

function permissionMatchesQuery(
  permission: PermissionCatalogItem,
  categoryName: string,
  query: string,
) {
  const haystack = `${permission.name} ${permission.codename} ${categoryName}`.toLowerCase();
  return haystack.includes(query);
}

export default function GroupsManagementPage() {
  const { hasPermission } = useCurrentUser();
  const canViewRoles = hasPermission(PERMISSIONS.ROLE_VIEW);
  const canEditRoles = hasPermission(PERMISSIONS.ROLE_CHANGE);
  const canCreateRoles = hasPermission(PERMISSIONS.ROLE_ADD);
  const canDeleteRoles = hasPermission(PERMISSIONS.ROLE_DELETE);

  const [search, setSearch] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Group | null>(null);
  const [form, setForm] = useState<GroupFormState>(emptyForm);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const debouncedSearch = useDebounce(search, 400);
  const permissionQuery = permissionSearch.trim().toLowerCase();
  
  const { data, isLoading, isFetching, refetch } = useGroups({
    search: debouncedSearch || undefined,
    limit: 100,
  });
  
  const {
    data: catalog,
    isLoading: catalogLoading,
    isError: catalogError,
    refetch: refetchCatalog,
  } = usePermissionCatalog();
  
  const createGroupMutation = useCreateGroup();
  const updateGroupMutation = useUpdateGroup();
  const deleteGroupMutation = useDeleteGroup();

  const groups = data?.data ?? [];
  
  const sortedCategories = useMemo(
    () => [...(catalog?.categories ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [catalog?.categories],
  );

  const filteredPermissionResults = useMemo(() => {
    if (!permissionQuery || !catalog) return [];

    return sortedCategories.flatMap((category) => {
      const items = catalog.permissionsByCategory?.[category.slug] ?? [];
      return items
        .filter((item) => permissionMatchesQuery(item, category.name, permissionQuery))
        .map((item) => ({ ...item, categoryName: category.name }));
    });
  }, [permissionQuery, catalog, sortedCategories]);

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setPermissionSearch("");
      setEditingGroupId(null);
      setLoadingEdit(false);
    }
  };

  const openCreate = () => {
    setEditingGroupId(null);
    setForm(emptyForm);
    setPermissionSearch("");
    setDialogOpen(true);
  };

  const openEdit = async (group: Group) => {
    setEditingGroupId(group.id);
    setPermissionSearch("");
    setDialogOpen(true);
    setLoadingEdit(true);

    try {
      const detail = await getGroupById(group.id);
      setForm({
        name: detail.name,
        permissionIds: detail.permissions ?? [],
      });
    } catch (error) {
      toast.error((error as { message?: string })?.message ?? "Failed to load group details.");
      setDialogOpen(false);
      setEditingGroupId(null);
    } finally {
      setLoadingEdit(false);
    }
  };

  const togglePermission = (permissionId: number, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      permissionIds: checked
        ? [...prev.permissionIds, permissionId]
        : prev.permissionIds.filter((id) => id !== permissionId),
    }));
  };

  const saveGroup = async () => {
    if (!form.name.trim()) {
      toast.error("Group name is required.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      permissions: form.permissionIds,
    };

    try {
      if (editingGroupId) {
        await updateGroupMutation.mutateAsync({ id: editingGroupId, data: payload });
        toast.success("Group updated successfully.");
      } else {
        await createGroupMutation.mutateAsync(payload);
        toast.success("Group created successfully.");
      }
      setDialogOpen(false);
    } catch (error) {
      const fallback = editingGroupId ? "Failed to update group." : "Failed to create group.";
      toast.error((error as { message?: string })?.message ?? fallback);
    }
  };

  const deleteGroup = async () => {
    if (!deleteCandidate) return;

    try {
      await deleteGroupMutation.mutateAsync(deleteCandidate.id);
      toast.success("Group deleted successfully.");
      setDeleteCandidate(null);
    } catch (error) {
      toast.error((error as { message?: string })?.message ?? "Failed to delete group.");
    }
  };

  if (!canViewRoles) {
    return (
      <PageContainer
        title="Permission Groups"
        description="You do not have permission to manage groups."
      >
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Contact a system administrator to request access.
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Permission Groups"
      description="Bundle permissions into reusable groups to easily assign them to multiple roles."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
            Refresh
          </Button>
          {canCreateRoles && (
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Group
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Groups
                </CardTitle>
                <CardDescription>
                  Group granular permissions into reusable bundles.
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search groups..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Group Name</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                        Loading groups...
                      </TableCell>
                    </TableRow>
                  ) : groups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                        No groups found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    groups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell>
                          <p className="font-medium">{group.name}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {(group.permissions ?? []).length} assigned
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {(canEditRoles || canDeleteRoles) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canEditRoles && (
                                  <DropdownMenuItem onClick={() => openEdit(group)}>
                                    <PencilLine className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                )}
                                {canDeleteRoles && (
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => setDeleteCandidate(group)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>{editingGroupId ? "Edit Group" : "Create Group"}</DialogTitle>
            <DialogDescription>
              Provide a name and select permissions to bundle into this group.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-180px)] px-6 py-4">
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Name</Label>
                  <Input
                    value={form.name}
                    onChange={(event) => {
                      const name = event.target.value;
                      setForm((prev) => ({
                        ...prev,
                        name,
                      }));
                    }}
                    placeholder="e.g. Concept Note Reviewers"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Label>Permissions</Label>
                  {!catalogLoading && !catalogError && !loadingEdit && (
                    <p className="text-xs text-muted-foreground">
                      {form.permissionIds.length} selected
                    </p>
                  )}
                </div>

                {!loadingEdit && !catalogLoading && !catalogError && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search permissions by name or codename..."
                      value={permissionSearch}
                      onChange={(event) => setPermissionSearch(event.target.value)}
                      className="pl-9"
                    />
                  </div>
                )}

                {loadingEdit ? (
                  <p className="text-sm text-muted-foreground">Loading group permissions...</p>
                ) : catalogLoading ? (
                  <p className="text-sm text-muted-foreground">Loading permission catalog...</p>
                ) : catalogError ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
                    <p className="font-medium text-destructive">
                      Failed to load permission catalog.
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      Permissions cannot be displayed until the catalog loads.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => refetchCatalog()}
                    >
                      Retry
                    </Button>
                  </div>
                ) : sortedCategories.every(
                    (category) =>
                      (catalog?.permissionsByCategory?.[category.slug] ?? []).length === 0,
                  ) ? (
                  <p className="text-sm text-muted-foreground">
                    No permissions found in the catalog.
                  </p>
                ) : permissionQuery && filteredPermissionResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No permissions match &quot;{permissionSearch.trim()}&quot;.
                  </p>
                ) : permissionQuery ? (
                  <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border p-2">
                    {filteredPermissionResults.map((permission) => (
                      <label
                        key={permission.id}
                        className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50"
                      >
                        <Checkbox
                          className="mt-0.5"
                          checked={form.permissionIds.includes(permission.id)}
                          onCheckedChange={(checked) =>
                            togglePermission(permission.id, checked === true)
                          }
                        />
                        <div>
                          <p className="text-sm font-medium">{permission.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {permission.codename}
                          </p>
                          <p className="text-xs text-muted-foreground/80">
                            {permission.categoryName}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <Accordion type="multiple" className="rounded-lg border px-3">
                    {sortedCategories.map((category) => {
                      const items =
                        catalog?.permissionsByCategory?.[category.slug] ?? [];
                      if (items.length === 0) return null;

                      const selectedCount = items.filter((item) =>
                        form.permissionIds.includes(item.id),
                      ).length;

                      return (
                        <AccordionItem key={category.slug} value={category.slug}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex flex-1 items-center justify-between pr-2 text-left">
                              <span className="font-medium">{category.name}</span>
                              <Badge variant="secondary">{selectedCount}/{items.length}</Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 pb-2">
                              {items.map((permission) => (
                                <label
                                  key={permission.id}
                                  className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50"
                                >
                                  <Checkbox
                                    className="mt-0.5"
                                    checked={form.permissionIds.includes(permission.id)}
                                    onCheckedChange={(checked) =>
                                      togglePermission(permission.id, checked === true)
                                    }
                                  />
                                  <div>
                                    <p className="text-sm font-medium">{permission.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {permission.codename}
                                    </p>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="border-t px-6 py-4">
            <Button variant="outline" onClick={() => handleDialogOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveGroup}
              disabled={createGroupMutation.isPending || updateGroupMutation.isPending}
            >
              {editingGroupId ? "Save Changes" : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteCandidate} onOpenChange={() => setDeleteCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete group?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the &quot;{deleteCandidate?.name}&quot; group. Roles
              using this group will lose access to its bundled permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={deleteGroup}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
