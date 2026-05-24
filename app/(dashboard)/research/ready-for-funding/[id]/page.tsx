"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PageContainer } from "@/components/layout";
import { HtmlContentRenderer } from "@/components/research/proposal/steps/HtmlContentRenderer";
import { toast } from "sonner";

import { readyForFundingService } from "@/api/services/ready-for-funding.service";
import {
  getApprovedPendingFundingScreening,
  type ApprovedPendingFundingScreening,
} from "@/api/services/screenings.service";
import { cn } from "@/lib/utils";

export default function ReadyForFundingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const routeId = params.id;
  const screeningId = Array.isArray(routeId) ? routeId[0] : routeId;

  const [screening, setScreening] =
    useState<ApprovedPendingFundingScreening | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);
  const [fundingDecision, setFundingDecision] = useState("");
  const [requiresEthicalClearance, setRequiresEthicalClearance] = useState("");
  const [committeeRemarks, setCommitteeRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!screeningId) {
        toast.error("Invalid screening id");
        router.push("/research/ready-for-funding");
        return;
      }

      try {
        const data = await getApprovedPendingFundingScreening(screeningId);
        setScreening(data);
      } catch (error) {
        console.error("Failed to load screening:", error);
        toast.error("Failed to load screening");
        router.push("/research/ready-for-funding");
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [router, screeningId]);

  const openFundingModal = () => {
    setFundingDecision(screening?.fundingStatus?.decision || "");
    setRequiresEthicalClearance(
      screening?.fundingStatus?.needIrbEthicalClearance ? "yes" : "no",
    );
    setCommitteeRemarks(screening?.fundingStatus?.remark || "");
    setIsFundingModalOpen(true);
  };

  if (isLoading) {
    return (
      <PageContainer title="Loading...">
        <div className="h-96 flex flex-col items-center justify-center gap-4">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full" />
          <p className="text-sm text-muted-foreground">Loading details...</p>
        </div>
      </PageContainer>
    );
  }

  if (!screening) return null;

  const handleSubmit = async () => {
    if (!fundingDecision) {
      toast.error("Select funding decision");
      return;
    }

    if (!screeningId) {
      toast.error("Invalid screening id");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        Remark: committeeRemarks.trim(),
        need_irb_ethical_clearance: requiresEthicalClearance === "yes",
        decision_status: fundingDecision as
          | "pending"
          | "approved"
          | "rejected"
          | "deferred",
      };

      if (screening?.fundingStatus?.id) {
        await readyForFundingService.updateDecision(screeningId, payload);
      } else {
        await readyForFundingService.createDecision(screeningId, payload);
      }

      setScreening((current) =>
        current
          ? {
              ...current,
              fundingStatus: {
                ...current.fundingStatus,
                decision: fundingDecision,
                remark: committeeRemarks.trim(),
                needIrbEthicalClearance: requiresEthicalClearance === "yes",
                state: "funding_decision_exists",
              },
            }
          : current,
      );

      toast.success("Funding decision submitted successfully");
      setIsFundingModalOpen(false);
      setCommitteeRemarks("");
      setFundingDecision("");
      setRequiresEthicalClearance("");
    } catch (error) {
      console.error("Failed to submit funding decision:", error);
      toast.error("Failed to submit funding decision");
    } finally {
      setIsSubmitting(false);
    }
  };

  const principalInvestigatorName =
    screening.principalInvestigator.firstName || "Principal Investigator";
  const reviewLabel =
    screening.reviewStatus.technicalReview || screening.status;
  const fundingLabel = screening.fundingStatus.state || "pending";

  return (
    <PageContainer
      title={screening.title}
      description={`Reference: ${screening.id.toUpperCase()}`}
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/research/ready-for-funding")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button onClick={openFundingModal}>
            <DollarSign className="w-4 h-4 mr-2" />
            Funding Decision
          </Button>
        </div>
      }
    >
      <div className="grid xl:grid-cols-[1fr_350px] gap-6 w-full">
        <div className="space-y-6">
          <Tabs defaultValue="overview">
            <TabsList className="border-b rounded-none w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="attachments">Attachments</TabsTrigger>
              <TabsTrigger value="budget">Budget</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 pt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex gap-2 items-center">
                    <FileText className="w-4 h-4" />
                    Abstract
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <HtmlContentRenderer content={screening.abstract} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Funding Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border p-4">
                      <p className="text-xs uppercase text-muted-foreground">
                        Technical Review
                      </p>
                      <p className="font-medium">
                        {screening.reviewStatus.technicalReview
                          ? screening.reviewStatus.technicalReview.replace(/_/g, " ")
                          : "N/A"}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-xs uppercase text-muted-foreground">
                        Financial Review
                      </p>
                      <p className="font-medium">
                        {screening.reviewStatus.financialReview
                          ? screening.reviewStatus.financialReview.replace(/_/g, " ")
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attachments" className="pt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attachments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {screening.attachments.length > 0 ? (
                      screening.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                        >
                          <span className="truncate">{attachment.name}</span>
                          <Download className="h-4 w-4 shrink-0" />
                        </a>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No attachments available.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="budget" className="pt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Budget</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>Total: ETB {screening.budget.total.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">
                    Currency: {screening.budget.currency}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader className=" p-4 roundedd-t-lg bg-primary text-white">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <p>Status</p>
              </div>
              <p>{screening.fundingStatus.state.replace(/_/g, " ")}</p>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="font-medium">
                  {screening.institution || "Institution not provided"}
                </p>
                <Badge>{screening.researchArea || "Uncategorized"}</Badge>
              </div>

              <div className="space-y-1 text-sm">
                <p className="font-medium">{principalInvestigatorName}</p>
                <p className="text-muted-foreground">
                  {screening.principalInvestigator.email}
                </p>
                <p className="text-muted-foreground">
                  {screening.principalInvestigator.phone}
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                {screening.submittedAt
                  ? new Date(screening.submittedAt).toDateString()
                  : "Submission date unavailable"}
              </div>

              <div className="rounded-lg border p-3 text-sm">
                <p className="text-muted-foreground">Summary</p>
                <p className="mt-1">{screening.title}</p>
              </div>

              <div className="rounded-lg border p-3 text-sm space-y-2">
                <p className="text-muted-foreground uppercase text-[11px]">
                  Funding Decision
                </p>
                <p className="font-semibold">
                  {screening.fundingStatus.decision || "No decision submitted"}
                </p>
                <p className="text-muted-foreground">
                  {screening.fundingStatus.remark || "No remark provided."}
                </p>
                <p className="text-sm text-muted-foreground">
                  IRB Required: {screening.fundingStatus.needIrbEthicalClearance ? "Yes" : "No"}
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog open={isFundingModalOpen} onOpenChange={setIsFundingModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Funding Decision
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Review and record the committee funding decision for this
              proposal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Decision Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Funding Decision</label>
              <select
                className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                value={fundingDecision}
                onChange={(e) => setFundingDecision(e.target.value)}
              >
                <option value="">Select decision</option>
                <option value="approved">Approved</option>
                <option value="deferred">Deferred</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Ethical Clearance */}
            <div className="space-y-3">
              <label className="text-sm font-medium">
                Ethical Clearance Requirement
              </label>

              <RadioGroup
                value={requiresEthicalClearance}
                onValueChange={setRequiresEthicalClearance}
                className="grid grid-cols-1 gap-3"
              >
                {/* YES CARD */}
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all",
                    requiresEthicalClearance === "yes"
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "hover:border-primary/40 hover:bg-muted/30",
                  )}
                >
                  <RadioGroupItem value="yes" className="mt-1" />

                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Yes, Required</p>
                    <p className="text-xs text-muted-foreground">
                      Ethical clearance must be obtained before funding is
                      released.
                    </p>
                  </div>
                </label>

                {/* NO CARD */}
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all",
                    requiresEthicalClearance === "no"
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "hover:border-primary/40 hover:bg-muted/30",
                  )}
                >
                  <RadioGroupItem value="no" className="mt-1" />

                  <div className="space-y-1">
                    <p className="text-sm font-semibold">No, Not Required</p>
                    <p className="text-xs text-muted-foreground">
                      No additional ethical approval is required for this
                      proposal.
                    </p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {/* Remarks */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Committee Remarks</label>
              <textarea
                className="w-full min-h-28 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                placeholder="Add detailed justification, conditions, or notes..."
                value={committeeRemarks}
                onChange={(e) => setCommitteeRemarks(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Provide clear reasoning for audit and governance tracking.
              </p>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsFundingModalOpen(false)}
            >
              Cancel
            </Button>

            <Button
              onClick={handleSubmit}
              className="bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Decision"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
