"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

import { fundingRecommendationsService } from "@/api/services/funding-recommendations.service";
import {
  downloadAgreementFromData,
  downloadAwardLetterFromData,
  downloadFundingRecommendationAgreementPdf,
  downloadFundingRecommendationAwardPdf,
} from "@/lib/documents/funding-recommendation-pdf";
import type { FundingRecommendation } from "@/types/funding-recommendation";

export type FundingRecommendationDocumentType = "award" | "agreement";

type DownloadOptions = {
  recommendationId?: string;
  recommendation?: FundingRecommendation;
  context?: Record<string, unknown> | null;
};

export function useFundingRecommendationDocumentDownload() {
  const [active, setActive] = useState<FundingRecommendationDocumentType | null>(
    null,
  );

  const download = useCallback(async (
    type: FundingRecommendationDocumentType,
    options: DownloadOptions,
  ) => {
    setActive(type);

    try {
      const recommendationId =
        options.recommendationId ??
        (options.recommendation ? String(options.recommendation.id) : undefined);

      if (!recommendationId) {
        throw new Error("Recommendation id is required.");
      }

      // Primary path: fetch fully-resolved document data from the backend
      // (keyed on the funding recommendation id).
      try {
        if (type === "award") {
          const data =
            await fundingRecommendationsService.getAwardLetterData(recommendationId);
          await downloadAwardLetterFromData(data, data.refNo);
          toast.success("Award letter downloaded");
        } else {
          const data =
            await fundingRecommendationsService.getAgreementData(recommendationId);
          await downloadAgreementFromData(data);
          toast.success("Agreement downloaded");
        }
        return;
      } catch (backendError) {
        console.warn(
          "Backend document data unavailable, falling back to client mapping:",
          backendError,
        );
      }

      // Fallback: build the document client-side from the recommendation +
      // screening candidate context (legacy behaviour).
      let recommendation = options.recommendation;
      let context = options.context ?? null;

      if (!recommendation) {
        recommendation = await fundingRecommendationsService.retrieve(
          recommendationId,
        );
      }

      if (!context) {
        const fundingDecisionId =
          recommendation.readyForFundingId ?? recommendation.ready_for_funding_id ?? recommendation.proposal;

        if (fundingDecisionId) {
          const candidateResponse =
            await fundingRecommendationsService.listCandidates({
              limit: 1,
              funding_decision_id: fundingDecisionId,
            });
          context = (candidateResponse.data?.[0] ?? null) as unknown as Record<
            string,
            unknown
          > | null;
        }
      }

      if (type === "award") {
        await downloadFundingRecommendationAwardPdf(recommendation, context);
        toast.success("Award letter downloaded");
      } else {
        await downloadFundingRecommendationAgreementPdf(recommendation, context);
        toast.success("Agreement downloaded");
      }
    } catch (error) {
      console.error("PDF download failed:", error);
      toast.error("Failed to generate PDF", {
        description: "Check the recommendation data and try again.",
      });
    } finally {
      setActive(null);
    }
  }, []);

  return { download, active, isDownloading: active !== null };
}
