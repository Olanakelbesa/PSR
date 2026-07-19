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
  Users,
  Activity,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
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
import { useRoles } from "@/hooks/useRoles";
import { useOrganizationsList } from "@/hooks/useOrganizations";
import type { User, UserStatistics } from "@/api/services/users.service";
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
  const [roleFilter, setRoleFilter] = useState("all");
  const [organizationFilter, setOrganizationFilter] = useState("all");
  const [onlineFilter, setOnlineFilter] = useState<string>("all");
  const [ordering, setOrdering] = useState("-created");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [jumpPage, setJumpPage] = useState("");
  const [deleteCandidate, setDeleteCandidate] = useState<User | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const { data: rolesRes } = useRoles({ limit: 100, is_active: true });
  const roles = rolesRes?.data ?? [];

  const { data: orgsRes } = useOrganizationsList({ limit: 200 });
  const organizations = orgsRes?.data ?? [];

  const filters = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      role: roleFilter === "all" ? undefined : roleFilter,
      organization: organizationFilter === "all" ? undefined : Number(organizationFilter),
      is_logged_in: onlineFilter === "online" ? true : onlineFilter === "offline" ? false : undefined,
      ordering: ordering || undefined,
    }),
    [page, limit, debouncedSearch, statusFilter, roleFilter, organizationFilter, onlineFilter, ordering],
  );

  const { data, isLoading, isFetching, refetch } = useUsers(filters);
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const users = data?.data ?? [];
  const meta = data?.meta;
  const statistics = (meta as any)?.statistics as UserStatistics | undefined;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, roleFilter, organizationFilter, onlineFilter, ordering, limit]);

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
        {(() => {
          const isStatusActive = (key: string) => {
            if (key === "total") return statusFilter === "all" && onlineFilter === "all";
            if (key === "active") return statusFilter === "Active";
            if (key === "inactive") return statusFilter === "Inactive";
            if (key === "online") return onlineFilter === "online";
            return false;
          };
          const toggleStat = (key: string) => {
            if (key === "total") {
              setStatusFilter("all");
              setOnlineFilter("all");
            } else if (key === "active") {
              setStatusFilter((c) => (c === "Active" ? "all" : "Active"));
              setOnlineFilter("all");
            } else if (key === "inactive") {
              setStatusFilter((c) => (c === "Inactive" ? "all" : "Inactive"));
              setOnlineFilter("all");
            } else if (key === "online") {
              setOnlineFilter((c) => (c === "online" ? "all" : "online"));
              setStatusFilter("all");
            }
          };
          const statCards = [
            {
              key: "total",
              label: "Total Users",
              value: statistics?.total ?? meta?.total ?? users.length,
              icon: <Users className="h-4 w-4 text-primary" />,
              iconBg: "bg-primary/10",
              border: "border-primary/10",
              activeRing: "ring-primary/50 border-primary/40",
            },
            {
              key: "active",
              label: "Active",
              value: statistics?.active ?? 0,
              icon: <ShieldCheck className="h-4 w-4 text-green-600" />,
              iconBg: "bg-green-100",
              border: "border-green-100/50",
              activeRing: "ring-green-500/60 border-green-300",
            },
            {
              key: "inactive",
              label: "Inactive",
              value: statistics?.inactive ?? 0,
              icon: <ShieldX className="h-4 w-4 text-orange-600" />,
              iconBg: "bg-orange-100",
              border: "border-orange-100/50",
              activeRing: "ring-orange-500/60 border-orange-300",
            },
            {
              key: "online",
              label: "Active (5 min)",
              value: statistics?.loggedIn ?? 0,
              icon: <Activity className="h-4 w-4 text-blue-600" />,
              iconBg: "bg-blue-100",
              border: "border-blue-100/50",
              activeRing: "ring-blue-500/60 border-blue-300",
            },
          ];
          return (
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              {statCards.map((card) => {
                const isActive = isStatusActive(card.key);
                return (
                  <Card
                    key={card.key}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleStat(card.key)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleStat(card.key);
                      }
                    }}
                    className={cn(
                      card.border,
                      "cursor-pointer transition-all hover:shadow-md",
                      isActive && cn("ring-2 shadow-md", card.activeRing),
                    )}
                  >
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardDescription>{card.label}</CardDescription>
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${card.iconBg}`}>
                        {card.icon}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{card.value}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          );
        })()}

        {statistics && statistics.roles.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Top roles:</span>
            {statistics.roles.slice(0, 5).map((role) => (
              <Badge key={role.slug} variant="secondary" className="text-[10px]">
                {role.name} ({role.count})
              </Badge>
            ))}
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Users</CardTitle>
                <CardDescription>
                  Click a user to view details and edit.
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
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
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.slug}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
                  <SelectTrigger className="w-full sm:w-52">
                    <SelectValue placeholder="Organization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All organizations</SelectItem>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={String(org.id)}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={ordering} onValueChange={setOrdering}>
                  <SelectTrigger className="w-full sm:w-48">
                    <ArrowUpDown className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-created">Newest users</SelectItem>
                    <SelectItem value="created">Oldest users</SelectItem>
                    <SelectItem value="first_name">Name A → Z</SelectItem>
                    <SelectItem value="-first_name">Name Z → A</SelectItem>
                    <SelectItem value="email">Email A → Z</SelectItem>
                    <SelectItem value="-email">Email Z → A</SelectItem>
                    <SelectItem value="organization__name">Organization A → Z</SelectItem>
                    <SelectItem value="-organization__name">Organization Z → A</SelectItem>
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
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {meta.page} of {meta.totalPages} ({meta.total} users)
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">Go to</span>
                    <Input
                      type="number"
                      min={1}
                      max={meta.totalPages}
                      placeholder="#"
                      value={jumpPage}
                      onChange={(e) => setJumpPage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const p = parseInt(jumpPage);
                          if (!isNaN(p) && p >= 1 && p <= meta.totalPages) {
                            setPage(p);
                            setJumpPage("");
                          }
                        }
                      }}
                      onBlur={() => setJumpPage("")}
                      className="h-8 w-16 text-center text-xs"
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={page <= 1}
                      onClick={() => setPage(1)}
                    >
                      <ChevronsLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    {(() => {
                      const total = meta.totalPages;
                      const current = page;
                      if (total <= 7) {
                        return Array.from({ length: total }, (_, i) => i + 1);
                      }
                      const pages: (number | "...")[] = [1];
                      if (current > 3) pages.push("...");
                      for (
                        let i = Math.max(2, current - 1);
                        i <= Math.min(total - 1, current + 1);
                        i++
                      ) {
                        pages.push(i);
                      }
                      if (current < total - 2) pages.push("...");
                      pages.push(total);
                      return pages;
                    })().map((p, idx) =>
                      p === "..." ? (
                        <span key={`dots-${idx}`} className="px-1.5 text-xs text-muted-foreground self-center">
                          ...
                        </span>
                      ) : (
                        <Button
                          key={p}
                          variant={page === p ? "default" : "outline"}
                          size="icon"
                          className="h-8 w-8 text-xs"
                          onClick={() => setPage(p as number)}
                        >
                          {p}
                        </Button>
                      ),
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={page >= meta.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={page >= meta.totalPages}
                      onClick={() => setPage(meta.totalPages)}
                    >
                      <ChevronsRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
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
