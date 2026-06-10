"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  RefreshCw,
  Search,
  Shield,
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
  useCreateRole,
  useDeleteRole,
  usePermissionCatalog,
  useRoles,
  useUpdateRole,
} from "@/hooks/useRoles";
import { getRoleById } from "@/api/services/roles.service";
import type { PermissionCatalogItem } from "@/api/services/roles.service";
import type { Role } from "@/api/services/roles.service";
import { PERMISSIONS } from "@/lib/permissions";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type RoleFormState = {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  hasAllPermissions: boolean;
  permissionIds: number[];
};

const emptyForm: RoleFormState = {
  name: "",
  slug: "",
  description: "",
  isActive: true,
  hasAllPermissions: false,
  permissionIds: [],
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function permissionMatchesQuery(
  permission: PermissionCatalogItem,
  categoryName: string,
  query: string,
) {
  const haystack = `${permission.name} ${permission.codename} ${categoryName}`.toLowerCase();
  return haystack.includes(query);
}

export default function RolesManagementPage() {
  const { hasPermission } = useCurrentUser();
  const canViewRoles = hasPermission(PERMISSIONS.ROLE_VIEW);
  const canEditRoles = hasPermission(PERMISSIONS.ROLE_CHANGE);
  const canCreateRoles = hasPermission(PERMISSIONS.ROLE_ADD);
  const canDeleteRoles = hasPermission(PERMISSIONS.ROLE_DELETE);

  const [search, setSearch] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Role | null>(null);
  const [form, setForm] = useState<RoleFormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const debouncedSearch = useDebounce(search, 400);
  const permissionQuery = permissionSearch.trim().toLowerCase();
  const { data, isLoading, isFetching, refetch } = useRoles({
    search: debouncedSearch || undefined,
    limit: 100,
  });
  const {
    data: catalog,
    isLoading: catalogLoading,
    isError: catalogError,
    refetch: refetchCatalog,
  } = usePermissionCatalog();
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();

  const roles = data?.data ?? [];
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
      setEditingRoleId(null);
      setLoadingEdit(false);
    }
  };

  const openCreate = () => {
    setEditingRoleId(null);
    setForm(emptyForm);
    setSlugTouched(false);
    setPermissionSearch("");
    setDialogOpen(true);
  };

  const openEdit = async (role: Role) => {
    setEditingRoleId(role.id);
    setSlugTouched(true);
    setPermissionSearch("");
    setDialogOpen(true);
    setLoadingEdit(true);

    try {
      const detail = await getRoleById(role.id);
      setForm({
        name: detail.name,
        slug: detail.slug,
        description: detail.description ?? "",
        isActive: detail.isActive ?? true,
        hasAllPermissions: detail.hasAllPermissions ?? false,
        permissionIds: detail.permissions ?? [],
      });
    } catch (error) {
      toast.error((error as { message?: string })?.message ?? "Failed to load role details.");
      setDialogOpen(false);
      setEditingRoleId(null);
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

  const saveRole = async () => {
    if (!form.name.trim()) {
      toast.error("Role name is required.");
      return;
    }

    const slug = form.slug.trim() || slugify(form.name);
    if (!slug) {
      toast.error("Role slug is required.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug,
      description: form.description.trim() || null,
      is_active: form.isActive,
      has_all_permissions: form.hasAllPermissions,
      permissions: form.hasAllPermissions ? [] : form.permissionIds,
    };

    try {
      if (editingRoleId) {
        await updateRoleMutation.mutateAsync({ id: editingRoleId, data: payload });
        toast.success("Role updated successfully.");
      } else {
        await createRoleMutation.mutateAsync(payload);
        toast.success("Role created successfully.");
      }
      setDialogOpen(false);
    } catch (error) {
      const fallback = editingRoleId ? "Failed to update role." : "Failed to create role.";
      toast.error((error as { message?: string })?.message ?? fallback);
    }
  };

  const deleteRole = async () => {
    if (!deleteCandidate) return;

    try {
      await deleteRoleMutation.mutateAsync(deleteCandidate.id);
      toast.success("Role deleted successfully.");
      setDeleteCandidate(null);
    } catch (error) {
      toast.error((error as { message?: string })?.message ?? "Failed to delete role.");
    }
  };

  if (!canViewRoles) {
    return (
      <PageContainer
        title="Roles & Permissions"
        description="You do not have permission to manage roles."
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
      title="Roles & Permissions"
      description="Define roles and assign granular permissions across the system."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
            Refresh
          </Button>
          {canCreateRoles && (
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Role
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
                  <Shield className="h-5 w-5" />
                  Roles
                </CardTitle>
                <CardDescription>
                  Each role bundles permissions that control feature access.
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search roles..."
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
                    <TableHead>Role</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        Loading roles...
                      </TableCell>
                    </TableRow>
                  ) : roles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        No roles found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{role.name}</p>
                            {role.description && (
                              <p className="text-xs text-muted-foreground">{role.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="rounded bg-muted px-2 py-1 text-xs">{role.slug}</code>
                        </TableCell>
                        <TableCell>
                          {role.hasAllPermissions ? (
                            <Badge>All permissions</Badge>
                          ) : (
                            <Badge variant="secondary">
                              {(role.permissions ?? []).length} assigned
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={role.isActive ? "default" : "secondary"}>
                            {role.isActive ? "Active" : "Inactive"}
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
                                  <DropdownMenuItem onClick={() => openEdit(role)}>
                                    <PencilLine className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                )}
                                {canDeleteRoles && (
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => setDeleteCandidate(role)}
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
            <DialogTitle>{editingRoleId ? "Edit Role" : "Create Role"}</DialogTitle>
            <DialogDescription>
              Configure role metadata and assign permissions by category.
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
                        slug: slugTouched ? prev.slug : slugify(name),
                      }));
                    }}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Slug</Label>
                  <Input
                    value={form.slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      setForm((prev) => ({ ...prev, slug: slugify(event.target.value) }));
                    }}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                    rows={2}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium">Active</p>
                    <p className="text-xs text-muted-foreground">Inactive roles cannot be assigned.</p>
                  </div>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, isActive: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium">All Permissions</p>
                    <p className="text-xs text-muted-foreground">Grants unrestricted system access.</p>
                  </div>
                  <Switch
                    checked={form.hasAllPermissions}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, hasAllPermissions: checked }))
                    }
                  />
                </div>
              </div>

              {!form.hasAllPermissions && (
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
                    <p className="text-sm text-muted-foreground">Loading role permissions...</p>
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
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="border-t px-6 py-4">
            <Button variant="outline" onClick={() => handleDialogOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveRole}
              disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
            >
              {editingRoleId ? "Save Changes" : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteCandidate} onOpenChange={() => setDeleteCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the &quot;{deleteCandidate?.name}&quot; role. Users
              assigned to this role will lose its permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={deleteRole}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
