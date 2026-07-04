// ============================================================================
// RPDMS Validation Schemas
// ============================================================================

import { z } from "zod";
import { MAX_FILE_SIZE } from "@/lib/constants";
import { isConceptNoteAllowedAttachment } from "@/lib/utils/concept-note-attachments";

// ============================================================================
// Authentication Schemas
// ============================================================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Sentinel value used by selects when the user picks "Other (not listed)" and
// fills in a free-text value instead of choosing an existing record.
export const OTHER_OPTION = "__other__";

export const registerSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    middleName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email("Please enter a valid email address"),
    phone: z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .regex(/^\+?[0-9]+$/, "Please enter a valid phone number"),
    sex: z.union([z.literal("Male"), z.literal("Female"), z.literal("")]),
    organizationType: z.string().min(1, "Organization type is required"),
    organizationTypeOther: z.string().optional(),
    organization: z.string().min(1, "Organization is required"),
    organizationOther: z.string().optional(),
    unit: z.string().min(1, "Unit/Department is required"),
    unitOther: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .superRefine((data, ctx) => {
    if (data.sex !== "Male" && data.sex !== "Female") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select sex",
        path: ["sex"],
      });
    }
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
    if (
      data.organizationType === OTHER_OPTION &&
      !data.organizationTypeOther?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please enter your organization type",
        path: ["organizationTypeOther"],
      });
    }
    if (data.organization === OTHER_OPTION && !data.organizationOther?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please enter your organization name",
        path: ["organizationOther"],
      });
    }
    if (data.unit === OTHER_OPTION && !data.unitOther?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please enter your unit / department",
        path: ["unitOther"],
      });
    }
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
});

export type OTPFormData = z.infer<typeof otpSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from your current password",
    path: ["newPassword"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// ============================================================================
// User Schemas
// ============================================================================

export const userSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  firstName: z
    .string()
    .min(1, "First name is required")
    .min(2, "First name must be at least 2 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .min(2, "Last name must be at least 2 characters"),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\+?[0-9]{10,15}$/.test(val),
      "Please enter a valid phone number",
    ),
  role: z.enum([
    "system_admin",
    "psr_officer",
    "leo_officer",
    "researcher",
    "roc_reviewer",
    "director",
    "institutional_partner",
  ]),
  institution: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  status: z.enum(["active", "inactive", "pending"]).default("active"),
});

export type UserFormData = z.infer<typeof userSchema>;

// ============================================================================
// Concept Note Schemas
// ============================================================================

export const conceptNoteSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(500, "Title must be less than 500 characters"),
  executiveSummary: z.string().min(1, "Executive summary is required"),
  documentType: z.number().min(1, "Document type is required"),
  organization: z.string().min(1, "Select an organization"),
  unit: z.string().optional(),
  strategicObjectives: z.array(z.string()).optional(),
  // thematicAreas removed from concept notes
  file: z
    .any()
    .refine(
      (file) => !file || typeof file === "string" || file instanceof File,
      "File must be a valid file object"
    )
    .refine(
      (file) =>
        !file ||
        typeof file === "string" ||
        (file instanceof File && file.size <= MAX_FILE_SIZE),
      "File size exceeds the maximum allowed size"
    )
    .refine(
      (file) =>
        !file ||
        typeof file === "string" ||
        (file instanceof File && isConceptNoteAllowedAttachment(file)),
      "Only PDF and Word (.doc, .docx) files are allowed",
    )
    .optional()
    .nullable(),
  documentCategory: z.enum(["new", "revision"], {
    errorMap: () => ({
      message: "Document category must be either new or revision",
    }),
  }),
});

export type ConceptNoteFormData = z.infer<typeof conceptNoteSchema>;

// ============================================================================
// Policy Document Schemas
// ============================================================================

export const policyDocumentSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .min(10, "Title must be at least 10 characters"),
  description: z.string().optional(),
  type: z.enum([
    "policy",
    "strategy",
    "guideline",
    "protocol",
    "standard",
    "directive",
  ]),
  category: z.string().min(1, "Category is required"),
});

export type PolicyDocumentFormData = z.infer<typeof policyDocumentSchema>;

// ============================================================================
// Call for Proposals Schemas
// ============================================================================

