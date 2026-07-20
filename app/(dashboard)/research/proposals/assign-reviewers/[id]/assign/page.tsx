"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Check,
  Shield,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Info,
  X,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/layout";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUserSelector } from "@/lib/queries/users";
import {
  assignReviewers,
  getAssignedReviewers,
  getScreeningById,
  type Screening,
} from "@/api/services";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";

const PAGE_SIZE = 6;

interface LocalReviewer {
  id: number;
  fullName: string;
  email: string;
  photoUrl?: string;
  organization?: string;
  unit?: string;
  title?: string;
}

function formatApiError(error: any, fallback: string) {
  const apiError =
    error?.response?.data?.error ??
    error?.response?.data?.message ??
    error?.response?.data ??
    error?.errors;

  if (apiError?.details) {
    const detailMessages = Object.entries(apiError.details)
      .map(([field, messages]) => {
        const formattedField = field
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (v) => v.toUpperCase());
        const messageText = Array.isArray(messages)
          ? messages.join(", ")
          : String(messages);
        return `${formattedField}: ${messageText}`;
      })
      .join("\n");
    if (detailMessages) return detailMessages;
  }

  if (
    Array.isArray(apiError?.non_field_errors) &&
    apiError.non_field_errors.length > 0
  ) {
    return apiError.non_field_errors.join("\n");
  }

  if (typeof apiError === "string" && apiError.trim()) return apiError;

  return (
    error?.response?.data?.detail ||
    error?.message ||
    (error?.message && error.message !== "[object Object]"
      ? error.message
      : fallback)
  );
}

