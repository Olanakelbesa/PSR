"use client";

import { AbstractKeywordsSection } from "./AbstractKeywordsSection";
import { SubmissionTypeToggle } from "./SubmissionTypeToggle";
import { DocumentUploadSection } from "./DocumentUploadSection";
import { SectionsSidebar } from "./SectionsSidebar";
import { MainContentArea } from "./MainContentArea";
import { ContentRenderer } from "./ContentRenderer";
import { useFilesStep } from "./hooks";

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
      <SubmissionTypeToggle />

      <div className="flex gap-6">
        {submissionType === "on_site" && (
          <SectionsSidebar
            sections={allSections}
            activeSection={activeSection}
            onSectionClick={handleSectionClick}
            isLoading={isLoadingSections}
          />
        )}

        {submissionType === "document_upload" && <DocumentUploadSection />}

        {submissionType === "on_site" && (
          <MainContentArea
            activeSection={activeSection}
            activeSectionData={activeSectionData}
            renderContent={() => (
              <ContentRenderer
                activeSection={activeSection}
                allSections={allSections}
                getSectionConfig={getSectionConfig}
              />
            )}
          />
        )}
      </div>
    </div>
  );
}
