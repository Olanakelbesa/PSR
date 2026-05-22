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
  ClipboardCheck,
  FileText,
  Clock,
  ShieldCheck,
  Trash2,
  Search,
  Award,
  DollarSign,
  Layers,
  Inbox,
  Tag,
  GitBranch,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getScreeningById, type Screening } from "@/api/services";
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
  const [screening, setScreening] = useState<Screening | null>(null);
  const [assignedReviewers, setAssignedReviewers] = useState<Reviewer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const formatReference = (value: string | number) =>
    String(value)
      .replace(/^prop-/i, "PRP-")
      .toUpperCase();

  const stripHtml = (value: string) =>
    value
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const getPersonName = (person: any) => {
    if (!person) return "—";
    return (
      [person.firstName, person.lastName].filter(Boolean).join(" ") ||
      person.fullName ||
      person.name ||
      person.email ||
      "—"
    );
  };

  useEffect(() => {
    async function loadScreening() {
      setIsLoading(true);
      try {
        const record = await getScreeningById(id as string);
        setScreening(record);

        const existingReviewers = Array.isArray(
          (record as any).assignedReviewers,
        )
          ? (record as any).assignedReviewers.map(
              (reviewer: any, index: number) => ({
                id: String(
                  reviewer.id ?? reviewer.member ?? `assigned-${index}`,
                ),
                name: getPersonName(reviewer),
                institution:
                  reviewer.institution ||
                  reviewer.organizationName ||
                  reviewer.department ||
                  "—",
                expertise: Array.isArray(reviewer.expertise)
                  ? reviewer.expertise
                  : reviewer.roleName
                    ? [reviewer.roleName]
                    : [],
                matchScore: 100,
                activeReviews: 0,
              }),
            )
          : [];

        setAssignedReviewers(existingReviewers);
      } catch (error) {
        console.error("Failed to load screening detail:", error);
        toast.error("Failed to load screening detail");
      } finally {
        setIsLoading(false);
      }
    }

    if (id) loadScreening();
  }, [id]);

  const handleAssign = (reviewer: Reviewer) => {
    if (assignedReviewers.some((r) => r.id === reviewer.id)) {
      toast.error("Reviewer is already assigned to this screening.");
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
    router.push("/research/proposals/assign-reviewers");
  };

  const getStatusStyles = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s.includes("APPROV") || s.includes("ACCEPT")) {
      return "bg-primary/10 text-primary border-primary/20 hover:bg-primary/10";
    }
    if (s.includes("REJECT") || s.includes("DECLIN")) {
      return "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/10";
    }
    if (s.includes("DRAFT") || s.includes("PENDING")) {
      return "bg-muted/50 text-muted-foreground border-border hover:bg-muted/50";
    }
    if (s.includes("REVIEW") || s.includes("SCREENING")) {
      return "bg-secondary text-secondary-foreground border-border hover:bg-secondary";
    }
    return "bg-muted/50 text-muted-foreground border-border hover:bg-muted/50";
  };

  if (isLoading) {
    return (
      <PageContainer
        title="Loading Screening Details..."
        description="Retrieving screening record and reviewer pool..."
      >
        <div className="space-y-8 max-w-7xl mx-auto animate-pulse">
          {/* Header Action Mock */}
          <div className="flex justify-between items-center pb-4 border-b border-border">
            <div className="space-y-2">
              <div className="h-6 w-32 bg-muted rounded-md" />
              <div className="h-4 w-64 bg-muted/60 rounded-md" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-20 bg-muted rounded-lg" />
              <div className="h-9 w-32 bg-muted rounded-lg" />
            </div>
          </div>

          {/* Metric Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-card border border-border rounded-2xl"
              />
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="h-96 bg-card border border-border rounded-2xl" />
              <div className="h-48 bg-card border border-border rounded-2xl" />
              <div className="h-64 bg-card border border-border rounded-2xl" />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="h-72 bg-card border border-border rounded-2xl" />
              <div className="h-64 bg-card border border-border rounded-2xl" />
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!screening) {
    return (
      <PageContainer title="Screening Not Found">
        <div className="text-center py-16 max-w-md mx-auto">
          <div className="h-16 w-16 bg-muted border border-border text-muted-foreground rounded-full flex items-center justify-center mx-auto mb-5">
            <BookOpen className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">
            Record Not Found
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            The screening proposal record you are looking for does not exist or
            has been removed.
          </p>
          <Button
            asChild
            className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-xs"
          >
            <Link href="/research/proposals/assign-reviewers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Proposals
            </Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  const proposal: any = (screening as any).proposal || {};
  const proposalReference =
    proposal.referenceNumber || formatReference(proposal.id || screening.id);
  const proposalTitle = proposal.title || "Untitled Proposal";
  const proposalAbstract = stripHtml(
    proposal.abstract ||
      proposal.shortAbstract ||
      "No abstract provided for this screening.",
  );
  const proposalStatus = proposal.workflowState || screening.status;
  const organizationName = proposal.Organization?.name || "—";
  const unitName = proposal.Unit?.name || "—";
  const receivingOffice = proposal.receivingOffice?.name || "—";
  const callTitle = proposal.call?.title || "—";
  const proposalType = proposal.proposalType?.name || "—";
  const thematicArea = proposal.thematicAreas?.[0]?.name || "—";
  const subThematicArea = proposal.subThematicArea?.name || "—";
  const submittedAt =
    proposal.submittedAt ||
    proposal.lastSubmittedAt ||
    screening.createdAt ||
    null;
  const decisionRemarks =
    proposal.reviewHistory?.decisionRemarks ||
    proposal.reviewHistory?.decision_remarks ||
    screening.decisionRemarks ||
    "No decision remarks provided.";
  const reviewedAt =
    proposal.reviewHistory?.reviewedAt || screening.updatedAt || null;
  const technicalReviews = Array.isArray(
    proposal.reviewHistory?.technicalReviews,
  )
    ? proposal.reviewHistory.technicalReviews
    : [];
  const teamMembers = Array.isArray(proposal.teamMembers)
    ? proposal.teamMembers
    : [];
  const attachmentLinks = [
    { label: "Proposal File", href: proposal.proposalFile },
    { label: "Supporting Docs", href: proposal.supportingDocs },
    { label: "Signature", href: proposal.signature },
    { label: "Updated Proposal", href: proposal.updatedProposal },
  ].filter((item) => item.href);

  const filteredReviewers = mockReviewers.filter(
    (rev) =>
      rev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rev.expertise.some((exp) =>
        exp.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
  );

  return (
    <PageContainer
      title="Proposal Screening Detail"
      description={`Review proposal screening records and configure evaluator assignments.`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-9 rounded-xl border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Link href="/research/proposals/assign-reviewers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/research/proposals/assign-reviewers/${id}/assign`}>
              <Users className="mr-2 h-4 w-4 text-white" />
              Assign Reviewer Pool
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Proposal Quick Stats Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-2xl border border-border bg-card shadow-xs p-5 flex items-center gap-4 transition-all hover:shadow-sm">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Budget Requested
              </span>
              <span className="text-base font-bold text-foreground mt-0.5 block truncate">
                {proposal.budgetRequested
                  ? `ETB ${Number(proposal.budgetRequested).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                  : "—"}
              </span>
            </div>
          </Card>

          <Card className="rounded-2xl border border-border bg-card shadow-xs p-5 flex items-center gap-4 transition-all hover:shadow-sm">
            <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center text-secondary-foreground shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Technical Reviews
              </span>
              <span className="text-base font-bold text-foreground mt-0.5 block">
                {technicalReviews.length} completed
              </span>
            </div>
          </Card>

          <Card className="rounded-2xl border border-border bg-card shadow-xs p-5 flex items-center gap-4 transition-all hover:shadow-sm">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Collaborators
              </span>
              <span className="text-base font-bold text-foreground mt-0.5 block">
                {teamMembers.length} team member
                {teamMembers.length !== 1 ? "s" : ""}
              </span>
            </div>
          </Card>

          <Card className="rounded-2xl border border-border bg-card shadow-xs p-5 flex items-center gap-4 transition-all hover:shadow-sm">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Submission Date
              </span>
              <span className="text-base font-bold text-foreground mt-0.5 block truncate">
                {submittedAt
                  ? new Date(submittedAt).toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })
                  : "Pending"}
              </span>
            </div>
          </Card>
        </div>

        {/* 2-Column Responsive Desktop Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
          {/* Main Area (70%) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Proposal Details Card */}
            <Card className="rounded-2xl border border-border shadow-xs bg-card overflow-hidden">
              <CardHeader className="border-b border-border pb-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase font-extrabold border-border bg-muted/50 text-muted-foreground tracking-wider"
                      >
                        Ref: {proposalReference}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-extrabold uppercase tracking-wider",
                          getStatusStyles(proposalStatus),
                        )}
                      >
                        {proposalStatus.replace(/_/g, " ")}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-extrabold uppercase bg-secondary text-secondary-foreground border-none"
                      >
                        Screening
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-bold text-foreground leading-snug pt-1">
                      {proposalTitle}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Abstract Highlight Block */}
                <div className="p-5 rounded-xl border border-border bg-muted/30">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5 mb-2">
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    Abstract Summary
                  </span>
                  <p className="text-sm leading-relaxed text-foreground/80 font-medium italic whitespace-pre-line">
                    "{proposalAbstract}"
                  </p>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-2">
                  <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                        Submitted By
                      </span>
                      <span className="text-sm font-semibold text-foreground mt-0.5 block truncate">
                        {getPersonName(proposal.createdBy)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                        Organization
                      </span>
                      <span
                        className="text-sm font-semibold text-foreground mt-0.5 block truncate"
                        title={organizationName}
                      >
                        {organizationName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded-lg bg-muted text-muted-foreground shrink-0">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                        Unit / Department
                      </span>
                      <span
                        className="text-sm font-semibold text-foreground mt-0.5 block truncate"
                        title={unitName}
                      >
                        {unitName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded-lg bg-muted text-muted-foreground shrink-0">
                      <Inbox className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                        Receiving Office
                      </span>
                      <span
                        className="text-sm font-semibold text-foreground mt-0.5 block truncate"
                        title={receivingOffice}
                      >
                        {receivingOffice}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors md:col-span-2">
                    <div className="p-2 rounded-lg bg-muted text-muted-foreground shrink-0">
                      <Award className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                        Call Title
                      </span>
                      <span
                        className="text-sm font-semibold text-foreground mt-0.5 block truncate"
                        title={callTitle}
                      >
                        {callTitle}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded-lg bg-muted text-muted-foreground shrink-0">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                        Proposal Type
                      </span>
                      <span
                        className="text-sm font-semibold text-foreground mt-0.5 block truncate"
                        title={proposalType}
                      >
                        {proposalType}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded-lg bg-muted text-muted-foreground shrink-0">
                      <Tag className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                        Thematic Area
                      </span>
                      <span
                        className="text-sm font-semibold text-foreground mt-0.5 block truncate"
                        title={thematicArea}
                      >
                        {thematicArea}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors md:col-span-2">
                    <div className="p-2 rounded-lg bg-muted text-muted-foreground shrink-0">
                      <GitBranch className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                        Sub-Thematic Area
                      </span>
                      <span
                        className="text-sm font-semibold text-foreground mt-0.5 block truncate"
                        title={subThematicArea}
                      >
                        {subThematicArea}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review Decision Card */}
            <Card className="rounded-2xl border border-border shadow-xs bg-card overflow-hidden">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                  Screening Review Decision
                </CardTitle>
                <CardDescription className="text-xs">
                  Remarks and findings recorded during the initial eligibility
                  and screening phase.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div
                  className={cn(
                    "p-5 rounded-xl border border-dashed flex flex-col gap-4",
                    proposalStatus.toUpperCase().includes("APPROV")
                      ? "bg-primary/5 border-primary/20 text-foreground"
                      : "bg-secondary/40 border-border text-foreground",
                  )}
                >
                  <p className="text-sm leading-relaxed text-foreground/80 font-medium">
                    {decisionRemarks}
                  </p>

                  <div className="flex flex-wrap gap-4 pt-4 border-t border-border text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Reviewed:{" "}
                      {reviewedAt
                        ? new Date(reviewedAt).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "—"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      Technical reviews count:{" "}
                      <Badge
                        variant="outline"
                        className="font-extrabold text-[10px] px-1.5 py-0 border-border"
                      >
                        {technicalReviews.length}
                      </Badge>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attachments Section */}
            {attachmentLinks.length > 0 && (
              <Card className="rounded-2xl border border-border shadow-xs bg-card overflow-hidden">
                <CardHeader className="border-b border-border pb-4">
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Proposal Documents & Attachments
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Access and download key proposal files, declarations, or
                    updated drafts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {attachmentLinks.map((attachment) => (
                      <a
                        key={attachment.label}
                        href={attachment.href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 hover:border-border hover:shadow-xs group transition-all duration-200"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-sm font-bold text-foreground block truncate group-hover:text-primary transition-colors">
                              {attachment.label}
                            </span>
                            <span className="text-[9px] text-muted-foreground block font-bold uppercase tracking-wider">
                              PDF Document
                            </span>
                          </div>
                        </div>
                        <div className="p-1.5 rounded-lg border border-border bg-background group-hover:border-border group-hover:bg-muted text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </div>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Team Members Section */}
            <Card className="rounded-2xl border border-border shadow-xs bg-card overflow-hidden">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Collaborators & Team Members
                </CardTitle>
                <CardDescription className="text-xs">
                  Internal and external team members designated to participate
                  in the research program.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {teamMembers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-10 border border-dashed border-border rounded-xl bg-muted/30">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
                      <User className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      No Team Members Registered
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                      There are no team members or external collaborators
                      recorded for this screening.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {teamMembers.map((member: any) => {
                      const name =
                        member.memberName ||
                        member.stakeholderName ||
                        member.organizationName ||
                        "Unnamed Member";
                      const initials =
                        name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase() || "U";
                      return (
                        <div
                          key={member.id}
                          className="flex flex-col justify-between p-4 rounded-xl border border-border bg-card hover:shadow-xs transition-shadow duration-200"
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10 border border-border bg-background shrink-0">
                              <AvatarFallback className="bg-muted text-primary font-bold text-xs">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p
                                className="text-sm font-bold text-foreground truncate"
                                title={name}
                              >
                                {name}
                              </p>
                              <p
                                className="text-xs text-muted-foreground mt-0.5 truncate"
                                title={
                                  member.organizationName ||
                                  member.position ||
                                  "Independent"
                                }
                              >
                                {member.organizationName ||
                                  member.position ||
                                  "Independent"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between flex-wrap gap-2">
                            <div className="flex gap-1.5 flex-wrap">
                              <Badge
                                variant="outline"
                                className="text-[10px] py-0.5 px-2 font-bold uppercase border-border text-muted-foreground bg-muted/50"
                              >
                                {member.memberType || "Member"}
                              </Badge>
                              {member.roleName && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] py-0.5 px-2 font-bold uppercase bg-secondary text-secondary-foreground border-none"
                                >
                                  {member.roleName}
                                </Badge>
                              )}
                            </div>
                            <span
                              className="text-[10px] text-muted-foreground font-semibold truncate max-w-37.5"
                              title={
                                member.memberEmail ||
                                member.email ||
                                "No contact info"
                              }
                            >
                              {member.memberEmail ||
                                member.email ||
                                "No contact info"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Area (30%) */}
          <div className="space-y-6 lg:sticky lg:top-6">
            {/* Active reviewer assignments */}
            <Card className="rounded-2xl border border-border shadow-sm bg-card overflow-hidden">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Active Assignments
                  <Badge className="bg-primary text-primary-foreground font-extrabold h-5 min-w-5 flex items-center justify-center p-0.5 text-xs rounded-full border-none">
                    {assignedReviewers.length}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Reviewers designated to evaluate this screening submission.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {assignedReviewers.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-border rounded-xl bg-muted/30 px-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground mx-auto mb-3">
                      <User className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">
                      No Reviewers Designated
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Assign reviewers from the directory list on the left.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-95 overflow-y-auto pr-1">
                    {assignedReviewers.map((rev) => {
                      const initials =
                        rev.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase() || "U";
                      return (
                        <div
                          key={rev.id}
                          className="flex items-center justify-between p-3 border border-border rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-150 gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar className="h-8 w-8 border border-border bg-background shrink-0">
                              <AvatarFallback className="bg-muted text-foreground font-bold text-[10px]">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p
                                className="text-xs font-bold text-foreground truncate"
                                title={rev.name}
                              >
                                {rev.name}
                              </p>
                              <p
                                className="text-[9px] text-muted-foreground truncate"
                                title={rev.institution}
                              >
                                {rev.institution}
                              </p>

                              {rev.expertise && rev.expertise.length > 0 && (
                                <div className="flex flex-wrap gap-0.5 mt-1">
                                  {rev.expertise.slice(0, 2).map((exp) => (
                                    <span
                                      key={exp}
                                      className="text-[8px] bg-muted text-muted-foreground px-1 py-0.2 rounded-sm border border-border"
                                    >
                                      {exp}
                                    </span>
                                  ))}
                                  {rev.expertise.length > 2 && (
                                    <span className="text-[8px] text-muted-foreground font-bold ml-0.5">
                                      +{rev.expertise.length - 2} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
