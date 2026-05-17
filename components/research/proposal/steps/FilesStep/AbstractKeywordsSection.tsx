"use client";

import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import TagInput from "@/components/ui/tag-input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { ProposalFormInput } from "@/lib/validators/proposal.schema";
import RichTextEditor from "@/components/RichTextEditor";

export function AbstractKeywordsSection() {
  const strategicOptions = [
    { id: "so-1", name: "Improve health system governance" },
    { id: "so-2", name: "Strengthen health workforce" },
    { id: "so-3", name: "Enhance service delivery" },
    { id: "so-4", name: "Promote research and innovation" },
  ];

  return (
    <>
      {/* Abstract - Common for both modes */}
      <FormField
        name="abstract"
        render={({ field }) => (
          <FormItem data-field="abstract">
            <FormLabel>
              Abstract <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <div className="rounded-md border border-input">
                <RichTextEditor
                  content={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Enter your proposal abstract (minimum 100 characters)..."
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Keywords - Common for both modes */}
      <div className="w-full space-y-4">
        <FormField
          control={useFormContext<ProposalFormInput>().control}
          name="strategicObjective"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold">
                Strategic Objective
              </FormLabel>
              <p className="text-sm text-muted-foreground">
                Select the strategic objective that best aligns with this
                proposal.
              </p>
              <FormControl>
                <SearchableSelect<{ id: string; name: string }>
                  value={String(field.value || "")}
                  onValueChange={(v) => field.onChange(v)}
                  additionalOptions={strategicOptions}
                  getOptionValue={(o) => String(o.id)}
                  getOptionLabel={(o) => o.name}
                  placeholder="Select Strategic Objective"
                  searchPlaceholder="Search objectives..."
                  emptyMessage="No objectives found"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="w-full space-y-4">
        <FormField
          control={useFormContext<ProposalFormInput>().control}
          name="keywords"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold">
                Keywords <span className="text-destructive">*</span>
              </FormLabel>
              <p className="text-sm text-muted-foreground">
                Enter relevant keywords for your research proposal. Press Enter
                or type a comma to add a tag.
              </p>
              <FormControl>
                <TagInput
                  tags={
                    (field.value as string | undefined)
                      ?.split(",")
                      .map((s) => s.trim())
                      .filter(Boolean) ?? []
                  }
                  onChange={(tags) => field.onChange(tags.join(", "))}
                  placeholder="e.g., research, methodology, data analysis, innovation"
                  className="text-sm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
}
