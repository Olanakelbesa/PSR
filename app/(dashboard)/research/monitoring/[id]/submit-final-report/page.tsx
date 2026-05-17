"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  BookOpen,
  Database,
  Send,
  Calendar,
  X,
  FileUp,
  Download,
  Info,
  ShieldCheck,
  Globe,
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
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PageContainer } from "@/components/layout";
import { monitoringApi } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const formSchema = z.object({
  dataLink: z.string().url("Please provide a valid URL or DOI from NDMC-EPHI"),
  submissionComments: z.string().optional(),
  dataSharingChecklist: z.boolean().refine((v) => v === true, {
    message: "You must confirm the data sharing checklist",
  }),
});

export default function SubmitFinalOutputPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Specific file states
  const [policyBrief, setPolicyBrief] = useState<File | null>(null);
  const [fullReport, setFullReport] = useState<File | null>(null);
  const [otherFiles, setOtherFiles] = useState<File[]>([]);

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
      dataLink: "",
      submissionComments: "",
      dataSharingChecklist: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!policyBrief || !fullReport) {
      toast.error("Both Policy Brief and Full Report are mandatory.");
      return;
    }

    try {
      toast.success(
        "Final Outputs submitted successfully! Moving to Technical Review.",
      );
      setTimeout(() => router.push(`/research/monitoring/${id}`), 2000);
    } catch (error) {
      toast.error("Failed to submit outputs.");
    }
  }

  if (isLoading)
    return (
      <PageContainer title="Loading...">
        <div className="h-96 flex items-center justify-center">
          Preparing Step 9 Submission...
        </div>
      </PageContainer>
    );
  if (!project)
    return (
      <PageContainer title="Project Not Found">
        Project not found.
      </PageContainer>
    );

  return (
    <PageContainer
      title="Final Output Submission"
      description="Step 9: Policy Brief, Final Report, and Data Deposit Verification"
      actions={
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Left Column: Form */}
        <div className="space-y-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* 1. File Uploads Section */}
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-black tracking-tight">
                    Core Deliverables
                  </CardTitle>
                  <CardDescription>
                    Upload mandatory research outputs
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                  {/* Policy Brief Upload */}
                  <div className="space-y-3">
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                      Policy Brief
                    </FormLabel>
                    <div
                      className={cn(
                        "border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer group",
                        policyBrief
                          ? "border-emerald-500 bg-emerald-50/30"
                          : "border-muted-foreground/20 hover:bg-primary/5",
                      )}
                    >
                      <input
                        type="file"
                        id="policy-brief-upload"
                        className="hidden"
                        onChange={(e) =>
                          setPolicyBrief(e.target.files?.[0] || null)
                        }
                      />
                      <label
                        htmlFor="policy-brief-upload"
                        className="cursor-pointer space-y-2"
                      >
                        <BookOpen
                          className={cn(
                            "h-8 w-8 mx-auto transition-transform group-hover:scale-110",
                            policyBrief
                              ? "text-emerald-500"
                              : "text-muted-foreground/40",
                          )}
                        />
                        <p className="text-[11px] font-black uppercase tracking-tighter">
                          {policyBrief
                            ? policyBrief.name
                            : "Upload Policy Brief"}
                        </p>
                      </label>
                    </div>
                  </div>

                  {/* Full Report Upload */}
                  <div className="space-y-3">
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                      Full Research Report
                    </FormLabel>
                    <div
                      className={cn(
                        "border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer group",
                        fullReport
                          ? "border-emerald-500 bg-emerald-50/30"
                          : "border-muted-foreground/20 hover:bg-primary/5",
                      )}
                    >
                      <input
                        type="file"
                        id="full-report-upload"
                        className="hidden"
                        onChange={(e) =>
                          setFullReport(e.target.files?.[0] || null)
                        }
                      />
                      <label
                        htmlFor="full-report-upload"
                        className="cursor-pointer space-y-2"
                      >
                        <FileText
                          className={cn(
                            "h-8 w-8 mx-auto transition-transform group-hover:scale-110",
                            fullReport
                              ? "text-emerald-500"
                              : "text-muted-foreground/40",
                          )}
                        />
                        <p className="text-[11px] font-black uppercase tracking-tighter">
                          {fullReport ? fullReport.name : "Upload Full Report"}
                        </p>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 2. Data Repository Section */}
              <Card className="border-none shadow-sm overflow-hidden">
                <div className="bg-primary/5 px-6 py-4 border-b border-primary/10 flex items-center gap-3">
                  <Database className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-primary">
                    Data Center Deposit (NDMC-EPHI)
                  </h3>
                </div>
                <CardContent className="pt-6 space-y-6">
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex gap-3">
                    <Info className="h-5 w-5 text-amber-600 shrink-0" />
                    <p className="text-[11px] font-medium text-amber-900 leading-relaxed">
                      Submission of raw data to **NDMC-EPHI (National Data
                      Management Center)** is mandatory for all PSR-funded
                      research.
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="dataLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Data URL or DOI
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="https://ndmc.ephi.gov.et/dataset/..."
                              className="pl-10 h-10 border-muted-foreground/20 focus-visible:ring-primary font-medium"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription className="text-[10px] italic">
                          Provide the DOI or unique URL generated by the
                          NDMC-EPHI server as verification of deposit.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dataSharingChecklist"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border p-4 bg-muted/30">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-[11px] font-bold text-slate-700">
                            Data sharing checklist completed
                          </FormLabel>
                          <p className="text-[10px] text-muted-foreground">
                            I verify that the data has been securely stored and
                            all sharing protocols have been followed.
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Action */}
              <Button
                type="submit"
                className="w-full h-14 text-base font-black bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl group"
              >
                <Send className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                Submit All Outputs for Technical Review
              </Button>
            </form>
          </Form>
        </div>

        {/* Right Column: Context */}
        <aside className="space-y-6">
          <Card className="border-none shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-slate-900 p-8 text-white">
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="h-6 w-6 opacity-80 text-emerald-400" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                  Proposal Context
                </p>
              </div>
              <CardTitle className="text-xl font-black tracking-tight leading-tight">
                {project.proposal.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-muted">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                    Contract #
                  </p>
                  <p className="text-xs font-bold">{project.contractNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                    Submitted On
                  </p>
                  <p className="text-xs font-bold">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  Requirements Checklist
                </p>
                {[
                  { label: "Policy Brief (PDF)", met: !!policyBrief },
                  { label: "Full Research Report", met: !!fullReport },
                  {
                    label: "EPHI Data Deposit",
                    met: form.watch("dataLink").length > 10,
                  },
                  {
                    label: "Checklist Verification",
                    met: form.watch("dataSharingChecklist"),
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600">
                      {item.label}
                    </span>
                    {item.met ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
