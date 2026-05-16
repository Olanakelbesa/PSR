// ============================================================================
// PSR Platform Validation Schemas
// ============================================================================

import { z } from "zod";

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

export const registerSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    middleName: z.string().optional(),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .regex(/^\+?[0-9]+$/, "Please enter a valid phone number"),
    sex: z.enum(["Male", "Female"]),
    organizationType: z.string().min(1, "Organization type is required"),
    organization: z.string().min(1, "Organization is required"),
    unit: z.string().min(1, "Unit/Department is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
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

export const conceptNoteSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(500, "Title must be less than 500 characters"),
    executiveSummary: z
      .string()
      .min(1, "Executive summary is required")
      .max(1500, "Executive summary must not exceed 250 words"),
    documentType: z.string().min(1, "Document type is required"),
    organization: z
      .array(z.string())
      .min(1, "Select at least one organization"),
    universities: z.array(z.string()).optional(),
    thematicAreas: z
      .array(z.string())
      .min(1, "At least one thematic area is required"),
    file: z
      .instanceof(File)
      .refine(
        (file) => file.size <= 10 * 1024 * 1024,
        "File size must be less than 10MB",
      )
      .refine(
        (file) =>
          [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
          ].includes(file.type),
        "File must be a PDF, DOC, DOCX, or TXT file",
      ),
    documentCategory: z.enum(["new", "revision"], {
      errorMap: () => ({
        message: "Document category must be either new or revision",
      }),
    }),
  })
  .refine(
    (data) =>
      !data.organization.includes("University") ||
      (data.universities?.length || 0) > 0,
    {
      message: "Select at least one university when University is chosen",
      path: ["universities"],
    },
  );

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
        "Banner must be an image file"
      )
      .refine(
        (file) => !file || file.size <= 5 * 1024 * 1024,
        "Banner must be less than 5MB"
      ),
    poster: z
      .instanceof(File)
      .optional()
      .refine(
        (file) => !file || file.type.startsWith("image/") || file.type === "application/pdf",
        "Poster must be an image or PDF file"
      )
      .refine(
        (file) => !file || file.size <= 10 * 1024 * 1024,
        "Poster must be less than 10MB"
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

export const proposalSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .min(10, "Title must be at least 10 characters")
    .max(300, "Title must be less than 300 characters"),
  abstract: z
    .string()
    .min(1, "Abstract is required")
    .max(2000, "Abstract is too long"),
  background: z
    .string()
    .min(1, "Background is required")
    .min(100, "Background must be at least 100 characters"),
  objectives: z
    .string()
    .min(1, "Objectives are required")
    .min(50, "Objectives must be at least 50 characters"),
  methodology: z
    .string()
    .min(1, "Methodology is required")
    .min(100, "Methodology must be at least 100 characters"),
  expectedOutcomes: z
    .string()
    .min(1, "Expected outcomes are required")
    .min(50, "Expected outcomes must be at least 50 characters"),
  thematicArea: z.string().min(1, "Thematic area is required"),
  studyType: z.string().min(1, "Study type is required"),
  studyRegions: z.array(z.string()).optional(),
  budget: z.number().min(0, "Budget must be a positive number"),
  duration: z.number().min(1, "Duration must be at least 1 month"),
});

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
  comments: z.string().min(1, "Comments are required").min(10),
  recommendation: z.enum(["approve", "revise", "reject"]),
  assignedReviewers: z.array(z.string()).optional(),
});

export type ProposalScreeningFormData = z.infer<typeof proposalScreeningSchema>;

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
