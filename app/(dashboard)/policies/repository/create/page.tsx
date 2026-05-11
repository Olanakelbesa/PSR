"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Building2,
  Calendar,
  Globe,
  Shield,
  Lock,
  Hash,
  Tag,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageContainer } from "@/components/layout";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { policyApi } from "@/lib/api/client";
import { PolicyDocument } from "@/lib/types";

const READINESS = [
  { key: "title", label: "Policy title selected" },
  { key: "type", label: "Document type identified" },
  { key: "org", label: "Organization identified" },
  { key: "effectiveDate", label: "Effective date set" },
  { key: "accessLevel", label: "Access level chosen" },
];

export default function CreateRepositoryEntryPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    type: "",
    organization: "",
    sourceDraft: "",
    approvalDate: "",
    effectiveDate: "",
    nextReviewDate: "",
    operationalPeriod: "",
    accessLevel: "",
    description: "",
    publishNow: false,
  });

  const [approvedDrafts, setApprovedDrafts] = useState<PolicyDocument[]>([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(true);

  useEffect(() => {
    async function loadApprovedDrafts() {
      try {
        const response = await policyApi.getPolicies({ status: "approved" }, { page: 1, pageSize: 100 });
        setApprovedDrafts(response.data);
      } catch (error) {
        console.error("Failed to load approved drafts:", error);
      } finally {
        setIsLoadingDrafts(false);
      }
    }
    loadApprovedDrafts();
  }, []);

  const handleDraftSelect = (draftId: string) => {
    const draft = approvedDrafts.find((d) => d.id === draftId);
    if (draft) {
      setForm((prev) => ({
        ...prev,
        title: draft.title,
        type: draft.type,
        organization: draft.createdBy?.institution || "Ministry of Education",
        sourceDraft: draft.id,
        description: draft.description,
      }));
    }
  };

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const readinessMap: Record<string, boolean> = {
    title: !!form.title.trim(),
    type: !!form.type,
    org: !!form.organization.trim(),
    effectiveDate: !!form.effectiveDate,
    accessLevel: !!form.accessLevel,
  };
  const completedCount = Object.values(readinessMap).filter(Boolean).length;
  const isReady = completedCount === READINESS.length;

  async function handleSubmit() {
    if (!isReady) {
      toast.error("Please fill in all required fields before registering the policy.");
      return;
    }
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 1400));
      toast.success(`Policy "${form.title}" has been registered in the repository.`);
      router.push("/policies/repository");
    } catch {
      toast.error("Failed to register policy. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageContainer
      title="Register Approved Policy"
      description="Select an approved policy draft to finalize its entry into the official repository."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/policies/repository">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !isReady}
            className="bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? "Registering..." : "Register Policy"}
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* Form */}
        <div className="space-y-6">

          {/* Core Identity */}
          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Policy Identity Selection</CardTitle>
              </div>
              <CardDescription>Select an approved draft to import its core identification details</CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="draft">Select Approved Draft <span className="text-destructive">*</span></Label>
                <Select value={form.sourceDraft} onValueChange={handleDraftSelect}>
                  <SelectTrigger id="draft" className="h-11 shadow-sm focus:ring-primary/20">
                    <SelectValue placeholder={isLoadingDrafts ? "Loading approved drafts..." : "Choose an approved policy draft..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedDrafts.length > 0 ? (
                      approvedDrafts.map((draft) => (
                        <SelectItem key={draft.id} value={draft.id}>
                          <div className="flex flex-col py-1">
                            <span className="font-bold">{draft.title}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">{draft.id} · {draft.type}</span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-muted-foreground">No approved drafts found in the system.</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {form.title && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold uppercase text-muted-foreground">Selected Title</p>
                       <p className="text-sm font-black text-foreground">{form.title}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold uppercase text-muted-foreground">Document Type</p>
                       <Badge variant="outline" className="bg-background">{form.type.toUpperCase()}</Badge>
                    </div>
                    <div className="space-y-1 col-span-full">
                       <p className="text-[10px] font-bold uppercase text-muted-foreground">Submitting Organization</p>
                       <p className="text-sm font-medium">{form.organization}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Executive Summary / Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide a brief overview of what this policy document covers..."
                  className="resize-none min-h-[100px] shadow-sm"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Operational Dates</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-5 grid gap-4 sm:grid-cols-2">
              {[
                { id: "approvalDate", label: "Approval Date", field: "approvalDate" },
                { id: "effectiveDate", label: "Effective Date *", field: "effectiveDate" },
                { id: "nextReviewDate", label: "Next Review Date", field: "nextReviewDate" },
                { id: "operationalPeriod", label: "Operational Period", field: "operationalPeriod", placeholder: "e.g. 2 years" },
              ].map((item) => (
                <div key={item.id} className="space-y-2">
                  <Label htmlFor={item.id}>{item.label}</Label>
                  {"placeholder" in item ? (
                    <Input
                      id={item.id}
                      placeholder={item.placeholder}
                      value={(form as any)[item.field]}
                      onChange={(e) => set(item.field, e.target.value)}
                    />
                  ) : (
                    <Input
                      id={item.id}
                      type="date"
                      value={(form as any)[item.field]}
                      onChange={(e) => set(item.field, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Access Level */}
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <CardTitle className="text-base">Access Level <span className="text-destructive text-sm font-normal">*</span></CardTitle>
              <CardDescription>Control who can view this policy in the repository</CardDescription>
            </CardHeader>
            <CardContent className="pt-5 grid gap-3 sm:grid-cols-3">
              {[
                { value: "public", label: "Public", icon: Globe, description: "Visible to all users and the general public", className: "border-green-200 bg-green-50/50 hover:bg-green-50" },
                { value: "internal", label: "Internal", icon: Shield, description: "Visible to registered ministry staff only", className: "border-blue-200 bg-blue-50/50 hover:bg-blue-50" },
                { value: "restricted", label: "Restricted", icon: Lock, description: "Visible to authorized administrators only", className: "border-red-200 bg-red-50/50 hover:bg-red-50" },
              ].map((opt) => {
                const Icon = opt.icon;
                const selected = form.accessLevel === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set("accessLevel", opt.value)}
                    className={cn(
                      "flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-all",
                      opt.className,
                      selected ? "border-primary ring-2 ring-primary/20" : "border-border"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-semibold">{opt.label}</span>
                      {selected && <CheckCircle2 className="h-3.5 w-3.5 text-primary ml-auto" />}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{opt.description}</p>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Readiness */}
        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <Card className={cn("shadow-sm border", isReady ? "border-green-200 bg-green-50/30" : "border-primary/20")}>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">
                Registration Readiness
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {/* Progress ring */}
              <div className="flex items-center justify-center py-2">
                <div className="relative">
                  <svg className="w-20 h-20 -rotate-90">
                    <circle cx="40" cy="40" r="34" strokeWidth="7" stroke="currentColor" fill="transparent" className="text-muted/20" />
                    <circle
                      cx="40" cy="40" r="34"
                      strokeWidth="7"
                      strokeDasharray={213.6}
                      strokeDashoffset={213.6 - (213.6 * completedCount) / READINESS.length}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      className={isReady ? "text-green-500" : "text-primary"}
                      style={{ transition: "stroke-dashoffset 0.4s ease" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-black">{completedCount}/{READINESS.length}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {READINESS.map((item) => (
                  <div key={item.key} className="flex items-center gap-2 text-xs">
                    {readinessMap[item.key] ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                    )}
                    <span className={readinessMap[item.key] ? "text-foreground" : "text-muted-foreground"}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              {!isReady && (
                <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded border border-amber-200 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  Complete all required fields to register the policy.
                </div>
              )}

              <Button
                className={cn("w-full mt-2", isReady ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-primary/90")}
                onClick={handleSubmit}
                disabled={isSubmitting || !isReady}
              >
                {isSubmitting ? "Registering..." : isReady ? "Register Policy" : "Complete Form First"}
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/10">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Manual registration is for policies that originated outside the standard workflow. For policies going through the full PSR approval cycle, use the <strong>Concept Note → Draft → Review</strong> workflow.
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
