"use client";

import { useFormContext, useWatch } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import TagInput from "@/components/ui/tag-input";
import type { ProposalFormInput } from "@/lib/validators/proposal.schema";
import RichTextEditor from "@/components/RichTextEditor";

export function AbstractKeywordsSection() {
  const form = useFormContext<ProposalFormInput>();

  return (
    <>
      {/* Abstract - Common for both modes */}
      <FormField
        name="abstract"
        render={({ field }) => (
          <FormItem data-field="abstract">
            <FormLabel>
              Executive Summary <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <div className="rounded-md border border-input">
                <RichTextEditor
                  content={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Enter your proposal executive summary (minimum 100 characters)..."
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
