"use client";

import { useState, useEffect } from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/layout";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Mock user pool
const expertPool = [
  { id: "u1", firstName: "Abebe", lastName: "Kebede", email: "abebe@moe.gov.et", department: "Digital Infrastructure", isAssigned: true },
  { id: "u2", firstName: "Tigist", lastName: "G/Michael", email: "tigist@moe.gov.et", department: "Curriculum Development", isAssigned: true },
  { id: "u3", firstName: "Samuel", lastName: "Tadesse", email: "samuel@moe.gov.et", department: "Policy Analysis", isAssigned: false },
  { id: "u4", firstName: "Hirut", lastName: "Worku", email: "hirut@moe.gov.et", department: "Special Needs Education", isAssigned: false },
  { id: "u5", firstName: "Dawit", lastName: "Mekonnen", email: "dawit@aau.edu.et", department: "Educational Technology", isAssigned: false },
  { id: "u6", firstName: "Yonas", lastName: "Getachew", email: "yonas@aau.edu.et", department: "Science Education", isAssigned: false },
  { id: "u7", firstName: "Meron", lastName: "Haile", email: "meron@moe.gov.et", department: "Early Childhood", isAssigned: false },
  { id: "u8", firstName: "Biruk", lastName: "Alemu", email: "biruk@aau.edu.et", department: "Higher Education", isAssigned: false },
  { id: "u9", firstName: "Selamawit", lastName: "Tesfaye", email: "selamawit@moe.gov.et", department: "Teacher Training", isAssigned: false },
  { id: "u10", firstName: "Elias", lastName: "Bekele", email: "elias@aau.edu.et", department: "Vocational Training", isAssigned: false },
  { id: "u11", firstName: "Hana", lastName: "Girma", email: "hana@moe.gov.et", department: "Special Needs Education", isAssigned: false },
  { id: "u12", firstName: "Tewodros", lastName: "Mengistu", email: "tewodros@aau.edu.et", department: "Digital Infrastructure", isAssigned: false },
  { id: "u13", firstName: "Liya", lastName: "Woldemariam", email: "liya@moe.gov.et", department: "Policy Analysis", isAssigned: false },
  { id: "u14", firstName: "Robel", lastName: "Negash", email: "robel@aau.edu.et", department: "Curriculum Development", isAssigned: false },
  { id: "u15", firstName: "Abebu", lastName: "Tadesse", email: "abebu@moe.gov.et", department: "Educational Technology", isAssigned: false },
  { id: "u16", firstName: "Fasika", lastName: "Darge", email: "fasika@aau.edu.et", department: "Science Education", isAssigned: false },
  { id: "u17", firstName: "Natnael", lastName: "Assefa", email: "natnael@moe.gov.et", department: "Teacher Training", isAssigned: false },
  { id: "u18", firstName: "Tigist", lastName: "Yimer", email: "tigisty@aau.edu.et", department: "Higher Education", isAssigned: false },
  { id: "u19", firstName: "Kidist", lastName: "Hailu", email: "kidist@moe.gov.et", department: "Early Childhood", isAssigned: false },
  { id: "u20", firstName: "Abel", lastName: "Fantahun", email: "abel@aau.edu.et", department: "Vocational Training", isAssigned: false },
];

const PAGE_SIZE = 5;

export default function AssignExpertsPage() {
  const params = useParams();
  const router = useRouter();
  const [experts, setExperts] = useState(expertPool);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredExperts = experts.filter((e) =>
    `${e.firstName} ${e.lastName} ${e.email} ${e.department}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredExperts.length / PAGE_SIZE);
  const paginatedExperts = filteredExperts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const assignedCount = experts.filter((e) => e.isAssigned).length;

  const toggleAssignment = (id: string) => {
    setExperts((prev) =>
      prev.map((expert) =>
        expert.id === id ? { ...expert, isAssigned: !expert.isAssigned } : expert
      )
    );
  };

  const handleSaveAssignments = async () => {
    if (assignedCount === 0) {
      toast.error("You must assign at least one expert to review this draft.");
      return;
    }
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`Successfully assigned ${assignedCount} expert(s) to draft ${params.id}. They have been notified.`);
      router.push(`/policies/drafts`);
    } catch {
      toast.error("Failed to save assignments. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Loading User Pool...">
        <div className="h-96 bg-muted animate-pulse rounded-xl" />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Assign Expert Reviewers"
      description={`Manage the evaluation committee for Draft: ${params.id}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="shadow-sm">
            <Link href="/policies/drafts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </Button>
          <Button
            onClick={handleSaveAssignments}
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90"
          >
            <Shield className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Assignments"}
          </Button>
        </div>
      }
    >
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
                    placeholder="Search by name, dept..."
                    className="pl-9 h-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredExperts.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No experts match your search criteria.
                </div>
              ) : (
                <>
                  {/* Expert rows */}
                  <div className="divide-y min-h-[280px]">
                    {paginatedExperts.map((expert) => (
                      <div
                        key={expert.id}
                        className={cn(
                          "flex items-center justify-between p-4 hover:bg-muted/20 transition-colors cursor-pointer",
                          expert.isAssigned && "bg-primary/5 hover:bg-primary/10"
                        )}
                        onClick={() => toggleAssignment(expert.id)}
                      >
                        <div className="flex items-center gap-4">
                          <Avatar
                            className={cn(
                              "h-10 w-10 border-2",
                              expert.isAssigned ? "border-primary" : "border-transparent"
                            )}
                          >
                            <AvatarFallback
                              className={cn(
                                "text-xs font-bold",
                                expert.isAssigned
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {expert.firstName[0]}
                              {expert.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">
                              {expert.firstName} {expert.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">{expert.email}</span>
                            <span className="text-[10px] font-medium uppercase tracking-wider text-primary/70 mt-0.5">
                              {expert.department}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant={expert.isAssigned ? "default" : "outline"}
                          size="sm"
                          className={cn("w-28", expert.isAssigned && "bg-primary hover:bg-primary/90")}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAssignment(expert.id);
                          }}
                        >
                          {expert.isAssigned ? (
                            <>
                              <Check className="mr-2 h-4 w-4" /> Assigned
                            </>
                          ) : (
                            "Assign"
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="p-4 border-t bg-muted/10 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Showing{" "}
                        <span className="font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{" "}
                        <span className="font-medium">
                          {Math.min(currentPage * PAGE_SIZE, filteredExperts.length)}
                        </span>{" "}
                        of <span className="font-medium">{filteredExperts.length}</span> experts
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
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
                            className="h-8 w-8 p-0 text-xs"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        ))}
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
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

        {/* Assignment Summary */}
        <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <Card className="shadow-sm border-primary/20 bg-primary/5">
            <CardHeader className="pb-3 border-b border-primary/10">
              <CardTitle className="text-base text-primary flex items-center justify-between">
                Assignment Summary
                <Badge className="bg-primary hover:bg-primary">{assignedCount}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                You have selected <strong>{assignedCount} expert(s)</strong> to review this policy draft.
              </p>
              <div className="space-y-2">
                {experts
                  .filter((e) => e.isAssigned)
                  .map((expert) => (
                    <div
                      key={expert.id}
                      className="flex items-center gap-2 text-sm bg-background p-2 rounded border shadow-sm"
                    >
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="truncate">
                        {expert.firstName} {expert.lastName}
                      </span>
                    </div>
                  ))}
              </div>
              {assignedCount === 0 && (
                <div className="text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  Drafts cannot proceed to the evaluation phase without at least one assigned expert.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
