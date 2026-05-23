"use client";

import { useState, useEffect, useMemo } from "react";
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
import { PageContainer } from "@/components/layout";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUserSelector } from "@/lib/queries/users";
import {
  usePolicyDraft,
  useAssignDraftReviewers,
  useAssignedDraftReviewers,
  useChecklistTemplates,
} from "@/lib/queries/policy-drafts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE = 5;

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
          .replace(/^./, (value) => value.toUpperCase());
        const messageText = Array.isArray(messages)
          ? messages.join(", ")
          : String(messages);
        return `${formattedField}: ${messageText}`;
      })
      .join("\n");

    if (detailMessages) {
      return detailMessages;
    }
  }

  if (
    Array.isArray(apiError?.non_field_errors) &&
    apiError.non_field_errors.length > 0
  ) {
    return apiError.non_field_errors.join("\n");
  }

  if (typeof apiError === "string" && apiError.trim()) {
    return apiError;
  }

  return (
    error?.response?.data?.detail ||
    error?.message ||
    (error?.message && error.message !== "[object Object]"
      ? error.message
      : fallback)
  );
}

export default function AssignExpertsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: draft, isLoading: isLoadingDraft } = usePolicyDraft(id);
  const { data: rawUsers, isLoading: isLoadingUsers } = useUserSelector();
  const { data: assignedData, isLoading: isLoadingAssigned } =
    useAssignedDraftReviewers(id);
  const users = rawUsers || [];

  const docTypeId = draft?.docType?.id;
  const { data: templates = [], isLoading: isLoadingTemplates } =
    useChecklistTemplates(docTypeId);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null,
  );

  // Initialize selectedIds when assigned reviewers or draft is loaded
  useEffect(() => {
    if (assignedData?.reviewerIds) {
      setSelectedIds(assignedData.reviewerIds);
    } else if (draft) {
      const existingIds =
        draft.reviewers?.map((r: any) => (typeof r === "object" ? r.id : r)) ||
        draft.assignedReviewers?.map((r: any) =>
          typeof r === "object" ? r.id : r,
        ) ||
        [];
      setSelectedIds(existingIds);
    }
  }, [assignedData, draft]);

  // Initialize selectedTemplateId
  useEffect(() => {
    if (assignedData?.checklist_template_id) {
      setSelectedTemplateId(assignedData.checklist_template_id);
    } else if (
      templates &&
      templates.length > 0 &&
      selectedTemplateId === null
    ) {
      const active = templates.find((t) => t.is_active);
      if (active) {
        setSelectedTemplateId(active.id);
      } else {
        setSelectedTemplateId(templates[0].id);
      }
    }
  }, [assignedData, templates, selectedTemplateId]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredUsers = useMemo(() => {
    return users.filter((u: any) => {
      const search = searchQuery.toLowerCase();
      const fullName =
        u.fullName ||
        `${u.firstName || ""} ${u.middleName || ""} ${u.lastName || ""}`;
      return (
        fullName.toLowerCase().includes(search) ||
        (u.email || "").toLowerCase().includes(search) ||
        (u.unit?.name || "").toLowerCase().includes(search) ||
        (u.organization?.name || "").toLowerCase().includes(search)
      );
    });
  }, [users, searchQuery]);

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE,
    );
  }, [filteredUsers, currentPage]);

  const assignedCount = selectedIds.length;

  const toggleAssignment = (userId: number) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const assignMutation = useAssignDraftReviewers();

  const handleSaveAssignments = async () => {
    if (assignedCount === 0) {
      toast.error("You must assign at least one expert to review this draft.");
      return;
    }

    setSubmitError(null);

    try {
      await assignMutation.mutateAsync({
        draftId: id,
        reviewers: selectedIds,
        checklistTemplateId: selectedTemplateId || undefined,
      });
      setSubmitError(null);
      toast.success(
        `Successfully assigned ${assignedCount} expert(s) to this draft. They have been notified.`,
      );
      router.push(`/policies/drafts/manage-drafts`);
    } catch (error: any) {
      const message = formatApiError(
        error,
        "Failed to save assignments. Please try again.",
      );
      setSubmitError(message);
      toast.error(message);
    }
  };

  // Get currently selected user objects for the sidebar summary list
  const selectedUsers = useMemo(() => {
    return users.filter((u: any) => selectedIds.includes(u.id));
  }, [users, selectedIds]);

  const isLoading = isLoadingDraft || isLoadingUsers || isLoadingAssigned;

  if (isLoading) {
    return (
      <PageContainer title="Loading Committee Pool...">
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

  return (
    <PageContainer
      title="Assign Expert Reviewers"
      description={`Manage the evaluation committee for Draft: ${draft?.title || id}`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            asChild
            className="shadow-sm border-primary/20 hover:bg-primary/5"
          >
            <Link href="/policies/drafts/manage-drafts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </Button>
          <Button
            onClick={handleSaveAssignments}
            disabled={assignMutation.isPending}
            className="bg-primary hover:bg-primary/90 font-semibold"
          >
            <Shield className="mr-2 h-4 w-4" />
            {assignMutation.isPending ? "Saving..." : "Save Assignments"}
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
        {/* Expert Pool */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Expert Pool</CardTitle>
                  <CardDescription>
                    Select subject matter experts to evaluate this policy draft.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by name, department, or university..."
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
                  <span>No experts match your search criteria.</span>
                </div>
              ) : (
                <>
                  {/* Expert rows */}
                  <div className="divide-y min-h-[280px]">
                    {paginatedUsers.map((user: any) => {
                      const isSelected = selectedIds.includes(user.id);
                      return (
                        <div
                          key={user.id}
                          className={cn(
                            "flex items-center justify-between p-4 hover:bg-muted/20 transition-colors cursor-pointer",
                            isSelected && "bg-primary/5 hover:bg-primary/10",
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
                              <AvatarImage src={user.photoUrl || undefined} />
                              <AvatarFallback
                                className={cn(
                                  "text-xs font-bold transition-all",
                                  isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-primary/10 text-primary",
                                )}
                              >
                                {user.firstName?.[0] || "U"}
                                {user.middleName?.[0] ||
                                  user.lastName?.[0] ||
                                  ""}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm text-foreground">
                                {user.fullName ||
                                  `${user.firstName || ""} ${user.middleName || ""} ${user.lastName || ""}`}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {user.email}
                              </span>
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/70 mt-0.5">
                                {user.unit?.name ||
                                  user.organization?.name ||
                                  "Institution Partner"}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant={isSelected ? "default" : "outline"}
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
                                <Check className="mr-2 h-4 w-4" /> Assigned
                              </>
                            ) : (
                              "Assign"
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="p-4 border-t bg-muted/10 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Showing{" "}
                        <span className="font-medium">
                          {(currentPage - 1) * PAGE_SIZE + 1}
                        </span>{" "}
                        to{" "}
                        <span className="font-medium">
                          {Math.min(
                            currentPage * PAGE_SIZE,
                            filteredUsers.length,
                          )}
                        </span>{" "}
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
                            setCurrentPage((p) => Math.max(1, p - 1))
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
                            variant={currentPage === page ? "default" : "ghost"}
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

        {/* Sidebar Controls */}
        <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          {/* Evaluation Checklist Selector */}
          <Card className="shadow-sm border-primary/10 bg-card">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Evaluation Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {isLoadingTemplates ? (
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-9 w-full bg-muted animate-pulse rounded" />
                </div>
              ) : templates.length > 0 ? (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Select Checklist Template
                  </label>
                  <Select
                    value={selectedTemplateId ? String(selectedTemplateId) : ""}
                    onValueChange={(val) => setSelectedTemplateId(Number(val))}
                  >
                    <SelectTrigger className="w-full border-primary/10 focus:ring-primary">
                      <SelectValue placeholder="Choose a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((tpl) => (
                        <SelectItem key={tpl.id} value={String(tpl.id)}>
                          {tpl.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Experts will use the selected checklist criteria to grade
                    and review this policy draft.
                  </p>
                </div>
              ) : (
                <div className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded border border-amber-100 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    No specific checklist template registered for this document
                    type. The system default active template will be
                    automatically used.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

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
                You have selected <strong>{assignedCount} expert(s)</strong> to
                review this policy draft.
              </p>
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {selectedUsers.map((user: any) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 text-sm bg-background p-2 rounded border border-primary/10 shadow-sm"
                  >
                    <UserCheck className="h-4 w-4 text-green-600 shrink-0" />
                    <span className="truncate font-medium text-foreground">
                      {user.fullName ||
                        `${user.firstName || ""} ${user.middleName || ""} ${user.lastName || ""}`}
                    </span>
                  </div>
                ))}
              </div>
              {assignedCount === 0 && (
                <div className="text-xs text-red-500 bg-red-50 p-2.5 rounded border border-red-100 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                  <span>
                    Drafts cannot proceed to the evaluation phase without at
                    least one assigned expert.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
