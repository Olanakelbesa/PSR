"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import type { ProposalFormInput } from "@/lib/validators/proposal.schema";
import { HtmlContentRenderer } from "./HtmlContentRenderer";
import { toast } from "sonner";
import SignaturePad from "@/components/signature-pad";
import { useProposalTemplateSections } from "@/lib/queries/proposal-template-section";
import { useGrantCall } from "@/lib/queries/grant-calls";
import { useProposalType } from "@/lib/queries/proposal-type";
import { useSubCallType } from "@/lib/queries/subcalltype";
import { useOffice } from "@/lib/queries/office";
import { useThematicArea } from "@/lib/queries/thematic-area";
import { useInternalUsers } from "@/lib/queries/internal-users";
import { useTeamMemberRoles } from "@/lib/queries/team-member-role";
import { CheckCircle2, Send, ChevronDown, ChevronUp } from "lucide-react";

// Helper function to format dates
const formatDate = (date: Date | undefined | null): string => {
  if (!date) return "Not provided";
  try {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "Invalid date";
  }
};

// Helper function to format currency
const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null) return "Not provided";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ETB",
  }).format(amount);
};

interface ProposalReviewStepProps {
  onSubmit: (status: "draft" | "submitted") => void;
  isSubmitting?: boolean;
  submittingAction?: "draft" | "submitted" | null;
  onPrevious: () => void;
  isEditMode?: boolean;
  isDraft?: boolean;
  isResubmitMode?: boolean;
}

type TeamMemberValue = {
  userId?: string;
  role?: string;
};

type StakeholderValue = {
  stakeholderName?: string;
  position?: string;
  organizationName?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
};

type SavedSignatureValue = {
  file?: string;
  name?: string;
};

function isSavedSignatureValue(value: unknown): value is SavedSignatureValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

import { resolveFileUrl } from "@/lib/utils/resolve-file-url";

function getSignatureUrl(value: unknown): string | undefined {
  if (value instanceof File) return undefined;
  if (typeof value === "string") return resolveFileUrl(value) ?? undefined;
  if (isSavedSignatureValue(value)) return resolveFileUrl(value.file) ?? undefined;
  return undefined;
}

function getSignatureLabel(value: unknown): string {
  if (value instanceof File) return value.name;
  if (isSavedSignatureValue(value)) {
    return value.name || value.file?.split("/").pop() || "Signature";
  }
  return "Signature";
}

type ProposalTemplateSection = {
  id: string | number;
  order: number;
  title?: string;
  label?: string;
};

