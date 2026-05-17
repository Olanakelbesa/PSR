"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Users,
  Building2,
  BookOpen,
  Calendar,
  CheckCircle2,
  Plus,
  Trash2,
  Search,
  Award,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { proposalsApi } from "@/lib/api/client";
import { mockProposals } from "@/lib/api/mock-data";
import type { ResearchProposal } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Reviewer {
  id: string;
  name: string;
  institution: string;
  expertise: string[];
  matchScore: number;
  activeReviews: number;
}

const mockReviewers: Reviewer[] = [
  {
    id: "rev-001",
    name: "Dr. Selamawit Tadesse",
    institution: "Armauer Hansen Research Institute (AHRI)",
    expertise: ["Epidemiology", "Public Health", "Infectious Diseases"],
    matchScore: 95,
    activeReviews: 1,
  },
  {
    id: "rev-002",
    name: "Prof. Bekele Gizaw",
    institution: "Addis Ababa University",
    expertise: ["Health Policy", "WASH", "Governance"],
    matchScore: 88,
    activeReviews: 2,
  },
  {
    id: "rev-003",
    name: "Dr. Mekonen Hailu",
    institution: "Mekelle University",
    expertise: ["Environmental Health", "Epidemiology"],
    matchScore: 82,
    activeReviews: 0,
  },
];

export default function AssignReviewersPage() {
  const { id } = useParams();
  const router = useRouter();
  const [proposal, setProposal] = useState<ResearchProposal | null>(null);
  const [assignedReviewers, setAssignedReviewers] = useState<Reviewer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProposal() {
      setIsLoading(true);
      try {
        const response = await proposalsApi.getProposal(id as string);
        if (response && response.data) {
          setProposal(response.data);
        } else {
          const found = mockProposals.find((p) => p.id === id);
          if (found) setProposal(found);
        }
      } catch (error) {
        const found = mockProposals.find((p) => p.id === id);
        if (found) setProposal(found);
      } finally {
        setIsLoading(false);
      }
    }
    if (id) loadProposal();
  }, [id]);

  const handleAssign = (reviewer: Reviewer) => {
    if (assignedReviewers.some((r) => r.id === reviewer.id)) {
      toast.error("Reviewer is already assigned to this proposal.");
      return;
    }
    setAssignedReviewers([...assignedReviewers, reviewer]);
    toast.success(`${reviewer.name} added to assignment list.`);
  };

  const handleRemove = (reviewerId: string) => {
    setAssignedReviewers(assignedReviewers.filter((r) => r.id !== reviewerId));
    toast.success("Reviewer removed from assignment list.");
  };

  const handleSubmitAssignments = async () => {
    if (assignedReviewers.length === 0) {
      toast.error("Please assign at least one reviewer.");
      return;
    }
    toast.success("Reviewer assignments saved successfully!");
    router.push("/research/proposals");
  };

  if (isLoading) {
    return (
      <PageContainer title="Loading Proposal...">
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-pulse text-muted-foreground font-bold">Retrieving proposal dossiers...</div>
        </div>
      </PageContainer>
    );
  }

  if (!proposal) {
    return (
      <PageContainer title="Proposal Not Found">
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-bold text-foreground">Record Not Found</h3>
          <Button asChild className="mt-4">
            <Link href="/research/proposals">Back to Proposals</Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  const filteredReviewers = mockReviewers.filter((rev) =>
    rev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rev.expertise.some((exp) => exp.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <PageContainer
      title="Assign Technical Reviewers"
      description={`Reviewer Matching & Evaluation Setup — Proposal Ref: ${proposal.id.replace('prop-', 'PRP-').toUpperCase()}`}
      actions={
        <Button variant="outline" asChild className="shadow-sm bg-white">
          <Link href="/research/proposals">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 max-w-7xl mx-auto">
        
        {/* LEFT COLUMN: Proposal Dossier Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-muted-foreground/10 shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-bold text-slate-900">Research Proposal Dossier</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              <div>
                <span className="text-[10px] uppercase font-bold text-primary/70 tracking-wider">Title</span>
                <h3 className="text-lg font-bold text-slate-800 mt-1 leading-snug">{proposal.title}</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Principal Investigator</span>
                  <span className="text-xs font-semibold text-slate-900 mt-1 block">
                    {proposal.principalInvestigator.firstName} {proposal.principalInvestigator.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Institution</span>
                  <span className="text-xs font-semibold text-slate-900 mt-1 block truncate">
                    {proposal.institution}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Research Area</span>
                  <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 text-[9px] font-bold uppercase mt-1">
                    {proposal.researchArea}
                  </Badge>
                </div>
              </div>

              <div className="pt-4 border-t">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-2">Proposal Abstract</span>
                <p className="text-xs leading-relaxed text-slate-600 bg-slate-50 p-4 rounded-xl border">
                  {proposal.abstract || "No abstract provided for this proposal submission."}
                </p>
              </div>

            </CardContent>
          </Card>

          {/* Match & Browse Panel */}
          <Card className="border border-muted-foreground/10 shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader className="border-b pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Reviewer Matching Panel</CardTitle>
                <CardDescription className="text-xs">Browse peer-reviewers matching study expertise.</CardDescription>
              </div>
              <div className="relative w-48 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter by name or expertise..."
                  className="pl-9 h-9 rounded-xl text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {filteredReviewers.map((rev) => (
                <div key={rev.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl hover:border-primary/20 transition-all gap-4">
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-slate-800">{rev.name}</h4>
                    <p className="text-[10px] text-muted-foreground italic font-medium">{rev.institution}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {rev.expertise.map((exp) => (
                        <Badge key={exp} variant="outline" className="text-[9px] font-semibold py-0.5 px-2">
                          {exp}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 sm:self-center">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs justify-end">
                        <Award className="h-4.5 w-4.5" />
                        {rev.matchScore}% Match
                      </div>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        {rev.activeReviews} active reviews
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAssign(rev)}
                      disabled={assignedReviewers.some((r) => r.id === rev.id)}
                      className="rounded-xl h-9 text-xs"
                    >
                      Assign Reviewer
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Active Assignments Sidebar */}
        <div className="space-y-6">
          <Card className="border border-muted-foreground/10 shadow-lg bg-white rounded-2xl overflow-hidden sticky top-6">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <Users className="h-5 w-5 text-primary" />
                Active Assignments
              </CardTitle>
              <CardDescription className="text-xs">Reviewers designated to evaluate this proposal.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              {assignedReviewers.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-xl">
                  <User className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground font-semibold">No Reviewers Designated</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 px-4">
                    Assign reviewers from the matching directory list on the left.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignedReviewers.map((rev) => (
                    <div key={rev.id} className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/50">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{rev.name}</p>
                        <p className="text-[9px] text-muted-foreground truncate">{rev.institution}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-lg"
                        onClick={() => handleRemove(rev.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t">
                <Button
                  onClick={handleSubmitAssignments}
                  disabled={assignedReviewers.length === 0}
                  className="w-full h-11 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-primary/20 rounded-xl"
                >
                  Commit Assignments
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>
    </PageContainer>
  );
}
