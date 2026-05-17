"use client";

import { useState, useMemo, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import type { ProposalFormInput } from "@/lib/validators/proposal.schema";
import { useProposalTemplateSections } from "@/lib/queries/proposal-template-section";
import type { Section, SectionId } from "./types";

export function useFilesStep() {
  const form = useFormContext<ProposalFormInput>();
  const { data: backendSections = [], isLoading: isLoadingSections } =
    useProposalTemplateSections({
      proposal_type: form.watch("proposalType")
        ? Number(form.watch("proposalType"))
        : undefined,
    });

  // Map only the available sections from backend
  const allSections = useMemo(() => {
    if (!backendSections || backendSections.length === 0) {
      return [];
    }

    // Return backend sections sorted by order
    return [...backendSections].sort((a, b) => a.order - b.order);
  }, [backendSections]);

  // Set initial active section to first section when sections are loaded
  const [activeSection, setActiveSection] = useState<string>("introduction");

  // Update active section when sections are loaded
  useEffect(() => {
    if (allSections.length > 0) {
      // If current active section doesn't exist in new sections, switch to first one
      if (!allSections.find((s) => s.id.toString() === activeSection)) {
        setActiveSection(allSections[0].id.toString());
      }
    }
  }, [allSections, activeSection]);

  const getSectionConfig = (sectionId: string) => {
    // Find section from backend data
    return allSections.find((section) => section.id.toString() === sectionId);
  };

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    const mainContent = document.querySelector("[data-main-content]");
    mainContent?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeSectionData = allSections.find(
    (s) => s.id.toString() === activeSection
  );

  return {
    form,
    activeSection,
    allSections,
    activeSectionData,
    getSectionConfig,
    handleSectionClick,
    isLoadingSections,
  };
}
