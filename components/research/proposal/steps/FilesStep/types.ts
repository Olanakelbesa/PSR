export type SectionId =
  | "abstract"
  | "introduction"
  | "statementOfProblem"
  | "researchQuestions"
  | "researchObjectives"
  | "significanceOfStudy"
  | "scopeOfStudy"
  | "literatureReview"
  | "researchMethodology"
  | "conceptualFramework"
  | "workPlanTimeline"
  | "budget"
  | "references"
  | "appendices"
  | `custom-${string}`
  | string; // Allow numeric IDs from API

export interface Section {
  id: SectionId;
  label: string;
  order: number;
  isCustom?: boolean;
  originalId?: string; // For default sections
  description?: string;
  placeholder?: string;
}
