"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Search,
  Plus,
  Globe,
  Mail,
  MapPin,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Loader2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import type { Organization } from "@/api/services/organizations.service";
import type { ApiError } from "@/api/client";
import { OrganizationForm } from "@/components/organizations/organization-form";
import {
  useCreateOrganization,
  useDeleteOrganization,
  useOrganizationsList,
  useOrganizationTypesList,
} from "@/hooks/useOrganizations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

const emptyOrganizationDefaults = {
  name: "",
  orgType: "",
  description: "",
  organizationEmail: "",
  organizationWebsite: "",
  address: "",
};

export default function OrganizationsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [deleteCandidate, setDeleteCandidate] = useState<Organization | null>(
    null,
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const {
    data: organizationsResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useOrganizationsList({
    limit: 200,
    search: debouncedSearch || undefined,
    org_type: typeFilter !== "all" ? Number(typeFilter) : undefined,
  });
  const { data: typesResponse } = useOrganizationTypesList({ limit: 100 });
  const createMutation = useCreateOrganization();
  const deleteMutation = useDeleteOrganization();

  const typeMap = useMemo(() => {
    const map: Record<number, string> = {};
    (typesResponse?.data ?? []).forEach((type) => {
      map[type.id] = type.name;
    });
    return map;
  }, [typesResponse?.data]);

  const organizations = organizationsResponse?.data ?? [];
  const totalCount = organizationsResponse?.meta?.total ?? organizations.length;

  const typeCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    organizations.forEach((org) => {
      counts[org.orgType] = (counts[org.orgType] ?? 0) + 1;
    });
    return counts;
  }, [organizations]);

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    try {
      await deleteMutation.mutateAsync(deleteCandidate.id);
      toast.success("Organization deleted.");
      setDeleteCandidate(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete organization."));
    }
  };

  return (
    <PageContainer
      title="Organizations"
      description="Manage institutional partners used in user profiles, proposals, and policy workflows."
      actions={
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Organization
          </Button>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Add Organization</DialogTitle>
              <DialogDescription>
                Create a new institutional partner record without leaving this
                page.
              </DialogDescription>
            </DialogHeader>
            <OrganizationForm
              defaultValues={emptyOrganizationDefaults}
              organizationTypes={typesResponse?.data ?? []}
              submitLabel="Create Organization"
              isPending={createMutation.isPending}
              onSubmit={async (values) => {
                try {
                  const created = await createMutation.mutateAsync({
                    name: values.name,
                    orgType: Number(values.orgType),
                    description: values.description,
                    organizationEmail: values.organizationEmail || undefined,
                    organizationWebsite:
                      values.organizationWebsite || undefined,
                    address: values.address,
                  });
                  toast.success("Organization created successfully.");
                  setIsCreateOpen(false);
                  router.push(`/organizations/${created.id}`);
                } catch (err) {
                  const apiError = err as ApiError;
                  toast.error(
                    apiError?.message ?? "Failed to create organization.",
                  );
                }
              }}
            />
          </DialogContent>
        </Dialog>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>Organization types are managed under</span>
        <Link
          href="/settings/taxonomy"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          Settings → Taxonomy
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-semibold">{totalCount}</p>
            </div>
          </CardContent>
        </Card>
        {(typesResponse?.data ?? []).slice(0, 3).map((type) => (
          <Card key={type.id}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{type.name}</p>
              <p className="text-2xl font-semibold">
                {typeCounts[type.id] ?? 0}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>All Organizations</CardTitle>
              <CardDescription>
                Search, filter by type, and manage organization records.
              </CardDescription>
            </div>
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
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or description..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {(typesResponse?.data ?? []).map((type) => (
                  <SelectItem key={type.id} value={String(type.id)}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {getErrorMessage(error, "Failed to load organizations.")}
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Added</TableHead>
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
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                      Loading organizations...
                    </TableCell>
                  </TableRow>
                ) : organizations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No organizations found.
                    </TableCell>
                  </TableRow>
                ) : (
                  organizations.map((org) => (
                    <TableRow
                      key={org.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/organizations/${org.id}`)}
                    >
                      <TableCell>
                        <div className="font-medium">{org.name}</div>
                        {org.description && (
                          <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
                            {org.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {typeMap[org.orgType] ?? "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {org.organizationEmail ? (
                          <span className="inline-flex items-center gap-1.5 text-sm">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            {org.organizationEmail}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {org.address ? (
                          <span className="inline-flex max-w-[180px] items-center gap-1.5 truncate text-sm">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            {org.address}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {org.createdAt
                          ? new Date(org.createdAt).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/organizations/${org.id}`)
                              }
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/organizations/${org.id}/edit`)
                              }
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {org.organizationWebsite && (
                              <DropdownMenuItem asChild>
                                <a
                                  href={org.organizationWebsite}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Globe className="mr-2 h-4 w-4" />
                                  Website
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteCandidate(org)}
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

      <AlertDialog
        open={!!deleteCandidate}
        onOpenChange={() => setDeleteCandidate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete organization?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &quot;{deleteCandidate?.name}&quot;.
              Users and records linked to this organization may be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
