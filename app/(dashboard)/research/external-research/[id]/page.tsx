"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Building2,
  Users,
  BadgeCheck,
  Tag,
  Download,
  Copy,
  Check,
  FileText,
  FileCode2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useExternalResearch } from "@/hooks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ExternalResearchDetailPage() {
  const params = useParams();
  const idParam = params.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [citationFormat, setCitationFormat] = useState("apa");

  const { data: item, isLoading } = useExternalResearch(id);

  const authorList = item?.authors ?? "Unknown author";
  const authorParts = authorList.trim().split(/\s+/).filter(Boolean);
  const primaryAuthor = authorParts[0] || "Unknown";
  const familyName = authorParts[authorParts.length - 1] || "Unknown";
  const publicationYear = item?.year || "n.d.";
  const publicationTitle = item?.title || "Untitled research";
  const sourceName = item?.institution || "External Research Archive";
  const abstractText =
    item?.abstract ||
    item?.citation ||
    "No abstract was provided for this record.";
  const citationValue =
    item?.citation ||
    `${familyName}, ${primaryAuthor[0] || "U"}. (${publicationYear}). ${publicationTitle}. ${sourceName}.`;

  if (isLoading) {
    return (
      <PageContainer title="Loading...">
        <div className="text-center py-16">Loading...</div>
      </PageContainer>
    );
  }

  if (!item) {
    return (
      <PageContainer title="Research Entry Not Found">
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-bold text-foreground">
            Entry Not Found
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            The requested external research record does not exist or has been
            removed.
          </p>
          <Button asChild className="mt-6">
            <Link href="/research/external-research">
              Back to External Research
            </Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  // Citation formatting APA, MLA, BibTeX
  const citations = {
    apa: citationValue,
    mla: `${familyName}, ${primaryAuthor[0]}. "${publicationTitle}." Journal of Health Policy and Evidence, vol. 12, no. 1, ${publicationYear}, pp. 34-48.`,
    bibtex: `@article{ext_${String(item.id).toLowerCase().replace(/-/g, "_")},\n  author = {${authorList}},\n  title = {${publicationTitle}},\n  journal = {Journal of Health Policy and Evidence},\n  year = {${publicationYear}},\n  volume = {12},\n  number = {1},\n  pages = {34--48},\n  publisher = {${sourceName}}\n}`,
  };

  const handleCopyCitation = () => {
    const textToCopy =
      citations[citationFormat as keyof typeof citations] || "";
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success("Citation copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PageContainer
      title={item.title}
      description={`External Archive Reference: ${item.id}`}
    >
      <div className="space-y-6">
        {/* Navigation Action */}
        <div className="flex items-center justify-between">
          <Button asChild variant="outline" className="shadow-sm bg-white">
            <Link href="/research/external-research">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to External Research
            </Link>
          </Button>

          <Badge
            variant="outline"
            className="px-3 py-1 font-bold uppercase tracking-wider text-primary border-primary/20"
          >
            Ingested Evidence
          </Badge>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* LEFT COLUMN: Narrative Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Details Card */}
            <Card className="border border-muted-foreground/10 shadow-sm bg-white overflow-hidden rounded-[1.5rem]">
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                  <Tag className="h-3.5 w-3.5" />
                  {item.keywords}
                </div>

                <h1 className="text-xl md:text-2xl font-bold leading-snug text-slate-900">
                  {item.title}
                </h1>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold text-sm">
                      {item.authors.split(" ").pop()?.[0]}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Author(s)
                      </span>
                      <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                        {item.authors}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Publisher / Source
                      </span>
                      <span className="text-xs font-semibold text-slate-900 mt-0.5 block">
                        {item.institution}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Year Ingested
                      </span>
                      <span className="text-xs font-semibold text-slate-900 mt-0.5 block">
                        {item.year}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Core Narrative / Abstract */}
            <Card className="border border-muted-foreground/10 shadow-sm bg-white overflow-hidden rounded-[1.5rem]">
              <CardHeader className="border-b pb-4 p-6 md:p-8">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                  <FileText className="h-5 w-5 text-primary" />
                  Research Narrative & Abstract
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-6">
                <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                  {abstractText}
                </p>

              </CardContent>
            </Card>

            {/* Evidence Grade Callout Box */}
            <Card
              className={cn(
                "border shadow-sm overflow-hidden rounded-[1.5rem]",
                item.grade === "good"
                  ? "border-emerald-200/50 bg-emerald-50/[0.15]"
                  : "border-rose-200/50 bg-rose-50/[0.15]",
              )}
            >
              <CardContent className="p-6 md:p-8 flex gap-4 items-start">
                {item.grade === "good" ? (
                  <>
                    <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600 shrink-0">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-emerald-800 uppercase tracking-tight">
                        Verified Evidence Standard
                      </h4>
                      <p className="text-xs leading-relaxed text-emerald-700/90 font-medium">
                        This document has been graded as reliable national
                        policymaking evidence. The datasets follow sound
                        empirical controls.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-rose-100 rounded-2xl text-rose-600 shrink-0">
                      <XCircle className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-rose-800 uppercase tracking-tight">
                        Evidence Warning standard
                      </h4>
                      <p className="text-xs leading-relaxed text-rose-700/90 font-medium">
                        This research dataset contains critical caveats or
                        inadequate validation frameworks. Should be cited with
                        appropriate constraints.
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Citation & Files */}
          <div className="space-y-6">
            {/* Spec Card */}
            <Card className="border border-muted-foreground/10 shadow-sm bg-white overflow-hidden rounded-[1.5rem]">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Archive Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Evidence Standing
                  </span>
                  {item.grade === "good" ? (
                    <Badge
                      variant="secondary"
                      className="bg-emerald-50 text-emerald-700 border-emerald-200/40 font-bold text-[10px] px-2.5"
                    >
                      Good Grade
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="bg-rose-50 text-rose-700 border-rose-200/40 font-bold text-[10px] px-2.5"
                    >
                      Poor Grade
                    </Badge>
                  )}
                </div>

                <div className="flex justify-between items-center py-1 border-t border-slate-50">
                  <span className="text-xs font-medium text-muted-foreground">
                    Format
                  </span>
                  <Badge
                    variant="secondary"
                    className="bg-slate-100 text-slate-700 font-semibold text-[10px] px-2.5"
                  >
                    {item.type}
                  </Badge>
                </div>

                <div className="flex justify-between items-center py-1 border-t border-slate-50">
                  <span className="text-xs font-medium text-muted-foreground">
                    Catalog Reference
                  </span>
                  <span className="font-mono text-[10px] font-bold text-slate-700">
                    {item.id}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Citation Panel */}
            <Card className="border border-muted-foreground/10 shadow-sm bg-white overflow-hidden rounded-[1.5rem]">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <FileCode2 className="h-4 w-4 text-primary" />
                  Citation Builder
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <Tabs
                  value={citationFormat}
                  onValueChange={setCitationFormat}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-3 h-9 bg-slate-100 rounded-lg p-0.5">
                    <TabsTrigger
                      value="apa"
                      className="text-[10px] font-bold uppercase py-1 px-2"
                    >
                      APA
                    </TabsTrigger>
                    <TabsTrigger
                      value="mla"
                      className="text-[10px] font-bold uppercase py-1 px-2"
                    >
                      MLA
                    </TabsTrigger>
                    <TabsTrigger
                      value="bibtex"
                      className="text-[10px] font-bold uppercase py-1 px-2"
                    >
                      BibTeX
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-3">
                    <div className="p-3 bg-slate-50 border rounded-xl font-mono text-[10px] leading-relaxed text-slate-700 select-all max-h-[140px] overflow-y-auto whitespace-pre-wrap">
                      {citations[citationFormat as keyof typeof citations]}
                    </div>
                  </div>
                </Tabs>

                <Button
                  onClick={handleCopyCitation}
                  variant="outline"
                  className="w-full h-10 text-xs font-bold uppercase tracking-wider bg-white shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4 text-emerald-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Citation
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Supporting Document */}
            <Card className="border border-muted-foreground/10 shadow-md bg-white overflow-hidden rounded-[1.5rem]">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Document Access
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-3 border rounded-xl hover:bg-slate-50/50 transition-colors">
                  <div className="p-2.5 bg-primary/10 rounded-lg text-primary shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {item.id}_Source_Material.pdf
                    </p>
                    <p className="text-[10px] text-muted-foreground">3.2 MB</p>
                  </div>
                </div>

                <Button className="w-full h-11 text-xs font-bold uppercase tracking-wider text-white bg-primary hover:bg-primary/95">
                  <Download className="mr-2 h-4 w-4" />
                  Download Document
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
