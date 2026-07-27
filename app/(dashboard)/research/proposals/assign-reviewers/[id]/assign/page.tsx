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
  ShieldAlert,
  Mail,
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
import { useCurrentUser } from "@/hooks/useCurrentUser";
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

function getUserAvatarUrl(photoUrl?: string | null): string | undefined {
  if (!photoUrl || photoUrl === "#") return undefined;
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
    return photoUrl;
  }
  const cleanPath = photoUrl.startsWith("/") ? photoUrl : `/${photoUrl}`;
  return `/bff/media/stream/${cleanPath.replace(/^\/media\//, "")}`;
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

  const { user: currentUser } = useCurrentUser();
  const assignerId = currentUser?.id != null ? Number(currentUser.id) : null;

  // ── Conflict of Interest Exclusion Set (PI, Creator, Team Members, Assigner) ──
  const { excludedUserIds, excludedUserEmails, excludedTeamCount } = useMemo(() => {
    const ids = new Set<number>();
    const emails = new Set<string>();

    if (assignerId != null) {
      ids.add(assignerId);
      if (currentUser?.email) emails.add(currentUser.email.toLowerCase().trim());
    }

    if (screening) {
      const rawProposal = (screening.proposal || {}) as any;

      // 1. Principal Investigator
      const rawPi =
        screening.principalInvestigator ||
        rawProposal.principalInvestigator ||
        rawProposal.principal_investigator;
      if (rawPi) {
        if (typeof rawPi === "object") {
          if (rawPi.id != null) ids.add(Number(rawPi.id));
          if (rawPi.email) emails.add(String(rawPi.email).toLowerCase().trim());
        } else if (!isNaN(Number(rawPi))) {
          ids.add(Number(rawPi));
        }
      }

      // 2. Proposal Creator / Owner
      const creator = rawProposal.createdBy || rawProposal.created_by;
      if (creator) {
        if (typeof creator === "object") {
          if (creator.id != null) ids.add(Number(creator.id));
          if (creator.email) emails.add(String(creator.email).toLowerCase().trim());
        } else if (!isNaN(Number(creator))) {
          ids.add(Number(creator));
        }
      }

      // 3. Team Members & Co-Investigators
      const team =
        rawProposal.teamMembers ||
        rawProposal.team_members ||
        rawProposal.coInvestigators ||
        rawProposal.co_investigators ||
        [];

      if (Array.isArray(team)) {
        team.forEach((m: any) => {
          const uObj = m.user ?? m.user_detail ?? m;
          const uId = uObj?.id ?? m.userId ?? m.user_id;
          const uEmail = uObj?.email ?? m.memberEmail ?? m.email;

          if (uId != null && !isNaN(Number(uId))) {
            ids.add(Number(uId));
          }
          if (uEmail) {
            emails.add(String(uEmail).toLowerCase().trim());
          }
        });
      }
    }

    const count = ids.size > 0 || emails.size > 0 ? (ids.size + emails.size) : 0;

    return {
      excludedUserIds: ids,
      excludedUserEmails: emails,
      excludedTeamCount: count,
    };
  }, [screening, assignerId, currentUser]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return users.filter((u: any) => {
      const uId = Number(u.id);
      const uEmail = (u.email || "").toLowerCase().trim();

      // Conflict of Interest Exclusion: Exclude PI, Creator, Team Members, and Assigner
      if (excludedUserIds.has(uId) || (uEmail && excludedUserEmails.has(uEmail))) {
        return false;
      }

      if (!q) return true;

      const fullName =
        u.fullName ||
        u.full_name ||
        `${u.firstName || u.first_name || ""} ${u.middleName || u.middle_name || ""} ${u.lastName || u.last_name || ""}`;
      const unitName = (u.unit?.name || u.unit_name || u.unit || "").toLowerCase();
      const orgName = (u.organization?.name || u.organization_name || u.organization || "").toLowerCase();
      const titleName = (u.title?.name || u.title_name || u.title || "").toLowerCase();

      return (
        fullName.toLowerCase().includes(q) ||
        uEmail.includes(q) ||
        unitName.includes(q) ||
        orgName.includes(q) ||
        titleName.includes(q)
      );
    });
  }, [users, searchQuery, excludedUserIds, excludedUserEmails]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const toggleAssignment = useCallback((userId: number) => {
    const matchingUser = users.find((u: any) => Number(u.id) === userId);
    const uEmail = matchingUser?.email ? matchingUser.email.toLowerCase().trim() : "";

    if (excludedUserIds.has(userId) || (uEmail && excludedUserEmails.has(uEmail))) {
      toast.error("This user is a proposal author/team member and cannot be assigned as a reviewer due to Conflict of Interest.");
      return;
    }

    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  }, [users, excludedUserIds, excludedUserEmails]);

  const selectedUsers = useMemo(() => {
    return users
      .filter((u: any) => {
        const uId = Number(u.id);
        const uEmail = (u.email || "").toLowerCase().trim();
        return (
          selectedIds.includes(uId) &&
          !excludedUserIds.has(uId) &&
          !excludedUserEmails.has(uEmail)
        );
      })
      .map(mapUserToSelector);
  }, [users, selectedIds, excludedUserIds, excludedUserEmails, mapUserToSelector]);

  const assignedCount = selectedUsers.length;

  const handleSubmitAssignment = useCallback(async () => {
    if (assignedCount === 0) {
      toast.error("Please select at least one reviewer");
      return;
    }

    if (!screeningId) {
      toast.error("Missing screening id");
      return;
    }

    const validSelectedIds = selectedUsers.map((u) => u.id);

    setSubmitError(null);
    setSubmitting(true);
    try {
      await assignReviewers(
        screeningId,
        validSelectedIds,
      );
      toast.success(
        `Successfully assigned ${validSelectedIds.length} reviewer(s). They have been notified.`,
      );
      router.push(`/research/proposals/assign-reviewers/${screeningId}?tab=reviewers`);
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
  }, [assignedCount, selectedUsers, router, screeningId]);

  const isLoadingPage = loading || isLoadingUsers;

  if (isLoadingPage) {
    return (
      <PageContainer title="Loading Reviewer Pool...">
        <div className="grid gap-6 lg:grid-cols-4 items-start">
          <div className="lg:col-span-3 space-y-6">
            <div className="h-16 w-full bg-muted/60 animate-pulse rounded-xl" />
            <div className="h-12 w-full bg-blue-500/10 animate-pulse rounded-xl" />

            <div className="rounded-xl border bg-card p-6 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                <div className="space-y-2">
                  <div className="h-5 w-44 bg-muted animate-pulse rounded-md" />
                  <div className="h-3 w-64 bg-muted/70 animate-pulse rounded-md" />
                </div>
                <div className="h-9 w-full sm:w-64 bg-muted animate-pulse rounded-md" />
              </div>

              <div className="space-y-2.5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-20 w-full bg-muted/50 animate-pulse rounded-xl border p-4 flex items-center justify-between gap-4"
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="h-64 w-full bg-muted/60 animate-pulse rounded-xl border" />
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
            <Link href={`/research/proposals/assign-reviewers/${screeningId}?tab=reviewers`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Details
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
                    href={`/research/proposals/assign-reviewers/${screeningId}?tab=reviewers`}
                  >
                    <Info className="size-3" />
                    View Screening Details
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Conflict of Interest Notice Banner */}
          {/* <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-3 text-xs text-blue-800 dark:text-blue-300">
            <ShieldAlert className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <div className="flex-1">
              <span className="font-bold">Conflict of Interest Safeguard Active:</span> Proposal authors, principal investigators, co-investigators, and research team members are automatically excluded from the available reviewer selection pool.
            </div>
          </div> */}

          {/* Expert Pool */}
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Reviewer Pool</CardTitle>
                  <CardDescription>
                    Select subject matter experts to evaluate this research proposal.
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
            <CardContent className="p-6 space-y-6">
              {paginatedUsers.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-xl">
                  <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
                  <h3 className="font-bold text-foreground">No reviewers found</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {searchQuery
                      ? "No reviewers matched your search query."
                      : "No eligible external reviewers are currently available in the system pool."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {paginatedUsers.map((user: any) => {
                    const selector = mapUserToSelector(user);
                    const isSelected = selectedIds.includes(selector.id);
                    const photoUrl = getUserAvatarUrl(selector.photoUrl);

                    return (
                      <div
                        key={selector.id}
                        onClick={() => toggleAssignment(selector.id)}
                        className={cn(
                          "p-4 rounded-xl border bg-card transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md group",
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary shadow-2xs"
                            : "border-border/60 hover:border-primary/40 hover:bg-muted/10",
                        )}
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div
                            className={cn(
                              "h-5 w-5 rounded-md border flex items-center justify-center transition-colors shrink-0",
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border/60 bg-background group-hover:border-primary/40",
                            )}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5" />}
                          </div>

                          <Avatar className="h-11 w-11 border-2 border-primary/20 shrink-0 shadow-2xs">
                            <AvatarImage src={photoUrl} alt={selector.fullName} />
                            <AvatarFallback className="bg-primary/10 text-primary font-black text-xs">
                              {selector.fullName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                {selector.fullName}
                              </h4>
                              {selector.title && (
                                <Badge variant="outline" className="text-[9px] uppercase font-bold px-2 py-0.5 bg-muted/40">
                                  {selector.title}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                              <span className="truncate">{selector.email}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                          {(selector.unit || selector.organization) && (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-semibold bg-muted/30 px-2.5 py-1 text-muted-foreground truncate max-w-[220px]"
                            >
                              {selector.unit || selector.organization}
                            </Badge>
                          )}

                          <Badge
                            variant={isSelected ? "default" : "outline"}
                            className={cn(
                              "text-[10px] uppercase font-extrabold px-2.5 py-1 tracking-wider",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground border-border/60 bg-muted/20",
                            )}
                          >
                            {isSelected ? "Assigned" : "Select"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {filteredUsers.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t text-xs text-muted-foreground">
                  <div>
                    Showing <span className="font-bold">{startIndex}</span> to{" "}
                    <span className="font-bold">{endIndex}</span> of{" "}
                    <span className="font-bold">{filteredUsers.length}</span> eligible reviewers
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-semibold px-2">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Selection Summary Sidebar ───────────────────────────────────── */}
        <div className="space-y-6">
          <Card className="shadow-sm border-primary/10 sticky top-20">
            <CardHeader className="bg-muted/30 border-b py-3.5 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Selected Committee
                </CardTitle>
                <Badge variant="secondary" className="font-bold text-xs bg-primary/10 text-primary">
                  {assignedCount} Assigned
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {selectedUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCheck className="mx-auto h-8 w-8 opacity-40 mb-2" />
                  <p className="text-xs font-semibold">No Reviewers Selected</p>
                  <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                    Click on cards in the pool to assign reviewers.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                  {selectedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border bg-card text-xs shadow-2xs gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-7 w-7 border shrink-0">
                          <AvatarImage src={getUserAvatarUrl(user.photoUrl)} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-[10px]">
                            {user.fullName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate">
                            {user.fullName}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAssignment(user.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={handleSubmitAssignment}
                disabled={submitting || assignedCount === 0}
                className="w-full bg-primary hover:bg-primary/90 font-semibold"
              >
                <Shield className="mr-2 h-4 w-4" />
                {submitting ? "Saving..." : `Save ${assignedCount} Reviewer(s)`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
