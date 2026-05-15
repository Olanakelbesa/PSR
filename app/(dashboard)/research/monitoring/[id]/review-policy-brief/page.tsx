"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  BookOpen,
  Send,
  Star,
  MessageSquare,
  ClipboardCheck,
  ShieldCheck,
  XCircle,
  ChevronRight,
  Download
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/layout";
import { monitoringApi } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const gradeCriteria = [
  { id: "clarity", label: "Clarity of Findings", weight: 30 },
  { id: "actionable", label: "Actionable Recommendations", weight: 40 },
  { id: "conciseness", label: "Conciseness & Layout", weight: 15 },
  { id: "stakeholder", label: "Stakeholder Relevance", weight: 15 },
];

const formSchema = z.object({
  reviewerComments: z.string().min(10, "Please provide detailed feedback for the PI"),
  decision: z.enum(["approve", "revision_required", "reject"]),
  grades: z.record(z.string(), z.number().min(0).max(100)),
});

export default function ReviewPolicyBriefPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProject() {
      try {
        const response = await monitoringApi.getProjectById(id as string);
        if (response.success) {
          setProject(response.data);
        }
      } catch (error) {
        console.error("Error loading project:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadProject();
  }, [id]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reviewerComments: "",
      decision: "approve",
      grades: {
        clarity: 80,
        actionable: 80,
        conciseness: 80,
        stakeholder: 80,
      },
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      toast.success("Review submitted successfully! Decision recorded.");
      setTimeout(() => router.push(`/research/monitoring/${id}`), 2000);
    } catch (error) {
      toast.error("Failed to submit review.");
    }
  }

  if (isLoading) return <PageContainer title="Loading..."><div className="h-96 flex items-center justify-center">Loading Review Workspace...</div></PageContainer>;
  if (!project) return <PageContainer title="Project Not Found">Project not found.</PageContainer>;

  return (
    <PageContainer
      title="Policy Brief Technical Review"
      description="Step 12: Administrative Grading and Technical Validation"
      actions={
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Main Review Section */}
        <div className="space-y-8">
          
          {/* Submission Preview Card */}
          <Card className="border-none shadow-sm overflow-hidden bg-white">
            <div className="bg-primary/5 px-6 py-4 border-b border-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-widest text-primary">Submitted Policy Brief</h3>
              </div>
              <Button variant="secondary" className="h-8 text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary hover:bg-primary/20">
                <Download className="h-3 w-3 mr-1.5" /> View Document
              </Button>
            </div>
            <CardContent className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Submission Ref</p>
                <p className="text-xs font-bold">{(id as string).replace("PROJ", "SUB")}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Author (PI)</p>
                <p className="text-xs font-bold">{project.proposal.principalInvestigator.firstName} {project.proposal.principalInvestigator.lastName}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Submission Date</p>
                <p className="text-xs font-bold">{new Date().toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Status</p>
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 border shadow-none font-bold text-[9px] uppercase">Pending Review</Badge>
              </div>
            </CardContent>
          </Card>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Technical Grading Section */}
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                    GRADE (Evidence Quality Checklist)
                  </CardTitle>
                  <CardDescription>Evaluate the policy brief against the standardized PSR criteria</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {gradeCriteria.map((criterion) => (
                      <FormField
                        key={criterion.id}
                        control={form.control}
                        name={`grades.${criterion.id}`}
                        render={({ field }) => (
                          <FormItem className="space-y-3 p-4 rounded-2xl bg-muted/30 border border-muted-foreground/10">
                            <div className="flex justify-between items-center">
                              <FormLabel className="text-xs font-black uppercase tracking-widest">{criterion.label}</FormLabel>
                              <span className="text-sm font-black text-primary">{field.value}%</span>
                            </div>
                            <FormControl>
                              <input 
                                type="range" 
                                className="w-full h-2 bg-muted-foreground/20 rounded-lg appearance-none cursor-pointer accent-primary"
                                min="0"
                                max="100"
                                value={field.value}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <p className="text-[9px] text-muted-foreground font-bold italic">Weight: {criterion.weight}%</p>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Comments Section */}
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Reviewer Comments (from PSR)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="reviewerComments"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            placeholder="Provide constructive feedback for the researcher..." 
                            className="min-h-[150px] rounded-2xl border-muted-foreground/20 focus-visible:ring-primary"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Decision Section */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Technical Decision</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="decision"
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 rounded-xl border-muted-foreground/20 font-bold">
                                <SelectValue placeholder="Select Decision" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl border-primary/10">
                              <SelectItem value="approve" className="font-bold text-emerald-600">Authorize Policy Brief</SelectItem>
                              <SelectItem value="revision_required" className="font-bold text-amber-600">Revision Requested</SelectItem>
                              <SelectItem value="reject" className="font-bold text-rose-600">Reject Submission</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Button 
                  type="submit" 
                  className="h-24 text-lg font-black bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl group flex flex-col items-center justify-center gap-1"
                >
                  <div className="flex items-center gap-2">
                    <Send className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    Finalize Review
                  </div>
                  <span className="text-[10px] opacity-70 font-bold uppercase tracking-[0.2em]">Step 12 Validation</span>
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* Sidebar Info */}
        <aside className="space-y-6">
           <Card className="border-none shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-slate-900 p-8 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Star className="h-6 w-6 opacity-80 text-amber-400" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Research Grade</p>
              </div>
              <div className="flex items-baseline gap-2">
                 <span className="text-4xl font-black tracking-tighter">
                   {Math.round(Object.values(form.watch("grades")).reduce((a, b) => a + b, 0) / 4)}
                 </span>
                 <span className="text-sm font-bold opacity-70 uppercase tracking-widest">/ 100</span>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Project Reference</p>
                <p className="text-sm font-bold text-primary">{project.contractNumber}</p>
              </div>
              <div className="pt-4 border-t space-y-2">
                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Review Requirements</p>
                 <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] font-bold">
                       <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Verify Evidence Quality
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold">
                       <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Check Recommendation Feasibility
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold">
                       <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Validate EPHI Data Deposit
                    </div>
                 </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
