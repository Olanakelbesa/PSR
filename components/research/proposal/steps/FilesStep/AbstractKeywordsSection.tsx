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
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { ProposalFormInput } from "@/lib/validators/proposal.schema";
import RichTextEditor from "@/components/RichTextEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function AbstractKeywordsSection() {
  const strategicOptions = [
    { id: "so-1", name: "Improve health system governance" },
    { id: "so-2", name: "Strengthen health workforce" },
    { id: "so-3", name: "Enhance service delivery" },
    { id: "so-4", name: "Promote research and innovation" },
  ];

  const form = useFormContext<ProposalFormInput>();
  const selectedStrategicObjectives =
    (useWatch({
      control: form.control,
      name: "strategic_objectives",
      defaultValue: [],
    }) as string[]) ?? [];

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
          control={form.control}
          name="strategic_objectives"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold">
                Strategic Objectives
              </FormLabel>
              <p className="text-sm text-muted-foreground">
                Select one or more strategic objectives that best align with
                this proposal.
              </p>
             
              <FormControl>
                <SearchableSelect<{ id: string; name: string }>
                  value=""
                  onValueChange={(v) => {
                    if (!v) return;
                    if (selectedStrategicObjectives.includes(v)) return;
                    field.onChange([...selectedStrategicObjectives, v]);
                  }}
                  additionalOptions={strategicOptions}
                  getOptionValue={(o) => String(o.id)}
                  getOptionLabel={(o) => o.name}
                  placeholder="Select Strategic Objective(s)"
                  searchPlaceholder="Search objectives..."
                  emptyMessage="No objectives found"
                  selectedLabel=""
                />
              </FormControl>
               {selectedStrategicObjectives.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedStrategicObjectives.map((objectiveId) => {
                    const objective = strategicOptions.find(
                      (item) => item.id === objectiveId,
                    );
                    return (
                      <Badge
                        key={objectiveId}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        <span>{objective?.name ?? objectiveId}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 shrink-0 rounded-full p-0 text-muted-foreground hover:text-foreground"
                          onClick={() =>
                            field.onChange(
                              selectedStrategicObjectives.filter(
                                (item) => item !== objectiveId,
                              ),
                            )
                          }
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    );
                  })}
                </div>
              )}
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
