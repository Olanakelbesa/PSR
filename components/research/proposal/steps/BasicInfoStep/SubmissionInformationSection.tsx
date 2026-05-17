"use client";

import React, { useMemo, useCallback, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Building2 } from "lucide-react";
import type { ProposalFormInput } from "@/lib/validators/proposal.schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  useProposalOptions,
  useOfficeOptions,
  type ProposalOption,
  type OfficeOption,
} from "@/lib/queries/proposal-options";

export function SubmissionInformationSection() {
  const form = useFormContext<ProposalFormInput>();
  const grantCallId = form.watch("grantCallId");
  const submissionLevel = form.watch("submissionLevel");

  // Fetch submission levels from proposal options
  const { data: proposalOptionsData, isLoading: isLoadingOptions } =
    useProposalOptions(grantCallId);

  // Fetch offices based on grant call and submission level
  const { data: officeOptionsData, isLoading: isLoadingOffices } =
    useOfficeOptions(grantCallId, submissionLevel);

  // Wrapper hooks with frontend filtering for SearchableSelect
  const useSubmissionLevelOptions = useCallback(
    (params?: { search?: string }) => {
      const allData = (proposalOptionsData?.submission_levels ??
        []) as ProposalOption[];

      // Apply frontend search filter
      const filteredData =
        params?.search && params.search.trim()
          ? allData.filter((level) =>
              level.name.toLowerCase().includes(params.search!.toLowerCase()),
            )
          : allData;

      return {
        data: filteredData,
        isLoading: isLoadingOptions,
        isError: false,
      };
    },
    [proposalOptionsData, isLoadingOptions],
  );

  // Wrapper hook for offices with frontend filtering
  const useOfficeSubmitOptions = useCallback(
    (params?: { search?: string }) => {
      const allData = (officeOptionsData?.offices ?? []) as OfficeOption[];

      // Apply frontend search filter
      const filteredData =
        params?.search && params.search.trim()
          ? allData.filter((office) =>
              office.name.toLowerCase().includes(params.search!.toLowerCase()),
            )
          : allData;

      return {
        data: filteredData,
        isLoading: isLoadingOffices,
        isError: false,
      };
    },
    [officeOptionsData, isLoadingOffices],
  );

  const handleSubmissionLevelChange = useCallback(
    (value: string) => {
      form.setValue("submissionLevel", value);
      form.setValue("officeToSubmit", "");
    },
    [form],
  );

  // FIX 3: Explicitly set values AFTER options load (for edit mode)
  // Use refs to track if we've already processed values to prevent infinite loops
  const hasProcessedSubmissionLevelRef = React.useRef(false);
  const hasProcessedOfficeRef = React.useRef(false);
  const submissionLevelsLengthRef = React.useRef(0);
  const officesLengthRef = React.useRef(0);

  useEffect(() => {
    const submissionLevels = (proposalOptionsData?.submission_levels ??
      []) as ProposalOption[];
    const currentLength = submissionLevels.length;
    const lengthChanged = currentLength !== submissionLevelsLengthRef.current;

    // Only process if we have levels and length changed (meaning new data loaded)
    if (
      currentLength > 0 &&
      lengthChanged &&
      !hasProcessedSubmissionLevelRef.current
    ) {
      const currentValue = form.getValues("submissionLevel");
      if (currentValue) {
        // Check if value exists in options
        const option = submissionLevels.find(
          (level) => String(level.id) === currentValue,
        );
        if (option) {
          // Mark as processed first to prevent loops
          hasProcessedSubmissionLevelRef.current = true;
          submissionLevelsLengthRef.current = currentLength;

          // Use requestAnimationFrame to avoid state update during render
          requestAnimationFrame(() => {
            form.setValue("submissionLevel", currentValue, {
              shouldValidate: false,
              shouldDirty: false,
              shouldTouch: false,
            });
          });
        }
      }
    }

    // Update length ref even if we didn't process
    if (lengthChanged) {
      submissionLevelsLengthRef.current = currentLength;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalOptionsData?.submission_levels?.length]);

  useEffect(() => {
    const offices = (officeOptionsData?.offices ?? []) as OfficeOption[];
    const currentLength = offices.length;
    const lengthChanged = currentLength !== officesLengthRef.current;

    // Only process if we have offices and length changed (meaning new data loaded)
    if (currentLength > 0 && lengthChanged && !hasProcessedOfficeRef.current) {
      const currentValue = form.getValues("officeToSubmit");
      if (currentValue) {
        // Check if value exists in options
        const option = offices.find(
          (office) => String(office.id) === currentValue,
        );
        if (option) {
          // Mark as processed first to prevent loops
          hasProcessedOfficeRef.current = true;
          officesLengthRef.current = currentLength;

          // Use requestAnimationFrame to avoid state update during render
          requestAnimationFrame(() => {
            form.setValue("officeToSubmit", currentValue, {
              shouldValidate: false,
              shouldDirty: false,
              shouldTouch: false,
            });
          });
        }
      }
    }

    // Update length ref even if we didn't process
    if (lengthChanged) {
      officesLengthRef.current = currentLength;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [officeOptionsData?.offices?.length]);

  // Reset office refs when submission level changes (to allow re-setting office)
  useEffect(() => {
    hasProcessedOfficeRef.current = false;
    officesLengthRef.current = 0;
  }, [submissionLevel]);

  return (
    <Card className="border-2 transition-all duration-300 hover:shadow-lg hover:border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/10 text-primary shadow-sm">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl font-semibold">
              Submission Information
            </CardTitle>
            <CardDescription className="mt-1">
              Select the organization and unit where you will submit
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="submissionLevel"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Organization *</FormLabel>
                <FormControl>
                  <SearchableSelect<ProposalOption>
                    key={`submission-level-${proposalOptionsData?.submission_levels?.length || 0}`}
                    value={field.value}
                    onValueChange={handleSubmissionLevelChange}
                    useQueryHook={useSubmissionLevelOptions}
                    getOptionValue={(level) => String(level.id)}
                    getOptionLabel={(level) => level.name}
                    placeholder="Select Organization"
                    searchPlaceholder="Search organizations..."
                    emptyMessage="No organizations found"
                    className={cn(
                      fieldState.error &&
                        "border-destructive focus:border-destructive focus:ring-destructive",
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="officeToSubmit"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Unit *</FormLabel>
                <FormControl>
                  <SearchableSelect<OfficeOption>
                    key={`office-${officeOptionsData?.offices?.length || 0}-${submissionLevel || ""}`}
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    useQueryHook={useOfficeSubmitOptions}
                    getOptionValue={(office) => String(office.id)}
                    getOptionLabel={(office) => office.name}
                    placeholder={
                      submissionLevel
                        ? "Select Unit"
                        : "Select Organization first"
                    }
                    searchPlaceholder="Search units..."
                    emptyMessage="No units found"
                    className={cn(
                      fieldState.error &&
                        "border-destructive focus:border-destructive focus:ring-destructive",
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
