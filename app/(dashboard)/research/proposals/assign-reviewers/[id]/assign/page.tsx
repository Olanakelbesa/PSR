"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  ArrowLeft,
  Search,
  Check,
  Info,
  Shield,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Briefcase,
  GraduationCap,
  X,
  Building2,
  UserCog,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  assignReviewers,
  getAssignedReviewers,
  getReviewerSelector,
  getScreeningById,
  type ReviewerSelectorFilters,
  type Screening,
} from "@/api/services";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";

const PAGE_LIMIT = 5;
const SEARCH_DEBOUNCE_MS = 500;

interface Reviewer {
  id: number;
  fullName: string;
  email: string;
  middleName?: string;
  photoUrl?: string;
  organization?: string;
  organizationType?: string;
  unit?: string;
  title?: string;
}

interface PaginationMeta {
  page: number;
  total: number;
  totalPages: number;
  limit: number;
}

interface ReviewerCardProps {
  reviewer: Reviewer;
  isSelected: boolean;
  onToggle: (reviewerId: number) => void;
}

function ReviewerCard({ reviewer, isSelected, onToggle }: ReviewerCardProps) {
  const initials =
    reviewer.fullName
      .split(" ")
      .filter(Boolean)
      .map((name) => name[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "RV";

  return (
    <div
      className={cn(
        "relative rounded-xl border p-4 transition-all duration-200 cursor-pointer",
        "hover:bg-muted/40 hover:shadow-sm",
        isSelected
          ? "border-primary/60 bg-primary/5 shadow-sm ring-1 ring-primary/20"
          : "border-border bg-card",
      )}
      onClick={() => onToggle(reviewer.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle(reviewer.id);
        }
      }}
      aria-pressed={isSelected}
    >
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-1 rounded-l-xl transition-colors",
          isSelected ? "bg-primary" : "bg-transparent",
        )}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <Avatar
            className={cn(
              "h-11 w-11 border transition-all",
              isSelected ? "border-primary/50" : "border-border",
            )}
          >
            <AvatarImage src={resolveFileUrl(reviewer.photoUrl) ?? undefined} alt={reviewer.fullName} />
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

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm text-foreground truncate">
                <span className="truncate">{reviewer.title || ""} </span>
                {reviewer.fullName}
              </p>
              {isSelected && (
                <Badge className="h-5 text-[10px] bg-primary text-primary-foreground border-none">
                  <Check className="h-3 w-3 mr-1" />
                  Selected
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {reviewer.email || "No email"}
            </p>
          </div>
        </div>

        <Button
          variant={isSelected ? "default" : "outline"}
          size="sm"
          className={cn(
            "w-34 h-8 text-xs transition-all duration-200",
            isSelected && "bg-primary hover:bg-primary/90",
          )}
          onClick={(event) => {
            event.stopPropagation();
            onToggle(reviewer.id);
          }}
        >
          {isSelected ? (
            <>
              <Check className="mr-1.5 h-3.5 w-3.5" />
              Check Assigned
            </>
          ) : (
            <>
              <Shield className="mr-1.5 h-3.5 w-3.5" />
              Assign Reviewer
            </>
          )}
        </Button>
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1">
          <Building2 className="h-3 w-3" />
          {reviewer.organization || "No organization"}
        </span>
        <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1">
          <Briefcase className="h-3 w-3" />
          {reviewer.unit || "No unit"}
        </span>
        <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1">
          <UserCog className="h-3 w-3" />
          {reviewer.organizationType || "Organization"}
        </span>
      </div>
    </div>
  );
}

interface SelectedReviewerCardProps {
  reviewer: Reviewer;
  onRemove: (reviewerId: number) => void;
}

function SelectedReviewerCard({
  reviewer,
  onRemove,
}: SelectedReviewerCardProps) {
  const initials =
    reviewer.fullName
      .split(" ")
      .filter(Boolean)
      .map((name) => name[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "RV";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-2.5 shadow-xs">
      <Avatar className="h-8 w-8 border border-border">
        <AvatarImage src={resolveFileUrl(reviewer.photoUrl) ?? undefined} alt={reviewer.fullName} />
        <AvatarFallback className="text-[10px] font-bold bg-muted text-muted-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-foreground truncate">
          {reviewer.fullName}
        </p>
        <p className="text-[10px] text-muted-foreground truncate">
          {reviewer.email || ""}
        </p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-muted-foreground hover:text-destructive"
        onClick={() => onRemove(reviewer.id)}
        aria-label={`Remove ${reviewer.fullName}`}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

interface AssignmentStatsProps {
  assignedCount: number;
  availableCount: number;
}

function AssignmentStats({
  assignedCount,
  availableCount,
}: AssignmentStatsProps) {
  const policyState =
    assignedCount === 0
      ? {
          icon: AlertCircle,
          className:
            "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300",
          title: "No reviewers selected",
          description: "Select at least one reviewer to continue.",
        }
      : assignedCount === 1
        ? {
            icon: Info,
            className:
              "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300",
            title: "Recommendation",
            description: "Standard policy recommends 2 reviewers.",
          }
        : {
            icon: Check,
            className:
              "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300",
            title: "Policy satisfied",
            description: "You have selected the recommended reviewer count.",
          };

  const StatusIcon = policyState.icon;

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border bg-background p-2.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Assigned
          </p>
          <p className="text-base font-bold text-foreground">{assignedCount}</p>
          <p className="text-[10px] text-muted-foreground">reviewers</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-2.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Available
          </p>
          <p className="text-base font-bold text-foreground">
            {availableCount}
          </p>
          <p className="text-[10px] text-muted-foreground">in directory</p>
        </div>
      </div>

      <div className={cn("rounded-lg border p-2.5", policyState.className)}>
        <div className="flex items-start gap-2">
          <StatusIcon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-semibold">{policyState.title}</p>
            <p className="text-[10px] mt-0.5">{policyState.description}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-2.5 flex items-start gap-2">
        <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] font-semibold text-foreground">
            Standard recommendation
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Standard: 2 reviewers for institutional screening quality control.
          </p>
        </div>
      </div>
    </>
  );
}

function ReviewerSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: PAGE_LIMIT }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-border p-4 space-y-3"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="h-11 w-11 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AssignReviewersDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const screeningId = Array.isArray(id) ? id[0] : String(id || "");

  const [screening, setScreening] = useState<Screening | null>(null);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [reviewerLookup, setReviewerLookup] = useState<
    Record<number, Reviewer>
  >({});
  const [assignedReviewers, setAssignedReviewers] = useState<Reviewer[]>([]);
  const [selectedReviewerIds, setSelectedReviewerIds] = useState<number[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    total: 0,
    totalPages: 1,
    limit: PAGE_LIMIT,
  });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reviewersLoading, setReviewersLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const searchSeq = useRef(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const mapReviewer = useCallback((item: any): Reviewer => {
    const fallbackName = [
      item?.firstName ?? item?.first_name,
      item?.middleName ?? item?.middle_name,
      item?.lastName ?? item?.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      id: Number(item.id),
      fullName:
        item.fullName || item.full_name || fallbackName || "Unnamed Reviewer",
      email: item.email || "",
      middleName: item.middleName ?? item.middle_name ?? undefined,
      photoUrl: item.photoUrl || undefined,
      organization:
        item.organization?.name || item.organization_name || "No organization",
      organizationType:
        item.organizationType?.name ||
        item.organization_type?.name ||
        "No organization type",
      unit: item.unit?.name || item.unit_name || "No unit",
      title: item.title?.name || item.title_name || "",
    };
  }, []);

  const loadReviewers = useCallback(
    async (targetPage: number, searchTerm: string) => {
      const seq = ++searchSeq.current;
      setReviewersLoading(true);
      try {
        const params: ReviewerSelectorFilters = {
          page: targetPage,
          limit: PAGE_LIMIT,
          search: searchTerm || undefined,
        };

        const response = await getReviewerSelector(params);
        if (seq !== searchSeq.current) return;

        const mapped = (response.data || []).map(mapReviewer);

        setReviewers(mapped);
        setReviewerLookup((previous) => {
          const next = { ...previous };
          mapped.forEach((reviewer) => {
            next[reviewer.id] = reviewer;
          });
          return next;
        });
        setMeta({
          page: response.meta?.page ?? targetPage,
          total: response.meta?.total ?? mapped.length,
          totalPages: Math.max(response.meta?.totalPages ?? 1, 1),
          limit: response.meta?.limit ?? PAGE_LIMIT,
        });
      } catch (error) {
        console.error("Failed to load reviewers:", error);
        toast.error("Failed to load reviewer directory");
      } finally {
        setReviewersLoading(false);
      }
    },
    [mapReviewer],
  );

  const loadData = useCallback(async () => {
    if (!screeningId) {
      return;
    }

    setLoading(true);
    try {
      // Load screening (proposal) details
      const screeningRes = await getScreeningById(screeningId);
      setScreening(screeningRes);

      // Load assigned reviewers for this screening
      const assignedRes = await getAssignedReviewers(screeningId);
      const assigned = (assignedRes.reviewers || []).map(mapReviewer);
      setAssignedReviewers(assigned);
      setSelectedReviewerIds(assigned.map((r) => Number(r.id)));

      // Populate reviewer lookup for fast access
      setReviewerLookup((prev) => {
        const next = { ...prev };
        assigned.forEach((rev) => {
          next[rev.id] = rev;
        });
        return next;
      });
    } catch (error) {
      console.error("Failed to load assignment data:", error);
      toast.error("Failed to load assignment data");
    } finally {
      setLoading(false);
    }
  }, [screeningId, mapReviewer]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (screeningId && !loading) {
      loadReviewers(page, debouncedSearch);
    }
  }, [debouncedSearch, loadReviewers, loading, page, screeningId]);

  const toggleReviewer = useCallback((reviewerId: number) => {
    setSelectedReviewerIds((previous) => {
      if (previous.includes(reviewerId)) {
        return previous.filter((idValue) => idValue !== reviewerId);
      }
      return [...previous, reviewerId];
    });
  }, []);

  const selectedReviewerMap = useMemo(
    () =>
      new Map(
        [...assignedReviewers, ...Object.values(reviewerLookup)].map(
          (reviewer) => [reviewer.id, reviewer],
        ),
      ),
    [assignedReviewers, reviewerLookup],
  );

  const selectedReviewers = useMemo(() => {
    return selectedReviewerIds.map((reviewerId) => {
      const reviewer = selectedReviewerMap.get(reviewerId);
      if (reviewer) {
        return reviewer;
      }

      return {
        id: reviewerId,
        fullName: `Reviewer #${reviewerId}`,
        email: "",
        organization: "No organization",
        unit: "No unit",
        title: "Reviewer",
      } satisfies Reviewer;
    });
  }, [selectedReviewerIds, selectedReviewerMap]);

  const assignedCount = selectedReviewerIds.length;

  const handleSubmitAssignment = useCallback(async () => {
    if (assignedCount === 0) {
      toast.error("Please select at least one reviewer");
      return;
    }

    if (!screeningId) {
      toast.error("Missing screening id");
      return;
    }

    setSubmitting(true);
    try {
      await assignReviewers(
        screeningId,
        selectedReviewerIds.map((value) => Number(value)),
      );
      toast.success("Reviewers assigned successfully");
      router.push("/research/proposals/assign-reviewers");
    } catch (error: any) {
      toast.error(error?.message || "Failed to assign reviewers");
    } finally {
      setSubmitting(false);
    }
  }, [assignedCount, router, screeningId, selectedReviewerIds]);

  if (loading) {
    return (
      <PageContainer title="Loading Reviewer Pool...">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          <div className="lg:col-span-3 space-y-6">
            <Card className="border border-border shadow-sm">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-28" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <ReviewerSkeleton />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border border-border shadow-sm">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
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
        <Button onClick={() => router.back()}>Go Back</Button>
      </PageContainer>
    );
  }

  const proposal = screening.proposal as any;
  const proposalReference = proposal.referenceNumber || `PRP-${proposal.id}`;
  const proposalTitle = proposal.title || "Untitled Proposal";
  const proposalAbstract =
    proposal.shortAbstract ||
    "No abstract provided for this proposal submission.";
  const proposalArea = proposal.thematicAreas?.[0]?.name || "Unspecified Area";
  const proposalOwner =
    [proposal.createdBy?.firstName, proposal.createdBy?.lastName]
      .filter(Boolean)
      .join(" ") ||
    proposal.createdBy?.email ||
    "—";

  const startIndex = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const endIndex = Math.min(meta.page * meta.limit, meta.total);

  return (
    <PageContainer
      title="Assign Technical Reviewers"
      description={`Manage the evaluation committee for: ${proposalTitle}`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="shadow-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Proposal Context Summary */}
          <Card className="border-none shadow-sm bg-linear-to-r from-primary/5 to-muted/30">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-xl leading-tight text-foreground">
                    {proposalTitle}
                  </h3>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs gap-1 shrink-0"
                  asChild
                >
                  <Link href={`/research/proposals/${String(proposal.id)}`}>
                    <Info className="size-3" />
                    Full Proposal
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reviewer Pool */}
          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Reviewer Pool</CardTitle>
                  <CardDescription className="text-xs">
                    Select subject matter experts to evaluate this research
                    proposal.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search reviewers"
                    className="pl-9 h-9 text-sm"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {reviewersLoading ? (
                <ReviewerSkeleton />
              ) : reviewers.length === 0 ? (
                <div className="p-12 text-center text-sm">
                  <p className="font-medium text-foreground">
                    No reviewers found
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    {debouncedSearch
                      ? "No reviewers match your criteria"
                      : "Reviewer directory is currently empty."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 p-4 min-h-87.5">
                    {reviewers.map((reviewer) => (
                      <ReviewerCard
                        key={reviewer.id}
                        reviewer={reviewer}
                        isSelected={selectedReviewerIds.includes(reviewer.id)}
                        onToggle={toggleReviewer}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {meta.totalPages > 1 && (
                    <div className="p-4 border-t bg-muted/10 flex items-center justify-between">
                      <p className="text-[10px] text-muted-foreground">
                        Showing{" "}
                        <span className="font-medium">{startIndex}</span> to{" "}
                        <span className="font-medium">{endIndex}</span> of{" "}
                        <span className="font-medium">{meta.total}</span>{" "}
                        experts
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            setPage((previous) => Math.max(1, previous - 1))
                          }
                          disabled={meta.page <= 1 || reviewersLoading}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <span className="text-[10px] text-muted-foreground px-2">
                          Page {meta.page} of {meta.totalPages}
                        </span>

                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            setPage((previous) =>
                              Math.min(meta.totalPages, previous + 1),
                            )
                          }
                          disabled={
                            meta.page >= meta.totalPages || reviewersLoading
                          }
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

        {/* Sidebar Summary */}
        <div className="lg:sticky lg:top-20 space-y-6">
          <Card className="shadow-sm border-primary/20 bg-primary/5 overflow-hidden">
            <CardHeader className="pb-3 border-b border-primary/10 bg-primary/10">
              <CardTitle className="text-sm font-bold text-primary flex items-center justify-between">
                Selected Reviewers
                <Badge className="bg-primary hover:bg-primary h-5 min-w-5 flex items-center justify-center p-0">
                  {assignedCount}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2 max-h-75 overflow-y-auto pr-1">
                {selectedReviewers.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-3 text-center text-[11px] text-muted-foreground">
                    Select reviewers from the directory
                  </div>
                ) : (
                  selectedReviewers.map((reviewer) => (
                    <SelectedReviewerCard
                      key={reviewer.id}
                      reviewer={reviewer}
                      onRemove={toggleReviewer}
                    />
                  ))
                )}
              </div>
              <Button
                onClick={handleSubmitAssignment}
                disabled={submitting || assignedCount === 0}
                size="sm"
                className="bg-primary hover:bg-primary/90 shadow-sm w-full"
              >
                {submitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
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
        </div>
      </div>
    </PageContainer>
  );
}
