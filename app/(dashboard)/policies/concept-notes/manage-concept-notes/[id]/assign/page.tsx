"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Search,
  Shield,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Building2,
  BookOpen,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/layout";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  useUserSelector,
  useAssignReviewer,
  useAssignedReviewers,
} from "@/lib/queries/users";

const PAGE_SIZE = 6;

export default function AssignConceptNoteReviewersPage() {
  const params = useParams();
  const router = useRouter();
  const { backendToken } = useAuth();
  const conceptNoteId = params.id as string;

  // ── Data fetching ────────────────────────────────────────────────────────────
  const {
    data: users = [],
    isLoading,
    isError,
    refetch,
  } = useUserSelector(backendToken);
  const { data: assignedData, isLoading: isLoadingAssigned } =
    useAssignedReviewers(conceptNoteId);
  const assignMutation = useAssignReviewer();

  // ── Local state ──────────────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Sync assigned reviewer
  useEffect(() => {
    if (assignedData?.reviewerIds && assignedData.reviewerIds.length > 0) {
      setSelectedId(assignedData.reviewerIds[0]);
    }
  }, [assignedData]);

  // ── Filtered & paginated ────────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return users.filter((u) =>
      [u.fullName, u.email, u.organization?.name, u.unit?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [users, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // ── Assign handler ──────────────────────────────────────────────────────────
  const handleAssign = async () => {
    if (selectedId === null) {
      toast.error("Please select a reviewer before saving.");
      return;
    }

    try {
      await assignMutation.mutateAsync({
        conceptNoteId,
        reviewerId: selectedId,
      });
      const assignedUser = users.find((u) => u.id === selectedId);
      toast.success(
        `${assignedUser?.fullName ?? "Reviewer"} assigned successfully.`,
      );
      router.push(
        `/policies/concept-notes/manage-concept-notes/${conceptNoteId}`,
      );
    } catch (error: any) {
      const msg =
        error?.response?.data?.error?.message ??
        error?.message ??
        "Failed to assign reviewer.";
      toast.error(msg);
    }
  };

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading || isLoadingAssigned) {
    return (
      <PageContainer title="Assign Reviewer">
        <div className="grid gap-6 lg:grid-cols-4 items-start">
          <div className="lg:col-span-3 space-y-3">
            <Skeleton className="h-16 rounded-xl" />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </PageContainer>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <PageContainer title="Assign Reviewer">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-12 text-center">
          <AlertCircle className="h-10 w-10 text-destructive/60 mx-auto mb-3" />
          <p className="font-semibold text-destructive">Failed to load users</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </div>
      </PageContainer>
    );
  }

  const selectedUser = users.find((u) => u.id === selectedId) ?? null;

  return (
    <PageContainer
      title="Assign Expert Reviewer"
      description={`Select one reviewer to assign to Concept Note #${conceptNoteId}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="shadow-sm">
            <Link
              href={`/policies/concept-notes/manage-concept-notes/${conceptNoteId}`}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </Button>
          <Button
            onClick={handleAssign}
            disabled={assignMutation.isPending || selectedId === null}
            className="shadow-sm"
          >
            <Shield className="mr-2 h-4 w-4" />
            {assignMutation.isPending ? "Assigning..." : "Confirm Assignment"}
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-4 items-start">
        {/* ── User list ────────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg">Select a Reviewer</CardTitle>
                  <CardDescription>
                    Choose one user from the platform to review this concept
                    note.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search by name, email, or unit…"
                    className="pl-9 h-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredUsers.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground text-sm">
                  No users match your search.
                </div>
              ) : (
                <>
                  <div className="divide-y">
                    {paginatedUsers.map((user) => {
                      const isSelected = user.id === selectedId;
                      const initials = user.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2);

                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() =>
                            setSelectedId(isSelected ? null : user.id)
                          }
                          className={cn(
                            "flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-muted/30",
                            isSelected && "bg-primary/5 hover:bg-primary/10",
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <Avatar
                              className={cn(
                                "h-10 w-10 border-2 shadow-sm",
                                isSelected
                                  ? "border-primary"
                                  : "border-transparent",
                              )}
                            >
                              <AvatarImage
                                src={user.photoUrl ?? undefined}
                                alt={user.fullName}
                              />
                              <AvatarFallback
                                className={cn(
                                  "text-xs font-bold",
                                  isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground",
                                )}
                              >
                                {initials}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-sm leading-tight">
                                {user.fullName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {user.email}
                              </span>
                              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                {user.organization && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary/70 uppercase tracking-wide">
                                    <Building2 className="h-2.5 w-2.5" />
                                    {user.organization.name}
                                  </span>
                                )}
                                {user.unit && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                                    <BookOpen className="h-2.5 w-2.5" />
                                    {user.unit.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <Badge
                            variant={isSelected ? "default" : "outline"}
                            className="shrink-0"
                          >
                            {isSelected ? (
                              <span className="inline-flex items-center gap-1">
                                <Check className="h-3.5 w-3.5" />
                                Selected
                              </span>
                            ) : (
                              "Select"
                            )}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between gap-3 border-t bg-muted/10 p-4">
                      <p className="text-xs text-muted-foreground">
                        Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                        {Math.min(
                          currentPage * PAGE_SIZE,
                          filteredUsers.length,
                        )}{" "}
                        of {filteredUsers.length} users
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1,
                        ).map((p) => (
                          <Button
                            key={p}
                            variant={currentPage === p ? "default" : "outline"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCurrentPage(p)}
                          >
                            {p}
                          </Button>
                        ))}
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Sidebar summary ──────────────────────────────────────────────── */}
        <div className="space-y-4 lg:col-span-1">
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b bg-muted/30 pb-3">
              <CardTitle className="text-base">Assignment Summary</CardTitle>
              <CardDescription>Selected reviewer preview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {selectedUser ? (
                <>
                  <div className="flex flex-col items-center text-center gap-2 py-2">
                    <Avatar className="h-14 w-14 border-2 border-primary shadow-sm">
                      <AvatarImage src={selectedUser.photoUrl ?? undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                        {selectedUser.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm leading-tight">
                        {selectedUser.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedUser.email}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2 text-xs">
                    {selectedUser.organization && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">
                          Organization
                        </span>
                        <span className="font-medium text-right">
                          {selectedUser.organization.name}
                        </span>
                      </div>
                    )}
                    {selectedUser.unit && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Unit</span>
                        <span className="font-medium text-right">
                          {selectedUser.unit.name}
                        </span>
                      </div>
                    )}
                    {selectedUser.sex && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sex</span>
                        <span className="font-medium">{selectedUser.sex}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full mt-2"
                    onClick={handleAssign}
                    disabled={assignMutation.isPending}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    {assignMutation.isPending
                      ? "Assigning..."
                      : "Confirm Assignment"}
                  </Button>
                </>
              ) : (
                <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground text-center">
                  Select a reviewer from the list to see their details here.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-muted">
            <CardContent className="pt-4 text-xs text-muted-foreground space-y-1.5">
              <p className="font-medium text-foreground text-sm">
                How it works
              </p>
              <p>
                Only one reviewer can be assigned per concept note at a time.
              </p>
              <p>
                The reviewer will be notified and given access to evaluate this
                concept note.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
