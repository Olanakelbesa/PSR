"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Plus,
  Download,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Building2,
  Search,
  CalendarDays,
  ShieldCheck,
  FileLock2,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageContainer } from "@/components/layout";
import { DataTable } from "@/components/shared/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
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

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------
const mockClearances: EthicalClearance[] = [
  {
    id: "ec-001",
    proposalReference: "PRP-008",
    proposalTitle: "Task Shifting to CHWs for Hypertension Management",
    requestingFile: "Ethics_Application_CHW_HTN.pdf",
    type: "full_board",
    clearanceFile: "EPHI_Clearance_EC-2024-001.pdf",
    status: "approved",
    organization: "EPHI IRB",
    dateOfApplication: "2024-01-25T00:00:00Z",
    approvalDate: "2024-02-15T00:00:00Z",
    expiryDate: "2026-02-14T00:00:00Z",
  },
  {
    id: "ec-002",
    proposalReference: "PRP-009",
    proposalTitle: "Kangaroo Mother Care Scale-Up in Secondary Hospitals",
    requestingFile: "Ethics_Application_KMC.pdf",
    type: "expedited",
    clearanceFile: "MOH_IRB_Clearance_EC-2024-002.pdf",
    status: "approved",
    organization: "MOH IRB",
    dateOfApplication: "2024-01-20T00:00:00Z",
    approvalDate: "2024-02-05T00:00:00Z",
    expiryDate: "2026-02-04T00:00:00Z",
  },
  {
    id: "ec-003",
    proposalReference: "PRP-010",
    proposalTitle: "mHealth App for Maternal Danger Sign Reporting",
    requestingFile: "Ethics_Application_mHealth.pdf",
    type: "full_board",
    clearanceFile: undefined,
    status: "under_review",
    organization: "AAU IRB",
    dateOfApplication: "2024-03-01T00:00:00Z",
    approvalDate: undefined,
  },
  {
    id: "ec-004",
    proposalReference: "PRP-005",
    proposalTitle: "Evaluation of Maternal Waiting Homes",
    requestingFile: "Ethics_Application_MWH.pdf",
    type: "full_board",
    clearanceFile: undefined,
    status: "pending",
    organization: "MOH IRB",
    dateOfApplication: "2024-03-18T00:00:00Z",
    approvalDate: undefined,
  },
  {
    id: "ec-005",
    proposalReference: "PRP-006",
    proposalTitle: "Integration of Mental Health into Primary Health Care",
    requestingFile: "Ethics_Application_MH_PHC.pdf",
    type: "full_board",
    clearanceFile: undefined,
    status: "pending",
    organization: "Jimma University IRB",
    dateOfApplication: "2024-03-22T00:00:00Z",
    approvalDate: undefined,
  },
  {
    id: "ec-006",
    proposalReference: "PRP-003",
    proposalTitle: "COVID-19 Impact on Essential Health Services",
    requestingFile: "Ethics_Application_COVID.pdf",
    type: "exempt",
    clearanceFile: "EPHI_Exempt_Cert_EC-2023-011.pdf",
    status: "expired",
    organization: "EPHI IRB",
    dateOfApplication: "2023-09-10T00:00:00Z",
    approvalDate: "2023-09-20T00:00:00Z",
    expiryDate: "2024-09-19T00:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const statusConfig: Record<ClearanceStatus, { label: string; color: string; icon: any }> = {
  pending:      { label: "Pending",      color: "bg-slate-100 text-slate-700 border-slate-200",   icon: Clock },
  under_review: { label: "Under Review", color: "bg-blue-100 text-blue-700 border-blue-200",      icon: Shield },
  approved:     { label: "Approved",     color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  rejected:     { label: "Rejected",     color: "bg-rose-100 text-rose-700 border-rose-200",      icon: XCircle },
  expired:      { label: "Expired",      color: "bg-amber-100 text-amber-700 border-amber-200",   icon: AlertCircle },
};

const typeLabel: Record<ClearanceType, string> = {
  full_board:             "Full Board Review",
  expedited:              "Expedited Review",
  exempt:                 "Exempt",
  informed_consent_waiver:"Consent Waiver",
};

const CLEARANCE_TYPES: ClearanceType[] = ["full_board", "expedited", "exempt", "informed_consent_waiver"];

// ---------------------------------------------------------------------------
// New Application Form State
// ---------------------------------------------------------------------------
const emptyForm = {
  proposalReference: "",
  proposalTitle: "",
  type: "" as ClearanceType | "",
  organization: "",
  notes: "",
  requestingFile: null as File | null,
};

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------
export default function EthicalClearancePage() {
  const router = useRouter();
  const [clearances, setClearances] = useState<EthicalClearance[]>(mockClearances);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stats = [
    { label: "Total Applications",  value: clearances.length,                                               icon: FileLock2,   color: "text-slate-600",   bg: "bg-slate-50" },
    { label: "Pending / In Review", value: clearances.filter(c => c.status === "pending" || c.status === "under_review").length, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Approved",            value: clearances.filter(c => c.status === "approved").length,           icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Expired / Rejected",  value: clearances.filter(c => c.status === "expired" || c.status === "rejected").length, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  function handleSubmit() {
    if (!form.proposalReference || !form.type || !form.organization) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      const newEntry: EthicalClearance = {
        id: `ec-${Date.now()}`,
        proposalReference: form.proposalReference.toUpperCase(),
        proposalTitle: form.proposalTitle,
        requestingFile: form.requestingFile?.name || "Application_Form.pdf",
        type: form.type as ClearanceType,
        status: "pending",
        organization: form.organization,
        dateOfApplication: new Date().toISOString(),
      };
      setClearances(prev => [newEntry, ...prev]);
      setForm({ ...emptyForm });
      setDialogOpen(false);
      setIsSubmitting(false);
      toast.success("Ethical clearance application submitted.");
    }, 800);
  }

  const columns: ColumnDef<EthicalClearance>[] = [
    {
      accessorKey: "proposalReference",
      header: "Proposal Ref.",
      cell: ({ row }) => (
        <span className="font-bold text-primary text-sm">{row.original.proposalReference}</span>
      ),
    },
    {
      accessorKey: "proposalTitle",
      header: "Proposal / Study",
      cell: ({ row }) => (
        <div className="max-w-[260px]">
          <p className="font-semibold text-sm line-clamp-1">{row.original.proposalTitle}</p>
          <p className="text-[10px] text-muted-foreground font-bold uppercase mt-0.5">{typeLabel[row.original.type]}</p>
        </div>
      ),
    },
    {
      accessorKey: "organization",
      header: "IRB / Organization",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium">{row.original.organization}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const cfg = statusConfig[row.original.status];
        const Icon = cfg.icon;
        return (
          <Badge className={cn("border text-[10px] font-bold uppercase shadow-none gap-1 px-2", cfg.color)}>
            <Icon className="h-3 w-3" />
            {cfg.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "dateOfApplication",
      header: "Applied",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <CalendarDays className="h-3.5 w-3.5" />
          {new Date(row.original.dateOfApplication).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
        </div>
      ),
    },
    {
      accessorKey: "approvalDate",
      header: "Approved / Expiry",
      cell: ({ row }) => {
        const o = row.original;
        if (!o.approvalDate) return <span className="text-xs text-muted-foreground/50">—</span>;
        return (
          <div className="space-y-0.5 text-xs">
            <p className="font-medium">{new Date(o.approvalDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
            {o.expiryDate && (
              <p className={cn("text-[10px] font-bold", new Date(o.expiryDate) < new Date() ? "text-rose-600" : "text-emerald-600")}>
                Exp: {new Date(o.expiryDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            )}
          </div>
        );
      },
    },
    {
      id: "files",
      header: "Documents",
      cell: ({ row }) => {
        const o = row.original;
        return (
          <div className="flex items-center gap-1">
            <button className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline">
              <FileText className="h-3 w-3" />
              Request
            </button>
            {o.clearanceFile && (
              <>
                <span className="text-muted-foreground/40">|</span>
                <button className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:underline">
                  <Download className="h-3 w-3" />
                  Clearance
                </button>
              </>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => router.push(`/research/ethical-clearance/${row.original.id}`)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="h-4 w-4 mr-2" />
              Download Request
            </DropdownMenuItem>
            {row.original.clearanceFile && (
              <DropdownMenuItem className="text-emerald-600 font-medium">
                <ShieldCheck className="h-4 w-4 mr-2" />
                Download Clearance
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {row.original.status === "pending" && (
              <DropdownMenuItem className="text-amber-600 font-medium">
                <Clock className="h-4 w-4 mr-2" />
                Mark as Under Review
              </DropdownMenuItem>
            )}
            {row.original.status === "under_review" && (
              <DropdownMenuItem className="text-emerald-600 font-medium" onClick={() => router.push(`/research/ethical-clearance/${row.original.id}/approve`)}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Upload & Approve
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <PageContainer
      title="Ethical Clearance"
      description="Track, manage and verify ethics approvals for all research proposals."

    >
      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Card key={i} className="group relative overflow-hidden border-none shadow-md hover:shadow-lg transition-all">
              <div className={cn("absolute inset-y-0 left-0 w-1", stat.bg)} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</CardTitle>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={clearances}
          searchKey="proposalTitle"
          searchPlaceholder="Search by proposal title, reference, or organization..."
          filterOptions={[
            {
              key: "status",
              label: "Status",
              options: [
                { value: "pending",      label: "Pending" },
                { value: "under_review", label: "Under Review" },
                { value: "approved",     label: "Approved" },
                { value: "rejected",     label: "Rejected" },
                { value: "expired",      label: "Expired" },
              ],
            },
            {
              key: "type",
              label: "Review Type",
              options: CLEARANCE_TYPES.map(t => ({ value: t, label: typeLabel[t] })),
            },
          ]}
          emptyMessage="No ethical clearance applications found"
          emptyDescription="Submit a new application to track ethical approvals here."
          onRowClick={(row) => router.push(`/research/ethical-clearance/${row.id}`)}
        />
      </div>
    </PageContainer>
  );
}
