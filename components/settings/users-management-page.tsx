"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Mail,
  MoreVertical,
  PencilLine,
  RefreshCw,
  Search,
  ShieldCheck,
  Loader2,
  ShieldX,
  Trash2,
  UserPlus,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { useDebounce } from "@/hooks/useDebounce";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from "@/hooks/useUsers";
import { useRoles } from "@/hooks/useRoles";
import {
  useOrganizationTypes,
  useOrganizations,
  useTitles,
  useUnitsWithParams,
} from "@/hooks/useReference";
import {
  getUserById,
  type AdminCreateUserPayload,
  type AdminUpdateUserPayload,
  type User,
} from "@/api/services/users.service";
import { PERMISSIONS } from "@/lib/permissions";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type FormState = {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
  sex: string;
  titleId: string;
  organizationTypeId: string;
  organizationId: string;
  unitId: string;
  selectedRoleIds: number[];
  password: string;
  status: string;
  enabled: boolean;
};

const emptyForm: FormState = {
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  phone: "",
  sex: "",
  titleId: "",
  organizationTypeId: "",
  organizationId: "",
  unitId: "",
  selectedRoleIds: [],
  password: "",
  status: "Active",
  enabled: true,
};

function userLabel(user: User) {
  if (user.fullName && user.fullName.trim().length > 0) return user.fullName;
  return (
    [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ") ||
    user.email
  );
}

function userInitials(user: User) {
  const parts = [user.firstName, user.middleName, user.lastName]
    .filter(Boolean)
    .map((part) => String(part).trim())
    .filter((part) => part.length > 0);

  if (parts.length > 0) {
    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }

  return user.email.slice(0, 2).toUpperCase();
}

function toCreatePayload(form: FormState): AdminCreateUserPayload {
  return {
    email: form.email.trim(),
    firstName: form.firstName.trim() || null,
    middleName: form.middleName.trim() || null,
    lastName: form.lastName.trim() || null,
    phone: form.phone.trim() || null,
    sex: form.sex || null,
    title: form.titleId ? Number(form.titleId) : null,
    organization_type: form.organizationTypeId
      ? Number(form.organizationTypeId)
      : null,
    organization: form.organizationId ? Number(form.organizationId) : null,
    unit: form.unitId ? Number(form.unitId) : null,
    roles: form.selectedRoleIds,
    password: form.password,
  };
}

function toUpdatePayload(form: FormState): AdminUpdateUserPayload {
  return {
    email: form.email.trim() || undefined,
    firstName: form.firstName.trim() || null,
    middleName: form.middleName.trim() || null,
    lastName: form.lastName.trim() || null,
    phone: form.phone.trim() || null,
    sex: form.sex || null,
    title: form.titleId ? Number(form.titleId) : null,
    organization: form.organizationId ? Number(form.organizationId) : null,
    unit: form.unitId ? Number(form.unitId) : null,
    status: form.status,
    enabled: form.enabled,
    roles: form.selectedRoleIds,
  };
}

export default function UsersManagementPage() {
  const isMobile = useIsMobile();
  const { hasPermission } = useCurrentUser();
  const canManageUsers = hasPermission(PERMISSIONS.USER_VIEW);
  const canEditUsers = hasPermission(PERMISSIONS.USER_CHANGE);
  const canCreateUsers = hasPermission(PERMISSIONS.USER_ADD);
  const canDeleteUsers = hasPermission(PERMISSIONS.USER_DELETE);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<User | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const filters = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
    }),
    [page, limit, debouncedSearch, statusFilter],
  );

  const { data, isLoading, isFetching, refetch } = useUsers(filters);
  const { data: rolesData } = useRoles({ limit: 200 });
  const { data: titles = [] } = useTitles();
  const { data: organizationTypes = [] } = useOrganizationTypes();
  const { data: organizationsResponse } = useOrganizations({
    limit: 200,
    org_type: form.organizationTypeId || undefined,
  });
  const { data: unitsResponse } = useUnitsWithParams({
    limit: 200,
    organization: form.organizationId || undefined,
  });
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const users = data?.data ?? [];
  const roles = rolesData?.data ?? [];
  const organizations = organizationsResponse?.data ?? [];
  const units = unitsResponse?.data ?? [];
  const meta = data?.meta;
  const totalUsers = meta?.total ?? users.length;
  const activeUsers = users.filter((user) => user.enabled).length;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, limit]);

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setIsSheetOpen(true);
  };

  const openEdit = async (user: User) => {
    setEditingUser(user);
    setIsSheetOpen(true);
    setLoadingUserDetail(true);

    try {
      const detail = await getUserById(user.id);
      setForm({
        firstName: detail.firstName ?? "",
        middleName: detail.middleName ?? "",
        lastName: detail.lastName ?? "",
        email: detail.email,
        phone: detail.phone ?? "",
        sex: detail.sex ?? "",
        titleId: detail.title?.id ? String(detail.title.id) : "",
        organizationTypeId: detail.organizationType?.id
          ? String(detail.organizationType.id)
          : "",
        organizationId: detail.organization?.id ? String(detail.organization.id) : "",
        unitId: detail.unit?.id ? String(detail.unit.id) : "",
        selectedRoleIds: (detail.roles ?? []).map((role) => role.id),
        password: "",
        status: detail.status ?? "Active",
        enabled: detail.enabled,
      });
    } catch (error) {
      toast.error((error as { message?: string })?.message ?? "Failed to load user details.");
      setIsSheetOpen(false);
      setEditingUser(null);
    } finally {
      setLoadingUserDetail(false);
    }
  };

  const toggleRole = (roleId: number, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      selectedRoleIds: checked
        ? [...prev.selectedRoleIds, roleId]
        : prev.selectedRoleIds.filter((id) => id !== roleId),
    }));
  };

  const saveUser = async () => {
    if (!form.email.trim()) {
      toast.error("Email is required.");
      return;
    }

    if (!editingUser && !form.password.trim()) {
      toast.error("Password is required for creating a user.");
      return;
    }

    try {
      if (editingUser) {
        await updateUserMutation.mutateAsync({
          id: editingUser.id,
          data: toUpdatePayload(form),
        });
        toast.success("User updated successfully.");
      } else {
        await createUserMutation.mutateAsync(toCreatePayload(form));
        toast.success("User created successfully.");
      }
      setIsSheetOpen(false);
    } catch (error) {
      const fallback = editingUser ? "Failed to update user." : "Failed to create user.";
      toast.error((error as { message?: string })?.message ?? fallback);
    }
  };

  const toggleStatus = async (user: User) => {
    try {
      await updateUserMutation.mutateAsync({
        id: user.id,
        data: {
          enabled: !user.enabled,
          status: user.enabled ? "Inactive" : "Active",
        },
      });
      toast.success(`${userLabel(user)} is now ${user.enabled ? "disabled" : "active"}.`);
    } catch (error) {
      toast.error((error as { message?: string })?.message ?? "Failed to update user status.");
    }
  };

  const deleteUser = async () => {
    if (!deleteCandidate) return;

    try {
      await deleteUserMutation.mutateAsync(deleteCandidate.id);
      toast.success("User deleted successfully.");
      setDeleteCandidate(null);
    } catch (error) {
      toast.error((error as { message?: string })?.message ?? "Failed to delete user.");
    }
  };

  if (!canManageUsers) {
    return (
      <PageContainer
        title="User Management"
        description="You do not have permission to view user accounts."
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
      title="User Management"
        description="Manage user accounts, roles, and access status."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
            Refresh
          </Button>
          {canCreateUsers && (
            <Button onClick={openCreate}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-3xl">{totalUsers}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active on Page</CardDescription>
              <CardTitle className="text-3xl">{activeUsers}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Available Roles</CardDescription>
              <CardTitle className="text-3xl">{roles.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Users</CardTitle>
                <CardDescription>Search and filter registered accounts.</CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-full pl-9 sm:w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={resolveFileUrl(user.photoUrl) || undefined} alt={userLabel(user)} />
                              <AvatarFallback>{userInitials(user)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{userLabel(user)}</p>
                              <p className="text-xs text-muted-foreground">
                                {user.title?.name ?? "No title"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            {user.organization?.name ?? "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(user.roles ?? []).length > 0 ? (
                              user.roles?.map((role) => (
                                <Badge key={role.id} variant="secondary">
                                  {role.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">No roles</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.enabled ? "default" : "secondary"}>
                            {user.enabled ? "Active" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canEditUsers && (
                                <DropdownMenuItem onClick={() => openEdit(user)}>
                                  <PencilLine className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {canEditUsers && (
                                <DropdownMenuItem onClick={() => toggleStatus(user)}>
                                  {user.enabled ? (
                                    <>
                                      <ShieldX className="mr-2 h-4 w-4" />
                                      Disable
                                    </>
                                  ) : (
                                    <>
                                      <ShieldCheck className="mr-2 h-4 w-4" />
                                      Enable
                                    </>
                                  )}
                                </DropdownMenuItem>
                              )}
                              {canDeleteUsers && (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeleteCandidate(user)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {meta.page} of {meta.totalPages} ({meta.total} users)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => current - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= meta.totalPages}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className="w-full overflow-y-auto sm:max-w-5xl"
        >
          <SheetHeader>
            <SheetTitle>{editingUser ? "Edit User" : "Create User"}</SheetTitle>
            <SheetDescription>
              {editingUser
                ? "Update profile details, roles, and account status."
                : "Register a new user and assign roles."}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <Card className="border-muted/60 shadow-none">
              <CardContent className="space-y-4 p-4 sm:p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      value={form.firstName}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, firstName: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      value={form.lastName}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, lastName: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, email: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={form.phone}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, phone: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sex</Label>
                    <Select
                      value={form.sex || "none"}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, sex: value === "none" ? "" : value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not specified</SelectItem>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Select
                      value={form.titleId || "none"}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, titleId: value === "none" ? "" : value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {titles.map((title) => (
                          <SelectItem key={title.id} value={String(title.id)}>
                            {title.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Organization Type</Label>
                    <Select
                      value={form.organizationTypeId || "none"}
                      onValueChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          organizationTypeId: value === "none" ? "" : value,
                          organizationId: "",
                          unitId: "",
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {organizationTypes.map((type) => (
                          <SelectItem key={type.id} value={String(type.id)}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Organization</Label>
                    <Select
                      value={form.organizationId || "none"}
                      onValueChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          organizationId: value === "none" ? "" : value,
                          unitId: "",
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {organizations.map((organization) => (
                          <SelectItem key={organization.id} value={String(organization.id)}>
                            {organization.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Unit</Label>
                    <Select
                      value={form.unitId || "none"}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, unitId: value === "none" ? "" : value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={String(unit.id)}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Roles</Label>
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
                    {roles.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No roles available.</p>
                    ) : (
                      roles.map((role) => (
                        <label
                          key={role.id}
                          className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={form.selectedRoleIds.includes(role.id)}
                            onCheckedChange={(checked) =>
                              toggleRole(role.id, checked === true)
                            }
                            disabled={loadingUserDetail}
                          />
                          <div>
                            <p className="text-sm font-medium">{role.name}</p>
                            {role.description && (
                              <p className="text-xs text-muted-foreground">{role.description}</p>
                            )}
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {!editingUser && (
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={form.password}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, password: event.target.value }))
                      }
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {editingUser && (
              <Card className="border-muted/60 shadow-none">
                <CardContent className="space-y-4 p-4 sm:p-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={form.status}
                        onValueChange={(value) =>
                          setForm((prev) => ({ ...prev, status: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium">Access Enabled</p>
                          <p className="text-xs text-muted-foreground">
                            Disabled users cannot sign in.
                          </p>
                        </div>
                        <Switch
                          checked={form.enabled}
                          onCheckedChange={(checked) =>
                            setForm((prev) => ({ ...prev, enabled: checked }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsSheetOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveUser}
              disabled={
                createUserMutation.isPending ||
                updateUserMutation.isPending ||
                loadingUserDetail
              }
            >
              {editingUser ? "Save Changes" : "Create User"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteCandidate} onOpenChange={() => setDeleteCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              {deleteCandidate ? userLabel(deleteCandidate) : "this user"} from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={deleteUser}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
