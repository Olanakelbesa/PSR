"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  XCircle,
  DollarSign,
  ShieldCheck,
  ClipboardList,
  AlertCircle,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageContainer } from "@/components/layout";
import { proposalsApi } from "@/lib/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Funding evaluation criteria
// ---------------------------------------------------------------------------
const FUNDING_CRITERIA = [
  { id: "roc_approved", label: "Proposal formally approved by ROC board" },
  { id: "ethical_clearance", label: "Ethical clearance obtained" },
  { id: "budget_validated", label: "Budget reviewed and validated by finance" },
  { id: "pi_eligibility", label: "Principal Investigator eligibility confirmed" },
  { id: "institution_agreement", label: "Institution signed partnership agreement" },
  { id: "timeline_feasible", label: "Project timeline is feasible and realistic" },
  { id: "no_conflict", label: "No conflict of interest identified" },
  { id: "data_plan", label: "Data management and publication plan submitted" },
];

const fundingApprovalSchema = z.object({
  decision: z.enum(["fund", "defer", "reject"], {
    required_error: "Please select a funding decision",
  }),
  criteria: z.record(z.boolean()),
});

type FundingApprovalFormData = z.infer<typeof fundingApprovalSchema>;

export default function FundingApprovalPage() {
  const { id } = useParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposal, setProposal] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<FundingApprovalFormData>({
    resolver: zodResolver(fundingApprovalSchema),
    defaultValues: {
      decision: "fund",
      criteria: Object.fromEntries(FUNDING_CRITERIA.map(c => [c.id, false])),
    },
  });

  const decision = form.watch("decision");
  const criteria = form.watch("criteria");
  const passedCount = Object.values(criteria).filter(Boolean).length;
  const allPassed = passedCount === FUNDING_CRITERIA.length;

  useEffect(() => {
    async function loadProposal() {
      try {
        const response = await proposalsApi.getById(id as string);
        if (response.success && response.data) {
          setProposal(response.data);
        } else {
          toast.error("Proposal not found");
          router.push("/research/ready-for-funding");
        }
      } catch {
        toast.error("Failed to load proposal");
      } finally {
        setIsLoading(false);
      }
    }
    loadProposal();
  }, [id, router]);

  async function onSubmit(data: FundingApprovalFormData) {
    setIsSubmitting(true);
    try {
      // In production this would call a dedicated funding approval endpoint
      const newStatus =
        data.decision === "fund" ? "completed" :
        data.decision === "defer" ? "under_review" : "rejected";

      const response = await proposalsApi.updateProposal(id as string, {
        status: newStatus as any,
      });

      if (response.success) {
        toast.success(
          data.decision === "fund"
            ? "Funding approved! The proposal has been authorized."
            : data.decision === "defer"
            ? "Funding decision deferred."
            : "Proposal funding rejected."
        );
        router.push("/research/ready-for-funding");
      } else {
        toast.error(response.message || "Failed to submit decision");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <PageContainer title="Loading...">
        <div className="h-96 flex flex-col items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Preparing funding authorization form...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Funding Authorization"
      description={`Final funding decision — Proposal Reference: ${proposal?.id.replace("prop-", "PRP-").toUpperCase()}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 shadow-sm"
          >
            {isSubmitting ? "Processing..." : "Submit Decision"}
            <Send className="ml-2 h-4 w-4" />
          </Button>
        </div>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">

            {/* ------------------------------------------------------------------ */}
            {/* Main Column                                                          */}
            {/* ------------------------------------------------------------------ */}
            <div className="space-y-6">

              {/* Proposal Summary */}
              <Card className="shadow-sm border-primary/10 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Proposal Title</p>
                      <h3 className="text-lg font-black leading-tight text-primary">{proposal?.title}</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t border-primary/10">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Proposal Reference</p>
                        <p className="text-sm font-bold">{proposal?.id.replace("prop-", "PRP-").toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Status</p>
                        <Badge className="bg-primary/10 text-primary border-primary/20 border shadow-none font-bold text-[10px]">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          ROC Approved
                        </Badge>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Budget Requested</p>
                        <p className="text-sm font-bold text-primary">ETB {proposal?.budget?.total?.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Evaluation Criteria Checklist */}
              <Card className="shadow-sm border-primary/10">
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base">Evaluation Criteria Checklist</CardTitle>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-bold text-xs",
                        allPassed
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      )}
                    >
                      {passedCount} / {FUNDING_CRITERIA.length} Met
                    </Badge>
                  </div>
                  <CardDescription>
                    Confirm all pre-funding conditions are satisfied before authorizing disbursement
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2 divide-y">
                  {FUNDING_CRITERIA.map((criterion) => {
                    const met = form.watch(`criteria.${criterion.id}`);
                    return (
                      <div key={criterion.id} className="flex items-center justify-between py-4">
                        <span className="text-sm font-medium text-foreground pr-4">{criterion.label}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => form.setValue(`criteria.${criterion.id}`, true)}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all",
                              met === true
                                ? "bg-primary/80 text-white border-primary/60 shadow-sm"
                                : "border-muted-foreground/20 text-muted-foreground hover:border-primary/40 hover:text-primary/60"
                            )}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => form.setValue(`criteria.${criterion.id}`, false)}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all",
                              met === false && Object.values(form.formState.dirtyFields.criteria || {}).length > 0
                                ? "bg-primary/80 text-white border-primary/60 shadow-sm"
                                : "border-muted-foreground/20 text-muted-foreground hover:border-primary/40 hover:text-primary/60"
                            )}
                          >
                            <XCircle className="h-3 w-3" />
                            No
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* ------------------------------------------------------------------ */}
            {/* Sidebar — Decision                                                   */}
            {/* ------------------------------------------------------------------ */}
            <aside className="space-y-4 sticky top-20 self-start">
              <Card className="shadow-sm border-primary/10 overflow-hidden">
                <CardHeader className="bg-primary/80 text-white py-6 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 opacity-80">Funding Decision</p>
                  <DollarSign className="h-8 w-8 mx-auto opacity-90" />
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <FormField
                    control={form.control}
                    name="decision"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 shadow-sm border-primary/20">
                              <SelectValue placeholder="Select decision" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="fund">
                              <div className="flex items-center gap-2 text-primary/80">
                                <CheckCircle2 className="h-4 w-4" />
                                Authorize Funding
                              </div>
                            </SelectItem>
                            <SelectItem value="defer">
                              <div className="flex items-center gap-2 text-amber-600">
                                <Clock className="h-4 w-4" />
                                Defer Decision
                              </div>
                            </SelectItem>
                            <SelectItem value="reject">
                              <div className="flex items-center gap-2 text-rose-600">
                                <XCircle className="h-4 w-4" />
                                Reject Funding
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="p-4 rounded-xl bg-muted/30 border border-muted-foreground/10">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <ShieldCheck className="h-3 w-3" /> Decision Impact
                    </h4>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {decision === "fund"
                        ? "Authorizing funding will initiate the contract process and notify the research team to proceed."
                        : decision === "defer"
                        ? "Deferring will place this proposal on hold pending additional information or board review."
                        : "Rejecting will close this proposal and notify the researcher with a formal rejection notice."}
                    </p>
                  </div>

                  {!allPassed && decision === "fund" && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 font-medium">
                        {FUNDING_CRITERIA.length - passedCount} criteria not yet met. Review checklist before authorizing.
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 bg-primary/80 hover:bg-primary/60 shadow-lg"
                    disabled={isSubmitting}
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Processing..." : "Finalize Funding Decision"}
                  </Button>
                </CardContent>
              </Card>

              {/* Criteria Summary */}
              <Card className="shadow-sm border-primary/5">
                <CardHeader className="py-3 border-b">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Checklist Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                  {FUNDING_CRITERIA.map(c => {
                    const met = form.watch(`criteria.${c.id}`);
                    return (
                      <div key={c.id} className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="text-muted-foreground truncate flex-1">{c.label}</span>
                        {met ? (
                          <Badge variant="outline" className="h-4 px-1 text-[8px] bg-primary/80 text-white border-primary/60 shrink-0">YES</Badge>
                        ) : (
                          <Badge variant="outline" className="h-4 px-1 text-[8px] bg-rose-50 text-rose-600 border-rose-100 shrink-0">NO</Badge>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </aside>
          </div>
        </form>
      </Form>
    </PageContainer>
  );
}