export default function AssignReviewersDetailPage() {
  const params = useParams();
  const router = useRouter();
  const screeningId = Array.isArray(params.id)
    ? params.id[0]
    : String(params.id || "");

  const [screening, setScreening] = useState<Screening | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: rawUsers, isLoading: isLoadingUsers } = useUserSelector();
  const users = rawUsers || [];

  const mapUserToSelector = useCallback(
    (item: any): LocalReviewer => {
      const fallbackName = [
        item?.firstName,
        item?.middleName,
        item?.lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      return {
        id: Number(item.id),
        fullName:
          item.fullName ||
          item.full_name ||
          fallbackName ||
          "Unnamed Reviewer",
        email: item.email || "",
        photoUrl: item.photoUrl || undefined,
        organization:
          item.organization?.name || item.organization_name || "",
        unit: item.unit?.name || item.unit_name || "",
        title: item.title?.name || item.title_name || "",
      };
    },
    [],
  );

  useEffect(() => {
    if (!screeningId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    (async () => {
      try {
        const [screeningRes, assignedRes] = await Promise.all([
          getScreeningById(screeningId),
          getAssignedReviewers(screeningId),
        ]);

        if (!isMounted) return;

        setScreening(screeningRes);

        const assignedIds = (assignedRes.reviewers || []).map(
          (r: any) => Number(r.id),
        );
        setSelectedIds(assignedIds);
      } catch (error) {
        if (!isMounted) return;
        console.error("Failed to load assignment data:", error);
        toast.error("Failed to load assignment data");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [screeningId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return users.filter((u: any) => {
      const fullName =
        u.fullName ||
        `${u.firstName || ""} ${u.middleName || ""} ${u.lastName || ""}`;
      return (
        fullName.toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.unit?.name || "").toLowerCase().includes(q) ||
        (u.organization?.name || "").toLowerCase().includes(q)
      );
    });
  }, [users, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const toggleAssignment = useCallback((userId: number) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  }, []);

  const selectedUsers = useMemo(() => {
    return users
      .filter((u: any) => selectedIds.includes(u.id))
      .map(mapUserToSelector);
  }, [users, selectedIds, mapUserToSelector]);

  const assignedCount = selectedIds.length;

  const handleSubmitAssignment = useCallback(async () => {
    if (assignedCount === 0) {
      toast.error("Please select at least one reviewer");
      return;
    }

    if (!screeningId) {
      toast.error("Missing screening id");
      return;
    }

    setSubmitError(null);
    setSubmitting(true);
    try {
      await assignReviewers(
        screeningId,
        selectedIds.map((v) => Number(v)),
      );
      toast.success(
        `Successfully assigned ${assignedCount} reviewer(s). They have been notified.`,
      );
      router.push("/research/proposals/assign-reviewers");
    } catch (error: any) {
      const message = formatApiError(
        error,
        "Failed to save assignments. Please try again.",
      );
      setSubmitError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }, [assignedCount, router, screeningId, selectedIds]);

  const isLoadingPage = loading || isLoadingUsers;

  if (isLoadingPage) {
    return (
      <PageContainer title="Loading Reviewer Pool...">
        <div className="rounded-xl border p-6 space-y-6 bg-card">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 w-[250px] bg-muted animate-pulse rounded" />
              <div className="h-4 w-[350px] bg-muted animate-pulse rounded" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-[100px] bg-muted animate-pulse rounded" />
              <div className="h-9 w-[150px] bg-muted animate-pulse rounded" />
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-4">
            <div className="lg:col-span-3 space-y-4">
              {[...Array(PAGE_SIZE)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 w-full bg-muted animate-pulse rounded-lg"
                />
              ))}
            </div>
            <div className="h-48 w-full bg-muted animate-pulse rounded-lg" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!screening) {
    return (
      <PageContainer
        title="Proposal Not Found"
        description="The requested proposal could not be found."
      >
        <Card className="border-l-4 border-l-amber-500 bg-amber-50">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-amber-900">
                Screening Not Found
              </h3>
              <p className="text-sm text-amber-800">
                The screening details could not be loaded. Please try again.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const proposal = screening.proposal as any;
  const proposalTitle = proposal?.title || "Untitled Proposal";

  const startIndex =
    filteredUsers.length === 0
      ? 0
      : (currentPage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(
    currentPage * PAGE_SIZE,
    filteredUsers.length,
  );

  return (
    <PageContainer
      title="Assign Technical Reviewers"
      description={`Manage the evaluation committee for: ${proposalTitle}`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            asChild
            className="shadow-sm border-primary/20 hover:bg-primary/5"
          >
            <Link href="/research/proposals/assign-reviewers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </Button>
          <Button
            onClick={handleSubmitAssignment}
            disabled={submitting || assignedCount === 0}
            className="bg-primary hover:bg-primary/90 font-semibold"
          >
            <Shield className="mr-2 h-4 w-4" />
            {submitting ? "Saving..." : "Save Assignments"}
          </Button>
        </div>
      }
    >
      {submitError && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold">Unable to save assignments</p>
              <p className="whitespace-pre-line">{submitError}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-4 items-start">
        {/* ── Reviewer Pool ──────────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-6">
          {/* Proposal Context */}
          <Card className="border-none shadow-sm bg-linear-to-r from-primary/5 to-muted/30">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xl leading-tight text-foreground truncate">
                    {proposalTitle}
                  </h3>
                  {proposal?.referenceNumber && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Reference: {proposal.referenceNumber}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs gap-1 shrink-0"
                  asChild
                >
                  <Link
                    href={`/research/proposals/assign-reviewers/${screeningId}`}
                  >
                    <Info className="size-3" />
                    View Screening Details
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Expert Pool */}
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Reviewer Pool</CardTitle>
                  <CardDescription>
                    Select subject matter experts to evaluate this research
                    proposal.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by name, email, or unit..."
                    className="pl-9 h-9 border-primary/10 focus-visible:ring-primary"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredUsers.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <AlertCircle className="h-8 w-8 text-muted-foreground/60" />
                  <span>No reviewers match your search criteria.</span>
                </div>
              ) : (
                <>
                  <div className="divide-y min-h-[280px]">
                    {paginatedUsers.map((user: any) => {
                      const isSelected = selectedIds.includes(user.id);
                      const mapped = mapUserToSelector(user);
                      return (
                        <div
                          key={user.id}
                          className={cn(
                            "flex items-center justify-between p-4 hover:bg-muted/20 transition-colors cursor-pointer",
                            isSelected &&
                              "bg-primary/5 hover:bg-primary/10",
                          )}
                          onClick={() => toggleAssignment(user.id)}
                        >
                          <div className="flex items-center gap-4">
                            <Avatar
                              className={cn(
                                "h-10 w-10 border-2 transition-all",
                                isSelected
                                  ? "border-primary shadow-sm"
                                  : "border-transparent",
                              )}
                            >
                              <AvatarImage
                                src={
                                  resolveFileUrl(mapped.photoUrl) ??
                                  undefined
                                }
                              />
                              <AvatarFallback
                                className={cn(
                                  "text-xs font-bold transition-all",
                                  isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-primary/10 text-primary",
                                )}
                              >
                                {mapped.fullName
                                  .split(" ")
                                  .filter(Boolean)
                                  .map((n: string) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-sm text-foreground truncate">
                                {mapped.fullName}
                              </span>
                              <span className="text-xs text-muted-foreground truncate">
                                {mapped.email}
                              </span>
                              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                {mapped.organization && (
                                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/70">
                                    {mapped.organization}
                                  </span>
                                )}
                                {mapped.unit && (
                                  <span className="text-[10px] font-medium text-muted-foreground">
                                    {mapped.unit}
                                  </span>
                                )}
                              </div>
                              {user.roles &&
                                user.roles.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {user.roles.map((role: any) => (
                                      <Badge
                                        key={role.id}
                                        variant="secondary"
                                        className="text-[9px] px-1.5 py-0 h-4 font-medium"
                                      >
                                        {role.name}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                            </div>
                          </div>
                          <Button
                            variant={
                              isSelected ? "default" : "outline"
                            }
                            size="sm"
                            className={cn(
                              "w-28 font-medium transition-all",
                              isSelected
                                ? "bg-primary hover:bg-primary/90"
                                : "border-primary/20 hover:bg-primary/5 text-primary",
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAssignment(user.id);
                            }}
                          >
                            {isSelected ? (
                              <>
                                <Check className="mr-2 h-4 w-4" />{" "}
                                Assigned
                              </>
                            ) : (
                              "Assign"
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="p-4 border-t bg-muted/10 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Showing{" "}
                        <span className="font-medium">{startIndex}</span>{" "}
                        to{" "}
                        <span className="font-medium">{endIndex}</span>{" "}
                        of{" "}
                        <span className="font-medium">
                          {filteredUsers.length}
                        </span>{" "}
                        experts
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 border-primary/10 hover:bg-primary/5 text-primary"
                          onClick={() =>
                            setCurrentPage((p) =>
                              Math.max(1, p - 1),
                            )
                          }
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1,
                        ).map((page) => (
                          <Button
                            key={page}
                            variant={
                              currentPage === page
                                ? "default"
                                : "ghost"
                            }
                            size="sm"
                            className={cn(
                              "h-8 w-8 p-0 text-xs font-semibold",
                              currentPage === page
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-primary/5 text-primary",
                            )}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        ))}
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 border-primary/10 hover:bg-primary/5 text-primary"
                          onClick={() =>
                            setCurrentPage((p) =>
                              Math.min(totalPages, p + 1),
                            )
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

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          {/* Assignment Summary */}
          <Card className="shadow-sm border-primary/20 bg-primary/5">
            <CardHeader className="pb-3 border-b border-primary/10">
              <CardTitle className="text-base text-primary flex items-center justify-between">
                Assignment Summary
                <Badge className="bg-primary hover:bg-primary">
                  {assignedCount}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                You have selected{" "}
                <strong>{assignedCount} reviewer(s)</strong> to evaluate
                this proposal.
              </p>
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {selectedUsers.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-3 text-center text-[11px] text-muted-foreground">
                    Select reviewers from the directory
                  </div>
                ) : (
                  selectedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 text-sm bg-background p-2 rounded border border-primary/10 shadow-sm"
                    >
                      <UserCheck className="h-4 w-4 text-green-600 shrink-0" />
                      <span className="truncate font-medium text-foreground flex-1">
                        {user.fullName}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => toggleAssignment(user.id)}
                        aria-label={`Remove ${user.fullName}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {assignedCount === 0 && (
                <div className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded border border-amber-100 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    Select at least one reviewer to continue.
                  </span>
                </div>
              )}

              <Button
                onClick={handleSubmitAssignment}
                disabled={submitting || assignedCount === 0}
                className="bg-primary hover:bg-primary/90 shadow-sm w-full"
              >
                {submitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Save Assignments
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Policy Info */}
          <Card className="shadow-sm border-muted">
            <CardContent className="pt-4 text-xs text-muted-foreground space-y-1.5">
              <p className="font-medium text-foreground text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Standard recommendation
              </p>
              <p>
                Standard policy recommends 2 reviewers for research proposal
                evaluation quality control.
              </p>
              <p>
                Selected reviewers will be notified and given access to
                conduct their technical review.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
