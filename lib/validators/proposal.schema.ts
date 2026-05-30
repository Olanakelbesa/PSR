export { proposalSchema as proposalFormSchema } from "@/lib/validations";

export interface ProposalFormInput {
  title?: string;
  abstract?: string;
  keywords?: string;
  startDate?: Date;
  endDate?: Date;
  budgetRequested?: number;
  proposalType?: string;
  subProposalTypeId?: string;
  grantCallId?: string;
  submissionLevel?: string;
  officeToSubmit?: string;
  receivingOffice?: string;
  thematicArea?: string;
  thematicAreas?: string[];
  subThematicArea?: string;
  teamMembers?: any[];
  stakeholders?: any[];
  proposalFile?: unknown;
  supportingDocs?: unknown;
  technicalProposal?: unknown;
  budgetFile?: unknown;
  signature?: unknown;
  submissionType?: "on_site" | "document_upload";
  hasStakeholder?: boolean;
  organizationName?: string;
  stakeholderName?: string;
  position?: string;
  phoneNumber?: string;
  customSections?: unknown[];
  sectionConfig?: unknown[];
  [key: string]: unknown;
}
