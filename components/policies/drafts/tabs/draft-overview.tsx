"use client";

import { FileText, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DraftOverviewProps {
  executiveSummary: string;
  metadata?: any;
  mode?: "draft" | "repository";
}

export function DraftOverview({ executiveSummary, metadata, mode }: DraftOverviewProps) {
  const isRepository = mode === "repository";

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-primary/10">
        <CardHeader className="border-b bg-muted/30 pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> {isRepository ? "Policy Description" : "Executive Summary"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {executiveSummary}
          </p>
        </CardContent>
      </Card>

      {isRepository && metadata && (
        <>
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <CardTitle className="text-base">Registry Metadata</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <dl className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Serial Number", value: metadata.serialNumber },
                  { label: "Version Code", value: metadata.versionCode },
                  { label: "Document Type", value: metadata.type },
                  { label: "Source Draft", value: metadata.sourceDraft },
                  { label: "Approval Date", value: metadata.approvalDate },
                  { label: "Effective Date", value: metadata.effectiveDate },
                  { label: "Operational Period", value: metadata.operationalPeriod },
                  { label: "Next Review Date", value: metadata.nextReviewDate },
                ].map((item) => (
                  <div key={item.label} className="space-y-1">
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.label}</dt>
                    <dd className="text-sm font-semibold font-mono">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" /> Thematic Areas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 flex flex-wrap gap-2">
              {metadata.thematicAreas?.map((area: string) => (
                <Badge key={area} variant="secondary" className="px-3 py-1 text-sm">{area}</Badge>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
