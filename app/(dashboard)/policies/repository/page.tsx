"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Library,
  FileText,
  Globe,
  Lock,
  Shield,
  Download,
  Eye,
  Calendar,
  ArrowRight,
  BookOpen,
  Archive,
  Clock,
  Filter,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Plus,
  Building2,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageContainer } from "@/components/layout";
import { cn } from "@/lib/utils";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_POLICIES = [
  {
    id: "RP-001",
    serialNumber: "ET_MoE_EDU_001",
    versionCode: "ET_MoE_EDU_001_v1",
    title: "Education Sector Development Programme VI (ESDP VI)",
    type: "Strategy",
    organization: "Ministry of Education",
    approvalDate: "2025-03-15",
    effectiveDate: "2025-04-01",
    nextReviewDate: "2027-04-01",
    publishStatus: true,
    accessLevel: "public",
    downloads: 324,
    views: 1450,
  },
  {
    id: "RP-002",
    serialNumber: "ET_MoE_TCH_002",
    versionCode: "ET_MoE_TCH_002_v1",
    title: "Teacher Professional Development and Certification Policy",
    type: "Policy",
    organization: "Ministry of Education",
    approvalDate: "2025-05-20",
    effectiveDate: "2025-06-01",
    nextReviewDate: "2027-06-01",
    publishStatus: true,
    accessLevel: "public",
    downloads: 218,
    views: 890,
  },
  {
    id: "RP-003",
    serialNumber: "ET_MoE_INC_003",
    versionCode: "ET_MoE_INC_003_v2",
    title: "Inclusive Education for Students with Special Needs Guideline",
    type: "Guideline",
    organization: "MoE – Special Needs Division",
    approvalDate: "2025-07-10",
    effectiveDate: "2025-08-01",
    nextReviewDate: "2027-08-01",
    publishStatus: true,
    accessLevel: "public",
    downloads: 156,
    views: 670,
  },
  {
    id: "RP-004",
    serialNumber: "ET_MoE_DIG_004",
    versionCode: "ET_MoE_DIG_004_v1",
    title: "Digital Learning Infrastructure Implementation Framework",
    type: "Framework",
    organization: "MoE – ICT Directorate",
    approvalDate: "2025-09-05",
    effectiveDate: "2025-10-01",
    nextReviewDate: "2027-10-01",
    publishStatus: false,
    accessLevel: "internal",
    downloads: 0,
    views: 43,
  },
  {
    id: "RP-005",
    serialNumber: "ET_MoE_TVT_005",
    versionCode: "ET_MoE_TVT_005_v1",
    title: "TVET Strategy and Curriculum Reform Roadmap 2025–2030",
    type: "Strategy",
    organization: "MoE – TVET Department",
    approvalDate: "2025-10-18",
    effectiveDate: "2026-01-01",
    nextReviewDate: "2028-01-01",
    publishStatus: true,
    accessLevel: "public",
    downloads: 98,
    views: 412,
  },
  {
    id: "RP-006",
    serialNumber: "ET_MoE_HED_006",
    versionCode: "ET_MoE_HED_006_v1",
    title: "Higher Education Access and Quality Assurance Policy",
    type: "Policy",
    organization: "MoE – Higher Education",
    approvalDate: "2025-11-02",
    effectiveDate: "2026-02-01",
    nextReviewDate: "2028-02-01",
    publishStatus: false,
    accessLevel: "restricted",
    downloads: 0,
    views: 12,
  },
];

const ACCESS_ICONS: Record<string, { icon: typeof Globe; label: string; className: string }> = {
  public: { icon: Globe, label: "Public", className: "bg-green-100 text-green-700 border-green-200" },
  internal: { icon: Shield, label: "Internal", className: "bg-blue-100 text-blue-700 border-blue-200" },
  restricted: { icon: Lock, label: "Restricted", className: "bg-red-100 text-red-700 border-red-200" },
};

const PAGE_SIZE = 5;

