"use client";

import { createElement } from "react";

import type { AwardData } from "@/components/document/AwardLetterPDF";
import type { ContractData } from "@/types/agriments";
import type {
  FundingRecommendation,
  FundingRecommendationPi,
} from "@/types/funding-recommendation";

const DEFAULT_ORGANIZATION =
  "ADDIS ABABA SCIENCE AND TECHNOLOGY UNIVERSITY";

function resolvePublicAsset(path: string) {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
  }
  return path;
}

function formatPdfDate(value?: string | Date | null) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

function piDisplayName(pi?: FundingRecommendationPi | string | null) {
  if (!pi) return "Principal Investigator";
  if (typeof pi === "string") return pi;
  return pi.full_name || pi.fullName || pi.email || "Principal Investigator";
}

function piEmail(pi?: FundingRecommendationPi | string | null) {
  if (!pi || typeof pi === "string") return "";
  return pi.email ?? "";
}

function readContextString(
  context: Record<string, unknown> | null | undefined,
  ...keys: string[]
) {
  if (!context) return undefined;

  for (const key of keys) {
    const value = context[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }

  return undefined;
}

function readNestedName(
  context: Record<string, unknown> | null | undefined,
  key: string,
) {
  const nested = context?.[key];
  if (nested && typeof nested === "object" && "name" in nested) {
    const name = (nested as { name?: string }).name;
    if (name?.trim()) return name.trim();
  }
  return undefined;
}

function formatAmount(value?: string | number | null) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount.toLocaleString() : "0";
}

function savePdfBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function sanitizeFilename(value: string) {
  return value.replace(/[^\w.-]+/g, "_").replace(/_+/g, "_");
}

export function mapFundingRecommendationToAwardData(
  recommendation: FundingRecommendation,
  context?: Record<string, unknown> | null,
): AwardData {
  const pi =
    recommendation.pi ||
    (context?.principalInvestigator as FundingRecommendationPi | string | undefined) ||
    (context?.principal_investigator as FundingRecommendationPi | string | undefined) ||
    (context?.pi as FundingRecommendationPi | string | undefined);

  const proposalTitle =
    recommendation.proposal_title ||
    recommendation.proposalTitle ||
    readContextString(context, "proposalTitle", "proposal_title") ||
    "Untitled Proposal";

  const referenceNumber =
    recommendation.reference_number ||
    recommendation.referenceNumber ||
    readContextString(context, "referenceNumber", "reference_number") ||
    `FR-${recommendation.id}`;

  const recommendedAt = (recommendation.recommendedAt ?? recommendation.recommended_at)
    ? new Date(recommendation.recommendedAt ?? recommendation.recommended_at)
    : new Date();
  const approvalEnd = addDays(recommendedAt, 365);
  const agreementDeadline = addDays(new Date(), 30);

  const totalAward = recommendation.totalAwardAmount ?? recommendation.total_award_amount;
  const amountWords =
    (recommendation.amountEnglishInWords ?? recommendation.amount_english_in_words)?.trim() ||
    formatAmount(totalAward);

  const organizationName =
    readNestedName(context, "organization") || DEFAULT_ORGANIZATION;
  const unitName = readNestedName(context, "unit");
  const proposalTypeName = readNestedName(context, "proposalType") ||
    readNestedName(context, "proposal_type");

  return {
    organization_name: organizationName,
    document_no: `VP/RCS/${recommendation.id}`,
    refNo: referenceNumber,
    date: formatPdfDate(new Date()),
    recipients: [piDisplayName(pi)],
    projectTitle: proposalTitle,
    approvalStart: formatPdfDate(recommendedAt),
    approvalEnd: formatPdfDate(approvalEnd),
    totalAmount: formatAmount(totalAward),
    percentageAmount: formatAmount(totalAward),
    percentageAmountWords: amountWords,
    percentage: "100",
    agreementDeadline: formatPdfDate(agreementDeadline),
    logoPath: resolvePublicAsset("/placeholder-logo.svg"),
    second_level_office_name_en:
      proposalTypeName || "Research and Technology Transfer",
    submitting_office_name_en: unitName || organizationName,
  };
}

export function mapFundingRecommendationToContractData(
  recommendation: FundingRecommendation,
  context?: Record<string, unknown> | null,
): ContractData {
  const pi =
    recommendation.pi ||
    (context?.principalInvestigator as FundingRecommendationPi | string | undefined) ||
    (context?.principal_investigator as FundingRecommendationPi | string | undefined) ||
    (context?.pi as FundingRecommendationPi | string | undefined);

  const proposalTitle =
    recommendation.proposal_title ||
    recommendation.proposalTitle ||
    readContextString(context, "proposalTitle", "proposal_title") ||
    "Untitled Proposal";

  const referenceNumber =
    recommendation.reference_number ||
    recommendation.referenceNumber ||
    readContextString(context, "referenceNumber", "reference_number") ||
    `FR-${recommendation.id}`;

  const now = new Date();
  const organizationName =
    readNestedName(context, "organization") || DEFAULT_ORGANIZATION;
  const unitName = readNestedName(context, "unit");

  return {
    organization_name: organizationName,
    logoPath: resolvePublicAsset("/placeholder-logo.svg"),
    document_no: `CONTRACT/${referenceNumber}`,
    issue_no: "01",
    principal_investigator: piDisplayName(pi),
    co_investigators: [],
    proposal_title: proposalTitle,
    project_duration_years: "1",
    college: unitName || "—",
    department: readNestedName(context, "proposalType") || "—",
    center_of_excellence: "—",
    email: piEmail(pi) || "—",
    phone: "—",
    approved_budget: formatAmount(recommendation.totalAwardAmount ?? recommendation.total_award_amount),
    approved_budget_words:
      (recommendation.amountEnglishInWords ?? recommendation.amount_english_in_words)?.trim() ||
      formatAmount(recommendation.totalAwardAmount ?? recommendation.total_award_amount),
    day: String(now.getDate()),
    month: now.toLocaleDateString("en-GB", { month: "long" }),
  };
}

export async function downloadFundingRecommendationAwardPdf(
  recommendation: FundingRecommendation,
  context?: Record<string, unknown> | null,
) {
  const { pdf } = await import("@react-pdf/renderer");
  const { default: AwardLetterPDF } = await import(
    "@/components/document/AwardLetterPDF"
  );
  const data = mapFundingRecommendationToAwardData(recommendation, context);
  const blob = await pdf(createElement(AwardLetterPDF, { data }) as any).toBlob();
  const ref = sanitizeFilename(
    recommendation.reference_number ||
      recommendation.referenceNumber ||
      `FR-${recommendation.id}`,
  );

  savePdfBlob(blob, `Award-Letter-${ref}.pdf`);
}

export async function downloadFundingRecommendationAgreementPdf(
  recommendation: FundingRecommendation,
  context?: Record<string, unknown> | null,
) {
  const { pdf } = await import("@react-pdf/renderer");
  const { default: ContractDocumentPDF } = await import(
    "@/components/document/ContractDocumentPDF"
  );
  const data = mapFundingRecommendationToContractData(recommendation, context);
  const blob = await pdf(createElement(ContractDocumentPDF, { data }) as any).toBlob();
  const ref = sanitizeFilename(
    recommendation.reference_number ||
      recommendation.referenceNumber ||
      `FR-${recommendation.id}`,
  );

  savePdfBlob(blob, `Agreement-${ref}.pdf`);
}
