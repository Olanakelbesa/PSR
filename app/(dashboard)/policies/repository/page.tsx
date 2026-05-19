"use client";

import { useState, useMemo } from "react";
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

import { usePolicyRepository } from "@/lib/queries/policy-repository";
import { usePolicyDocumentTypes } from "@/lib/queries/policy-document-types";

const ACCESS_ICONS: Record<string, { icon: typeof Globe; label: string; className: string }> = {
  public: { icon: Globe, label: "Public", className: "bg-green-100 text-green-700 border-green-200 hover:bg-green-100" },
  internal: { icon: Shield, label: "Internal", className: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100" },
  restricted: { icon: Lock, label: "Restricted", className: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100" },
};

const PAGE_SIZE = 5;

export default function RepositoryDashboardPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");
  const [publishFilter, setPublishFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Fetch live dynamic document types for selection
  const { data: docTypes = [] } = usePolicyDocumentTypes();

  // Map state values to query payload
  const mappedPublishStatus = useMemo(() => {
    if (publishFilter === "published") return true;
    if (publishFilter === "unpublished") return false;
    return undefined;
  }, [publishFilter]);

  // 2. Fetch live policy repository data from backend
  const { data: repositoryResponse, isLoading } = usePolicyRepository({
    search: search || undefined,
    access_level: accessFilter || undefined,
    publish_status: mappedPublishStatus,
    source_draft__doc_type: typeFilter || undefined,
    page: currentPage,
    limit: PAGE_SIZE,
  });

  const policiesList = repositoryResponse?.data || [];
  const meta = repositoryResponse?.meta;
  const totalItems = meta?.total || 0;
  const totalPages = meta?.totalPages || 1;

  // Derive static quick stats dynamically from loaded dataset
  const stats = useMemo(() => {
    const publishedCount = policiesList.filter((p) => p.status === "Published").length;
    
    const uniqueOrgs = new Set<string>();
    const uniqueTypes = new Set<string>();
    policiesList.forEach((p) => {
      if (p.organizationName) uniqueOrgs.add(p.organizationName);
      if (p.docType) uniqueTypes.add(p.docType);
    });

    return {
      total: totalItems,
      published: publishedCount,
      orgs: uniqueOrgs.size || 1,
      types: uniqueTypes.size || 1,
    };
  }, [policiesList, totalItems]);

  return (
    <PageContainer
      title="Policy Repository"
      description="National Policy Knowledge Management System — registered, versioned, and published policy documents"
      actions={
        <div className="flex items-center gap-2">
          {/* <Button variant="outline" asChild className="shadow-sm border-primary/20 hover:bg-primary/5">
            <Link href="/policies/repository/archived">
              <Archive className="mr-2 h-4 w-4" />
              Archived
            </Link>
          </Button>
          <Button variant="outline" asChild className="shadow-sm border-primary/20 hover:bg-primary/5">
            <Link href="/policies/repository/drafts">
              <Clock className="mr-2 h-4 w-4" />
              Pending Publication
            </Link>
          </Button> */}
          <Button asChild className="bg-primary hover:bg-primary/90 text-white shadow-md">
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
            { label: "Total Registered", value: stats.total, icon: Library, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
            { label: "Published", value: stats.published, icon: Globe, color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
            { label: "Active Organizations", value: stats.orgs, icon: Building2, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
            { label: "Types of Documents", value: stats.types, icon: FileText, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
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
                <CardDescription>
                  {totalItems} polic{totalItems === 1 ? "y" : "ies"} found
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search title, serial, org..."
                    className="pl-9 h-9 w-60 focus-visible:ring-primary/20"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  />
                </div>
                
                <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 w-40 focus:ring-primary/20">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {docTypes.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={accessFilter} onValueChange={(v) => { setAccessFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 w-32 focus:ring-primary/20">
                    <SelectValue placeholder="Access" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Access</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={publishFilter} onValueChange={(v) => { setPublishFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 w-36 focus:ring-primary/20">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="unpublished">Unpublished</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center border rounded-md overflow-hidden bg-background">
                  <button onClick={() => setViewMode("list")} className={cn("p-2 transition-colors", viewMode === "list" ? "bg-primary text-white" : "hover:bg-muted/50 text-muted-foreground")}>
                    <List className="h-4 w-4" />
                  </button>
                  <button onClick={() => setViewMode("grid")} className={cn("p-2 transition-colors", viewMode === "grid" ? "bg-primary text-white" : "hover:bg-muted/50 text-muted-foreground")}>
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-16 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
                <p className="text-sm font-semibold text-muted-foreground">Retrieving registered policies...</p>
              </div>
            ) : policiesList.length === 0 ? (
              <div className="p-16 text-center text-muted-foreground">
                <Library className="h-12 w-12 mx-auto mb-3 opacity-20 text-primary" />
                <p className="font-semibold text-foreground">No policies match your criteria</p>
                <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or search term</p>
              </div>
            ) : viewMode === "list" ? (
              <>
                {/* Column headers */}
                <div className="hidden xl:grid grid-cols-[1fr_140px_100px_120px_110px_130px] gap-4 px-5 py-3 border-b bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>Policy</span>
                  <span>Type</span>
                  <span>Access</span>
                  <span>Effective Date</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>
                <div className="divide-y min-h-[300px]">
                  {policiesList.map((policy) => {
                    const accessCfg = ACCESS_ICONS[policy.accessLevel] || ACCESS_ICONS.public;
                    const AccessIcon = accessCfg.icon;
                    return (
                      <div key={policy.id} className="flex flex-col xl:grid xl:grid-cols-[1fr_140px_100px_120px_110px_130px] xl:items-center gap-3 xl:gap-4 p-5 hover:bg-muted/10 transition-colors">
                        {/* Title */}
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="p-2 rounded-md bg-primary/5 shrink-0">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold leading-snug text-foreground hover:text-primary transition-colors text-left">
                              {policy.draftPolicy}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 font-medium text-left">{policy.organizationName}</p>
                            <p className="text-[10px] font-mono text-muted-foreground/70 mt-0.5 bg-muted/50 w-fit px-1.5 py-0.5 rounded border border-dashed">
                              {policy.serialNumber || policy.versionCode}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] w-fit font-bold uppercase py-0">{policy.docType}</Badge>
                        <Badge variant="outline" className={cn("text-[10px] w-fit flex items-center gap-1 font-bold", accessCfg.className)}>
                          <AccessIcon className="h-2.5 w-2.5" />{accessCfg.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                          <Calendar className="h-3 w-3 text-primary" /> {policy.effectiveDate || "Pending"}
                        </span>
                        <Badge className={cn("text-[10px] w-fit font-bold", policy.status === "Published" ? "bg-green-100 text-green-700 border border-green-200 hover:bg-green-100" : "bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-100")}>
                          {policy.status}
                        </Badge>
                        <div className="flex items-center gap-1.5">
                          <Button size="sm" variant="outline" className="h-8 hover:bg-primary/5 hover:text-primary border-primary/20" asChild>
                            <Link href={`/policies/repository/${policy.id}`}>
                              <Eye className="h-3 w-3 mr-1" /> View
                            </Link>
                          </Button>
                          {policy.draftFile && (
                            <Button size="sm" variant="ghost" className="h-8 hover:bg-muted text-primary shrink-0" asChild>
                              <a href={policy.draftFile} target="_blank" rel="noopener noreferrer" title="Download Document">
                                <Download className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
                {policiesList.map((policy) => {
                  const accessCfg = ACCESS_ICONS[policy.accessLevel] || ACCESS_ICONS.public;
                  const AccessIcon = accessCfg.icon;
                  return (
                    <Card key={policy.id} className="shadow-sm border-border hover:shadow-md hover:border-primary/30 transition-all duration-200">
                      <CardHeader className="pb-3 text-left">
                        <div className="flex items-start justify-between gap-2">
                          <Badge variant="outline" className="text-[10px] font-bold uppercase">{policy.docType}</Badge>
                          <Badge variant="outline" className={cn("text-[10px] flex items-center gap-1 font-bold", accessCfg.className)}>
                            <AccessIcon className="h-2.5 w-2.5" />{accessCfg.label}
                          </Badge>
                        </div>
                        <CardTitle className="text-sm leading-snug mt-2 text-foreground font-semibold line-clamp-2 min-h-[40px]">{policy.draftPolicy}</CardTitle>
                        <CardDescription className="text-xs font-medium text-muted-foreground mt-1 line-clamp-1">{policy.organizationName}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3 text-left">
                        <p className="text-[10px] font-mono text-muted-foreground/70 bg-muted/50 w-fit px-1.5 py-0.5 rounded border border-dashed">
                          {policy.serialNumber || policy.versionCode}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-primary" />Effective: {policy.effectiveDate || "Pending"}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 h-8 text-white bg-primary hover:bg-primary/90" asChild>
                            <Link href={`/policies/repository/${policy.id}`}>View Details <ArrowRight className="ml-1 h-3 w-3" /></Link>
                          </Button>
                          {policy.draftFile && (
                            <Button size="sm" variant="outline" className="h-8 border-primary/20 hover:bg-primary/5 text-primary shrink-0" asChild>
                              <a href={policy.draftFile} target="_blank" rel="noopener noreferrer">
                                <Download className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t bg-muted/10 flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">
                  Showing <span className="font-semibold">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{" "}
                  <span className="font-semibold">{Math.min(currentPage * PAGE_SIZE, totalItems)}</span> of{" "}
                  <span className="font-semibold">{totalItems}</span> policies
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
      </div>
    </PageContainer>
  );
}
