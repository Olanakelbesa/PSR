"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Download,
  Building2,
  CalendarDays,
  ShieldCheck,
  ChevronRight,
  Paperclip,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/layout";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Shared types & mock data (in real app, import from shared module)
// ---------------------------------------------------------------------------
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
  { id: "ec-005", proposalReference: "PRP-006", proposalTitle: "Integration of Mental Health into Primary Health Care", requestingFile: "Ethics_Application_MH_PHC.pdf", type: "full_board", status: "pending", organization: "Jimma University IRB", dateOfApplication: "2024-03-22T00:00:00Z" },
  { id: "ec-006", proposalReference: "PRP-003", proposalTitle: "COVID-19 Impact on Essential Health Services", requestingFile: "Ethics_Application_COVID.pdf", type: "exempt", clearanceFile: "EPHI_Exempt_Cert_EC-2023-011.pdf", status: "expired", organization: "EPHI IRB", dateOfApplication: "2023-09-10T00:00:00Z", approvalDate: "2023-09-20T00:00:00Z", expiryDate: "2024-09-19T00:00:00Z" },
];

const statusConfig: Record<ClearanceStatus, { label: string; color: string; icon: any }> = {
  pending:      { label: "Pending",      color: "bg-slate-100 text-slate-700 border-slate-200",       icon: Clock },
  under_review: { label: "Under Review", color: "bg-blue-100 text-blue-700 border-blue-200",          icon: Shield },
  approved:     { label: "Approved",     color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  rejected:     { label: "Rejected",     color: "bg-rose-100 text-rose-700 border-rose-200",          icon: XCircle },
  expired:      { label: "Expired",      color: "bg-amber-100 text-amber-700 border-amber-200",       icon: AlertCircle },
};

const typeLabel: Record<ClearanceType, string> = {
  full_board:              "Full Board Review",
  expedited:               "Expedited Review",
  exempt:                  "Exempt",
  informed_consent_waiver: "Informed Consent Waiver",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function EthicalClearanceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [clearance, setClearance] = useState<EthicalClearance | null>(null);

  useEffect(() => {
    const found = mockClearances.find(c => c.id === id);
    if (found) {
      setClearance(found);
    } else {
      toast.error("Clearance record not found");
      router.push("/research/ethical-clearance");
    }
  }, [id, router]);

  if (!clearance) return null;

  const cfg = statusConfig[clearance.status];
  const StatusIcon = cfg.icon;
  const isExpired = clearance.expiryDate && new Date(clearance.expiryDate) < new Date();

  return (
    <PageContainer
      title={clearance.proposalTitle}
      description={`Ethical Clearance — ${clearance.proposalReference}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/research/ethical-clearance")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {(clearance.status === "pending" || clearance.status === "under_review") && (
            <Button
              className="bg-primary/80 hover:bg-primary/60"
              onClick={() => router.push(`/research/ethical-clearance/${id}/approve`)}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Process Clearance
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        {/* Main */}
        <div className="space-y-6">
          {/* Status Banner */}
          <Card className={cn("shadow-sm border", cfg.color.replace("bg-", "border-").replace("text-", "").split(" ")[0])}>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", cfg.color)}>
                    <StatusIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-black text-base">{cfg.label}</p>
                    <p className="text-xs text-muted-foreground">Current clearance status</p>
                  </div>
                </div>
                {isExpired && (
                  <Badge className="bg-rose-100 text-rose-700 border border-rose-200 font-bold uppercase text-[10px]">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Expired — Renewal Required
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Application Details */}
          <Card className="shadow-sm border-primary/5">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Application Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { label: "Proposal Reference", value: <span className="font-bold text-primary">{clearance.proposalReference}</span> },
                  { label: "Type of Ethical Clearance", value: <Badge variant="outline" className="font-bold border-primary/20">{typeLabel[clearance.type]}</Badge> },
                  { label: "Name of Organization / IRB", value: <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-muted-foreground" />{clearance.organization}</span> },
                  { label: "Date of Application", value: <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />{new Date(clearance.dateOfApplication).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span> },
                  { label: "Approval Date", value: clearance.approvalDate ? <span className="flex items-center gap-1.5 text-primary font-bold"><CheckCircle2 className="h-3.5 w-3.5" />{new Date(clearance.approvalDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span> : <span className="text-muted-foreground/50 italic text-xs">Pending approval</span> },
                  { label: "Expiry Date", value: clearance.expiryDate ? <span className={cn("flex items-center gap-1.5 font-bold", isExpired ? "text-rose-600" : "text-primary")}><CalendarDays className="h-3.5 w-3.5" />{new Date(clearance.expiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}{isExpired ? " (Expired)" : ""}</span> : <span className="text-muted-foreground/50 italic text-xs">Not set</span> },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">{label}</dt>
                    <dd className="text-sm font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card className="shadow-sm border-primary/5">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-primary" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Requesting File */}
              <div className="flex items-center justify-between p-4 border-b hover:bg-muted/30 transition-colors group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{clearance.requestingFile}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Requesting File / Application</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Download
                </Button>
              </div>

              {/* Clearance File */}
              {clearance.clearanceFile ? (
                <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{clearance.clearanceFile}</p>
                      <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wide">Approved Clearance Certificate</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Download
                  </Button>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <ShieldCheck className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground italic">Clearance certificate will appear here once approved.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 sticky top-20 self-start">
          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <CardHeader className={cn("py-6 text-center text-white", clearance.status === "approved" ? "bg-emerald-600" : clearance.status === "rejected" ? "bg-rose-600" : clearance.status === "expired" ? "bg-amber-600" : "bg-primary")}>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mb-2">Clearance Record</p>
              <p className="text-2xl font-black">{clearance.proposalReference}</p>
              <Badge className="mt-2 bg-white/20 text-white border-white/30 text-[9px] font-bold uppercase">
                {clearance.type.replace(/_/g, " ")}
              </Badge>
            </CardHeader>
            <CardContent className="pt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Status</span>
                <Badge className={cn("border text-[10px] font-bold shadow-none", cfg.color)}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {cfg.label}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Organization</span>
                <span className="font-bold text-right max-w-[140px] text-right text-xs leading-tight">{clearance.organization}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Applied</span>
                <span className="font-bold text-xs">{new Date(clearance.dateOfApplication).toLocaleDateString("en-GB")}</span>
              </div>
              {clearance.approvalDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Approved</span>
                  <span className="font-bold text-xs text-emerald-600">{new Date(clearance.approvalDate).toLocaleDateString("en-GB")}</span>
                </div>
              )}
              {clearance.expiryDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Expires</span>
                  <span className={cn("font-bold text-xs", isExpired ? "text-rose-600" : "text-emerald-600")}>{new Date(clearance.expiryDate).toLocaleDateString("en-GB")}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {(clearance.status === "pending" || clearance.status === "under_review") && (
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 h-11"
              onClick={() => router.push(`/research/ethical-clearance/${id}/approve`)}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Process Clearance
            </Button>
          )}
        </aside>
      </div>
    </PageContainer>
  );
}