export const callForProposalSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title is required")
      .min(10, "Title must be at least 10 characters"),
    description: z
      .string()
      .min(1, "Description is required")
      .min(100, "Description must be at least 100 characters"),
    eligibilityCriteria: z
      .string()
      .min(1, "Eligibility criteria is required")
      .min(50, "Eligibility criteria must be at least 50 characters"),
    priorityAreas: z
      .array(z.string())
      .min(1, "Select at least one priority area"),
    budgetMin: z.number().min(0, "Minimum budget must be positive"),
    budgetMax: z.number().min(0, "Maximum budget must be positive"),
    submissionDeadline: z.string().min(1, "Submission deadline is required"),
    reviewDeadline: z.string().optional(),
    banner: z
      .instanceof(File)
      .optional()
      .refine(
        (file) => !file || file.type.startsWith("image/"),
        "Banner must be an image file",
      )
      .refine(
        (file) => !file || file.size <= 5 * 1024 * 1024,
        "Banner must be less than 5MB",
      ),
    poster: z
      .instanceof(File)
      .optional()
      .refine(
        (file) =>
          !file ||
          file.type.startsWith("image/") ||
          file.type === "application/pdf",
        "Poster must be an image or PDF file",
      )
      .refine(
        (file) => !file || file.size <= 10 * 1024 * 1024,
        "Poster must be less than 10MB",
      ),
  })
  .refine((data) => data.budgetMax >= data.budgetMin, {
    message: "Maximum budget must be greater than or equal to minimum budget",
    path: ["budgetMax"],
  });

export type CallForProposalFormData = z.infer<typeof callForProposalSchema>;

// ============================================================================
// Research Proposal Schemas
// ============================================================================

export const proposalBasicInfoSchema = z.object({
  callId: z.string().min(1, "Please select a call"),
  title: z
    .string()
    .min(1, "Title is required")
    .min(20, "Title must be at least 20 characters")
    .max(300, "Title must be less than 300 characters"),
  researchArea: z.string().min(1, "Research area is required"),
  institution: z.string().min(1, "Institution is required"),
});

export const proposalAbstractSchema = z.object({
  abstract: z
    .string()
    .min(1, "Abstract is required")
    .min(200, "Abstract must be at least 200 characters")
    .max(500, "Abstract must be less than 500 characters"),
  background: z
    .string()
    .min(1, "Background is required")
    .min(300, "Background must be at least 300 characters"),
  objectives: z
    .string()
    .min(1, "Objectives are required")
    .min(100, "Objectives must be at least 100 characters"),
});

export const proposalMethodologySchema = z.object({
  methodology: z
    .string()
    .min(1, "Methodology is required")
    .min(300, "Methodology must be at least 300 characters"),
  expectedOutcomes: z
    .string()
    .min(1, "Expected outcomes are required")
    .min(100, "Expected outcomes must be at least 100 characters"),
  ethicalConsiderations: z
    .string()
    .min(1, "Ethical considerations are required")
    .min(100, "Ethical considerations must be at least 100 characters"),
});

export const teamMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  role: z.enum(["co_pi", "researcher", "assistant"]),
  institution: z.string().min(1, "Institution is required"),
  expertise: z.string().min(1, "Expertise is required"),
});

export const budgetSchema = z.object({
  personnel: z.number().min(0),
  equipment: z.number().min(0),
  consumables: z.number().min(0),
  travel: z.number().min(0),
  other: z.number().min(0),
  justification: z.string().optional(),
});

export const timelineItemSchema = z.object({
  activity: z.string().min(1, "Activity is required"),
  startMonth: z.number().min(1).max(60),
  endMonth: z.number().min(1).max(60),
  deliverables: z.string().min(1, "Deliverables are required"),
});

export type ProposalBasicInfoFormData = z.infer<typeof proposalBasicInfoSchema>;
export type ProposalAbstractFormData = z.infer<typeof proposalAbstractSchema>;
export type ProposalMethodologyFormData = z.infer<
  typeof proposalMethodologySchema
>;
export type TeamMemberFormData = z.infer<typeof teamMemberSchema>;
export type BudgetFormData = z.infer<typeof budgetSchema>;
export type TimelineItemFormData = z.infer<typeof timelineItemSchema>;

