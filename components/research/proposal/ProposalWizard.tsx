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
import { Loader2, Check, AlertCircle } from "lucide-react";
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
import { upsertProposalTeamMember } from "./steps/TeamStep/teamMemberAutosave";

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
    thematicAreas: [],
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
    delete (clone as any).teamMembers;
    delete (clone as any).stakeholders;
    if (clone.technicalProposal instanceof File) {
      clone.technicalProposal = {
        name: clone.technicalProposal.name,
        size: clone.technicalProposal.size,
      } as any;
    } else if (clone.technicalProposal) {
      clone.technicalProposal = String(
        (clone.technicalProposal as any).name ||
          (clone.technicalProposal as any).file ||
          "",
      );
    }
    if (clone.budgetFile instanceof File) {
      clone.budgetFile = {
        name: clone.budgetFile.name,
        size: clone.budgetFile.size,
      } as any;
    } else if (clone.budgetFile) {
      clone.budgetFile = String(
        (clone.budgetFile as any).name || (clone.budgetFile as any).file || "",
      );
    }
    if (clone.signature instanceof File) {
      clone.signature = {
        name: clone.signature.name,
        size: clone.signature.size,
      } as any;
    } else if (clone.signature) {
      clone.signature = String(
        (clone.signature as any).name || (clone.signature as any).file || "",
      );
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
      const formattedStartDate = new Date(values.startDate)
        .toISOString()
        .split("T")[0];
      formData.append("start_date", formattedStartDate);
    } catch (e) {
      console.warn("Invalid start date", values.startDate);
    }
  }
  if (values.endDate) {
    try {
      const formattedEndDate = new Date(values.endDate)
        .toISOString()
        .split("T")[0];
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
    formData.append(
      "proposal_type",
      String(parseInt(String(values.proposalType), 10)),
    );
  }
  if (values.grantCallId) {
    formData.append("call", String(parseInt(String(values.grantCallId), 10)));
  }
  if (values.submissionLevel) {
    formData.append(
      "Organization",
      String(parseInt(String(values.submissionLevel), 10)),
    );
  }
  if (values.officeToSubmit) {
    formData.append(
      "Unit",
      String(parseInt(String(values.officeToSubmit), 10)),
    );
  }
  if (values.receivingOffice) {
    formData.append(
      "receiving_office",
      String(parseInt(String(values.receivingOffice), 10)),
    );
  }
  if (values.subThematicArea) {
    formData.append(
      "sub_thematic_area",
      String(parseInt(String(values.subThematicArea), 10)),
    );
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

  const thematicAreaValues = Array.isArray(values.thematicAreas)
    ? values.thematicAreas
    : values.thematicArea
      ? [values.thematicArea]
      : [];
  thematicAreaValues.forEach((thematicAreaValue) => {
    const thematicAreaVal = parseInt(String(thematicAreaValue), 10);
    if (!isNaN(thematicAreaVal)) {
      formData.append("thematic_areas", String(thematicAreaVal));
    }
  });

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
    const sectionResponses: Array<{
      template_section: number;
      content: string;
    }> = [];
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

// Map backend field names to form field names
const backendFieldToFormField: Record<string, string> = {
  "receiving_office": "receivingOffice",
  "receivingOffice": "receivingOffice",
  "submission_level": "submissionLevel",
  "submissionLevel": "submissionLevel",
  "office_to_submit": "officeToSubmit",
  "officeToSubmit": "officeToSubmit",
  "proposal_type": "proposalType",
  "proposalType": "proposalType",
  "grant_call": "grantCallId",
  "grantCallId": "grantCallId",
  "call": "grantCallId",
  "thematic_area": "thematicArea",
  "thematicArea": "thematicArea",
  "thematic_areas": "thematicAreas",
  "thematicAreas": "thematicAreas",
  "sub_thematic_area": "subThematicArea",
  "subThematicArea": "subThematicArea",
  "sub_proposal_type": "subProposalTypeId",
  "subProposalTypeId": "subProposalTypeId",
  "budget_requested": "budgetRequested",
  "budgetRequested": "budgetRequested",
  "start_date": "startDate",
  "startDate": "startDate",
  "end_date": "endDate",
  "endDate": "endDate",
};

const extractErrorMessage = (error: any): string => {
  if (typeof error === "string") return error;
  if (Array.isArray(error) && error.length > 0) return String(error[0]);
  if (error?.message) return error.message;
  return "Validation error";
};

// Extract a comprehensive error message from various error response structures
const extractFullErrorMessage = (error: any): string => {
  // Direct error message
  if (typeof error === "string") return error;
  
  // From error.message
  if (error?.message && typeof error.message === "string") {
    return error.message;
  }
  
  // From response data
  if (error?.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.response?.data?.detail) {
    return error.response.data.detail;
  }
  
  // From direct data
  if (error?.data?.error?.message) {
    return error.data.error.message;
  }
  if (error?.data?.message) {
    return error.data.message;
  }
  
  // Try to extract first validation error
  const errorDetails = error?.response?.data?.error?.details || 
                      error?.data?.error?.details ||
                      error?.details || {};
  if (Object.keys(errorDetails).length > 0) {
    const firstKey = Object.keys(errorDetails)[0];
    const firstError = errorDetails[firstKey];
    if (typeof firstError === "string") return firstError;
    if (Array.isArray(firstError) && firstError.length > 0) {
      return String(firstError[0]);
    }
  }
  
  return "Failed to process request. Please try again.";
};

const applyBackendErrorsToForm = (
  form: any,
  errorDetails: Record<string, any>,
) => {
  Object.entries(errorDetails).forEach(([backendField, errorValue]) => {
    const formField = backendFieldToFormField[backendField] || backendField;
    const errorMessage = extractErrorMessage(errorValue);
    form.setError(formField, {
      type: "manual",
      message: errorMessage,
    });
  });
};

const getModifiedFields = (
  current: ProposalFormInput,
  previous: Partial<ProposalFormInput>,
): Partial<ProposalFormInput> => {
  const modified: Partial<ProposalFormInput> = {};

  const keysToCompare = [
    "title",
    "abstract",
    "keywords",
    "startDate",
    "endDate",
    "budgetRequested",
    "submissionLevel",
    "officeToSubmit",
    "thematicArea",
    "thematicAreas",
    "subThematicArea",
    "proposalType",
    "subProposalTypeId",
    "grantCallId",
    "submissionType",
    "technicalProposal",
    "budgetFile",
    "signature",
    "needsIrb",
    "needs_irb",
    "strategic_objectives",
  ];

  for (const key of keysToCompare) {
    const valCurrent = current[key];
    const valPrevious = previous[key];

    // 1. Handle File objects
    if (valCurrent instanceof File) {
      if (
        !(valPrevious instanceof File) ||
        valCurrent.name !== valPrevious.name ||
        valCurrent.size !== valPrevious.size
      ) {
        modified[key] = valCurrent;
      }
      continue;
    }

    // 2. Handle file metadata objects from backend (plain objects)
    if (
      valCurrent &&
      typeof valCurrent === "object" &&
      !(valCurrent instanceof Date) &&
      !Array.isArray(valCurrent)
    ) {
      const prevObj = valPrevious as any;
      const currObj = valCurrent as any;
      if (
        !prevObj ||
        prevObj.file !== currObj.file ||
        prevObj.id !== currObj.id
      ) {
        modified[key] = valCurrent;
      }
      continue;
    }

    // 3. Handle Arrays
    if (Array.isArray(valCurrent)) {
      if (
        !Array.isArray(valPrevious) ||
        JSON.stringify(valCurrent) !== JSON.stringify(valPrevious)
      ) {
        modified[key] = valCurrent;
      }
      continue;
    }

    // 4. Handle Dates
    if (valCurrent instanceof Date) {
      if (
        !(valPrevious instanceof Date) ||
        valCurrent.getTime() !== valPrevious.getTime()
      ) {
        modified[key] = valCurrent;
      }
      continue;
    }

    // 5. Handle other primitives
    if (valCurrent !== valPrevious) {
      const isEmptyCurrent =
        valCurrent === undefined || valCurrent === null || valCurrent === "";
      const isEmptyPrevious =
        valPrevious === undefined || valPrevious === null || valPrevious === "";
      if (isEmptyCurrent && isEmptyPrevious) {
        continue;
      }
      modified[key] = valCurrent;
    }
  }

  // Handle custom sections (dynamic editor contents)
  Object.keys(current).forEach((key) => {
    const isSectionId = /^\d+$/.test(key);
    if (isSectionId) {
      if (current[key] !== previous[key]) {
        modified[key] = current[key];
      }
    }
  });

  return modified;
};

const buildModifiedProposalFormData = (
  values: Partial<ProposalFormInput>,
): FormData => {
  const formData = new FormData();

  if (values.title !== undefined) {
    formData.append("title", values.title || "");
  }
  if (values.abstract !== undefined) {
    formData.append("abstract", values.abstract || "");
  }

  if (values.startDate !== undefined) {
    if (values.startDate) {
      try {
        const formattedStartDate = new Date(values.startDate)
          .toISOString()
          .split("T")[0];
        formData.append("start_date", formattedStartDate);
      } catch (e) {
        console.warn("Invalid start date", values.startDate);
      }
    } else {
      formData.append("start_date", "");
    }
  }
  if (values.endDate !== undefined) {
    if (values.endDate) {
      try {
        const formattedEndDate = new Date(values.endDate)
          .toISOString()
          .split("T")[0];
        formData.append("end_date", formattedEndDate);
      } catch (e) {
        console.warn("Invalid end date", values.endDate);
      }
    } else {
      formData.append("end_date", "");
    }
  }

  if (values.budgetRequested !== undefined) {
    formData.append(
      "budget_requested",
      values.budgetRequested !== null && values.budgetRequested !== undefined
        ? String(values.budgetRequested)
        : "",
    );
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

  if (values.proposalType !== undefined) {
    formData.append(
      "proposal_type",
      values.proposalType
        ? String(parseInt(String(values.proposalType), 10))
        : "",
    );
  }
  if (values.grantCallId !== undefined) {
    formData.append(
      "call",
      values.grantCallId
        ? String(parseInt(String(values.grantCallId), 10))
        : "",
    );
  }
  if (values.submissionLevel !== undefined) {
    formData.append(
      "Organization",
      values.submissionLevel
        ? String(parseInt(String(values.submissionLevel), 10))
        : "",
    );
  }
  if (values.officeToSubmit !== undefined) {
    formData.append(
      "Unit",
      values.officeToSubmit
        ? String(parseInt(String(values.officeToSubmit), 10))
        : "",
    );
  }
  if (values.receivingOffice !== undefined) {
    formData.append(
      "receiving_office",
      values.receivingOffice
        ? String(parseInt(String(values.receivingOffice), 10))
        : "",
    );
  }
  if (values.subThematicArea !== undefined) {
    formData.append(
      "sub_thematic_area",
      values.subThematicArea
        ? String(parseInt(String(values.subThematicArea), 10))
        : "",
    );
  }

  if (values.keywords !== undefined) {
    const keywordsArray = String(values.keywords || "")
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (keywordsArray.length > 0) {
      keywordsArray.forEach((kw) => {
        formData.append("keywords", kw);
      });
    } else {
      formData.append("keywords", "");
    }
  }

  const thematicAreaValues = Array.isArray(values.thematicAreas)
    ? values.thematicAreas
    : values.thematicArea
      ? [values.thematicArea]
      : [];
  thematicAreaValues.forEach((thematicAreaValue) => {
    const thematicAreaVal = parseInt(String(thematicAreaValue), 10);
    if (!isNaN(thematicAreaVal)) {
      formData.append("thematic_areas", String(thematicAreaVal));
    }
  });

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
    const sectionResponses: Array<{
      template_section: number;
      content: string;
    }> = [];
    Object.keys(values).forEach((key) => {
      const isSectionId = /^\d+$/.test(key);
      if (isSectionId && values[key] !== undefined) {
        sectionResponses.push({
          template_section: parseInt(key, 10),
          content: String(values[key] || ""),
        });
      }
    });
    if (sectionResponses.length > 0) {
      formData.append("section_responses", JSON.stringify(sectionResponses));
    }
  }

  return formData;
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
    return proposalId && proposalId !== "undefined" ? proposalId : "";
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "typing" | "saving" | "saved" | "failed"
  >("idle");
  const saveStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedValuesRef = useRef<Partial<ProposalFormInput>>({});
  const isSavingRequestRef = useRef(false);
  const nextSaveValuesRef = useRef<ProposalFormInput | null>(null);
  const syncedProposalTeamMembersRef = useRef<string>("");

  // Update activeProposalId if proposalId prop changes
  useEffect(() => {
    if (proposalId && proposalId !== "undefined") {
      setActiveProposalId(proposalId);
    }
  }, [proposalId]);

  const createProposalMutation = useCreateProposal();
  const updateProposalMutation = useUpdateProposal();
  const isSubmitting =
    createProposalMutation.isPending ||
    updateProposalMutation.isPending ||
    isSaving;

  // Fetch existing proposal if activeProposalId or proposalId is provided (edit mode)
  const queryProposalId =
    activeProposalId && activeProposalId !== "undefined"
      ? activeProposalId
      : proposalId && proposalId !== "undefined"
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

  const renderSaveStatus = () => {
    switch (saveStatus) {
      case "typing":
        return (
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-500 animate-pulse bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
            Typing...
          </div>
        );
      case "saving":
        return (
          <div className="flex items-center gap-1.5 text-xs font-medium text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 shadow-xs">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Saving...
          </div>
        );
      case "saved":
        return (
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shadow-xs">
            <Check className="h-3.5 w-3.5" />
            Saved
          </div>
        );
      case "failed":
        return (
          <div className="flex items-center gap-1.5 text-xs font-medium text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20 shadow-xs">
            <AlertCircle className="h-3.5 w-3.5" />
            Failed to save
          </div>
        );
      default:
        return null;
    }
  };

  const syncProposalTeamMembers = async (
    savedProposalId: string,
    values: ProposalFormInput,
  ) => {
    if (!savedProposalId) return;
    if (syncedProposalTeamMembersRef.current === savedProposalId) return;

    const internalMembers = Array.isArray(values.teamMembers)
      ? values.teamMembers
      : [];
    const externalStakeholders = Array.isArray(values.stakeholders)
      ? values.stakeholders
      : [];

    let hasError = false;

    for (let index = 0; index < internalMembers.length; index += 1) {
      const member = internalMembers[index] as any;
      if (!member?.userId || !member?.role) continue;

      try {
        const result = await upsertProposalTeamMember({
          proposalId: savedProposalId,
          backendId: member?.backendId ?? null,
          memberType: "internal",
          payload: {
            member: Number(member.userId),
            role: Number(member.role),
          },
        });

        if (
          result?.id &&
          String(result.id) !== String(member?.backendId ?? "")
        ) {
          form.setValue(`teamMembers.${index}.backendId` as any, result.id, {
            shouldDirty: false,
            shouldTouch: false,
            shouldValidate: false,
          });
        }
      } catch (error) {
        hasError = true;
        console.error("Failed to sync internal team member", error);
      }
    }

    for (let index = 0; index < externalStakeholders.length; index += 1) {
      const stakeholder = externalStakeholders[index] as any;
      if (
        !stakeholder?.role ||
        !stakeholder?.organizationName ||
        !stakeholder?.stakeholderName ||
        !(stakeholder?.email || stakeholder?.phoneNumber)
      ) {
        continue;
      }

      try {
        const result = await upsertProposalTeamMember({
          proposalId: savedProposalId,
          backendId: stakeholder?.backendId ?? null,
          memberType: "external",
          payload: {
            role: Number(stakeholder.role),
            organization_name: stakeholder.organizationName || "",
            stakeholder_name: stakeholder.stakeholderName || "",
            position: stakeholder.position || "",
            phone_number: stakeholder.phoneNumber || "",
            email: stakeholder.email || "",
          },
        });

        if (
          result?.id &&
          String(result.id) !== String(stakeholder?.backendId ?? "")
        ) {
          form.setValue(`stakeholders.${index}.backendId` as any, result.id, {
            shouldDirty: false,
            shouldTouch: false,
            shouldValidate: false,
          });
        }
      } catch (error) {
        hasError = true;
        console.error("Failed to sync external stakeholder", error);
      }
    }

    if (!hasError) {
      syncedProposalTeamMembersRef.current = savedProposalId;
    }
  };

  const performSaveRequest = async (values: ProposalFormInput) => {
    isSavingRequestRef.current = true;
    setSaveStatus("saving");

    let currentId =
      activeProposalId && activeProposalId !== "undefined"
        ? activeProposalId
        : "";
    if (!currentId && proposalId && proposalId !== "undefined") {
      currentId = proposalId;
    }

    try {
      const modified = getModifiedFields(values, lastSavedValuesRef.current);

      // Skip call if no fields have changed and proposal already exists
      if (Object.keys(modified).length === 0 && currentId) {
        setSaveStatus("saved");
        isSavingRequestRef.current = false;
        processNextInQueue();
        return;
      }

      if (currentId) {
        // PATCH only modified fields
        const formData = buildModifiedProposalFormData(modified);
        await apiClient.patch(
          API_ENDPOINTS.PROPOSALS.UPDATE(currentId),
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );
      } else {
        // Create first if missing, requires basic fields
        if (hasRequiredFieldsForCreate(values)) {
          const formData = buildProposalFormData(values);
          const res = await apiClient.post(
            API_ENDPOINTS.PROPOSALS.CREATE,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            },
          );
          const rawId = res.data?.data?.id ?? res.data?.id;
          if (rawId) {
            const newId = String(rawId);
            setActiveProposalId(newId);
            currentId = newId;

            // Update URL seamlessly
            const newUrl = `${window.location.pathname}?edit=${newId}`;
            window.history.replaceState(
              { ...window.history.state, as: newUrl, url: newUrl },
              "",
              newUrl,
            );

            await syncProposalTeamMembers(newId, values);
          }
        } else {
          setSaveStatus("idle");
          isSavingRequestRef.current = false;
          return;
        }
      }

      lastSavedValuesRef.current = {
        ...lastSavedValuesRef.current,
        ...modified,
      };
      lastSavedDataRef.current = serializeFormValues(values);
      setSaveStatus("saved");
    } catch (error: any) {
      console.error("Auto-save PATCH failed:", error);
      
      // Extract error details for form field errors
      const errorDetails = error?.response?.data?.error?.details || 
                          error?.data?.error?.details ||
                          error?.details || {};
      
      // Apply backend validation errors to form fields if they exist
      if (Object.keys(errorDetails).length > 0) {
        applyBackendErrorsToForm(form, errorDetails);
      }
      
      setSaveStatus("failed");
    } finally {
      isSavingRequestRef.current = false;
      processNextInQueue();
    }
  };

  const processNextInQueue = () => {
    if (nextSaveValuesRef.current) {
      const nextValues = nextSaveValuesRef.current;
      nextSaveValuesRef.current = null;
      performSaveRequest(nextValues);
    }
  };

  // Auto-Save Effect
  useEffect(() => {
    if (
      isLoadingProposal ||
      isResettingRef.current ||
      !hasPopulatedFormRef.current
    )
      return;
    if (serializedValues === lastSavedDataRef.current) return;

    setSaveStatus("typing");

    if (saveStatusTimeoutRef.current) {
      clearTimeout(saveStatusTimeoutRef.current);
    }

    saveStatusTimeoutRef.current = setTimeout(() => {
      const currentValues = form.getValues();
      if (isSavingRequestRef.current) {
        nextSaveValuesRef.current = currentValues;
      } else {
        performSaveRequest(currentValues);
      }
    }, 1500);

    return () => {
      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
      }
    };
  }, [serializedValues, isLoadingProposal]);

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
        grantCallId: proposal.grantCall?.id
          ? String(proposal.grantCall.id)
          : proposal.grant_call?.id
            ? String(proposal.grant_call.id)
            : proposal.call && typeof proposal.call === "object"
              ? String((proposal.call as any)?.id ?? "")
              : proposal.call
                ? String(proposal.call)
                : "",
        proposalType: proposal.proposalType?.id
          ? String(proposal.proposalType.id)
          : proposal.grant_call?.proposal_type?.id
            ? String(proposal.grant_call.proposal_type.id)
            : proposal.proposal_type &&
                typeof proposal.proposal_type === "object"
              ? String((proposal.proposal_type as any)?.id ?? "")
              : proposal.proposal_type
                ? String(proposal.proposal_type)
                : "",
        subProposalTypeId: proposal.subProposalTypeId
          ? String(proposal.subProposalTypeId)
          : proposal.grant_call?.sub_call_type?.id
            ? String(proposal.grant_call.sub_call_type.id)
            : proposal.subcall && typeof proposal.subcall === "object"
              ? String((proposal.subcall as any)?.id ?? "")
              : proposal.subcall
                ? String(proposal.subcall)
                : "",
        startDate: proposal.startDate
          ? new Date(proposal.startDate)
          : proposal.start_date
            ? new Date(proposal.start_date)
            : proposal.dates?.start_date
              ? new Date(proposal.dates.start_date)
              : undefined,
        endDate: proposal.endDate
          ? new Date(proposal.endDate)
          : proposal.end_date
            ? new Date(proposal.end_date)
            : proposal.dates?.end_date
              ? new Date(proposal.dates.end_date)
              : undefined,
        budgetRequested:
          proposal.budgetRequested !== undefined
            ? Number(proposal.budgetRequested)
            : proposal.budget_requested !== undefined
              ? Number(proposal.budget_requested)
              : proposal.budget?.requested_amount !== undefined
                ? Number(proposal.budget.requested_amount)
                : undefined,
        submissionLevel: proposal.Organization?.id
          ? String(proposal.Organization.id)
          : proposal.organization?.id
            ? String(proposal.organization.id)
            : proposal.submission_level &&
                typeof proposal.submission_level === "object"
              ? String(proposal.submission_level.id)
              : proposal.submission_level
                ? String(proposal.submission_level)
                : "",
        officeToSubmit: proposal.Unit?.id
          ? String(proposal.Unit.id)
          : proposal.unit?.id
            ? String(proposal.unit.id)
            : typeof proposal.submitting_office === "object"
              ? String(proposal.submitting_office?.id ?? "")
              : proposal.submitting_office
                ? String(proposal.submitting_office)
                : "",
        receivingOffice: proposal.receivingOffice?.id
          ? String(proposal.receivingOffice.id)
          : proposal.receiving_office?.id
            ? String(proposal.receiving_office.id)
            : proposal.receiving_office
              ? String(proposal.receiving_office)
              : "",
        thematicArea: proposal.thematicAreas?.[0]?.id
          ? String(proposal.thematicAreas[0].id)
          : proposal.thematicArea?.id
            ? String(proposal.thematicArea.id)
            : proposal.thematic_area &&
                typeof proposal.thematic_area === "object"
              ? String(proposal.thematic_area.id)
              : proposal.thematic_area
                ? String(proposal.thematic_area)
                : "",
        thematicAreas: Array.isArray(proposal.thematicAreas)
          ? proposal.thematicAreas
              .map((thematicArea: any) =>
                thematicArea?.id ? String(thematicArea.id) : "",
              )
              .filter(Boolean)
          : proposal.thematicArea?.id
            ? [String(proposal.thematicArea.id)]
            : proposal.thematic_area &&
                typeof proposal.thematic_area === "object"
              ? [String(proposal.thematic_area.id)]
              : proposal.thematic_area
                ? [String(proposal.thematic_area)]
                : [],
        subThematicArea: proposal.subThematicArea?.id
          ? String(proposal.subThematicArea.id)
          : proposal.sub_thematic_area?.id
            ? String(proposal.sub_thematic_area.id)
            : proposal.sub_thematic_area &&
                typeof proposal.sub_thematic_area === "object"
              ? String(proposal.sub_thematic_area.id)
              : proposal.sub_thematic_area
                ? String(proposal.sub_thematic_area)
                : "",
        submissionType: (proposal.submissionType ||
          proposal.submission_type ||
          "document_upload") as "on_site" | "document_upload",
        keywords: Array.isArray(proposal.keywords)
          ? proposal.keywords.join(", ")
          : proposal.keywords || "",
        abstract: proposal.abstract || "",
        needsIrb: proposal.needsIrb ?? proposal.needs_irb ?? false,
        strategic_objectives: Array.isArray(proposal.strategic_objectives)
          ? proposal.strategic_objectives.map((so: any) =>
              typeof so === "object" ? String(so.id) : String(so),
            )
          : Array.isArray(proposal.strategicObjectives)
            ? proposal.strategicObjectives.map((so: any) =>
                typeof so === "object" ? String(so.id) : String(so),
              )
            : [],
      };

      // Map team members
      const rawTeamMembers =
        proposal.teamMembers || proposal.team_members || [];
      if (Array.isArray(rawTeamMembers) && rawTeamMembers.length > 0) {
        const internalMembers = rawTeamMembers
          .filter((tm: any) => tm.member_type === "internal")
          .map((tm: any) => ({
            backendId: tm.id,
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

        const externalMembers = rawTeamMembers
          .filter((tm: any) => tm.member_type === "external")
          .map((tm: any) => ({
            backendId: tm.id,
            role:
              tm.role && typeof tm.role === "object"
                ? String(tm.role.id)
                : tm.role
                  ? String(tm.role)
                  : "",
            organizationName: tm.organization_name || tm.organizationName || "",
            stakeholderName: tm.stakeholder_name || tm.stakeholderName || "",
            position: tm.position || "",
            phoneNumber: tm.phone_number || tm.phoneNumber || "",
            email: tm.email || "",
          }));

        formData.teamMembers = internalMembers;
        formData.stakeholders = externalMembers;
      }

      // Map files
      if (proposal.files && proposal.files.length > 0) {
        const technicalProposal = proposal.files.find(
          (f: any) =>
            f.file_type === "proposal" ||
            f.description === "proposal" ||
            f.file_type === "proposal_file",
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

        const budgetFile = proposal.files.find(
          (f: any) =>
            f.file_type === "budget" ||
            f.description === "budget" ||
            f.file_type === "supporting_docs",
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

      // Fallback for flat file fields
      if (
        !formData.technicalProposal &&
        (proposal.proposalFile || proposal.proposal_file)
      ) {
        const fileUrl = proposal.proposalFile || proposal.proposal_file;
        formData.technicalProposal = {
          name: fileUrl.split("/").pop() || "Technical Proposal",
          file: fileUrl,
          file_type: "proposal",
        } as any;
      }
      if (
        !formData.budgetFile &&
        (proposal.budgetFile ||
          proposal.budget_file ||
          proposal.supportingDocs ||
          proposal.supporting_docs ||
          proposal.supporting_file ||
          proposal.supportingFile)
      ) {
        const fileUrl =
          proposal.budgetFile ||
          proposal.budget_file ||
          proposal.supportingDocs ||
          proposal.supporting_docs ||
          proposal.supporting_file ||
          proposal.supportingFile;
        formData.budgetFile = {
          name: fileUrl.split("/").pop() || "Budget File",
          file: fileUrl,
          file_type: "budget",
        } as any;
      }
      if (proposal.signature) {
        const fileUrl = proposal.signature;
        formData.signature = {
          name: fileUrl.split("/").pop() || "Signature",
          file: fileUrl,
          file_type: "signature",
        } as any;
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
          let templateSectionId =
            response.template_section?.id ||
            response.template_section ||
            response.template_section_id;

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

      if (formData.grantCallId) {
        form.setValue("grantCallId", formData.grantCallId);
      }
      if (formData.proposalType) {
        form.setValue("proposalType", formData.proposalType);
      }
      if (formData.subProposalTypeId) {
        form.setValue("subProposalTypeId", formData.subProposalTypeId);
      }

      const grantCallIdForFetch = formData.grantCallId;
      const submissionLevelForFetch = formData.submissionLevel;
      const officeToSubmitForFetch = formData.officeToSubmit;

      // Directly reset the form with fetched proposal data.
      // Removed prefetch/ensureQuery usage to avoid fetching proposal options
      // via API_ENDPOINTS.PROPOSALS.OPTIONS during form population.
      try {
        if (!mountedRef.current || !formDataRef.current) {
          isResettingRef.current = false;
        } else {
          const dataToReset = formDataRef.current;
          form.reset(dataToReset);
          lastSavedDataRef.current = serializeFormValues(dataToReset as any);
          lastSavedValuesRef.current = dataToReset;
          setSaveStatus("saved");
          isResettingRef.current = false;
        }
      } catch (error) {
        console.error("Error resetting form:", error);
        isResettingRef.current = false;
      }
    }
  }, [
    existingProposal,
    proposalId,
    form,
    queryClient,
    sectionsData,
    isLoadingSections,
  ]);

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
          "thematicAreas",
          "subThematicArea",
        ];
        break;
      case 2:
        fieldsToValidate = ["teamMembers", "stakeholders"];
        break;
      case 3:
        fieldsToValidate = ["abstract", "keywords", "submissionType"];
        const technicalProposal = form.getValues("technicalProposal");
        if (technicalProposal instanceof File) {
          fieldsToValidate.push("technicalProposal");
        }
        break;
      case 4:
        fieldsToValidate = ["budgetRequested"];
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

  const handleManualSave = async () => {
    if (saveStatusTimeoutRef.current) {
      clearTimeout(saveStatusTimeoutRef.current);
      saveStatusTimeoutRef.current = null;
    }

    const values = form.getValues();

    if (isSavingRequestRef.current) {
      nextSaveValuesRef.current = values;
      toast.info("Save in progress, queuing draft save...");
    } else {
      try {
        await performSaveRequest(values);
        toast.success("Draft saved!");
      } catch (error: any) {
        const errorMessage = extractFullErrorMessage(error);
        const errorDetails = error?.response?.data?.error?.details || 
                            error?.data?.error?.details ||
                            error?.details || {};
        
        if (Object.keys(errorDetails).length > 0) {
          applyBackendErrorsToForm(form, errorDetails);
          toast.error("Please fix the validation errors and try again.");
        } else {
          toast.error(errorMessage);
        }
      }
    }
  };

  const onSubmit = async (
    data: ProposalFormInput,
    status: "draft" | "submitted" = "submitted",
  ) => {
    try {
      setIsSaving(true);

      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
        saveStatusTimeoutRef.current = null;
      }

      // Wait for any running queue to clear
      await new Promise<void>((resolve) => {
        const check = () => {
          if (!isSavingRequestRef.current && !nextSaveValuesRef.current) {
            resolve();
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });

      const values = form.getValues();
      let currentId =
        activeProposalId && activeProposalId !== "undefined"
          ? activeProposalId
          : "";
      if (!currentId && proposalId && proposalId !== "undefined") {
        currentId = proposalId;
      }

      const modified = getModifiedFields(values, lastSavedValuesRef.current);
      const hasUnsavedChanges = Object.keys(modified).length > 0;

      if (hasUnsavedChanges || !currentId) {
        setSaveStatus("saving");
        try {
          if (currentId) {
            const formData = buildModifiedProposalFormData(modified);
            await apiClient.patch(
              API_ENDPOINTS.PROPOSALS.UPDATE(currentId),
              formData,
              {
                headers: { "Content-Type": "multipart/form-data" },
              },
            );
          } else {
            const formData = buildProposalFormData(values);
            const res = await apiClient.post(
              API_ENDPOINTS.PROPOSALS.CREATE,
              formData,
              {
                headers: { "Content-Type": "multipart/form-data" },
              },
            );
            const rawId = res.data?.data?.id ?? res.data?.id;
            if (rawId) {
              currentId = String(rawId);
              setActiveProposalId(currentId);
              const newUrl = `${window.location.pathname}?edit=${currentId}`;
              window.history.replaceState(
                { ...window.history.state, as: newUrl, url: newUrl },
                "",
                newUrl,
              );

              await syncProposalTeamMembers(currentId, values);
            } else {
              throw new Error(
                "Failed to retrieve proposal ID from create response.",
              );
            }
          }

          lastSavedValuesRef.current = {
            ...lastSavedValuesRef.current,
            ...modified,
          };
          lastSavedDataRef.current = serializeFormValues(values);
          setSaveStatus("saved");
        } catch (saveError: any) {
          // Re-throw with context
          throw saveError;
        }
      }

      if (status === "submitted") {
        if (!currentId) {
          throw new Error("Cannot submit a proposal that has not been saved.");
        }
        
        try {
          await apiClient.post(API_ENDPOINTS.PROPOSALS.SUBMIT(currentId));
        } catch (submitError: any) {
          throw submitError;
        }

        try {
          if (!proposalId || proposalId === "undefined") {
            await syncProposalTeamMembers(currentId, values);
          }
        } catch (syncError) {
          // Log but don't fail submission if team members sync fails
          console.warn("Warning: Failed to sync team members after submission", syncError);
        }

        toast.success("Proposal submitted successfully!");
      } else {
        toast.success(
          activeProposalId || proposalId
            ? "Proposal updated successfully!"
            : "Proposal saved as draft!",
          {
            description: "You can continue editing your proposal later.",
          },
        );
      }

      setTimeout(() => {
        router.push("/research/proposals/my-proposals");
        setTimeout(() => {
          router.refresh();
        }, 500);
      }, 1000);
    } catch (error: any) {
      console.error("Proposal submission error:", error);
      setSaveStatus("failed");
      
      // Extract error details for form field errors
      const errorDetails = error?.response?.data?.error?.details || 
                          error?.data?.error?.details ||
                          error?.details || {};
      
      // Extract comprehensive error message
      const errorMessage = extractFullErrorMessage(error);
      
      // Apply backend validation errors to form fields if they exist
      if (Object.keys(errorDetails).length > 0) {
        applyBackendErrorsToForm(form, errorDetails);
        toast.error("Please fix the validation errors below and try again.");
      } else if (errorMessage && errorMessage !== "Failed to process request. Please try again.") {
        toast.error(errorMessage);
      } else {
        toast.error("Failed to submit proposal. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Show loading state while fetching and populating proposal data in edit mode */}
      {proposalId && (isLoadingProposal || !hasPopulatedFormRef.current) ? (
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
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      Step {currentStep}: {steps[currentStep - 1].label}
                    </CardTitle>
                    {renderSaveStatus()}
                  </div>
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
                  {currentStep === 2 && (
                    <ProposalTeamStep proposalId={queryProposalId} />
                  )}
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
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleManualSave}
                          disabled={isSubmitting}
                        >
                          Save Draft
                        </Button>
                        <Button type="button" onClick={handleNext}>
                          Next
                        </Button>
                      </div>
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
