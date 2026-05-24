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
  ShieldX,
  Trash2,
  UserPlus,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDebounce } from "@/hooks/useDebounce";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useOrganizationTypes,
  useOrganizations,
  useTitles,
  useUnitsWithParams,
} from "@/hooks/useReference";
import { useCreateUser, useDeleteUser, useUpdateUser, useUsers } from "@/hooks/useUsers";
import type {
  AdminCreateUserPayload,
  AdminUpdateUserPayload,
  User,
} from "@/api/services/users.service";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  roleIdsText: string;
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
  roleIdsText: "",
  password: "",
  status: "Active",
  enabled: true,
};

function userLabel(user: User) {
  if (user.fullName && user.fullName.trim().length > 0) return user.fullName;
  return [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ") || user.email;
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

function formatDate(dateValue?: string | null) {
  if (!dateValue) return "No recent activity";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "No recent activity";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toCreatePayload(form: FormState): AdminCreateUserPayload {
  const parsedRoleIds = form.roleIdsText
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);

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
    roles: parsedRoleIds,
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
  };
}

export default function UsersManagementPage() {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<User | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

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

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      firstName: user.firstName ?? "",
      middleName: user.middleName ?? "",
      lastName: user.lastName ?? "",
      email: user.email,
      phone: user.phone ?? "",
      sex: user.sex ?? "",
      titleId: user.title?.id ? String(user.title.id) : "",
      organizationTypeId: user.organizationType?.id
        ? String(user.organizationType.id)
        : "",
      organizationId: user.organization?.id ? String(user.organization.id) : "",
      unitId: user.unit?.id ? String(user.unit.id) : "",
      roleIdsText: (user.roles ?? []).map((role) => String(role.id)).join(", "),
      password: "",
      status: user.status ?? "Active",
      enabled: user.enabled,
    });
    setIsSheetOpen(true);
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
        const payload = toUpdatePayload(form);
        await updateUserMutation.mutateAsync({ id: editingUser.id, data: payload });
        toast.success("User updated successfully.");
      } else {
        const payload = toCreatePayload(form);
        await createUserMutation.mutateAsync(payload);
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

  return (
    <PageContainer
      title="User Management"
      description="Manage user accounts, access status, and profile details from the admin dashboard."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button onClick={openCreate}>
            <UserPlus className="mr-2 h-4 w-4" />
            New User
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-2xl">{totalUsers}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">Across all listed pages and filters</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active</CardDescription>
              <CardTitle className="text-2xl text-emerald-600">{activeUsers}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">Users with enabled access</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Disabled</CardDescription>
              <CardTitle className="text-2xl text-rose-600">{Math.max(users.length - activeUsers, 0)}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">Disabled in current result set</CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, organization"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-44">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={String(limit)} onValueChange={(value) => setLimit(Number(value))}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Rows" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 rows</SelectItem>
                  <SelectItem value="20">20 rows</SelectItem>
                  <SelectItem value="50">50 rows</SelectItem>
                </SelectContent>
              </Select>
              <div className="ml-auto text-xs text-muted-foreground">Page {meta?.page ?? page} of {meta?.totalPages ?? 1}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Affiliation</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    No users found with the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-border">
                          <AvatarImage src={user.photoUrl ?? undefined} alt={userLabel(user)} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {userInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium leading-none">{userLabel(user)}</p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-xs">
                        <p className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {user.organization?.name || "No organization"}
                        </p>
                        <p className="text-muted-foreground">{user.unit?.name || "No unit"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(user.roles ?? []).length > 0 ? (
                          user.roles.map((role) => (
                            <Badge key={role.id} variant="secondary" className="text-[11px]">
                              {role.name}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline">No role</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "text-xs",
                          user.enabled ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700",
                        )}
                      >
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
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => openEdit(user)}>
                            <PencilLine className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(user)}>
                            {user.enabled ? (
                              <ShieldX className="mr-2 h-4 w-4" />
                            ) : (
                              <ShieldCheck className="mr-2 h-4 w-4" />
                            )}
                            {user.enabled ? "Disable User" : "Enable User"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteCandidate(user)}
                            className="text-rose-600 focus:text-rose-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            disabled={(meta?.page ?? page) <= 1 || isFetching}
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={(meta?.page ?? page) >= (meta?.totalPages ?? 1) || isFetching}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <Sheet
        open={isSheetOpen}
        onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) setEditingUser(null);
        }}
      >
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className="flex h-[92dvh] w-full max-w-none flex-col overflow-hidden p-0 sm:h-full sm:max-w-3xl"
        >
          <SheetHeader className="px-6 pt-6 pb-4">
            <SheetTitle>{editingUser ? "Edit User" : "Create User"}</SheetTitle>
            <SheetDescription>
              {editingUser
                ? "Update user profile and account status."
                : "Create a new user account for dashboard access."}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="space-y-6 px-6 pb-6 pt-2">
            {editingUser && (
              <Card className="border-muted/60 bg-muted/30 shadow-none">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border border-border">
                      <AvatarImage src={editingUser.photoUrl ?? undefined} alt={userLabel(editingUser)} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {userInitials(editingUser)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="font-medium leading-none">{userLabel(editingUser)}</p>
                      <p className="text-xs text-muted-foreground">{editingUser.email}</p>
                      <p className="text-xs text-muted-foreground">Last login: {formatDate(editingUser.lastLogin)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-muted/60 shadow-none">
              <CardContent className="p-4 sm:p-5">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Profile Information</p>
                    <p className="text-xs text-muted-foreground">Basic identity and contact information</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input
                        value={form.firstName}
                        onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Middle Name</Label>
                      <Input
                        value={form.middleName}
                        onChange={(event) => setForm((prev) => ({ ...prev, middleName: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input
                        value={form.lastName}
                        onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={form.phone}
                        onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sex</Label>
                      <Select
                        value={form.sex || "unspecified"}
                        onValueChange={(value) =>
                          setForm((prev) => ({ ...prev, sex: value === "unspecified" ? "" : value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unspecified">Unspecified</SelectItem>
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
                            <SelectItem key={title.id} value={title.id}>
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
                        disabled={!!editingUser}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {organizationTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
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
                            <SelectItem key={organization.id} value={organization.id}>
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
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {!editingUser && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Role IDs</Label>
                        <Input
                          placeholder="Example: 1, 2"
                          value={form.roleIdsText}
                          onChange={(event) =>
                            setForm((prev) => ({ ...prev, roleIdsText: event.target.value }))
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter backend role IDs separated by commas.
                        </p>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>Password</Label>
                        <Input
                          type="password"
                          value={form.password}
                          onChange={(event) =>
                            setForm((prev) => ({ ...prev, password: event.target.value }))
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-muted/60 shadow-none">
              <CardContent className="p-4 sm:p-5">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Account Controls</p>
                    <p className="text-xs text-muted-foreground">Manage user state and dashboard access</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={form.status}
                        onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
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

                    <div className="rounded-lg border bg-background p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Access Enabled</p>
                          <p className="text-xs text-muted-foreground">
                            Disabled users cannot sign in to the dashboard.
                          </p>
                        </div>
                        <Switch
                          checked={form.enabled}
                          onCheckedChange={(checked) => setForm((prev) => ({ ...prev, enabled: checked }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          </ScrollArea>

          <SheetFooter className="border-t px-6 py-4">
            <Button variant="outline" onClick={() => setIsSheetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveUser} disabled={createUserMutation.isPending || updateUserMutation.isPending}>
              {createUserMutation.isPending || updateUserMutation.isPending ? "Saving..." : editingUser ? "Update User" : "Create User"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteCandidate} onOpenChange={(open) => !open && setDeleteCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleteCandidate ? userLabel(deleteCandidate) : "this user"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 text-white hover:bg-rose-700"
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
