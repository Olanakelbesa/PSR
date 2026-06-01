"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useFundingRecommendation } from "@/hooks";
import { fundingRecommendationRoutes } from "@/lib/routes/funding-recommendations";

type FundingRecommendationDocumentWorkspaceProps = {
  recommendationId: string;
  title: string;
  description: string;
  children: (context: {
    proposalTitle: string;
    referenceNumber: string;
  }) => ReactNode;
};

export function FundingRecommendationDocumentWorkspace({
  recommendationId,
  title,
  description,
  children,
}: FundingRecommendationDocumentWorkspaceProps) {
  const router = useRouter();
  const routes = fundingRecommendationRoutes(recommendationId);

  const {
    data: recommendation,
    isLoading,
    isError,
    refetch,
  } = useFundingRecommendation(recommendationId);

  const proposalTitle =
    recommendation?.proposal_title ||
    recommendation?.proposalTitle ||
    "Untitled Proposal";

  const referenceNumber =
    recommendation?.reference_number ||
    recommendation?.referenceNumber ||
    `FR-${recommendation?.id ?? recommendationId}`;

  if (isLoading) {
    return (
      <PageContainer title="Loading...">
        <div className="flex h-96 flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading recommendation...</p>
        </div>
      </PageContainer>
    );
  }

  if (isError || !recommendation) {
    return (
      <PageContainer title="Error">
        <Card className="mx-auto my-12 max-w-2xl border-rose-200 bg-rose-50/40 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-14 text-center">
            <div className="rounded-full bg-rose-100 p-4 text-rose-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <p className="text-lg font-semibold">
              Unable to load this funding recommendation.
            </p>
            <div className="mt-2 flex gap-3">
              <Button variant="outline" onClick={() => router.push(routes.list)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to List
              </Button>
              <Button onClick={() => void refetch()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={title}
      description={description}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => router.push(routes.detail)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Details
          </Button>
          <Button variant="outline" onClick={() => router.push(routes.list)}>
            All Recommendations
          </Button>
        </div>
      }
    >
      <div className="mb-6 rounded-xl border bg-muted/30 px-4 py-3">
        <p className="text-sm font-semibold text-foreground">{proposalTitle}</p>
        <p className="text-xs text-muted-foreground">Ref: {referenceNumber}</p>
      </div>
      {children({ proposalTitle, referenceNumber })}
    </PageContainer>
  );
}
