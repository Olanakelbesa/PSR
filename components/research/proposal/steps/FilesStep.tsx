"use client";

import { AbstractKeywordsSection } from "./FilesStep/AbstractKeywordsSection";
import { SubmissionTypeToggle } from "./FilesStep/SubmissionTypeToggle";
import { DocumentUploadSection } from "./FilesStep/DocumentUploadSection";
import { SectionsSidebar } from "./FilesStep/SectionsSidebar";
import { MainContentArea } from "./FilesStep/MainContentArea";
import { ContentRenderer } from "./FilesStep/ContentRenderer";
import { useFilesStep } from "./FilesStep/hooks";
import { ProposalTemplateSection } from "@/types/proposal-template-section";

export function ProposalFilesStep() {
  const {
    form,
    activeSection,
    allSections,
    activeSectionData,
    getSectionConfig,
    handleSectionClick,
    isLoadingSections,
  } = useFilesStep();

  const submissionType = form.watch("submissionType") || "document_upload";

  return (
    <div className="space-y-6">
      <AbstractKeywordsSection />
      <DocumentUploadSection />
    </div>
  );
}
