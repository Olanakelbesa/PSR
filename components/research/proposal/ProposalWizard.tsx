"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import * as React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  proposalFormSchema,
  type ProposalFormInput,
} from "@/lib/validators/proposal.schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProposalBasicInfoStep } from "./steps/BasicInfoStep";
import type { InitialGrantCallInfo } from "./steps/BasicInfoStep/GrantCallInformationSection";
import { ProposalTeamStep } from "./steps/TeamStep";
import { ProposalFilesStep } from "./steps/FilesStep";
import { ProposalBudgetStep } from "./steps/BudgetStep";
import { ProposalReviewStep } from "./steps/ReviewStep";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  useCreateProposal,
  useProposal,
  useUpdateProposal,
} from "@/lib/queries/proposals";
import type { Section } from "./steps/FilesStep/types";
import { useProposalTemplateSections } from "@/lib/queries/proposal-template-section";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { ProposalDetail } from "@/types";

interface ProposalWizardProps {
  grantCallId?: string;
  proposalId?: string;
}

type ExistingProposalTeamMember = {
  member_type?: "internal" | "external" | string;
  internal_member_user_id?: string | number | null;
  member_details?: { id?: string | number | null } | null;
  member?: string | number | { id?: string | number | null } | null;
  role?: string | number | { id?: string | number | null } | null;
  organization_name?: string | null;
  stakeholder_name?: string | null;
  position?: string | null;
  phone_number?: string | null;
  email?: string | null;
};

const steps = [
  { id: 1, label: "Basic Info" },
  { id: 2, label: "Team Members" },
  { id: 3, label: "Files" },
  { id: 4, label: "Budget" },
  { id: 5, label: "Review & Submit" },
];

/**
 * Build default values for form fields based on available sections
 */
function buildDefaultValuesFromSections(
  sections: Section[],
  grantCallId?: string,
): Partial<ProposalFormInput> {
  const defaults: Partial<ProposalFormInput> = {
    title: "",
    abstract: "",
    grantCallId: grantCallId || "",
    proposalType: "",
    subProposalTypeId: "",
    budgetRequested: undefined,
    submissionLevel: "",
    officeToSubmit: "",
    thematicArea: "",
    teamMembers: [],
    hasStakeholder: false,
    organizationName: "",
    stakeholderName: "",
    position: "",
    phoneNumber: "",
    keywords: "",
    customSections: [],
    sectionConfig: [],
    submissionType: "document_upload",
  };

  // Initialize section fields dynamically based on available sections
  sections.forEach((section) => {
    // Handle regular sections (single field)
    (defaults as any)[section.id] = "";
  });

  return defaults;
}

const serializeFormValues = (values: ProposalFormInput): string => {
  try {
    const clone = { ...values };
    if (clone.technicalProposal instanceof File) {
      clone.technicalProposal = {
        name: clone.technicalProposal.name,
        size: clone.technicalProposal.size,
      } as any;
    } else if (clone.technicalProposal) {
      clone.technicalProposal = String((clone.technicalProposal as any).name || (clone.technicalProposal as any).file || "");
    }
    if (clone.budgetFile instanceof File) {
      clone.budgetFile = {
        name: clone.budgetFile.name,
        size: clone.budgetFile.size,
      } as any;
    } else if (clone.budgetFile) {
      clone.budgetFile = String((clone.budgetFile as any).name || (clone.budgetFile as any).file || "");
    }
    if (clone.signature instanceof File) {
      clone.signature = {
        name: clone.signature.name,
        size: clone.signature.size,
      } as any;
    } else if (clone.signature) {
      clone.signature = String((clone.signature as any).name || (clone.signature as any).file || "");
    }
    return JSON.stringify(clone);
  } catch {
    return "";
  }
};

