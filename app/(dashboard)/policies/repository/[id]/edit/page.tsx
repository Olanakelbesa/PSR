"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  UploadCloud,
  Calendar,
  Globe,
  Lock,
  CheckCircle2,
  AlertCircle,
  X,
  Hash,
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
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/layout";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { extractFileName } from "@/lib/utils/resolve-file-url";
import { MAX_FILE_SIZE_MB } from "@/lib/constants";
import {
  mapPolicyRepositoryDetail,
  usePolicyRepositoryDetail,
  useUpdateRegisteredPolicy,
} from "@/lib/queries/policy-repository";

const READINESS = [
  { key: "serialNumber", label: "Serial number set" },
  { key: "versionCode", label: "Version code set" },
  { key: "effectiveDate", label: "Effective date set" },
  { key: "accessLevel", label: "Access level chosen" },
];

function toInputDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

export default function EditRepositoryEntryPage() {
  const params = useParams();
  const router = useRouter();
  const policyId = (params as { id?: string })?.id ?? "";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: detailResponse, isLoading, isError } =
    usePolicyRepositoryDetail(policyId);
  const updateMutation = useUpdateRegisteredPolicy(policyId);

  const policy = useMemo(() => {
    if (!detailResponse?.data) return null;
    return mapPolicyRepositoryDetail(detailResponse.data, extractFileName);
  }, [detailResponse]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "",
    type: "",
    organization: "",
    serialNumber: "",
    versionCode: "",
    approvalDate: "",
    effectiveDate: "",
    nextReviewDate: "",
    accessLevel: "public",
    publishNow: false,
  });

  useEffect(() => {
    if (!policy) return;
    setForm({
      title: policy.title,
      type: policy.type,
      organization: policy.organization,
      serialNumber: policy.serialNumber,
      versionCode: policy.versionCode,
      approvalDate: toInputDate(policy.approvalDate),
      effectiveDate: toInputDate(policy.effectiveDate),
      nextReviewDate: toInputDate(policy.nextReviewDate),
      accessLevel: policy.accessLevel === "restricted" ? "restricted" : "public",
      publishNow: policy.publishStatus,
    });
  }, [policy]);

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const readinessMap: Record<string, boolean> = {
    serialNumber: !!form.serialNumber.trim(),
    versionCode: !!form.versionCode.trim(),
    effectiveDate: !!form.effectiveDate,
    accessLevel: !!form.accessLevel,
  };

  const completedCount = Object.values(readinessMap).filter(Boolean).length;
  const isReady = completedCount === READINESS.length;

  async function handleSubmit() {
    if (!isReady) {
      toast.error("Please complete all required fields before saving.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateMutation.mutateAsync({
        serial_number: form.serialNumber.trim(),
        version_code: form.versionCode.trim(),
        approval_date: form.approvalDate,
        effective_date: form.effectiveDate,
        next_review_date: form.nextReviewDate,
        access_level: form.accessLevel,
        publish_status: form.publishNow,
        policy_document_source: selectedFile,
      });
      toast.success(`Policy "${form.title}" has been updated.`);
      router.push(`/policies/repository/${policyId}`);
    } catch (error: any) {
      const details = error?.response?.data?.error?.details;
      const fieldMessage =
        details?.serialNumber?.[0] ||
        details?.serial_number?.[0] ||
        details?.versionCode?.[0] ||
        details?.version_code?.[0];
      const serverMessage =
        fieldMessage ||
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update policy. Please try again.";
      toast.error(String(serverMessage));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <PageContainer title="Loading policy…">
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !policy) {
    return (
      <PageContainer title="Policy not found">
        <div className="rounded-xl border border-dashed p-12 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="text-lg font-bold">Document not accessible</h2>
          <Button variant="outline" size="sm" asChild className="mt-4">
            <Link href="/policies/repository">Back to registry</Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Edit Registered Policy"
      description="Update registry metadata, identifiers, publication status, and document."
      actions={
        <Button variant="outline" asChild>
          <Link href={`/policies/repository/${policyId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Policy Identity</CardTitle>
              </div>
              <CardDescription>
                Source draft identity is fixed; registry identifiers can be edited
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">
                      Title
                    </p>
                    <p className="text-sm font-black text-foreground">
                      {form.title}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">
                      Document Type
                    </p>
                    <Badge variant="outline" className="bg-background">
                      {form.type}
                    </Badge>
                  </div>
                  <div className="space-y-1 col-span-full">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">
                      Submitting Organization
                    </p>
                    <p className="text-sm font-medium">{form.organization}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">
                    Serial Number <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="serialNumber"
                      className="h-11 pl-9 font-mono"
                      value={form.serialNumber}
                      onChange={(e) => set("serialNumber", e.target.value)}
                      placeholder="ET-ORG-TYPE-YEAR-0001"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Must be unique across the repository
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="versionCode">
                    Version Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="versionCode"
                    className="h-11 font-mono"
                    value={form.versionCode}
                    onChange={(e) => set("versionCode", e.target.value)}
                    placeholder="ET-ORG-TYPE-YEAR-0001_V1"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Must be unique across the repository
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <div className="flex items-center gap-2">
                <UploadCloud className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Policy Document</CardTitle>
              </div>
              <CardDescription>
                Keep the current file or upload a replacement document
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              {policy.draftFile && !selectedFile && (
                <div className="flex items-center justify-between gap-4 rounded-xl border bg-muted/20 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {policy.documentFileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Current repository document
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="sr-only"
                onChange={(event) =>
                  setSelectedFile(event.target.files?.[0] || null)
                }
              />

              {!selectedFile ? (
                <div
                  className="rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/5 p-6 text-center cursor-pointer hover:border-primary/40"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud className="mx-auto mb-2 h-8 w-8 text-primary" />
                  <p className="text-sm font-bold">
                    Upload replacement document (optional)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOC, or DOCX up to {MAX_FILE_SIZE_MB}MB
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4 rounded-xl border-2 bg-emerald-50/50 border-emerald-200 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-emerald-900">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs font-medium text-emerald-700 mt-0.5">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · READY
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-rose-500"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

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
                {
                  id: "effectiveDate",
                  label: "Effective Date *",
                  field: "effectiveDate",
                },
                {
                  id: "nextReviewDate",
                  label: "Next Review Date",
                  field: "nextReviewDate",
                },
              ].map((item) => (
                <div key={item.id} className="space-y-2">
                  <Label htmlFor={item.id}>{item.label}</Label>
                  <Input
                    id={item.id}
                    type="date"
                    value={(form as any)[item.field]}
                    onChange={(e) => set(item.field, e.target.value)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <CardTitle className="text-base">
                Access Level <span className="text-destructive text-sm">*</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 grid gap-3 sm:grid-cols-2">
              {[
                {
                  value: "public",
                  label: "Public",
                  icon: Globe,
                  description: "Visible to all users and the general public",
                  className: "border-green-200 bg-green-50/50 hover:bg-green-50",
                },
                {
                  value: "restricted",
                  label: "Restricted",
                  icon: Lock,
                  description: "Visible to authorized administrators only",
                  className: "border-red-200 bg-red-50/50 hover:bg-red-50",
                },
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
                      selected
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border",
                    )}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-semibold">{opt.label}</span>
                      {selected && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary ml-auto" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/10">
            <CardContent className="pt-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Publish now</p>
                <p className="text-xs text-muted-foreground">
                  Published policies appear as live registry entries
                </p>
              </div>
              <Switch
                checked={form.publishNow}
                onCheckedChange={(checked) => set("publishNow", checked)}
              />
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-5 xl:h-fit">
          <Card className="shadow-sm border-primary/20">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">
                Edit Readiness
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="space-y-2">
                {READINESS.map((item) => (
                  <div key={item.key} className="flex items-center gap-2 text-xs">
                    {readinessMap[item.key] ? (
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                    )}
                    <span
                      className={
                        readinessMap[item.key]
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                className="w-full mt-2 bg-primary hover:bg-primary/90"
                onClick={handleSubmit}
                disabled={isSubmitting || !isReady}
              >
                {isSubmitting
                  ? "Saving..."
                  : isReady
                    ? "Save Changes"
                    : "Complete Form First"}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
