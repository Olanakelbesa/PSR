"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon, UploadCloud, ArrowLeft, ShieldCheck, FileText, CheckCircle2, Building2, CalendarDays, Shield, AlertCircle } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { PageContainer } from "@/components/layout";
import { cn } from "@/lib/utils";

// Mock data
type ClearanceStatus = "pending" | "approved" | "rejected" | "expired" | "under_review";
type ClearanceType = "full_board" | "expedited" | "exempt" | "informed_consent_waiver";

interface EthicalClearance {
  id: string;
  proposalReference: string;
  proposalTitle: string;
  requestingFile: string;
  type: ClearanceType;
  clearanceFile?: string;
  status: ClearanceStatus;
  organization: string;
  dateOfApplication: string;
  approvalDate?: string;
  expiryDate?: string;
}

const mockClearances: EthicalClearance[] = [
  { id: "ec-001", proposalReference: "PRP-008", proposalTitle: "Task Shifting to CHWs for Hypertension Management", requestingFile: "Ethics_Application_CHW_HTN.pdf", type: "full_board", clearanceFile: "EPHI_Clearance_EC-2024-001.pdf", status: "approved", organization: "EPHI IRB", dateOfApplication: "2024-01-25T00:00:00Z", approvalDate: "2024-02-15T00:00:00Z", expiryDate: "2026-02-14T00:00:00Z" },
  { id: "ec-002", proposalReference: "PRP-009", proposalTitle: "Kangaroo Mother Care Scale-Up in Secondary Hospitals", requestingFile: "Ethics_Application_KMC.pdf", type: "expedited", clearanceFile: "MOH_IRB_Clearance_EC-2024-002.pdf", status: "approved", organization: "MOH IRB", dateOfApplication: "2024-01-20T00:00:00Z", approvalDate: "2024-02-05T00:00:00Z", expiryDate: "2026-02-04T00:00:00Z" },
  { id: "ec-003", proposalReference: "PRP-010", proposalTitle: "mHealth App for Maternal Danger Sign Reporting", requestingFile: "Ethics_Application_mHealth.pdf", type: "full_board", status: "under_review", organization: "AAU IRB", dateOfApplication: "2024-03-01T00:00:00Z" },
  { id: "ec-004", proposalReference: "PRP-005", proposalTitle: "Evaluation of Maternal Waiting Homes", requestingFile: "Ethics_Application_MWH.pdf", type: "full_board", status: "pending", organization: "MOH IRB", dateOfApplication: "2024-03-18T00:00:00Z" },
];

const formSchema = z.object({
  status: z.string().min(1),
  organization: z.string().min(1, "Organization name is required"),
  approvalDate: z.date({
    required_error: "Approval date is required.",
  }),
  clearanceFile: z.any().optional(),
});

const typeLabel: Record<ClearanceType, string> = {
  full_board: "Full Board Review",
  expedited: "Expedited Review",
  exempt: "Exempt",
  informed_consent_waiver: "Informed Consent Waiver",
};

