"use client";

import { ProposalTemplateSection } from "@/types/proposal-template-section";

interface MainContentAreaProps {
  activeSection: string;
  activeSectionData: ProposalTemplateSection | undefined;
  renderContent: () => React.ReactNode;
}

export function MainContentArea({
  activeSection,
  activeSectionData,
  renderContent,
}: MainContentAreaProps) {
  return (
    <div className="flex-1 p-6" data-main-content>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">
            {activeSectionData?.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {activeSectionData?.id.toString() === "abstract"
              ? "Provide a concise summary of your research proposal"
              : `Fill in the details for ${activeSectionData?.title.toLowerCase()}`}
          </p>
        </div>
        <div className="animate-in fade-in-50 duration-200">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
