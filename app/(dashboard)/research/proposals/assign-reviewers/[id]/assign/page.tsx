"use client";

import { useEffect, useState } from "react";
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
  X
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { proposalsApi, userApi } from "@/lib/api/client";
import type { ResearchProposal, User } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 5;

export default function AssignReviewersDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [proposal, setProposal] = useState<ResearchProposal | null>(null);
  const [availableReviewers, setAvailableReviewers] = useState<User[]>([]);
  const [selectedReviewerIds, setSelectedReviewerIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadData();
  }, [id]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [proposalRes, usersRes] = await Promise.all([
        proposalsApi.getProposal(id as string),
        userApi.getUsers({ role: "roc_reviewer" })
      ]);

      if (proposalRes.success && proposalRes.data) {
        setProposal(proposalRes.data);
        if (proposalRes.data.reviews) {
          const currentIds = proposalRes.data.reviews.map(r => r.reviewer.id);
          setSelectedReviewerIds(currentIds);
        }
      }

      setAvailableReviewers(usersRes.data);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load assignment data");
    } finally {
      setLoading(false);
    }
  };

  const toggleReviewer = (reviewerId: string) => {
    setSelectedReviewerIds(prev => 
      prev.includes(reviewerId) 
        ? prev.filter(id => id !== reviewerId)
        : [...prev, reviewerId]
    );
  };

  const handleSubmitAssignment = async () => {
    if (selectedReviewerIds.length === 0) {
      toast.error("Please select at least one reviewer");
      return;
    }

    setSubmitting(true);
    try {
      const res = await proposalsApi.assignReviewers(id as string, selectedReviewerIds);
      
      if (res.success) {
        toast.success("Reviewers assigned successfully");
        router.push("/research/proposals/assign-reviewers");
      } else {
        toast.error(res.message || "Failed to assign reviewers");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Loading Reviewer Pool...">
        <div className="h-96 bg-muted animate-pulse rounded-xl" />
      </PageContainer>
    );
  }

  if (!proposal) {
    return (
      <PageContainer title="Proposal Not Found" description="The requested proposal could not be found.">
        <Button onClick={() => router.back()}>Go Back</Button>
      </PageContainer>
    );
  }

  const filteredReviewers = availableReviewers.filter(r => 
    (`${r.firstName} ${r.lastName} ${r.institution} ${r.department}`)
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredReviewers.length / PAGE_SIZE);
  const paginatedReviewers = filteredReviewers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const selectedReviewers = availableReviewers.filter(r => selectedReviewerIds.includes(r.id));
  const assignedCount = selectedReviewerIds.length;

  return (
    <PageContainer
      title="Assign Technical Reviewers"
      description={`Manage the evaluation committee for: ${proposal.title}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="shadow-sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleSubmitAssignment}
            disabled={submitting || assignedCount === 0}
            size="sm"
            className="bg-primary hover:bg-primary/90 shadow-sm"
          >
            <Shield className="mr-2 h-4 w-4" />
            {submitting ? "Saving..." : "Save Assignments"}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Proposal Context Summary */}
          <Card className="border-none shadow-sm bg-gradient-to-r from-primary/5 to-muted/30">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold">
                      {proposal.id.replace("prop-", "PRP-").toUpperCase()}
                    </Badge>
                    <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold">
                      {proposal.researchArea}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-lg leading-tight">{proposal.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">
                    {proposal.abstract}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 shrink-0" asChild>
                  <Link href={`/research/proposals/${proposal.id}`}>
                    <Info className="size-3" />
                    Full Proposal
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Expert Pool */}
          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Reviewer Pool</CardTitle>
                  <CardDescription className="text-xs">
                    Select subject matter experts to evaluate this research proposal.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by name, dept..."
                    className="pl-9 h-9 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredReviewers.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-sm italic">
                  No reviewers match your search criteria.
                </div>
              ) : (
                <>
                  <div className="divide-y min-h-[350px]">
                    {paginatedReviewers.map((reviewer) => {
                      const isAssigned = selectedReviewerIds.includes(reviewer.id);
                      return (
                        <div
                          key={reviewer.id}
                          className={cn(
                            "flex items-center justify-between p-4 hover:bg-muted/20 transition-colors cursor-pointer group",
                            isAssigned && "bg-primary/5 hover:bg-primary/10"
                          )}
                          onClick={() => toggleReviewer(reviewer.id)}
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className={cn(
                              "h-10 w-10 border-2 transition-all",
                              isAssigned ? "border-primary shadow-sm" : "border-transparent"
                            )}>
                              <AvatarImage src={reviewer.image} />
                              <AvatarFallback className={cn(
                                "text-xs font-bold",
                                isAssigned ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                              )}>
                                {reviewer.firstName[0]}{reviewer.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm group-hover:text-primary transition-colors">
                                {reviewer.firstName} {reviewer.lastName}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-medium uppercase tracking-wider text-primary/70">
                                  {reviewer.institution}
                                </span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Briefcase className="size-2.5" />
                                  {reviewer.department}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant={isAssigned ? "default" : "outline"}
                            size="sm"
                            className={cn("w-28 h-8 text-xs", isAssigned && "bg-primary hover:bg-primary/90")}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleReviewer(reviewer.id);
                            }}
                          >
                            {isAssigned ? (
                              <>
                                <Check className="mr-2 h-3 w-3" /> Assigned
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
                      <p className="text-[10px] text-muted-foreground">
                        Showing <span className="font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span> to <span className="font-medium">{Math.min(currentPage * PAGE_SIZE, filteredReviewers.length)}</span> of <span className="font-medium">{filteredReviewers.length}</span> experts
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "ghost"}
                            size="sm"
                            className="h-7 w-7 p-0 text-[10px]"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        ))}
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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

        {/* Sidebar Summary */}
        <div className="lg:sticky lg:top-20 space-y-6">
          <Card className="shadow-sm border-primary/20 bg-primary/5 overflow-hidden">
            <CardHeader className="pb-3 border-b border-primary/10 bg-primary/10">
              <CardTitle className="text-sm font-bold text-primary flex items-center justify-between">
                Assignment Summary
                <Badge className="bg-primary hover:bg-primary h-5 min-w-5 flex items-center justify-center p-0">{assignedCount}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Selected <strong>{assignedCount} reviewer(s)</strong> for this proposal evaluation.
              </p>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {selectedReviewers.map((reviewer) => (
                  <div
                    key={reviewer.id}
                    className="flex items-center gap-2 text-xs bg-background p-2 rounded border shadow-sm group animate-in fade-in slide-in-from-right-1"
                  >
                    <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                    <span className="truncate font-medium flex-1">
                      {reviewer.firstName} {reviewer.lastName}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => toggleReviewer(reviewer.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {assignedCount === 0 && (
                <div className="text-[10px] text-amber-600 bg-amber-50 p-2 rounded border border-amber-100 flex items-start gap-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  Proposals require at least 2 assigned reviewers for standard technical evaluation.
                </div>
              )}

              {assignedCount > 0 && assignedCount < 2 && (
                <div className="text-[10px] text-blue-600 bg-blue-50 p-2 rounded border border-blue-100 flex items-start gap-2">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  Consider adding one more reviewer to meet the standard policy requirement.
                </div>
              )}

              <Separator className="bg-primary/10" />

              <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/10 flex gap-2">
                <ShieldCheck className="size-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[11px] font-bold text-blue-900">Expertise Check</div>
                  <p className="text-[10px] text-blue-700/80 mt-0.5 leading-tight">
                    Reviewers should have matching specialization in **{proposal.researchArea}**.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
