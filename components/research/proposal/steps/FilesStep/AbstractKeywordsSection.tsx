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
import type { ProposalFormInput } from "@/lib/validators/proposal.schema";
import RichTextEditor from "@/components/RichTextEditor";

export function AbstractKeywordsSection() {
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
          name="keywords"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold">
                Keywords <span className="text-destructive">*</span>
              </FormLabel>
              <p className="text-sm text-muted-foreground">
                Enter relevant keywords for your research proposal
                (comma-separated)
              </p>
              <FormControl>
                <Input
                  placeholder="e.g., research, methodology, data analysis, innovation"
                  value={field.value ?? ""}
                  onChange={field.onChange}
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