export function ProposalReviewStep({
  onSubmit,
  isSubmitting = false,
  submittingAction = null,
  onPrevious,
  isEditMode = false,
  isDraft = false,
  isResubmitMode = false,
}: ProposalReviewStepProps) {
  const form = useFormContext<ProposalFormInput>();
  const values = form.watch() as ProposalFormInput;

  // Get all form values including unregistered fields
  const allFormValues = form.getValues();

  // Fetch sections filtered by proposal type (same source as ContentRenderer)
  const { data: sectionsData = [], isLoading: isLoadingSections } =
    useProposalTemplateSections({
      proposal_type: values.proposalType
        ? Number(values.proposalType)
        : undefined,
    });
  const allSections = sectionsData as ProposalTemplateSection[];

  // Fetch selected data from backend
  const { data: grantCallData } = useGrantCall(values.grantCallId || "");
  const selectedGrantCall = grantCallData;

  const { data: proposalTypeData } = useProposalType(values.proposalType || "");
  const selectedCallType = proposalTypeData;

  const { data: subCallTypeData } = useSubCallType(
    values.subProposalTypeId || "",
  );
  const selectedSubCallType = subCallTypeData;

  const { data: receivingOfficeData } = useOffice(values.receivingOffice || "");
  const selectedReceivingOffice = receivingOfficeData;

  const { data: thematicAreaData } = useThematicArea(values.thematicArea || "");
  const selectedThematicArea = thematicAreaData;

  // Fetch all users and roles for team members display
  // Fetch enough users to resolve the team-member display names already in the form.
  // If your organisation has >200 internal users, replace this with individual
  // useInternalUserById() calls per team member to avoid a large list fetch.
  const { data: allUsersData } = useInternalUsers({ limit: 200 });
  const { data: allRolesData } = useTeamMemberRoles({ limit: 100 });

  const users = (allUsersData ?? []) as Array<{
    id: string | number;
    fullName?: string;
  }>;
  const roles = (allRolesData ?? []) as Array<{
    id: string | number;
    name?: string;
  }>;

  const getUserDisplayName = (userId?: string) => {
    const matchedUser = users.find(
      (user) => String(user.id) === String(userId || ""),
    );
    return matchedUser?.fullName || userId || "Unknown User";
  };

  const getRoleDisplayName = (roleId?: string) => {
    const matchedRole = roles.find(
      (role) => String(role.id) === String(roleId || ""),
    );
    return matchedRole?.name || roleId || "Unknown Role";
  };

  const teamMembers = (values.teamMembers ?? []) as TeamMemberValue[];
  const stakeholders = (values.stakeholders ?? []) as StakeholderValue[];
  const hasTechnicalProposal = Boolean(values.technicalProposal);
  const hasBudgetFile = Boolean(values.budgetFile);

  // State to track expanded/collapsed sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(), // Start with all sections collapsed
  );

  // Toggle section expand/collapse
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const handleSubmit = async (
    e: React.MouseEvent<HTMLButtonElement>,
    status: "draft" | "submitted",
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // For submitted status, validate form before submitting
    // For draft status, skip validation
    if (status === "submitted") {
      const isValid = await form.trigger();
      if (!isValid) {
        console.error("Form validation failed", form.formState.errors);
        toast.error("Please fill in all required fields before submitting.");
        return;
      }
    }

    onSubmit(status);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-muted/50 p-4">
        <h3 className="mb-4 font-semibold">Review Your Proposal</h3>
        <p className="text-sm text-muted-foreground">
          Please review all information before submitting. Once submitted, you
          cannot edit the proposal.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Proposal Details Section */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">
                Proposal Title
              </label>
              <p className="text-sm font-medium">
                {values.title || "Not provided"}
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">
                Grant Call
              </label>
              <p className="text-sm">
                {selectedGrantCall?.title || "Not provided"}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">
                  Proposal Type
                </label>
                <p className="text-sm">
                  {selectedCallType?.name || "Not provided"}
                </p>
              </div>
              {values.subProposalTypeId && selectedSubCallType && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">
                    Proposal Sub Type
                  </label>
                  <p className="text-sm">{selectedSubCallType.name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Timeline Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">
                  Start Date
                </label>
                <p className="text-sm">{formatDate(values.startDate)}</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">
                  End Date
                </label>
                <p className="text-sm">{formatDate(values.endDate)}</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Financial & Submission Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">
                Submitted To
              </label>
              <p className="text-sm">
                {selectedReceivingOffice?.name || "Not provided"}
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">
                Thematic Area
              </label>
              <p className="text-sm">
                {selectedThematicArea?.name || "Not provided"}
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">
                Budget Requested
              </label>
              <p className="text-sm font-medium text-primary">
                {values.budgetRequested} ETB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Internal Members Column */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Members</h4>
              {teamMembers.length > 0 ? (
                <ul className="space-y-2">
                  {teamMembers.map((member, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>
                        {getUserDisplayName(member.userId)} -{" "}
                        {getRoleDisplayName(member.role)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No members added
                </p>
              )}
            </div>

            {/* External Stakeholders Column */}
            <div>
              <h4 className="text-sm font-semibold mb-3">
                External Stakeholders
              </h4>
              {stakeholders.length > 0 ? (
                <ul className="space-y-3">
                  {stakeholders.map((stakeholder, index) => (
                    <li
                      key={index}
                      className="text-sm space-y-1 border-l-2 pl-3"
                    >
                      <p className="font-medium">
                        {stakeholder.stakeholderName || "Unknown Stakeholder"}
                      </p>
                      <p className="text-muted-foreground">
                        {stakeholder.position || "Position not provided"} at{" "}
                        {stakeholder.organizationName ||
                          "Organization not provided"}
                      </p>
                      <p className="text-muted-foreground">
                        {stakeholder.email || "Email not provided"} |{" "}
                        {stakeholder.phoneNumber || "Phone not provided"}
                      </p>
                      {stakeholder.role && (
                        <p className="text-muted-foreground">
                          Role: {stakeholder.role}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No external stakeholders added
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Abstract</CardTitle>
        </CardHeader>
        <CardContent>
          <HtmlContentRenderer content={values.abstract} />
        </CardContent>
      </Card>

      {values.keywords && (
        <Card>
          <CardHeader>
            <CardTitle>Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{values.keywords}</p>
          </CardContent>
        </Card>
      )}

      {/* Dynamic Content Sections - Only for on_site submission */}
      {values.submissionType === "on_site" && (
        <Card>
          <CardHeader>
            <CardTitle>Proposal Sections</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingSections ? (
              <div className="px-6 pb-6">
                <p className="text-sm text-muted-foreground">
                  Loading sections...
                </p>
              </div>
            ) : allSections.length > 0 ? (
              <div className="divide-y divide-border">
                {allSections
                  .sort((a, b) => a.order - b.order)
                  .map((section) => {
                    const sectionIdStr = String(section.id);
                    // Try multiple ways to get content from form
                    // 1. From watched values (reactive)
                    // 2. From getValues (includes all registered fields)
                    const content =
                      (values as any)[sectionIdStr] ||
                      (allFormValues as any)[sectionIdStr] ||
                      "";

                    const hasContent =
                      content &&
                      typeof content === "string" &&
                      content.trim() !== "";

                    const isExpanded = expandedSections.has(
                      section.id.toString(),
                    );

                    return (
                      <div key={section.id}>
                        <div
                          className="px-6 py-4 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => toggleSection(section.id.toString())}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-semibold">
                                {section.title ||
                                  section.label ||
                                  "Untitled Section"}
                              </h3>
                              {!hasContent && (
                                <span className="text-xs text-muted-foreground italic">
                                  (Not filled)
                                </span>
                              )}
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="border-t border-border bg-muted/30">
                            <div className="px-6 py-4">
                              {hasContent ? (
                                <HtmlContentRenderer content={content} />
                              ) : (
                                <p className="text-sm text-muted-foreground italic">
                                  No content has been added to this section yet.
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="px-6 pb-6">
                <p className="text-sm text-muted-foreground">
                  No sections available for this proposal type.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {(hasTechnicalProposal || hasBudgetFile) && (
        <Card>
          <CardHeader>
            <CardTitle>Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasTechnicalProposal && (
              <div className="border rounded-md p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">
                    Proposal Document
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 ml-6">
                  {values.technicalProposal instanceof File
                    ? values.technicalProposal.name
                    : (values.technicalProposal as any)?.name ||
                      (values.technicalProposal as any)?.file
                        ?.split("/")
                        .pop() ||
                      "Proposal Document"}
                </p>
              </div>
            )}
            {hasBudgetFile && (
              <div className="border rounded-md p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Budget File</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 ml-6">
                  {values.budgetFile instanceof File
                    ? values.budgetFile.name
                    : (values.budgetFile as any)?.name ||
                      (values.budgetFile as any)?.file?.split("/").pop() ||
                      "Budget File"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Signature</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="signature"
            render={({ field }) => {
              const signatureValue = field.value;
              const signatureUrl = getSignatureUrl(signatureValue);
              const hasSavedSignature =
                signatureValue instanceof File || isSavedSignatureValue(signatureValue);
              return (
                <FormItem>
                  <div className="space-y-3 ">
                    <p className="text-sm text-muted-foreground">
                      Draw your signature below, then click Save Signature.
                    </p>

                    <SignaturePad
                      initialImageUrl={signatureUrl}
                      onSave={(file) => {
                        field.onChange(file);
                        form.setValue("signature", file, {
                          shouldValidate: true,
                        });
                      }}
                      onClear={() => {
                        field.onChange(undefined);
                        form.setValue("signature", undefined, {
                          shouldValidate: true,
                        });
                      }}
                    />

                    {hasSavedSignature && (
                      <div className="border rounded-md p-3">
                        <p className="font-medium text-sm">Saved Signature</p>
                        <p className="text-xs text-muted-foreground">
                          {getSignatureLabel(signatureValue)} (
                          {signatureValue instanceof File
                            ? (signatureValue.size / 1024).toFixed(1)
                            : "—"} KB)
                        </p>
                        {signatureUrl ? (
                          <div className="mt-3">
                            <img
                              src={signatureUrl}
                              alt="Saved signature"
                              className="max-h-40 rounded-md border"
                            />
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </CardContent>
      </Card>

      {/* Action Buttons Section */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={submittingAction !== null}
        >
          Previous
        </Button>
        <div className="flex gap-3">
          {!isResubmitMode && (
            <Button
              type="button"
              variant="outline"
              onClick={(e) => handleSubmit(e, "draft")}
              disabled={submittingAction !== null}
              size="lg"
              className="min-w-37.5"
            >
              {submittingAction === "draft" ? <span>Saving...</span> : <span>Save as Draft</span>}
            </Button>
          )}
          <Button
            type="button"
            onClick={(e) => handleSubmit(e, "submitted")}
            disabled={submittingAction !== null}
            size="lg"
            className="min-w-37.5"
          >
            {submittingAction === "submitted" ? (
              <>
                <span className="mr-2">
                  {isResubmitMode
                    ? "Resubmitting..."
                    : isEditMode && !isDraft
                      ? "Updating..."
                      : "Submitting..."}
                </span>
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {isResubmitMode
                  ? "Resubmit Proposal"
                  : isEditMode && !isDraft
                    ? "Update Proposal"
                    : "Submit Proposal"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
