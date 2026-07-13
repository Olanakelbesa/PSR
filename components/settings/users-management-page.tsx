"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Mail,
  MoreVertical,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldX,
  Trash2,
  UserPlus,
  ExternalLink,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useDeleteUser, useUpdateUser, useUsers } from "@/hooks/useUsers";
import type { User } from "@/api/services/users.service";
import { PERMISSIONS } from "@/lib/permissions";
import { useCurrentUser } from "@/hooks/useCurrentUser";

function userLabel(user: User) {
  if (user.fullName && user.fullName.trim().length > 0) return user.fullName;
  return (
    [user.firstName, user.middleName, user.lastName]
      .filter(Boolean)
      .join(" ") || user.email
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

export default function UsersManagementPage() {
  const { hasPermission } = useCurrentUser();
  const canManageUsers = hasPermission(PERMISSIONS.USER_VIEW);
  const canCreateUsers = hasPermission(PERMISSIONS.USER_ADD);
  const canEditUsers = hasPermission(PERMISSIONS.USER_CHANGE);
  const canDeleteUsers = hasPermission(PERMISSIONS.USER_DELETE);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [deleteCandidate, setDeleteCandidate] = useState<User | null>(null);

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
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const users = data?.data ?? [];
  const meta = data?.meta;
  const totalUsers = meta?.total ?? users.length;
  const activeUsers = users.filter((u) => u.enabled).length;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, limit]);

  const toggleStatus = async (user: User) => {
    try {
      await updateUserMutation.mutateAsync({
        id: user.id,
        data: {
          enabled: !user.enabled,
          status: user.enabled ? "Inactive" : "Active",
        },
      });
      toast.success(
        `${userLabel(user)} is now ${user.enabled ? "disabled" : "active"}.`,
      );
    } catch (error) {
      toast.error(
        (error as { message?: string })?.message ??
          "Failed to update user status.",
      );
    }
  };

  const deleteUser = async () => {
    if (!deleteCandidate) return;
    try {
      await deleteUserMutation.mutateAsync(deleteCandidate.id);
      toast.success("User deleted successfully.");
      setDeleteCandidate(null);
    } catch (error) {
      toast.error(
        (error as { message?: string })?.message ?? "Failed to delete user.",
      );
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
      description="Manage user accounts and access status."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")}
            />
            Refresh
          </Button>
          {canCreateUsers && (
            <Link href="/settings/access-control/users/new">
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </Link>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Users</CardTitle>
                <CardDescription>
                  Click a user to view details and edit.
                </CardDescription>
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
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-muted-foreground"
                      >
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-muted-foreground"
                      >
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Link
                            href={`/settings/access-control/users/${user.id}`}
                            className="flex items-center gap-3 group"
                          >
                            <Avatar className="h-9 w-9">
                              <AvatarImage
                                src={
                                  resolveFileUrl(user.photoUrl) || undefined
                                }
                                alt={userLabel(user)}
                              />
                              <AvatarFallback>
                                {userInitials(user)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium group-hover:text-primary transition-colors">
                                {userLabel(user)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {user.title?.name ?? "No title"}
                              </p>
                            </div>
                            <ExternalLink className="ml-1 h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/settings/access-control/users/${user.id}`}
                            className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                          >
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            {user.email}
                          </Link>
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
                                <Badge
                                  key={role.id}
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  {role.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                No roles
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.enabled ? "default" : "secondary"}
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
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/settings/access-control/users/${user.id}`}
                                >
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              {canEditUsers && (
                                <DropdownMenuItem
                                  onClick={() => toggleStatus(user)}
                                >
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

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteCandidate}
        onOpenChange={() => setDeleteCandidate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              {deleteCandidate ? userLabel(deleteCandidate) : "this user"} from
              the system.
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
