"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Clock,
  Coins,
  FileText,
  Loader2,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  useCreateFundingRecommendation,
  useFundingRecommendationCandidates,
} from "@/hooks";
import type { FundingRecommendationCandidate } from "@/types/funding-recommendation";

const formSchema = z.object({
  proposal: z.string().min(1, "Please select an approved proposal"),
  total_award_amount: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Total award amount must be a positive number",
    }),
  amount_english_in_words: z.string().min(1, "Amount in words is required"),
  has_ethical_clearance_approval: z.boolean().default(false),
  comments: z.string().min(5, "Comments must be at least 5 characters"),
});

type FormData = z.infer<typeof formSchema>;

// Utility to convert numbers to English words
function numberToEnglishWords(num: number): string {
  if (num === 0) return "zero";
  if (num < 0) return "minus " + numberToEnglishWords(Math.abs(num));

  const ones = [
    "",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
  ];
  const tens = [
    "",
    "",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety",
  ];
  const scales = ["", "thousand", "million", "billion", "trillion"];

  function convertLessThanOneThousand(n: number): string {
    let str = "";
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + " hundred ";
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + " ";
      n %= 10;
      if (n > 0) {
        str += "-" + ones[n];
      }
    } else if (n > 0) {
      str += ones[n];
    }
    return str.trim();
  }

  const parts = num.toString().split(".");
  const integerPart = Math.floor(Math.abs(num));
  let result = "";

  let temp = integerPart;
  let scaleIdx = 0;
  while (temp > 0) {
    const chunk = temp % 1000;
    if (chunk > 0) {
      const chunkStr = convertLessThanOneThousand(chunk);
      result =
        chunkStr +
        (scales[scaleIdx] ? " " + scales[scaleIdx] : "") +
        " " +
        result;
    }
    temp = Math.floor(temp / 1000);
    scaleIdx++;
  }

  result = result.trim();

  // If decimal exists and is non-zero, append it (for cents)
  if (parts.length > 1 && Number(parts[1]) > 0) {
    const centsVal = Number(parts[1].slice(0, 2));
    result += " and " + convertLessThanOneThousand(centsVal) + " cents";
  }

  return result.trim();
}

function formatCurrency(value?: string | number | null) {
  const amount = Number(value ?? 0);
  return `ETB ${Number.isFinite(amount) ? amount.toLocaleString() : "0"}`;
}