export default function ApproveEthicalClearancePage() {
  const { id } = useParams();
  const router = useRouter();
  const [clearance, setClearance] = useState<EthicalClearance | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: "approved",
      organization: "",
      approvalDate: new Date(),
      clearanceFile: undefined,
    },
  });

  const watchStatus = form.watch("status");

  useEffect(() => {
    const found = mockClearances.find(c => c.id === id);
    if (found) {
      setClearance(found);
      form.reset({
        status: "approved",
        organization: found.organization,
        approvalDate: new Date(),
      });
    } else {
      toast.error("Clearance record not found");
      router.push("/research/ethical-clearance");
    }
  }, [id, router, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!fileName && values.status === "approved") {
      toast.error("Please upload the clearance certificate to approve.");
      return;
    }
    
    console.log("Approved Clearance Data:", values);
    toast.success("Ethical clearance updated successfully!");
    router.push(`/research/ethical-clearance/${id}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
      toast.success("File selected: " + e.target.files[0].name);
    }
  };

  if (!clearance) return null;

  return (
    <PageContainer
      title="Process Ethical Clearance"
      description={`Update the status and finalize clearance for proposal ${clearance.proposalReference}`}
      actions={
        <Button variant="outline" onClick={() => router.push(`/research/ethical-clearance/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Record
        </Button>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
        
        {/* Left Column: Context / Read-Only Data */}
        <div className="space-y-6">
          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <div className="bg-primary/5 p-6 border-b border-primary/10">
              <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none mb-3">
                Application Context
              </Badge>
              <h2 className="text-xl font-bold leading-tight">{clearance.proposalTitle}</h2>
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5">
                <Shield className="h-4 w-4" />
                Ref: {clearance.proposalReference}
              </p>
            </div>
            <CardContent className="p-6 space-y-4">
              
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Clearance Type</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-bold border-primary/20 bg-primary/5">
                    {typeLabel[clearance.type]}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Applied On</p>
                <p className="text-sm font-medium flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  {format(new Date(clearance.dateOfApplication), "PPP")}
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Requesting File</p>
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="h-8 w-8 rounded bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate" title={clearance.requestingFile}>{clearance.requestingFile}</p>
                    <p className="text-[10px] text-muted-foreground">Original Submission</p>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Right Column: Interactive Form */}
        <div className="xl:col-span-2 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {watchStatus === "approved" && (
                <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertTitle className="text-emerald-800 font-bold">Approving Clearance</AlertTitle>
                  <AlertDescription className="text-emerald-700/90 text-sm">
                    You are marking this ethical clearance as approved. You must provide the exact approval date and upload the official certificate.
                  </AlertDescription>
                </Alert>
              )}

              {watchStatus === "rejected" && (
                <Alert className="bg-rose-50 border-rose-200 text-rose-800">
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                  <AlertTitle className="text-rose-800 font-bold">Rejecting Clearance</AlertTitle>
                  <AlertDescription className="text-rose-700/90 text-sm">
                    This will halt the proposal until a new ethical clearance is submitted.
                  </AlertDescription>
                </Alert>
              )}

              <Card className="shadow-sm border-primary/10">
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Clearance Decision
                  </CardTitle>
                  <CardDescription>
                    Provide the decision details from the ethical review board.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Current Status */}
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold">Clearance Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11 border-primary/20">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="under_review">Under Review</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the current state of the review.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Name of Organization */}
                    <FormField
                      control={form.control}
                      name="organization"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold">Name of Organization / IRB</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Building2 className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                              <Input {...field} placeholder="e.g. EPHI IRB" className="pl-10 h-11 border-primary/20" />
                            </div>
                          </FormControl>
                          <FormDescription>
                            The Institutional Review Board handling this request.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Approval Date */}
                    {watchStatus === "approved" && (
                      <FormField
                        control={form.control}
                        name="approvalDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-sm font-bold">Approval Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal h-11 border-primary/20 hover:border-primary/50 transition-colors",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date(clearance.dateOfApplication)
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormDescription>Date the clearance was officially granted.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <Separator />

                  {/* Clearance File Upload */}
                  <FormField
                    control={form.control}
                    name="clearanceFile"
                    render={() => (
                      <FormItem className="space-y-4">
                        <div>
                          <FormLabel className={cn("text-sm font-bold flex items-center gap-1.5", watchStatus === "approved" && "after:content-['*'] after:text-rose-500")}>
                            Official Clearance Certificate
                          </FormLabel>
                          <FormDescription>
                            Upload the signed PDF from the IRB. Max size 10MB.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <div className={cn(
                            "relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer group",
                            fileName ? "border-emerald-500 bg-emerald-50/50" : "border-primary/20 hover:border-primary/50 hover:bg-muted/50",
                            watchStatus === "approved" && !fileName ? "border-rose-300 bg-rose-50/20" : ""
                          )}>
                            <Input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              onChange={handleFileUpload}
                            />
                            {fileName ? (
                              <div className="flex flex-col items-center animate-in zoom-in-95 duration-200">
                                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3 shadow-sm">
                                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                                </div>
                                <p className="text-sm font-bold text-emerald-800">{fileName}</p>
                                <p className="text-xs text-emerald-600/80 mt-1">Ready for submission</p>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="mt-4 h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 z-20" 
                                  onClick={(e) => { e.preventDefault(); setFileName(null); }}
                                >
                                  Remove file
                                </Button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center text-muted-foreground group-hover:text-primary transition-colors">
                                <div className="h-14 w-14 rounded-full bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                                  <UploadCloud className="h-7 w-7" />
                                </div>
                                <p className="text-base font-semibold text-foreground">Click to upload or drag and drop</p>
                                <p className="text-sm mt-1">PDF, JPG, PNG (max. 10MB)</p>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </CardContent>
                <CardFooter className="bg-muted/30 border-t p-6 flex items-center justify-between">
                  <Button type="button" variant="ghost" onClick={() => router.push(`/research/ethical-clearance/${id}`)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className={cn("h-11 px-8 transition-all", watchStatus === "approved" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 shadow-lg" : "")}
                  >
                    {watchStatus === "approved" ? (
                      <><CheckCircle2 className="mr-2 h-4 w-4" /> Approve Clearance</>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </div>
      </div>
    </PageContainer>
  );
}