const buildProposalFormData = (values: ProposalFormInput): FormData => {
  const formData = new FormData();

  if (values.title) {
    formData.append("title", values.title);
  }
  if (values.abstract) {
    formData.append("abstract", values.abstract);
  }
  
  if (values.startDate) {
    try {
      const formattedStartDate = new Date(values.startDate).toISOString().split('T')[0];
      formData.append("start_date", formattedStartDate);
    } catch (e) {
      console.warn("Invalid start date", values.startDate);
    }
  }
  if (values.endDate) {
    try {
      const formattedEndDate = new Date(values.endDate).toISOString().split('T')[0];
      formData.append("end_date", formattedEndDate);
    } catch (e) {
      console.warn("Invalid end date", values.endDate);
    }
  }

  if (values.budgetRequested !== undefined && values.budgetRequested !== null) {
    formData.append("budget_requested", String(values.budgetRequested));
  }

  if (values.technicalProposal instanceof File) {
    formData.append("proposal_file", values.technicalProposal);
  }
  if (values.budgetFile instanceof File) {
    formData.append("supporting_docs", values.budgetFile);
  }
  if (values.signature instanceof File) {
    formData.append("signature", values.signature);
  }

  if (values.proposalType) {
    formData.append("proposal_type", String(parseInt(String(values.proposalType), 10)));
  }
  if (values.grantCallId) {
    formData.append("call", String(parseInt(String(values.grantCallId), 10)));
  }
  if (values.submissionLevel) {
    formData.append("Organization", String(parseInt(String(values.submissionLevel), 10)));
  }
  if (values.officeToSubmit) {
    formData.append("Unit", String(parseInt(String(values.officeToSubmit), 10)));
    formData.append("receiving_office", String(parseInt(String(values.officeToSubmit), 10)));
  }
  if (values.subThematicArea) {
    formData.append("sub_thematic_area", String(parseInt(String(values.subThematicArea), 10)));
  }

  if (values.keywords) {
    const keywordsArray = String(values.keywords)
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
    
    keywordsArray.forEach((kw) => {
      formData.append("keywords", kw);
    });
  }

  if (values.thematicArea) {
    const thematicAreaVal = parseInt(String(values.thematicArea), 10);
    if (!isNaN(thematicAreaVal)) {
      formData.append("thematic_areas", String(thematicAreaVal));
    }
  }

  const needsIrb = values.needsIrb ?? values.needs_irb;
  if (needsIrb !== undefined && needsIrb !== null) {
    formData.append("needs_irb", String(needsIrb));
  }

  if (Array.isArray(values.strategic_objectives)) {
    values.strategic_objectives.forEach((so) => {
      formData.append("strategic_objectives", String(parseInt(String(so), 10)));
    });
  }

  if (values.submissionType === "on_site") {
    const sectionResponses: Array<{ template_section: number; content: string }> = [];
    Object.keys(values).forEach((key) => {
      const isSectionId = /^\d+$/.test(key);
      if (isSectionId && values[key]) {
        sectionResponses.push({
          template_section: parseInt(key, 10),
          content: String(values[key]),
        });
      }
    });
    if (sectionResponses.length > 0) {
      formData.append("section_responses", JSON.stringify(sectionResponses));
    }
  }

  if (Array.isArray(values.teamMembers) && values.teamMembers.length > 0) {
    const formattedTeamMembers = values.teamMembers.map((tm: any) => ({
      member_type: "internal",
      internal_member_user_id: parseInt(String(tm.userId), 10),
      role: parseInt(String(tm.role), 10),
    }));
    formData.append("team_members_json", JSON.stringify(formattedTeamMembers));
  }

  if (Array.isArray(values.stakeholders) && values.stakeholders.length > 0) {
    const formattedStakeholders = values.stakeholders.map((sh: any) => ({
      member_type: "external",
      role: sh.role ? parseInt(String(sh.role), 10) : null,
      organization_name: sh.organizationName || "",
      stakeholder_name: sh.stakeholderName || "",
      position: sh.position || "",
      phone_number: sh.phoneNumber || "",
      email: sh.email || "",
    }));
    formData.append("stakeholders_json", JSON.stringify(formattedStakeholders));
  }

  return formData;
};

const hasRequiredFieldsForCreate = (values: ProposalFormInput): boolean => {
  return !!(
    values.title &&
    values.proposalType &&
    values.grantCallId &&
    values.submissionLevel &&
    values.officeToSubmit &&
    values.technicalProposal
  );
};

