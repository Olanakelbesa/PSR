"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  ArrowLeft, 
  ShieldCheck, 
  BarChart3, 
  CheckCircle2, 
  AlertCircle,
  Save,
  Send,
  MessageSquare,
  Scale
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { PageContainer } from "@/components/layout";
import { proposalReviewSchema, type ProposalReviewFormData } from "@/lib/validations";
import { proposalsApi } from "@/lib/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ROCReviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProposalReviewFormData>({
    resolver: zodResolver(proposalReviewSchema),
    defaultValues: {
      technicalMerit: 0,
      methodology: 0,
      feasibility: 0,
      budget: 0,
      impact: 0,
      strengths: "",
      weaknesses: "",
      recommendation: "approve",
      comments: "",
    },
  });

  const scores = form.watch(["technicalMerit", "methodology", "feasibility", "budget", "impact"]);
  const totalScore = scores.reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0);

  async function onSubmit(data: ProposalReviewFormData) {
    setIsLoading(true);
    try {
      const response = await proposalsApi.submitReview(id as string, data);
      if (response.success) {
        toast.success("Evaluation submitted successfully");
        router.push(`/research/proposals/${id}`);
      } else {
        toast.error(response.message || "Failed to submit evaluation");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PageContainer
      title="Research Proposal Evaluation"
      description={`Technical evaluation for Proposal ID: ${id}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)} 
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 shadow-sm"
          >
            {isLoading ? "Submitting..." : "Submit Evaluation"}
            <Send className="ml-2 h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Form {...form}>
            <form className="space-y-6">
              {/* Technical Scoring */}
              <Card className="shadow-sm border-primary/10">
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">Technical Scoring Criteria</CardTitle>
                  </div>
                  <CardDescription>Score the proposal based on national research standards</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                   <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="technicalMerit"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between items-end mb-1">
                               <FormLabel className="font-bold">Technical Merit</FormLabel>
                               <span className="text-[10px] font-bold text-muted-foreground uppercase">Max 25</span>
                            </div>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                className="h-11 shadow-sm"
                              />
                            </FormControl>
                            <FormDescription className="text-[10px]">Significance and originality of the research.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="methodology"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between items-end mb-1">
                               <FormLabel className="font-bold">Methodology</FormLabel>
                               <span className="text-[10px] font-bold text-muted-foreground uppercase">Max 25</span>
                            </div>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                className="h-11 shadow-sm"
                              />
                            </FormControl>
                            <FormDescription className="text-[10px]">Appropriateness and rigor of study design.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="feasibility"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between items-end mb-1">
                               <FormLabel className="font-bold">Feasibility</FormLabel>
                               <span className="text-[10px] font-bold text-muted-foreground uppercase">Max 20</span>
                            </div>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                className="h-11 shadow-sm"
                              />
                            </FormControl>
                            <FormDescription className="text-[10px]">Capability of team and institutional support.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between items-end mb-1">
                               <FormLabel className="font-bold">Budget Justification</FormLabel>
                               <span className="text-[10px] font-bold text-muted-foreground uppercase">Max 15</span>
                            </div>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                className="h-11 shadow-sm"
                              />
                            </FormControl>
                            <FormDescription className="text-[10px]">Value for money and cost alignment.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="impact"
                        render={({ field }) => (
                          <FormItem className="col-span-full">
                            <div className="flex justify-between items-end mb-1">
                               <FormLabel className="font-bold">National Policy Impact</FormLabel>
                               <span className="text-[10px] font-bold text-muted-foreground uppercase">Max 15</span>
                            </div>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                className="h-11 shadow-sm"
                              />
                            </FormControl>
                            <FormDescription className="text-[10px]">Potential to inform Ministry decisions and policy revision.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                   </div>
                </CardContent>
              </Card>

              {/* Qualitative Analysis */}
              <Card className="shadow-sm border-primary/10">
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">Qualitative Analysis</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <FormField
                    control={form.control}
                    name="strengths"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-emerald-700 flex items-center gap-2">
                           <CheckCircle2 className="h-4 w-4" />
                           Technical Strengths
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Identify the most strong aspects of this proposal..." 
                            className="min-h-[100px] resize-none shadow-sm" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weaknesses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-rose-700 flex items-center gap-2">
                           <AlertCircle className="h-4 w-4" />
                           Technical Weaknesses
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Identify areas for improvement or fatal flaws..." 
                            className="min-h-[100px] resize-none shadow-sm" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <CardHeader className="bg-primary text-primary-foreground py-6 text-center">
               <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1 opacity-80">Aggregate Review Score</p>
               <CardTitle className="text-5xl font-black">{totalScore}</CardTitle>
               <p className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">Out of 100</p>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
               <FormField
                  control={form.control}
                  name="recommendation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">ROC Recommendation</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 shadow-sm">
                            <SelectValue placeholder="Select recommendation" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="approve">Approve for Funding</SelectItem>
                          <SelectItem value="revise">Request Major Revisions</SelectItem>
                          <SelectItem value="reject">Reject Proposal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
               />

               <div className="pt-2">
                  <Button 
                    onClick={form.handleSubmit(onSubmit)} 
                    className="w-full h-11" 
                    disabled={isLoading}
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Submit to ROC Board
                  </Button>
               </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/10">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Scoring Thresholds</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
               {[
                 { label: "Excellence", range: "85 - 100", color: "bg-emerald-500" },
                 { label: "Good / Approval", range: "70 - 84", color: "bg-blue-500" },
                 { label: "Revision Needed", range: "50 - 69", color: "bg-amber-500" },
                 { label: "Insufficient", range: "0 - 49", color: "bg-rose-500" },
               ].map((t) => (
                 <div key={t.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                       <div className={cn("h-2 w-2 rounded-full", t.color)} />
                       <span className="font-medium">{t.label}</span>
                    </div>
                    <span className="text-muted-foreground font-mono">{t.range}</span>
                 </div>
               ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
