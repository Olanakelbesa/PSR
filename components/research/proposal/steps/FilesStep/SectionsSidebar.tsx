"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProposalTemplateSection } from "@/types/proposal-template-section";

interface SectionsSidebarProps {
  sections: ProposalTemplateSection[];
  activeSection: string;
  onSectionClick: (sectionId: string) => void;
  isLoading?: boolean;
}

export function SectionsSidebar({
  sections,
  activeSection,
  onSectionClick,
  isLoading = false,
}: SectionsSidebarProps) {
  return (
    <aside className="w-80 border-r border-border bg-muted/30 p-4">
      <div className="space-y-1">
        <div className="mb-4 px-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Proposal Sections
          </h3>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading sections...
            </span>
          </div>
        ) : sections.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No sections available</p>
          </div>
        ) : (
          sections.map((section, index) => (
            <button
              key={section.id}
              type="button"
              onClick={() => onSectionClick(section.id.toString())}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                activeSection === section.id.toString()
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {index + 1}.
                </span>
                {section.title}
              </span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