export function ProposalWizard({
  grantCallId,
  proposalId,
}: ProposalWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();
  const queryClient: any = {
    prefetchQuery: async <T,>({
      queryFn,
    }: {
      queryKey?: unknown;
      queryFn: () => Promise<T>;
    }) => queryFn(),
    ensureQueryData: async <T,>({
      queryFn,
    }: {
      queryKey?: unknown;
      queryFn: () => Promise<T>;
    }) => queryFn(),
  };
  const [activeProposalId, setActiveProposalId] = useState(() => {
    return (proposalId && proposalId !== "undefined") ? proposalId : "";
  });
  const [isSaving, setIsSaving] = useState(false);

  // Update activeProposalId if proposalId prop changes
  useEffect(() => {
    if (proposalId && proposalId !== "undefined") {
      setActiveProposalId(proposalId);
    }
  }, [proposalId]);

  const createProposalMutation = useCreateProposal();
  const updateProposalMutation = useUpdateProposal();
  const isSubmitting =
    createProposalMutation.isPending || updateProposalMutation.isPending || isSaving;

  // Fetch existing proposal if activeProposalId or proposalId is provided (edit mode)
  const queryProposalId = (activeProposalId && activeProposalId !== "undefined")
    ? activeProposalId
    : (proposalId && proposalId !== "undefined")
      ? proposalId
      : "";
  const proposalQuery = useProposal(queryProposalId);
  const existingProposal: any = proposalQuery.data;
  const isLoadingProposal = proposalQuery.isLoading;
  const proposalError = proposalQuery.error;

  // Fetch sections dynamically - initially without proposalType filter
  // Will refetch when proposalType is selected in the form
  const { data: sectionsData = [], isLoading: isLoadingSections } =
    useProposalTemplateSections();

  const initialDefaultValuesRef = useRef<Partial<ProposalFormInput> | null>(
    null,
  );
  const hasPopulatedFormRef = useRef(false);
  const currentProposalIdRef = useRef(proposalId);
  const isResettingRef = useRef(false);
  const mountedRef = useRef(true);
  const formDataRef = useRef<Partial<ProposalFormInput> | null>(null);
  const lastSavedDataRef = useRef<string>("");

  useEffect(() => {
    if (!proposalId || proposalId === "undefined") {
      lastSavedDataRef.current = serializeFormValues(form.getValues());
    }
  }, [proposalId]);


  // Reset population flag when proposalId changes
  useEffect(() => {
    if (proposalId !== currentProposalIdRef.current) {
      hasPopulatedFormRef.current = false;
      isResettingRef.current = false;
      formDataRef.current = null;
      currentProposalIdRef.current = proposalId;
    }
  }, [proposalId]);

  // Track mount status
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const form = useForm<ProposalFormInput>({
    resolver: zodResolver(proposalFormSchema),
    // defaultValues,
    mode: "onChange",
    shouldUnregister: false,
  });

  const watchedValues = form.watch();
  const serializedValues = serializeFormValues(watchedValues);

  useEffect(() => {
    if (isSaving || isResettingRef.current) return;
    if (serializedValues === lastSavedDataRef.current) return;

    const timer = setTimeout(async () => {
      let currentId = (activeProposalId && activeProposalId !== "undefined") ? activeProposalId : "";
      if (!currentId && proposalId && proposalId !== "undefined") {
        currentId = proposalId;
      }

      if (currentId) {
        // Auto-save PATCH
        setIsSaving(true);
        try {
          const formData = buildProposalFormData(watchedValues);
          await apiClient.patch(`/v1/proposals/${currentId}/`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          lastSavedDataRef.current = serializedValues;
        } catch (error) {
          console.error("Auto-save PATCH failed:", error);
        } finally {
          setIsSaving(false);
        }
      } else {
        // Check if required fields are filled for initial POST
        if (hasRequiredFieldsForCreate(watchedValues)) {
          setIsSaving(true);
          try {
            const formData = buildProposalFormData(watchedValues);
            const res = await apiClient.post("/v1/proposals/", formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            const rawId = res.data?.data?.id ?? res.data?.id;
            if (rawId) {
              const newId = String(rawId);
              setActiveProposalId(newId);

              // Update URL with ?edit=newId seamlessly without page reload
              const newUrl = `${window.location.pathname}?edit=${newId}`;
              window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, "", newUrl);

              lastSavedDataRef.current = serializedValues;
            }
          } catch (error) {
            console.error("Auto-save POST failed:", error);
          } finally {
            setIsSaving(false);
          }
        }
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [serializedValues, activeProposalId, proposalId, isSaving]);


  // Populate form with existing proposal data when in edit mode
  useEffect(() => {
    // Only populate once per proposal and if not already resetting
    if (
      existingProposal &&
      proposalId &&
      proposalId !== "undefined" &&
      !hasPopulatedFormRef.current &&
      !isResettingRef.current
    ) {
      const proposal = existingProposal.data || existingProposal;

      // If it's an on_site submission, wait for sectionsData to load so we can match responses by title
      // since the backend might not return the template section IDs directly in section_responses
      if (proposal.submission_type === "on_site" && isLoadingSections) {
        return;
      }

      // Mark as resetting to prevent multiple resets
      isResettingRef.current = true;
      hasPopulatedFormRef.current = true;

      // Map backend data to form fields
      // Store in ref to persist across re-renders
      const formData: Partial<ProposalFormInput> = {
        title: proposal.title || "",
        // Handle both old and new backend response formats
        grantCallId: proposal.grant_call?.id
          ? String(proposal.grant_call.id)
          : proposal.call && typeof proposal.call === "object"
            ? String((proposal.call as any)?.id ?? "")
            : proposal.call
              ? String(proposal.call)
              : "",
        proposalType: proposal.grant_call?.proposal_type?.id
          ? String(proposal.grant_call.proposal_type.id)
          : proposal.proposal_type &&
              typeof proposal.proposal_type === "object"
            ? String((proposal.proposal_type as any)?.id ?? "")
            : proposal.proposal_type
              ? String(proposal.proposal_type)
              : "",
        subProposalTypeId: proposal.grant_call?.sub_call_type?.id
          ? String(proposal.grant_call.sub_call_type.id)
          : proposal.subcall &&
              typeof proposal.subcall === "object"
            ? String((proposal.subcall as any)?.id ?? "")
            : proposal.subcall
              ? String(proposal.subcall)
              : "",
        // Handle nested dates object or flat structure
        startDate: proposal.dates?.start_date
          ? new Date(proposal.dates.start_date)
          : proposal.start_date
            ? new Date(proposal.start_date)
            : undefined,
        endDate: proposal.dates?.end_date
          ? new Date(proposal.dates.end_date)
          : proposal.end_date
            ? new Date(proposal.end_date)
            : undefined,
        // Handle nested budget object or flat structure
        budgetRequested: proposal.budget?.requested_amount
          ? Number(proposal.budget.requested_amount)
          : proposal.budget_requested
            ? Number(proposal.budget_requested)
            : undefined,

        // Handle submission_level - check root object, direct ID, or nested office_level
        submissionLevel: proposal.submitting_office?.office_level?.id
          ? String(proposal.submitting_office.office_level.id)
          : proposal.submission_level &&
              typeof proposal.submission_level === "object"
            ? String(proposal.submission_level.id)
            : proposal.submission_level
              ? String(proposal.submission_level)
              : "",

        // Handle officeToSubmit - check root object or direct ID
        officeToSubmit: proposal.submitting_office?.id
          ? String(proposal.submitting_office.id)
          : typeof proposal.submitting_office === "number"
            ? String(proposal.submitting_office)
            : "",

        // Handle thematic_area - check root object or direct ID
        thematicArea:
          proposal.thematic_area &&
          typeof proposal.thematic_area === "object"
            ? String(proposal.thematic_area.id)
            : proposal.thematic_area
              ? String(proposal.thematic_area)
              : "",
        subThematicArea:
          (proposal as any).sub_thematic_area &&
          typeof (proposal as any).sub_thematic_area === "object"
            ? String((proposal as any).sub_thematic_area.id)
            : (proposal as any).sub_thematic_area
              ? String((proposal as any).sub_thematic_area)
              : "",
        submissionType: (proposal.submission_type ||
          "document_upload") as "on_site" | "document_upload",
        keywords: Array.isArray(proposal.keywords)
          ? proposal.keywords.join(", ")
          : proposal.keywords || "",
        abstract: proposal.abstract || "",
      };

      // Map team members
      if (
        proposal.team_members &&
        proposal.team_members.length > 0
      ) {
        const teamMembers =
          proposal.team_members as ExistingProposalTeamMember[];

        const internalMembers = proposal.team_members
          .filter(
            (tm: ExistingProposalTeamMember) => tm.member_type === "internal",
          )
          .map((tm: ExistingProposalTeamMember) => ({
            userId: tm.internal_member_user_id
              ? String(tm.internal_member_user_id)
              : tm.member_details?.id
                ? String(tm.member_details.id)
                : tm.member && typeof tm.member === "object"
                  ? String(tm.member.id)
                  : tm.member
                    ? String(tm.member)
                    : "",
            role:
              tm.role && typeof tm.role === "object"
                ? String(tm.role.id)
                : tm.role
                  ? String(tm.role)
                  : "",
          }));

        const externalMembers = teamMembers
          .filter(
            (tm: ExistingProposalTeamMember) => tm.member_type === "external",
          )
          .map((tm: ExistingProposalTeamMember) => ({
            role:
              tm.role && typeof tm.role === "object"
                ? String(tm.role.id)
                : tm.role
                  ? String(tm.role)
                  : "",
            organizationName: tm.organization_name || "",
            stakeholderName: tm.stakeholder_name || "",
            position: tm.position || "",
            phoneNumber: tm.phone_number || "",
            email: tm.email || "",
          }));

        formData.teamMembers = internalMembers;
        formData.stakeholders = externalMembers;
      }

      // Map files
      if (
        proposalId &&
        proposal.files &&
        proposal.files.length > 0
      ) {
        // Find technical proposal by file_type or description
        const technicalProposal = proposal.files.find(
          (f: any) =>
            f.file_type === "proposal" || f.description === "proposal",
        );
        if (technicalProposal) {
          formData.technicalProposal = {
            name:
              technicalProposal.file.split("/").pop() || "Technical Proposal",
            file: technicalProposal.file,
            id: technicalProposal.id,
            file_type: technicalProposal.file_type || "proposal",
            description: technicalProposal.description,
          } as any;
        }

        // Find budget file by file_type or description
        const budgetFile = proposal.files.find(
          (f: any) => f.file_type === "budget" || f.description === "budget",
        );
        if (budgetFile) {
          formData.budgetFile = {
            name: budgetFile.file.split("/").pop() || "Budget File",
            file: budgetFile.file,
            id: budgetFile.id,
            file_type: budgetFile.file_type || "budget",
            description: budgetFile.description,
          } as any;
        }
      }

      // Populate section responses for on_site submissions
      const sectionResponses =
        proposal.section_responses || proposal.sectionResponses;
      if (
        proposal.submission_type === "on_site" &&
        sectionResponses &&
        sectionResponses.length > 0
      ) {
        const typedSections = sectionsData as Section[];

        sectionResponses.forEach((response: any) => {
          // 1. Try to get template section ID directly from response
          let templateSectionId =
            response.template_section?.id ||
            response.template_section ||
            response.template_section_id;

          // 2. Fallback: Match by title against sectionsData since ID is missing from backend response
          if (
            !templateSectionId &&
            response.title &&
            typedSections &&
            typedSections.length > 0
          ) {
            const matchedSection = typedSections.find(
              (s: any) => s.title === response.title,
            );
            if (matchedSection) {
              templateSectionId = matchedSection.id;
            }
          }

          if (templateSectionId) {
            (formData as any)[String(templateSectionId)] =
              response.content || "";
          }
        });
      }

      // Store formData in ref for persistence
      formDataRef.current = formData;

      // Set grant call + proposal type / sub type immediately so dropdowns show selection
      // (labels come from initialGrantCallInfo additionalOptions; full reset happens after options load)
      if (formData.grantCallId) {
        form.setValue("grantCallId", formData.grantCallId);
      }
      if (formData.proposalType) {
        form.setValue("proposalType", formData.proposalType);
      }
      if (formData.subProposalTypeId) {
        form.setValue("subProposalTypeId", formData.subProposalTypeId);
      }

      // Prefetch options data before resetting form to ensure dropdowns can display names
      const grantCallIdForFetch = formData.grantCallId;
      const submissionLevelForFetch = formData.submissionLevel;
      const officeToSubmitForFetch = formData.officeToSubmit;

      // Prefetch queries and wait for them to complete before resetting form
      const prefetchOptions = async () => {
        if (grantCallIdForFetch) {
          // Prefetch proposal options (for proposal type, subcall, and submission levels)
          // Use same query key format as useProposalOptions hook for cache hit
          const proposalOptionsResponse = await queryClient.prefetchQuery({
            queryKey: ["proposal-options", grantCallIdForFetch],
            queryFn: async () => {
              const response = await apiClient.get(
                API_ENDPOINTS.PROPOSALS.OPTIONS,
                {
                  params: { grant_call_id: grantCallIdForFetch },
                },
              );
              return response.data;
            },
          });

          // Prefetch office options if submission level is available
          // Use same query key format as useOfficeOptions hook for cache hit
          if (submissionLevelForFetch) {
            const officeOptionsResponse = await queryClient.prefetchQuery({
              queryKey: [
                "office-options",
                grantCallIdForFetch,
                submissionLevelForFetch,
              ],
              queryFn: async () => {
                const response = await apiClient.get(
                  API_ENDPOINTS.PROPOSALS.OPTIONS,
                  {
                    params: {
                      grant_call_id: grantCallIdForFetch,
                      submission_level_id: submissionLevelForFetch,
                    },
                  },
                );
                return response.data;
              },
            });
          }
        }
      };

      // Wait for options to load before resetting form (FIX 1)
      const waitForOptionsAndReset = async () => {
        // Only reset if component is still mounted
        if (!mountedRef.current || !formDataRef.current) {
          isResettingRef.current = false;
          return;
        }

        try {
          // Prefetch options first
          await prefetchOptions();

          // Only reset if component is still mounted after prefetch
          if (!mountedRef.current || !formDataRef.current) {
            isResettingRef.current = false;
            return;
          }

          // Wait until submission levels exist
          const proposalOptions = await queryClient.ensureQueryData({
            queryKey: ["proposal-options", grantCallIdForFetch],
            queryFn: async () => {
              const response = await apiClient.get(
                API_ENDPOINTS.PROPOSALS.OPTIONS,
                {
                  params: { grant_call_id: grantCallIdForFetch },
                },
              );
              return response.data;
            },
          });

          // Require proposal_type so Proposal Type / Sub Type dropdowns have options
          const hasProposalType =
            proposalOptions?.data?.proposal_type &&
            (Array.isArray(proposalOptions.data.proposal_type?.options)
              ? proposalOptions.data.proposal_type.options.length > 0
              : !!(
                  proposalOptions.data.proposal_type?.id &&
                  proposalOptions.data.proposal_type?.name
                ));
          if (!hasProposalType) {
            console.warn(
              "Proposal type options not available yet, skipping reset",
            );
            isResettingRef.current = false;
            return;
          }

          // Require submission_levels only when form has a submission level
          if (
            submissionLevelForFetch &&
            (!proposalOptions?.data?.submission_levels ||
              proposalOptions.data.submission_levels.length === 0)
          ) {
            console.warn("Submission levels not available yet, skipping reset");
            isResettingRef.current = false;
            return;
          }

          // Wait until offices exist (depends on submissionLevel)
          if (submissionLevelForFetch) {
            const officeOptions = await queryClient.ensureQueryData({
              queryKey: [
                "office-options",
                grantCallIdForFetch,
                submissionLevelForFetch,
              ],
              queryFn: async () => {
                const response = await apiClient.get(
                  API_ENDPOINTS.PROPOSALS.OPTIONS,
                  {
                    params: {
                      grant_call_id: grantCallIdForFetch,
                      submission_level_id: submissionLevelForFetch,
                    },
                  },
                );
                return response.data;
              },
            });

            if (
              !officeOptions?.data?.offices ||
              officeOptions.data.offices.length === 0
            ) {
              console.warn("Office options not available yet, skipping reset");
              isResettingRef.current = false;
              return;
            }
          }

          // Note: Thematic area is taken from proposal response, not prefetched separately
          // The value is already set in formData from proposal.thematic_area.id

          // All options are loaded, now reset form
          if (!mountedRef.current || !formDataRef.current) {
            isResettingRef.current = false;
            return;
          }

          const dataToReset = formDataRef.current;
          form.reset(dataToReset);
          lastSavedDataRef.current = serializeFormValues(dataToReset as any);
          isResettingRef.current = false;
        } catch (error) {
          console.error("Error waiting for options:", error);
          // Still reset form even if there's an error, but only if mounted
          if (!mountedRef.current || !formDataRef.current) {
            isResettingRef.current = false;
            return;
          }
          const dataToReset = formDataRef.current;
          form.reset(dataToReset);
          lastSavedDataRef.current = serializeFormValues(dataToReset as any);
          isResettingRef.current = false;
        }
      };

      // Start waiting for options and reset
      waitForOptionsAndReset();
    }
  }, [
    existingProposal,
    proposalId,
    form,
    queryClient,
    sectionsData,
    isLoadingSections,
  ]);

  // Register section fields when sections are first loaded (only initialize, never reset)
  // Use a ref to track if we've already initialized to prevent re-running
  const initializedSectionsRef = useRef<Set<string>>(new Set());

  const handleNext = async () => {
    let fieldsToValidate: string[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = [
          "title",
          "grantCallId",
          "proposalType",
          "subProposalTypeId",
          "startDate",
          "endDate",
          "submissionLevel",
          "officeToSubmit",
          "thematicArea",
          "subThematicArea",
        ];
        break;
      case 2:
        fieldsToValidate = ["teamMembers", "stakeholders"];
        break;
      case 3:
        fieldsToValidate = ["abstract", "keywords", "submissionType"];
        // Only validate technicalProposal if it's a File instance (new upload)
        // Skip validation for existing file objects to avoid "not instance of File" errors
        const technicalProposal = form.getValues("technicalProposal");
        if (technicalProposal instanceof File) {
          fieldsToValidate.push("technicalProposal");
        }
        break;
      case 4:
        // Validate budgetRequested (required) and budgetFile (optional)
        fieldsToValidate = ["budgetRequested"];
        // Only validate budgetFile if it's a File instance (new upload)
        // Skip validation for existing file objects to avoid "not instance of File" errors
        const budgetFile = form.getValues("budgetFile");
        if (budgetFile instanceof File) {
          fieldsToValidate.push("budgetFile");
        }
        break;
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      toast.error("Please fill in all required fields correctly.");
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (
    data: ProposalFormInput,
    status: "draft" | "submitted" = "submitted",
  ) => {
    try {
      setIsSaving(true);

      // Get all form values including section fields (not in schema)
      const allFormValues = form.getValues();

      // 🔥 CRITICAL: Remove file metadata objects from allFormValues BEFORE merging
      // These objects contain file_type, original_name, mime_type, size which backend rejects
      const cleanedFormValues = { ...allFormValues };
      if (!(cleanedFormValues.technicalProposal instanceof File)) {
        delete cleanedFormValues.technicalProposal;
      }
      if (!(cleanedFormValues.budgetFile instanceof File)) {
        delete cleanedFormValues.budgetFile;
      }
      if (!(cleanedFormValues.signature instanceof File)) {
        delete cleanedFormValues.signature;
      }

      // Fetch sections if submission type is on_site
      let sectionsData: any[] = [];
      if (data.submissionType === "on_site") {
        const proposalType = form.watch("proposalType");
        if (proposalType) {
          const sectionsQuery = await queryClient.fetchQuery({
            queryKey: [
              "proposal-template-sections",
              { proposal_type: Number(proposalType) },
            ],
            queryFn: async () => {
              const response = await apiClient.get(
                API_ENDPOINTS.PROPOSAL_TEMPLATE_SECTION.LIST,
                {
                  params: {
                    proposal_type: Number(proposalType),
                  },
                },
              );
              return ((response.data as { data?: Section[] }).data ||
                []) as Section[];
            },
          });
          sectionsData = sectionsQuery || [];
        }
      }

      // 🔥 CRITICAL: Clean data object - remove file metadata objects
      // The ...data spread below would overwrite cleaned values if we don't clean it first
      const cleanedData = { ...data };
      if (!(cleanedData.technicalProposal instanceof File)) {
        delete cleanedData.technicalProposal;
      }
      if (!(cleanedData.budgetFile instanceof File)) {
        delete cleanedData.budgetFile;
      }
      if (!(cleanedData.signature instanceof File)) {
        delete cleanedData.signature;
      }

      // Clean file objects - only send File instances, remove metadata objects
      const cleanTechnicalProposal =
        data.technicalProposal instanceof File
          ? data.technicalProposal
          : undefined;

      const cleanBudgetFile =
        data.budgetFile instanceof File ? data.budgetFile : undefined;

      const cleanSignature =
        data.signature instanceof File ? data.signature : undefined;

      // Merge validated data with cleaned form values to include section content
      const submissionData = {
        ...cleanedFormValues,
        ...cleanedData,
        grantCallId: cleanedData.grantCallId || cleanedFormValues.grantCallId,
        proposalType:
          cleanedData.proposalType || cleanedFormValues.proposalType,
        teamMembers:
          cleanedData.teamMembers || cleanedFormValues.teamMembers || [],
        stakeholders:
          cleanedData.stakeholders || cleanedFormValues.stakeholders || [],
        sections: sectionsData,
        status,
        technicalProposal: cleanTechnicalProposal,
        budgetFile: cleanBudgetFile,
        signature: cleanSignature,
      };

      let currentId = (activeProposalId && activeProposalId !== "undefined") ? activeProposalId : "";
      if (!currentId && proposalId && proposalId !== "undefined") {
        currentId = proposalId;
      }
      const formData = buildProposalFormData(submissionData);

      if (!currentId) {
        // Create first if missing
        const res = await apiClient.post("/v1/proposals/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const rawId = res.data?.data?.id ?? res.data?.id;
        if (rawId) {
          currentId = String(rawId);
          setActiveProposalId(currentId);
        } else {
          throw new Error("Failed to retrieve proposal ID from create response.");
        }
      } else {
        // Save latest edits
        await apiClient.patch(`/v1/proposals/${currentId}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }


      // Update the lastSavedDataRef to match currently saved values
      lastSavedDataRef.current = serializeFormValues(allFormValues);

      if (status === "submitted") {
        // Custom submit endpoint
        await apiClient.post(`/v1/proposals/${currentId}/submit/`);
        toast.success("Proposal submitted successfully!");
      } else {
        toast.success(
          (activeProposalId || proposalId)
            ? "Proposal updated successfully!"
            : "Proposal saved as draft!",
          {
            description: "You can continue editing your proposal later.",
          },
        );
      }

      // Redirect to proposals page and refresh
      setTimeout(() => {
        router.push("/research/proposals/my-proposals");
        setTimeout(() => {
          router.refresh();
        }, 500);
      }, 1000);
    } catch (error: any) {
      console.error("Proposal submission error:", error);
      toast.error(error?.message || "Failed to submit proposal. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Show loading state while fetching proposal data in edit mode */}
      {proposalId && isLoadingProposal ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading proposal data...</p>
            </div>
          </CardContent>
        </Card>
      ) : proposalId && proposalError ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <p className="text-destructive">Failed to load proposal data.</p>
              <Button
                onClick={() => router.push("/research/proposals/my-proposals")}
              >
                Back to Proposals
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Progress Steps - Elegant Design */}
          <div className="flex items-center justify-between py-4 px-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-full border-3 transition-all duration-300 ${
                      currentStep === step.id
                        ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110"
                        : currentStep > step.id
                          ? "border-primary/50 bg-primary/10 text-primary shadow-md"
                          : "border-muted bg-card text-muted-foreground"
                    }`}
                  >
                    <span className="text-lg font-bold">
                      {currentStep > step.id ? "✓" : step.id}
                    </span>
                  </div>
                  <span
                    className={`mt-3 text-sm font-semibold ${
                      currentStep === step.id
                        ? "text-primary"
                        : currentStep > step.id
                          ? "text-primary"
                          : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`mx-4 h-1 flex-1 rounded-full transition-all duration-300 ${
                      currentStep > step.id
                        ? "bg-linear-to-r from-primary/50 to-primary"
                        : currentStep === step.id
                          ? "bg-linear-to-r from-primary to-primary/50"
                          : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Form Content */}
          <FormProvider {...form}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // Prevent auto-submission - only allow explicit button clicks
              }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>
                    Step {currentStep}: {steps[currentStep - 1].label}
                  </CardTitle>
                  <CardDescription>
                    {currentStep === 1 &&
                      "Enter basic information about your proposal"}
                    {currentStep === 2 && "Add team members to your proposal"}
                    {currentStep === 3 && "Upload required documents"}
                    {currentStep === 4 &&
                      "Enter the budget amount and optionally upload your budget file (PDF or Excel, max 5MB)."}
                    {currentStep === 5 &&
                      "Review your proposal before submission"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {currentStep === 1 && (
                    <ProposalBasicInfoStep
                      initialGrantCallInfo={(():
                        | InitialGrantCallInfo
                        | undefined => {
                        if (!existingProposal) return undefined;

                        const grantCall =
                          existingProposal.grant_call ??
                          (existingProposal.call &&
                          typeof existingProposal.call === "object"
                            ? (existingProposal.call as any)
                            : undefined);

                        const proposalType =
                          existingProposal.proposal_type &&
                          typeof existingProposal.proposal_type === "object"
                            ? (existingProposal.proposal_type as any)
                            : existingProposal.proposal_type
                              ? { id: existingProposal.proposal_type, name: "" }
                              : undefined;

                        const subcall =
                          existingProposal.subcall &&
                          typeof existingProposal.subcall === "object"
                            ? (existingProposal.subcall as any)
                            : existingProposal.subcall
                              ? { id: existingProposal.subcall, name: "" }
                              : undefined;

                        return {
                          grant_call: grantCall,
                          proposal_type: proposalType,
                          subcall,
                        };
                      })()}
                    />
                  )}
                  {currentStep === 2 && <ProposalTeamStep />}
                  {currentStep === 3 && <ProposalFilesStep />}
                  {currentStep === 4 && <ProposalBudgetStep />}
                  {currentStep === 5 && (
                    <ProposalReviewStep
                      onSubmit={(status) => {
                        form.handleSubmit(
                          (data) => onSubmit(data, status),
                          (errors) => {
                            console.error("Submit validation failed", errors);
                            toast.error("Please fill in all required fields.");
                          },
                        )();
                      }}
                      isSubmitting={isSubmitting}
                      onPrevious={handlePrevious}
                      isEditMode={!!proposalId}
                      isDraft={
                        String(existingProposal?.status || "").toLowerCase() ===
                        "draft"
                      }
                    />
                  )}

                  {/* Navigation Buttons - Hide on review step */}
                  {currentStep < 5 && (
                    <div className="flex justify-between pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentStep === 1 || isSubmitting}
                      >
                        Previous
                      </Button>
                      <Button type="button" onClick={handleNext}>
                        Next
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </form>
          </FormProvider>
        </>
      )}
    </div>
  );
}
