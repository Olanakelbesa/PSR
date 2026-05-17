"use client";

import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import type { ProposalFormInput } from "@/lib/validators/proposal.schema";
import { ProposalTemplateSection } from "@/types/proposal-template-section";
import RichTextEditor from "@/components/RichTextEditor";

interface ContentRendererProps {
  activeSection: string;
  allSections: ProposalTemplateSection[];
  getSectionConfig: (sectionId: string) => ProposalTemplateSection | undefined;
}

export function ContentRenderer({
  activeSection,
  allSections,
  getSectionConfig,
}: ContentRendererProps) {
  const form = useFormContext<ProposalFormInput>();

  // Render all sections, but only show the active one
  return (
    <>
      {allSections.map((section) => {
        const fieldName = section.id.toString();
        const isActive = activeSection === fieldName;

        return (
          <div
            key={fieldName}
            style={{ display: isActive ? "block" : "none" }}
            data-section={fieldName}
          >
            <FormField
              name={fieldName}
              shouldUnregister={false}
              render={({ field }) => {
                // Ensure value is always a string
                const stringValue =
                  typeof field.value === "string"
                    ? field.value ?? ""
                    : (field.value ?? "").toString();

                return (
                  <FormItem data-field={fieldName}>
                    <FormLabel>{section.title}</FormLabel>
                    <FormControl>
                      <div className="rounded-md border border-input">
                        <RichTextEditor
                          content={stringValue}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder={
                            `Enter content for ${section.title}...`
                          }
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>
        );
      })}
    </>
  );
}
