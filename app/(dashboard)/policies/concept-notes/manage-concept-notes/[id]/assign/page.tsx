"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Search,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { PageContainer } from "@/components/layout";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Reviewer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  specialty: string;
  isAssigned: boolean;
};

const reviewerPool: Reviewer[] = [
  {
    id: "r1",
    firstName: "Abebe",
    lastName: "Kebede",
    email: "abebe@psr.gov.et",
    department: "Policy Analysis",
    specialty: "Governance",
    isAssigned: true,
  },
  {
    id: "r2",
    firstName: "Tigist",
    lastName: "G/Michael",
    email: "tigist@psr.gov.et",
    department: "Research Review",
    specialty: "Evidence Synthesis",
    isAssigned: true,
  },
  {
    id: "r3",
    firstName: "Samuel",
    lastName: "Tadesse",
    email: "samuel@psr.gov.et",
    department: "Compliance",
    specialty: "Ethics & Regulation",
    isAssigned: false,
  },
  {
    id: "r4",
    firstName: "Hirut",
    lastName: "Worku",
    email: "hirut@psr.gov.et",
    department: "Monitoring",
    specialty: "Impact Assessment",
    isAssigned: false,
  },
  {
    id: "r5",
    firstName: "Dawit",
    lastName: "Mekonnen",
    email: "dawit@psr.gov.et",
    department: "Planning",
    specialty: "Implementation Design",
    isAssigned: false,
  },
  {
    id: "r6",
    firstName: "Meron",
    lastName: "Haile",
    email: "meron@psr.gov.et",
    department: "Strategy",
    specialty: "Strategic Alignment",
    isAssigned: false,
  },
  {
    id: "r7",
    firstName: "Biruk",
    lastName: "Alemu",
    email: "biruk@psr.gov.et",
    department: "Budgeting",
    specialty: "Resource Planning",
    isAssigned: false,
  },
  {
    id: "r8",
    firstName: "Selamawit",
    lastName: "Tesfaye",
    email: "selamawit@psr.gov.et",
    department: "Stakeholder Engagement",
    specialty: "Consultation",
    isAssigned: false,
  },
];

const PAGE_SIZE = 5;

export default function AssignConceptNoteReviewersPage() {
  const params = useParams();
  const router = useRouter();
  const [reviewers, setReviewers] = useState(reviewerPool);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 350);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredReviewers = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return reviewers.filter((reviewer) =>
      `${reviewer.firstName} ${reviewer.lastName} ${reviewer.email} ${reviewer.department} ${reviewer.specialty}`
        .toLowerCase()
        .includes(query),
    );
  }, [reviewers, searchQuery]);

  const paginatedReviewers = filteredReviewers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredReviewers.length / PAGE_SIZE),
  );
  const assignedCount = reviewers.filter(
    (reviewer) => reviewer.isAssigned,
  ).length;

  const toggleAssignment = (id: string) => {
    setReviewers((current) =>
      current.map((reviewer) =>
        reviewer.id === id
          ? { ...reviewer, isAssigned: !reviewer.isAssigned }
          : reviewer,
      ),
    );
  };

  const handleSaveAssignments = async () => {
    if (assignedCount === 0) {
      toast.error("Assign at least one reviewer before continuing.");
      return;
    }

    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success(
        `Assigned ${assignedCount} reviewer(s) to concept note ${params.id}.`,
      );
      router.push(`/policies/concept-notes/manage-concept-notes/${params.id}`);
    } catch {
      toast.error("Failed to save reviewer assignments.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Loading reviewers...">
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Assign Reviewers"
      description={`Select reviewers for Concept Note: ${params.id}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="shadow-sm">
            <Link
              href={`/policies/concept-notes/manage-concept-notes/${params.id}`}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </Button>
          <Button
            onClick={handleSaveAssignments}
            disabled={isSaving}
            className="shadow-sm"
          >
            <Shield className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Assignments"}
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-4 items-start">
        <div className="lg:col-span-3 space-y-6">
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg">Reviewer Pool</CardTitle>
                  <CardDescription>
                    Choose subject matter reviewers for this concept note.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search by name, specialty, or department"
                    className="pl-9 h-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredReviewers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No reviewers match your search.
                </div>
              ) : (
                <>
                  <div className="divide-y">
                    {paginatedReviewers.map((reviewer) => (
                      <button
                        key={reviewer.id}
                        type="button"
                        onClick={() => toggleAssignment(reviewer.id)}
                        className={cn(
                          "flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-muted/30",
                          reviewer.isAssigned &&
                            "bg-primary/5 hover:bg-primary/10",
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <Avatar
                            className={cn(
                              "h-10 w-10 border-2",
                              reviewer.isAssigned
                                ? "border-primary"
                                : "border-transparent",
                            )}
                          >
                            <AvatarFallback
                              className={cn(
                                "text-xs font-bold",
                                reviewer.isAssigned
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {reviewer.firstName[0]}
                              {reviewer.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">
                              {reviewer.firstName} {reviewer.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {reviewer.email}
                            </span>
                            <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-primary/70">
                              {reviewer.department} · {reviewer.specialty}
                            </span>
                          </div>
                        </div>

                        <Badge
                          variant={reviewer.isAssigned ? "default" : "outline"}
                          className="shrink-0"
                        >
                          {reviewer.isAssigned ? (
                            <span className="inline-flex items-center gap-1">
                              <Check className="h-3.5 w-3.5" />
                              Assigned
                            </span>
                          ) : (
                            "Assign"
                          )}
                        </Badge>
                      </button>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between gap-3 border-t bg-muted/10 p-4">
                      <p className="text-xs text-muted-foreground">
                        Showing {(currentPage - 1) * PAGE_SIZE + 1} to{" "}
                        {Math.min(
                          currentPage * PAGE_SIZE,
                          filteredReviewers.length,
                        )}{" "}
                        of {filteredReviewers.length} reviewers
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            setCurrentPage((value) => Math.max(1, value - 1))
                          }
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from(
                            { length: totalPages },
                            (_, index) => index + 1,
                          ).map((page) => (
                            <Button
                              key={page}
                              variant={
                                currentPage === page ? "default" : "outline"
                              }
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            setCurrentPage((value) =>
                              Math.min(totalPages, value + 1),
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

        <div className="space-y-6 lg:col-span-1">
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <CardTitle className="text-base">Assignment Summary</CardTitle>
              <CardDescription>
                Quick overview of the reviewer setup.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
                <span className="text-sm text-muted-foreground">
                  Selected reviewers
                </span>
                <span className="font-semibold">{assignedCount}</span>
              </div>
              <div className="rounded-lg border bg-background p-3 text-sm text-muted-foreground">
                Reviewers assigned here will be able to access and evaluate the
                concept note after saving.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