export const proposalSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    abstract: z.string().min(1, "Abstract is required"),
    keywords: z.string().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    budgetRequested: z.number().optional(),
    proposalType: z.string().optional(),
    subProposalTypeId: z.string().optional(),
    grantCallId: z.string().optional(),
    submissionLevel: z.string().optional(),
    officeToSubmit: z.string().optional(),
    receivingOffice: z.string().min(1, "Receiving office is required"),
    thematicArea: z.string().optional(),
    thematicAreas: z.array(z.string()).optional(),
    subThematicArea: z.string().optional(),
    proposalFile: z.any().optional(),
    supportingDocs: z.any().optional(),
    technicalProposal: z.any().optional(),
    budgetFile: z.any().optional(),
    teamMembers: z.array(z.any()).optional(),
    stakeholders: z.array(z.any()).optional(),
    submissionType: z.enum(["on_site", "document_upload"]).optional(),
    hasStakeholder: z.boolean().optional(),
    organizationName: z.string().optional(),
    stakeholderName: z.string().optional(),
    position: z.string().optional(),
    phoneNumber: z.string().optional(),
    customSections: z.array(z.any()).optional(),
    sectionConfig: z.array(z.any()).optional(),
  })
  .passthrough();

export type ProposalFormData = z.infer<typeof proposalSchema>;

// ============================================================================
// Review Schemas
// ============================================================================

export const proposalReviewSchema = z.object({
  technicalMerit: z.number().min(0).max(25),
  methodology: z.number().min(0).max(25),
  feasibility: z.number().min(0).max(20),
  budget: z.number().min(0).max(15),
  impact: z.number().min(0).max(15),
  strengths: z.string().min(1, "Strengths are required").min(50),
  weaknesses: z.string().min(1, "Weaknesses are required").min(50),
  recommendation: z.enum(["approve", "revise", "reject"]),
  comments: z.string().optional(),
});

export type ProposalReviewFormData = z.infer<typeof proposalReviewSchema>;

export const proposalScreeningSchema = z.object({
  comments: z
    .string()
    .trim()
    .min(1, "Comments are required")
    .min(2, "Comments must be at least 2 characters"),
  recommendation: z.enum(["approve", "under_review", "reject"]),
  assignedReviewers: z.array(z.string()).optional(),
});

export type ProposalScreeningFormData = z.infer<typeof proposalScreeningSchema>;

export const fundingDecisionSchema = z.object({
  fundingDecision: z
    .string()
    .min(1, "Funding decision is required")
    .refine((value) => ["approved", "deferred", "rejected"].includes(value), {
      message: "Select a valid funding decision",
    }),
  requiresEthicalClearance: z
    .string()
    .min(1, "Ethical clearance requirement is required")
    .refine((value) => value === "yes" || value === "no", {
      message: "Select whether ethical clearance is required",
    }),
  committeeRemarks: z
    .string()
    .trim()
    .min(1, "Committee remarks are required"),
});

export type FundingDecisionFormData = z.infer<typeof fundingDecisionSchema>;

export const protocolUploadSchema = z.object({
  proposalId: z.string().min(1, "Proposal is required"),
  protocolFile: z
    .custom<File>((value) => value instanceof File, "Protocol file is required")
    .refine((file) => file.size > 0, "Protocol file is required"),
  otherDocument: z.custom<File | null | undefined>().optional(),
});

export type ProtocolUploadFormData = z.infer<typeof protocolUploadSchema>;

export const conceptNoteReviewSchema = z.object({
  comments: z.string().min(1, "Comments are required").min(50),
  recommendation: z.enum(["approve", "revise", "reject"]),
});

export type ConceptNoteReviewFormData = z.infer<typeof conceptNoteReviewSchema>;

// ============================================================================
// Progress Report Schema
// ============================================================================

export const progressReportSchema = z.object({
  reportingPeriod: z.string().min(1, "Reporting period is required"),
  activitiesCompleted: z
    .string()
    .min(1, "Activities completed is required")
    .min(100, "Please provide more detail"),
  challenges: z.string().min(1, "Challenges section is required"),
  nextSteps: z.string().min(1, "Next steps are required"),
  budgetSpent: z.number().min(0, "Budget spent must be positive"),
});

export type ProgressReportFormData = z.infer<typeof progressReportSchema>;

// ============================================================================
// Taxonomy Schemas
// ============================================================================

export const taxonomyItemSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  order: z.number().optional(),
  isActive: z.boolean().default(true),
});

export type TaxonomyItemFormData = z.infer<typeof taxonomyItemSchema>;

export const institutionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["government", "academic", "ngo", "private", "international"]),
  address: z.string().optional(),
  contactEmail: z
    .string()
    .email("Please enter a valid email")
    .optional()
    .or(z.literal("")),
  contactPhone: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type InstitutionFormData = z.infer<typeof institutionSchema>;
