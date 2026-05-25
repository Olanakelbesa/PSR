// ============================================================================
// PSR Platform — API Services Barrel Export
// ============================================================================
// Import services from here for a clean import path:
//   import { login, logout } from "@/api/services"

export * from "./auth.service";
export * from "./users.service";
export * from "./contact-us.service";
export * from "./concept-notes.service";
export * from "./reference.service";
export * from "./proposals.service";
export * from "./grants-projects.service";
export * from "./grant-calls.service";
export * from "./individual-reviews.service";
export * from "./progress-reports.service";
export {
  createScreening,
  assignReviewers,
  getAssignedReviewers,
  updateScreening,
  getScreenings,
  getScreeningById,
  findScreeningByProposal,
  ensureScreeningForProposal,
  getReviewHistory,
  ScreeningStatusSchema as ScreeningWorkflowStatusSchema,
} from "./screenings.service";
export type { Screening, ReviewHistory, ReviewHistoryEvent } from "./screenings.service";
export type { ScreeningStatus as ScreeningWorkflowStatus } from "./screenings.service";
export type { ScreeningStatus as ProposalScreeningStatus } from "./proposals.service";

export { ScreeningStatusSchema as ProposalScreeningStatusSchema } from "./proposals.service";
