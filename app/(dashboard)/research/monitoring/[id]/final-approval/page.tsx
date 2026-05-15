"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck,
  FileCheck,
  Download,
  Calendar,
  Award,
  Send,
  Lock,
  Archive,
  ArrowRight
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

const formSchema = z.object({
  decision: z.enum(["approve_closure", "escalate"]),
  approvalNotes: z.string().optional(),
});

export default function FinalApprovalPage() {
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
      decision: "approve_closure",
      approvalNotes: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      toast.success("Final Approval Granted. Project is now formally closed.");
      setTimeout(() => router.push("/research/monitoring"), 2000);
    } catch (error) {
      toast.error("Failed to process approval.");
    }
  }

  if (isLoading) return <PageContainer title="Loading..."><div className="h-96 flex items-center justify-center">Authorizing project closure...</div></PageContainer>;
  if (!project) return <PageContainer title="Project Not Found">Project not found.</PageContainer>;

  return (
    <PageContainer
      title="Final Project Authorization"
      description="Step 12: Administrative Approval and Project Closure"
      actions={
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      }
    >
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Certificate-style Header */}
        <Card className="border-none shadow-xl overflow-hidden bg-white text-center">
          <div className="h-2 bg-emerald-500 w-full" />
          <CardHeader className="pt-10 pb-6">
            <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
               <Award className="h-10 w-10 text-emerald-600" />
            </div>
            <CardTitle className="text-3xl font-black tracking-tight text-slate-900">Research Portfolio Authorization</CardTitle>
            <CardDescription className="text-sm font-bold uppercase tracking-widest text-muted-foreground mt-2">
              Formal Step 12 Approval & Repository Archival
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-10 px-12 space-y-6">
             <div className="py-6 border-y border-slate-100 space-y-2">
                <p className="text-sm text-muted-foreground font-medium italic">This certifies that the research portfolio entitled:</p>
                <h3 className="text-xl font-black text-primary leading-tight px-10">{project.proposal.title}</h3>
                <p className="text-xs font-bold text-slate-500 mt-4">Under Contract: <span className="text-slate-900">{project.contractNumber}</span></p>
             </div>
             
             <div className="grid grid-cols-3 gap-8">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Approval Date</p>
                  <p className="text-sm font-bold">{new Date().toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Status</p>
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border shadow-none font-bold text-[9px] uppercase">Ready for Closure</Badge>
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Ref ID</p>
                  <p className="text-sm font-bold">{(id as string).replace("PROJ", "APP")}</p>
                </div>
             </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Deliverable Verification */}
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest">Final Deliverable Verification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-muted-foreground/10 group cursor-pointer hover:bg-white transition-colors">
                     <div className="flex items-center gap-3">
                        <FileCheck className="h-5 w-5 text-emerald-600" />
                        <div>
                           <p className="text-xs font-bold">Authorized Final Document</p>
                           <p className="text-[10px] text-muted-foreground">Signed_Project_Closure_{id}.pdf</p>
                        </div>
                     </div>
                     <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-emerald-800">
                     <ShieldCheck className="h-5 w-5 shrink-0" />
                     <p className="text-[11px] font-bold">The Policy Brief has been graded (88/100) and all technical requirements are met.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Administrative Decision */}
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest">Final Decision</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="decision"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-xl border-muted-foreground/20 font-bold">
                              <SelectValue placeholder="Select Action" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-primary/10">
                            <SelectItem value="approve_closure" className="font-bold text-emerald-600">Approve Closure & Archive</SelectItem>
                            <SelectItem value="escalate" className="font-bold text-amber-600">Escalate for Senior Review</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="pt-2">
                     <Button 
                       type="submit" 
                       className="w-full h-12 text-sm font-black bg-slate-900 hover:bg-slate-800 shadow-xl rounded-xl group"
                     >
                       <Archive className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                       Formalize Closure
                     </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </form>
        </Form>
        
        <div className="text-center pb-10">
           <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full border border-muted-foreground/10 text-xs font-bold text-muted-foreground">
              <Lock className="h-3 w-3" /> All data is encrypted and will be moved to the secure PSR Historical Archive.
           </div>
        </div>
      </div>
    </PageContainer>
  );
}
