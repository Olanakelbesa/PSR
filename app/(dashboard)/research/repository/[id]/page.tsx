"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Building2,
  User,
  BadgeCheck,
  Tag,
  Download,
  Globe,
  Copy,
  Check,
  FileText,
  FileCode2,
  TrendingUp,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockLibrary } from "../page";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ResearchRepositoryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [citationFormat, setCitationFormat] = useState("apa");

  const item = mockLibrary.find((x) => x.id === id);

  if (!item) {
    return (
      <PageContainer title="Research Not Found">
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-bold text-foreground">Publication Not Found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            The requested research catalog does not exist or has been archived.
          </p>
          <Button asChild className="mt-6">
            <Link href="/research/repository">Back to Repository</Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  // Citation generators based on paper metadata
  const citations = {
    apa: item.citation,
    mla: `${item.author.split(' ').pop()}, ${item.author.split(' ')[0]}. "${item.title}." Ethiopian Journal of Public Health, vol. 15, no. 2, 2023, pp. 112-124.`,
    bibtex: `@article{psr_${item.id.toLowerCase().replace(/-/g, '_')},\n  author = {${item.author}},\n  title = {${item.title}},\n  journal = {Ethiopian Journal of Public Health},\n  year = {${item.year}},\n  volume = {15},\n  number = {2},\n  pages = {112--124},\n  publisher = {PSR National Archive}\n}`,
  };

  const handleCopyCitation = () => {
    const textToCopy = citations[citationFormat as keyof typeof citations] || "";
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success("Citation copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PageContainer
      title={item.title}
      description={`National Archive Ref: ${item.id}`}
    >
      <div className="space-y-6">
        
        {/* Navigation Action */}
        <div className="flex items-center justify-between">
          <Button
            asChild
            variant="outline"
            className="shadow-sm bg-white"
          >
            <Link href="/research/repository">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Archive
            </Link>
          </Button>

          <Badge variant="outline" className="px-3 py-1 font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border-emerald-200/50">
            PSR Verified Findings
          </Badge>
        </div>

        {/* Content Workspace Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* LEFT COLUMN: Narrative details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Main Header Information Card */}
            <Card className="border border-muted-foreground/10 shadow-sm bg-white overflow-hidden rounded-[1.5rem]">
              <CardContent className="p-6 md:p-8 space-y-6">
                
                {/* Topic Area */}
                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                  <Tag className="h-3.5 w-3.5" />
                  {item.area} — {item.department}
                </div>

                {/* Title */}
                <h1 className="text-xl md:text-2xl font-bold leading-snug text-slate-900">
                  {item.title}
                </h1>

                {/* Author Block */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold text-sm">
                      {item.author.split(' ').pop()?.[0]}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Principal Investigator</span>
                      <span className="text-xs font-bold text-slate-900 mt-0.5 block">{item.author}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Research Institution</span>
                      <span className="text-xs font-semibold text-slate-900 mt-0.5 block">{item.institution}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Publication Year</span>
                      <span className="text-xs font-semibold text-slate-900 mt-0.5 block">{item.year}</span>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* Core Abstract Card */}
            <Card className="border border-muted-foreground/10 shadow-sm bg-white overflow-hidden rounded-[1.5rem]">
              <CardHeader className="border-b pb-4 p-6 md:p-8">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                  <FileText className="h-5 w-5 text-primary" />
                  Structured Abstract
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-6">
                <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                  {item.abstract}
                </p>

                {/* Methodology Detail */}
                <div className="space-y-2 border-t pt-5">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Methodology & Study Framework</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.methodology}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Institutional Policy Impact Card */}
            <Card className="border border-emerald-200/50 bg-emerald-50/[0.15] shadow-sm overflow-hidden rounded-[1.5rem]">
              <CardContent className="p-6 md:p-8 flex gap-4 items-start">
                <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600 shrink-0">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-emerald-800 uppercase tracking-tight">Policy & National Practice Impact</h4>
                  <p className="text-xs leading-relaxed text-emerald-700/90 font-medium">
                    {item.impact}
                  </p>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* RIGHT COLUMN: Metadata details, citation, & files */}
          <div className="space-y-6">
            
            {/* Publication Specs Card */}
            <Card className="border border-muted-foreground/10 shadow-sm bg-white overflow-hidden rounded-[1.5rem]">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Publication Specs</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs font-medium text-muted-foreground">PSR Review Quality</span>
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200/40 font-bold text-[10px] px-2.5">
                    {item.grade} Grade
                  </Badge>
                </div>

                <div className="flex justify-between items-center py-1 border-t border-slate-50">
                  <span className="text-xs font-medium text-muted-foreground">Document Format</span>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-semibold text-[10px] px-2.5">
                    {item.type}
                  </Badge>
                </div>

                <div className="flex justify-between items-center py-1 border-t border-slate-50">
                  <span className="text-xs font-medium text-muted-foreground">Peer Reviewed</span>
                  <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                    <BadgeCheck className="h-4 w-4 shrink-0" />
                    Verified
                  </div>
                </div>

                <div className="flex justify-between items-center py-1 border-t border-slate-50">
                  <span className="text-xs font-medium text-muted-foreground">Catalog Reference</span>
                  <span className="font-mono text-[10px] font-bold text-slate-700">{item.id}</span>
                </div>
              </CardContent>
            </Card>

            {/* Citations Panel */}
            <Card className="border border-muted-foreground/10 shadow-sm bg-white overflow-hidden rounded-[1.5rem]">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <FileCode2 className="h-4 w-4 text-primary" />
                  Citation Builder
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <Tabs value={citationFormat} onValueChange={setCitationFormat} className="w-full">
                  <TabsList className="grid grid-cols-3 h-9 bg-slate-100 rounded-lg p-0.5">
                    <TabsTrigger value="apa" className="text-[10px] font-bold uppercase py-1 px-2">APA</TabsTrigger>
                    <TabsTrigger value="mla" className="text-[10px] font-bold uppercase py-1 px-2">MLA</TabsTrigger>
                    <TabsTrigger value="bibtex" className="text-[10px] font-bold uppercase py-1 px-2">BibTeX</TabsTrigger>
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

            {/* Supporting Document Access */}
            <Card className="border border-muted-foreground/10 shadow-md bg-white overflow-hidden rounded-[1.5rem]">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Document Access</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-3 border rounded-xl hover:bg-slate-50/50 transition-colors">
                  <div className="p-2.5 bg-primary/10 rounded-lg text-primary shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {item.id}_Complete_Findings.pdf
                    </p>
                    <p className="text-[10px] text-muted-foreground">4.8 MB</p>
                  </div>
                </div>

                <Button className="w-full h-11 text-xs font-bold uppercase tracking-wider text-white bg-primary hover:bg-primary/95">
                  <Download className="mr-2 h-4 w-4" />
                  Download Full Report
                </Button>
              </CardContent>
            </Card>

          </div>

        </div>
      </div>
    </PageContainer>
  );
}
