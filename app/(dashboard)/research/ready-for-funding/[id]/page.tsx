"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  FileText,
  Download,
  CheckCircle2,
  Clock,
  BarChart3,
  Users,
  Wallet,
  DollarSign,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer } from "@/components/layout";
import { proposalsApi } from "@/lib/api/client";
import type { ResearchProposal } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { THEMATIC_AREAS } from "@/lib/constants";

export default function ReadyForFundingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [proposal, setProposal] = useState<ResearchProposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProposal() {
      try {
        const response = await proposalsApi.getById(id as string);
        if (response.success && response.data) {
          setProposal(response.data);
        } else {
          toast.error("Proposal not found");
          router.push("/research/ready-for-funding");
        }
      } catch {
        toast.error("Failed to load proposal");
      } finally {
        setIsLoading(false);
      }
    }
    loadProposal();
  }, [id, router]);

  if (isLoading) {
    return (
      <PageContainer title="Loading...">
        <div className="h-96 flex flex-col items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading proposal details...</p>
        </div>
      </PageContainer>
    );
  }

  if (!proposal) return null;

  return (
    <PageContainer
      title={proposal.title}
      description={`Reference: ${proposal.id.replace("prop-", "PRP-").toUpperCase()}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/research/ready-for-funding")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={() => router.push(`/research/ready-for-funding/${id}/approve`)}
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Funding Approval
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_350px]">
        <div className="space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0 gap-8">
              {["overview", "methodology", "budget"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-12 px-0 capitalize"
                >
                  {tab === "budget" ? "Budget & Team" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="pt-6 space-y-6">
              <Card className="shadow-sm border-primary/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Abstract & Background
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold mb-2">Abstract</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{proposal.abstract}</p>
                  </div>
                  <div className="pt-4 border-t border-dashed">
                    <h4 className="text-sm font-bold mb-2">Background & Rationale</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{proposal.background}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-primary/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Research Objectives
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{proposal.objectives}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="methodology" className="pt-6 space-y-6">
              <Card className="shadow-sm border-primary/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Methodology & Approach
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm text-muted-foreground leading-relaxed">{proposal.methodology}</p>
                  <div className="pt-4 border-t border-dashed">
                    <h4 className="text-sm font-bold mb-2">Ethical Considerations</h4>
                    <p className="text-sm text-muted-foreground italic">"{proposal.ethicalConsiderations}"</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="budget" className="pt-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-sm border-primary/5">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-emerald-600" />
                      Budget Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { label: "Personnel", value: proposal.budget.personnel },
                      { label: "Equipment", value: proposal.budget.equipment },
                      { label: "Travel & Fieldwork", value: proposal.budget.travel },
                      { label: "Consumables", value: proposal.budget.consumables },
                      { label: "Other", value: proposal.budget.other },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between py-2 border-b border-muted/30 last:border-0">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span className="text-sm font-bold">ETB {item.value?.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-3 mt-2 bg-emerald-50 rounded-lg px-3 border border-emerald-100">
                      <span className="text-sm font-black text-emerald-700 uppercase">Total</span>
                      <span className="text-base font-black text-emerald-700">ETB {proposal.budget.total?.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-primary/5">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Research Team
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 rounded-lg border border-primary/10 bg-primary/5 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-black">
                        {proposal.principalInvestigator.firstName[0]}{proposal.principalInvestigator.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{proposal.principalInvestigator.firstName} {proposal.principalInvestigator.lastName}</p>
                        <p className="text-[10px] text-primary font-bold uppercase">Principal Investigator</p>
                      </div>
                    </div>
                    {proposal.coInvestigators.map((m, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded border border-muted/50">
                        <div>
                          <p className="text-sm font-medium">{m.name}</p>
                          <p className="text-[10px] text-muted-foreground">{m.institution}</p>
                        </div>
                        <Badge variant="secondary" className="text-[9px] uppercase">{m.role.replace("_", " ")}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <CardHeader className="bg-primary text-white py-6 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-80">Proposal Status</p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <CheckCircle2 className="h-6 w-6" />
                <p className="text-xl font-black">Approved</p>
              </div>
              <p className="text-[10px] opacity-70 mt-1 uppercase tracking-wider">Ready for Funding Decision</p>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Reference</span>
                <span className="text-sm font-bold text-primary">{proposal.id.replace("prop-", "PRP-").toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Thematic Area</span>
                <Badge variant="outline" className="font-bold border-primary/20 text-xs">
                  {THEMATIC_AREAS.find(a => a.value === proposal.researchArea)?.label || proposal.researchArea}
                </Badge>
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <div className="text-xs">
                    <p className="font-bold text-foreground uppercase text-[9px]">Submitted</p>
                    <p className="font-medium">
                      {new Date(proposal.submittedAt || proposal.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/10">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Institution</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold">{proposal.institution}</p>
                  <p className="text-xs text-muted-foreground mt-1">Lead Research Institution</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/10">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Uploaded Documents</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {proposal.attachments.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground italic">No attachments</div>
              ) : proposal.attachments.map((file) => (
                <button key={file.id} className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b last:border-0 group">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-rose-500" />
                    <div className="text-left">
                      <p className="text-xs font-bold truncate max-w-[140px]">{file.name}</p>
                      <p className="text-[10px] text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                    </div>
                  </div>
                  <Download className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                </button>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