export default function NewFundingRecommendationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const proposalParam =
    searchParams.get("proposal") ||
    searchParams.get("proposal_id") ||
    searchParams.get("funding_decision_id");

  // Load candidate proposals with approved funding decisions that await a recommendation
  const { data: candidatesData, isLoading: isCandidatesLoading } =
    useFundingRecommendationCandidates({
      has_funding_decision: true,
      has_funding_recommendation: false,
      eligible_for_recommendation: true,
      proposal_workflow_state: "funding_recommendation",
    });

  const createMutation = useCreateFundingRecommendation();

  const [selectedCandidate, setSelectedCandidate] =
    useState<FundingRecommendationCandidate | null>(null);

  const candidates = candidatesData?.data ?? [];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      proposal: "",
      total_award_amount: "",
      amount_english_in_words: "",
      has_ethical_clearance_approval: false,
      comments: "",
    },
  });

  // Auto pre-select proposal when navigating with query parameter ?proposal=...
  useEffect(() => {
    if (!proposalParam || !candidates.length) return;
    if (form.getValues("proposal")) return;

    const match = candidates.find(
      (c) =>
        String(c.fundingDecisionId) === proposalParam ||
        String(c.proposalId) === proposalParam ||
        String(c.screeningId) === proposalParam,
    );

    if (match && match.fundingDecisionId) {
      form.setValue("proposal", String(match.fundingDecisionId));
    }
  }, [proposalParam, candidates, form]);

  const selectedProposalId = form.watch("proposal");
  const currentAmount = form.watch("total_award_amount");

  // Track selection changes to prefill amount, ethical clearance, etc.
  useEffect(() => {
    if (!selectedProposalId) {
      setSelectedCandidate(null);
      return;
    }

    const candidate = candidates.find(
      (c) => String(c.fundingDecisionId) === selectedProposalId,
    );

    if (candidate) {
      setSelectedCandidate(candidate);

      // Auto pre-populate amount requested
      if (candidate.budgetRequested) {
        form.setValue("total_award_amount", String(candidate.budgetRequested));

        // Auto pre-populate amount in words
        const numVal = Number(candidate.budgetRequested);
        if (!isNaN(numVal) && numVal > 0) {
          form.setValue(
            "amount_english_in_words",
            numberToEnglishWords(numVal),
          );
        }
      }

      // Auto pre-populate ethical clearance approval:
      // True if IRB is not required, OR if post-funding IRB is allowed, OR if status is 'approved'
      const needsIrb = Boolean(
        candidate.needIrbEthicalClearance ??
        candidate.need_irb_ethical_clearance ??
        false
      );
      const allowPostFunding = Boolean(
        candidate.allowPostFundingIrb ??
        candidate.allow_post_funding_irb ??
        candidate.ethicalClearanceRequirement === "required_post_funding"
      );
      const ethicalStatus = String(
        candidate.ethicalClearanceStatus ??
        candidate.ethical_clearance_status ??
        ""
      ).toLowerCase();

      const isEthicalApproved = !needsIrb || allowPostFunding || ethicalStatus === "approved";
      form.setValue("has_ethical_clearance_approval", isEthicalApproved);
    }
  }, [selectedProposalId, candidates, form]);

  // Automatically generate amount in words in real-time as the user types
  useEffect(() => {
    if (currentAmount === "" || currentAmount === undefined) {
      form.setValue("amount_english_in_words", "");
      return;
    }

    const numVal = Number(currentAmount);
    if (!isNaN(numVal) && numVal > 0) {
      form.setValue("amount_english_in_words", numberToEnglishWords(numVal));
    }
  }, [currentAmount, form]);

  // Handle manual/auto updating of amount in words
  const handleAutoFillWords = () => {
    const numVal = Number(currentAmount);
    if (!isNaN(numVal) && numVal > 0) {
      form.setValue("amount_english_in_words", numberToEnglishWords(numVal));
      toast.success("Amount in words generated successfully");
    } else {
      toast.error("Please enter a valid positive number first");
    }
  };

  const onSubmit = async (values: FormData) => {
    if (!selectedCandidate) {
      toast.error("Invalid candidate selected");
      return;
    }

    try {
      const payload = {
        proposal: Number(values.proposal), // maps to ReadyForFunding ID (fundingDecisionId)
        total_award_amount: Number(values.total_award_amount),
        amount_english_in_words: values.amount_english_in_words,
        has_ethical_clearance_approval: values.has_ethical_clearance_approval,
        comments: values.comments,
      };

      await createMutation.mutateAsync(payload);
      toast.success("Funding recommendation created successfully");
      router.push("/research/funding-recommendations");
    } catch (error: any) {
      console.error(error);
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create funding recommendation";
      toast.error(msg);
    }
  };

  return (
    <PageContainer
      title="Create Funding Recommendation"
      description="Create a new official award recommendation for an approved proposal."
      actions={
        <Button
          variant="outline"
          onClick={() => router.push("/research/funding-recommendations")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      }
    >
      <div className="grid xl:grid-cols-[1fr_400px] gap-6 items-start">
        {/* Form panel */}
        <Card className="border border-muted-foreground/15 shadow-sm">
          <CardHeader>
            <CardTitle>Recommendation Details</CardTitle>
            <CardDescription>
              Provide the award amount and justification for this funding
              decision.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Proposal Selector */}
                <FormField
                  control={form.control}
                  name="proposal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs uppercase tracking-wider text-foreground/80">
                        Select Approved Proposal{" "}
                        <span className="text-rose-500">*</span>
                      </FormLabel>
                      <FormControl>
                        {isCandidatesLoading ? (
                          <div className="flex h-12 items-center justify-between rounded-xl border bg-muted/30 px-3">
                            <span className="text-sm text-muted-foreground">
                              Loading candidates...
                            </span>
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <select
                            className="w-full h-12 bg-muted/50 border border-muted focus:border-primary focus:bg-background transition-all rounded-xl px-3 outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            {...field}
                          >
                            <option value="">Choose a proposal...</option>
                            {candidates.map((c) => (
                              <option
                                key={c.fundingDecisionId}
                                value={String(c.fundingDecisionId)}
                              >
                                {c.referenceNumber || `SCR-${c.screeningId}`} —{" "}
                                {c.proposalTitle}
                              </option>
                            ))}
                          </select>
                        )}
                      </FormControl>
                      <FormDescription className="text-xs text-muted-foreground">
                        Only candidates without an existing funding
                        recommendation are listed.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Award Amount */}
                  <FormField
                    control={form.control}
                    name="total_award_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-xs uppercase tracking-wider text-foreground/80">
                          Total Award Amount (ETB){" "}
                          <span className="text-rose-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="h-12 pl-10 bg-muted/50 border-muted focus:bg-background transition-all rounded-xl font-bold"
                              {...field}
                            />
                            <Coins className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-muted-foreground" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Ethical Clearance Confirmation */}
                  <FormField
                    control={form.control}
                    name="has_ethical_clearance_approval"
                    render={({ field }) => {
                      const needsIrb = Boolean(
                        selectedCandidate?.needIrbEthicalClearance ??
                        selectedCandidate?.need_irb_ethical_clearance ??
                        false
                      );
                      const allowPostFunding = Boolean(
                        selectedCandidate?.allowPostFundingIrb ??
                        selectedCandidate?.allow_post_funding_irb ??
                        selectedCandidate?.ethicalClearanceRequirement === "required_post_funding"
                      );
                      const ethicalStatus = String(
                        selectedCandidate?.ethicalClearanceStatus ??
                        selectedCandidate?.ethical_clearance_status ??
                        ""
                      ).toLowerCase();

                      return (
                        <FormItem className="flex flex-col justify-end p-3 border rounded-xl bg-slate-50/80 border-muted">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <FormLabel className="font-bold text-xs uppercase tracking-wider text-foreground/80 flex items-center gap-1.5">
                                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                Ethics Approval Status
                              </FormLabel>
                              <p className="text-[11px] text-muted-foreground">
                                {!selectedCandidate ? (
                                  "Select a proposal to check IRB status"
                                ) : !needsIrb ? (
                                  <span className="text-emerald-700 font-semibold">
                                    IRB Clearance Not Required
                                  </span>
                                ) : allowPostFunding ? (
                                  <span className="text-blue-700 font-semibold flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    IRB Required (Allowed Post-Funding — Pending IRB Status)
                                  </span>
                                ) : ethicalStatus === "approved" ? (
                                  <span className="text-emerald-700 font-semibold">
                                    IRB Clearance Approved
                                  </span>
                                ) : (
                                  <span className="text-amber-700 font-semibold">
                                    IRB Clearance Pending / Required
                                  </span>
                                )}
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                disabled={true}
                                className="data-[state=checked]:bg-emerald-600 opacity-90 cursor-not-allowed"
                              />
                            </FormControl>
                          </div>
                        </FormItem>
                      );
                    }}
                  />
                </div>

                {/* Amount in English words */}
                <FormField
                  control={form.control}
                  name="amount_english_in_words"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel className="font-bold text-xs uppercase tracking-wider text-foreground/80">
                          Amount in Words (English){" "}
                          <span className="text-rose-500">*</span>
                        </FormLabel>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs font-semibold text-primary hover:text-primary/90 px-2"
                          onClick={handleAutoFillWords}
                        >
                          Auto-generate
                        </Button>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="e.g. fifty thousand"
                            className="h-12 pl-10 bg-muted/50 border-muted focus:bg-background transition-all rounded-xl"
                            {...field}
                          />
                          <FileText className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Comments / Justification */}
                <FormField
                  control={form.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs uppercase tracking-wider text-foreground/80">
                        Recommendation Remarks & Comments{" "}
                        <span className="text-rose-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide detailed recommendation justification, conditions, or governance notes..."
                          className="min-h-30 bg-muted/50 border-muted focus:bg-background transition-all rounded-xl"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12 text-sm font-bold rounded-xl shadow-lg transition-all"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Recommendation...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Recommendation
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Selected candidate preview panel */}
        <aside className="space-y-6">
          {selectedCandidate ? (
            <Card className="border border-primary/20 shadow-md bg-linear-to-b from-white to-slate-50/50">
              <CardHeader className="bg-primary/5 border-b pb-4">
                <div className="flex justify-between items-start gap-2">
                  <Badge className="bg-primary/10 text-primary border border-primary/20 uppercase text-[9px] font-bold">
                    Selected Proposal
                  </Badge>
                  {selectedCandidate.needIrbEthicalClearance && (
                    <Badge
                      variant="outline"
                      className="border-amber-200 bg-amber-50 text-amber-800 uppercase text-[9px] font-bold"
                    >
                      IRB Required
                    </Badge>
                  )}
                </div>
                <CardTitle className="mt-2 text-base font-extrabold text-slate-900 leading-snug">
                  {selectedCandidate.proposalTitle}
                </CardTitle>
                <CardDescription className="text-xs font-bold text-primary">
                  {selectedCandidate.referenceNumber}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6 text-sm">
                {/* PI Details */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Principal Investigator
                  </span>
                  <div className="flex gap-3 items-center rounded-xl border p-3 bg-white shadow-xs">
                    <div className="rounded-full bg-slate-100 p-2.5 text-slate-600">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">
                        {selectedCandidate.principalInvestigator?.fullName ||
                          selectedCandidate.principalInvestigator?.full_name ||
                          "Mecha None"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {selectedCandidate.principalInvestigator?.email ||
                          "admin@gmail.com"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Score & Budget */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border p-3 bg-white shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Average Score
                    </span>
                    <p className="text-lg font-black text-blue-700">
                      {Number(
                        selectedCandidate.averageScorePercentage || 0,
                      ).toFixed(1)}
                      %
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {selectedCandidate.averageScore} /{" "}
                      {selectedCandidate.maxPossiblePoints || 100} pts
                    </span>
                  </div>

                  <div className="rounded-xl border p-3 bg-white shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Requested Budget
                    </span>
                    <p className="text-base font-black text-slate-900 truncate">
                      {formatCurrency(selectedCandidate.budgetRequested)}
                    </p>
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {selectedCandidate.organization?.name || "Institution"}
                    </span>
                  </div>
                </div>

                {/* Ethics warning */}
                {selectedCandidate.needIrbEthicalClearance && (
                  <div className="rounded-xl border p-3.5 bg-amber-50/50 border-amber-200">
                    <div className="flex gap-2 items-start">
                      <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-amber-800 uppercase tracking-wide block">
                          IRB / Ethical Clearance Status
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          {selectedCandidate.ethicalClearanceStatus ===
                          "approved" ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="text-xs font-bold text-slate-800">
                                Approved on{" "}
                                {selectedCandidate.ethicalClearanceApprovalDate ||
                                  "-"}
                              </span>
                            </>
                          ) : (
                            <>
                              <Clock className="h-3.5 w-3.5 text-amber-600" />
                              <span className="text-xs font-bold text-slate-800">
                                {selectedCandidate.ethicalClearanceStatus ||
                                  "Pending"}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Remarks info */}
                {selectedCandidate.fundingRemark && (
                  <div className="rounded-xl border p-3 bg-slate-50 border-muted">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                      Committee Funding Remarks
                    </span>
                    <p className="mt-1 text-xs text-slate-700 italic">
                      &ldquo;{selectedCandidate.fundingRemark}&rdquo;
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-dashed border-muted-foreground/20 shadow-none">
              <CardContent className="py-20 text-center flex flex-col items-center justify-center gap-3">
                <div className="rounded-full bg-slate-100 p-4 text-slate-400">
                  <Banknote className="h-6 w-6" />
                </div>
                <div className="space-y-1 max-w-60">
                  <p className="font-semibold text-sm">No proposal selected</p>
                  <p className="text-xs text-muted-foreground">
                    Select an approved proposal in the form to view details,
                    requested budget, and ethical reviews.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </PageContainer>
  );
}
