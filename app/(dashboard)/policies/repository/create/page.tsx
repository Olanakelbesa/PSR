"use client";

import { useState } from "react";
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

const THEMATIC_AREAS = [
  "Basic Education",
  "Higher Education",
  "TVET",
  "Teacher Development",
  "Digital Learning",
  "Early Childhood",
  "Special Needs Education",
  "Curriculum Development",
  "Quality Assurance",
  "Environmental Education",
];

const DOC_TYPES = ["Policy", "Strategy", "Guideline", "Framework", "Blueprint", "Roadmap"];

const ACCESS_OPTIONS = [
  { value: "public", label: "Public", icon: Globe, description: "Visible to all users and the general public", className: "border-green-200 bg-green-50/50 hover:bg-green-50" },
  { value: "internal", label: "Internal", icon: Shield, description: "Visible to registered ministry staff only", className: "border-blue-200 bg-blue-50/50 hover:bg-blue-50" },
  { value: "restricted", label: "Restricted", icon: Lock, description: "Visible to authorized administrators only", className: "border-red-200 bg-red-50/50 hover:bg-red-50" },
];

const READINESS = [
  { key: "title", label: "Policy title entered" },
  { key: "type", label: "Document type selected" },
  { key: "serial", label: "Serial number provided" },
  { key: "org", label: "Organization specified" },
  { key: "effectiveDate", label: "Effective date set" },
  { key: "accessLevel", label: "Access level chosen" },
];

export default function CreateRepositoryEntryPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    type: "",
    serialNumber: "",
    versionCode: "",
    organization: "",
    sourceDraft: "",
    approvalDate: "",
    effectiveDate: "",
    nextReviewDate: "",
    operationalPeriod: "",
    accessLevel: "",
    description: "",
    thematicAreas: [] as string[],
    publishNow: false,
  });

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleThematic(area: string) {
    setForm((prev) => ({
      ...prev,
      thematicAreas: prev.thematicAreas.includes(area)
        ? prev.thematicAreas.filter((a) => a !== area)
        : [...prev.thematicAreas, area],
    }));
  }

  const readinessMap: Record<string, boolean> = {
    title: !!form.title.trim(),
    type: !!form.type,
    serial: !!form.serialNumber.trim(),
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
      title="Register Policy Manually"
      description="Add a policy document directly to the repository without going through the full workflow"
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
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Policy Identity</CardTitle>
              </div>
              <CardDescription>Primary identification and classification of the policy document</CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Policy Title <span className="text-destructive">*</span></Label>
                <Input
                  id="title"
                  placeholder="e.g. Education Sector Development Programme VI"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">Document Type <span className="text-destructive">*</span></Label>
                  <Select value={form.type} onValueChange={(v) => set("type", v)}>
                    <SelectTrigger id="type"><SelectValue placeholder="Select type..." /></SelectTrigger>
                    <SelectContent>
                      {DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org">Organization <span className="text-destructive">*</span></Label>
                  <Input
                    id="org"
                    placeholder="e.g. Ministry of Education"
                    value={form.organization}
                    onChange={(e) => set("organization", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide a brief overview of what this policy document covers..."
                  className="resize-none min-h-[100px]"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Registry Codes */}
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Registry Codes</CardTitle>
              </div>
              <CardDescription>Unique identifiers used to track and version this policy in the registry</CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="serial">Serial Number <span className="text-destructive">*</span></Label>
                  <Input
                    id="serial"
                    placeholder="e.g. ET_MoE_EDU_001"
                    className="font-mono"
                    value={form.serialNumber}
                    onChange={(e) => set("serialNumber", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Format: ET_[ORG]_[AREA]_[NUM]</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="versionCode">Version Code</Label>
                  <Input
                    id="versionCode"
                    placeholder="e.g. ET_MoE_EDU_001_v1"
                    className="font-mono"
                    value={form.versionCode}
                    onChange={(e) => set("versionCode", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sourceDraft">Source Draft ID (optional)</Label>
                <Input
                  id="sourceDraft"
                  placeholder="e.g. PDD-2024-0081"
                  className="font-mono"
                  value={form.sourceDraft}
                  onChange={(e) => set("sourceDraft", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Link this record back to a policy draft that was approved through the full workflow.</p>
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
              {ACCESS_OPTIONS.map((opt) => {
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

          {/* Thematic Areas */}
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Thematic Areas</CardTitle>
              </div>
              <CardDescription>Tag this policy with relevant thematic classifications</CardDescription>
            </CardHeader>
            <CardContent className="pt-5 flex flex-wrap gap-2">
              {THEMATIC_AREAS.map((area) => {
                const selected = form.thematicAreas.includes(area);
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleThematic(area)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm border transition-all",
                      selected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background border-border hover:bg-muted/50 text-muted-foreground"
                    )}
                  >
                    {area}
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