export default function RepositoryDashboardPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");
  const [publishFilter, setPublishFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = MOCK_POLICIES.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.organization.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || p.type === typeFilter;
    const matchAccess = accessFilter === "all" || p.accessLevel === accessFilter;
    const matchPublish =
      publishFilter === "all" ||
      (publishFilter === "published" && p.publishStatus) ||
      (publishFilter === "unpublished" && !p.publishStatus);
    return matchSearch && matchType && matchAccess && matchPublish;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const totalPublished = MOCK_POLICIES.filter((p) => p.publishStatus).length;

  return (
    <PageContainer
      title="Policy Repository"
      description="National Policy Knowledge Management System — registered, versioned, and published policy documents"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/policies/repository/archived">
              <Archive className="mr-2 h-4 w-4" />
              Archived
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/policies/repository/drafts">
              <Clock className="mr-2 h-4 w-4" />
              Pending Publication
            </Link>
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href="/policies/repository/create">
              <Plus className="mr-2 h-4 w-4" />
              Register Policy
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Registered", value: MOCK_POLICIES.length, icon: Library, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
            { label: "Published", value: totalPublished, icon: Globe, color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
            { label: "Active Organizations", value: 3, icon: Building2, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
            { label: "Types of Documents", value: 4, icon: FileText, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
          ].map((stat) => (
            <Card key={stat.label} className={cn("shadow-sm border", stat.border)}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={cn("p-3 rounded-xl shrink-0", stat.bg)}>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <div>
                  <p className="text-2xl font-black">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters + Table */}
        <Card className="shadow-sm border-primary/10">
          <CardHeader className="border-b bg-muted/30 pb-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Policy Registry
                </CardTitle>
                <CardDescription>{filtered.length} polic{filtered.length === 1 ? "y" : "ies"} found</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search title, serial, org..."
                    className="pl-9 h-9 w-60"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  />
                </div>
                <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 w-32"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Policy">Policy</SelectItem>
                    <SelectItem value="Strategy">Strategy</SelectItem>
                    <SelectItem value="Guideline">Guideline</SelectItem>
                    <SelectItem value="Framework">Framework</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={accessFilter} onValueChange={(v) => { setAccessFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 w-32"><SelectValue placeholder="Access" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Access</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={publishFilter} onValueChange={(v) => { setPublishFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="unpublished">Unpublished</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center border rounded-md overflow-hidden">
                  <button onClick={() => setViewMode("list")} className={cn("p-2 transition-colors", viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted/50")}>
                    <List className="h-4 w-4" />
                  </button>
                  <button onClick={() => setViewMode("grid")} className={cn("p-2 transition-colors", viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted/50")}>
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="p-16 text-center text-muted-foreground">
                <Library className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No policies match your criteria</p>
                <p className="text-sm mt-1">Try adjusting your filters or search term</p>
              </div>
            ) : viewMode === "list" ? (
              <>
                {/* Column headers */}
                <div className="hidden xl:grid grid-cols-[1fr_120px_100px_110px_100px_120px] gap-4 px-5 py-2.5 border-b bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>Policy</span>
                  <span>Type</span>
                  <span>Access</span>
                  <span>Effective Date</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>
                <div className="divide-y min-h-[300px]">
                  {paginated.map((policy) => {
                    const accessCfg = ACCESS_ICONS[policy.accessLevel];
                    const AccessIcon = accessCfg.icon;
                    return (
                      <div key={policy.id} className="flex flex-col xl:grid xl:grid-cols-[1fr_120px_100px_110px_100px_120px] xl:items-center gap-3 xl:gap-4 p-5 hover:bg-muted/20 transition-colors">
                        {/* Title */}
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="p-2 rounded-md bg-primary/5 shrink-0">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold leading-snug">{policy.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{policy.organization}</p>
                            <p className="text-[10px] font-mono text-muted-foreground/70 mt-0.5">{policy.serialNumber}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] w-fit">{policy.type}</Badge>
                        <Badge variant="outline" className={cn("text-[10px] w-fit flex items-center gap-1", accessCfg.className)}>
                          <AccessIcon className="h-2.5 w-2.5" />{accessCfg.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {policy.effectiveDate}
                        </span>
                        <Badge className={cn("text-[10px] w-fit", policy.publishStatus ? "bg-green-100 text-green-700 border border-green-200" : "bg-amber-100 text-amber-700 border border-amber-200")}>
                          {policy.publishStatus ? "Published" : "Unpublished"}
                        </Badge>
                        <div className="flex items-center gap-1.5">
                          <Button size="sm" variant="outline" className="h-8" asChild>
                            <Link href={`/policies/repository/${policy.id}`}>
                              <Eye className="h-3 w-3 mr-1" /> View
                            </Link>
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
                {paginated.map((policy) => {
                  const accessCfg = ACCESS_ICONS[policy.accessLevel];
                  const AccessIcon = accessCfg.icon;
                  return (
                    <Card key={policy.id} className="shadow-sm border-border hover:shadow-md hover:border-primary/30 transition-all">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <Badge variant="outline" className="text-[10px]">{policy.type}</Badge>
                          <Badge variant="outline" className={cn("text-[10px] flex items-center gap-1", accessCfg.className)}>
                            <AccessIcon className="h-2.5 w-2.5" />{accessCfg.label}
                          </Badge>
                        </div>
                        <CardTitle className="text-sm leading-snug mt-2">{policy.title}</CardTitle>
                        <CardDescription className="text-xs">{policy.organization}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        <p className="text-[10px] font-mono text-muted-foreground">{policy.serialNumber}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Effective: {policy.effectiveDate}</span>
                        </div>
                        <Button size="sm" className="w-full h-8" asChild>
                          <Link href={`/policies/repository/${policy.id}`}>View Details <ArrowRight className="ml-1 h-3 w-3" /></Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t bg-muted/10 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Showing <span className="font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{" "}
                  <span className="font-medium">{Math.min(currentPage * PAGE_SIZE, filtered.length)}</span> of{" "}
                  <span className="font-medium">{filtered.length}</span> policies
                </p>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="icon" className="h-8 w-8"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button key={page} variant={currentPage === page ? "default" : "ghost"}
                      size="sm" className="h-8 w-8 p-0 text-xs" onClick={() => setCurrentPage(page)}>
                      {page}
                    </Button>
                  ))}
                  <Button variant="outline" size="icon" className="h-8 w-8"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Reviews */}
        <Card className="shadow-sm border-amber-200 bg-amber-50/30">
          <CardHeader className="border-b border-amber-200/50 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <CardTitle className="text-base">Upcoming Policy Reviews</CardTitle>
              </div>
              <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                {MOCK_POLICIES.filter(p => p.nextReviewDate <= "2028-01-01").length} due within 2 years
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {MOCK_POLICIES.slice(0, 3).map((policy) => (
                <div key={policy.id} className="flex items-center justify-between p-3 bg-background rounded-lg border shadow-sm">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{policy.title}</p>
                    <p className="text-xs text-muted-foreground">{policy.serialNumber}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-xs font-semibold text-amber-700">Review due</p>
                    <p className="text-xs text-muted-foreground">{policy.nextReviewDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
