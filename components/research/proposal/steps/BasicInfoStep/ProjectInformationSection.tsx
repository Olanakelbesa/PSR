"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Target } from "lucide-react";
import type { ProposalFormInput } from "@/lib/validators/proposal.schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useThematicAreas } from "@/lib/queries/thematic-area";
import {
  useSubThematicAreas,
} from "@/lib/queries/sub-thematic-area";
import { useProposalResponse } from "@/lib/queries/proposals";
import { useSearchParams } from "next/navigation";
import type { Theme, SubThematicArea } from "@/types/thematic-area";

export function ProjectInformationSection() {
  const form = useFormContext<ProposalFormInput>();
  const searchParams = useSearchParams();
  const proposalId = searchParams.get("edit");

  // Fetch full proposal response if in edit mode (to get thematic area name from response)
  const { data: proposalResponse } = useProposalResponse(proposalId || "");

  // Get thematic area name from proposal response (for fallback when API fails)
  const thematicAreaNameFromProposal =
    proposalResponse?.data?.thematic_area?.name;

  // Fetch thematic areas - handle 403 gracefully (optional for edit mode)
  const {
    data: thematicAreasData,
    isLoading: isLoadingThematicAreas,
    isError: isThematicAreasError,
  } = useThematicAreas();

  // Get thematic area from form value (comes from proposal response in edit mode)
  const thematicAreaId = form.watch("thematicArea");
  const subThematicAreaId = form.watch("subThematicArea");

  // Fetch sub thematic areas filtered by selected thematic area
  const { data: subThematicAreasData, isLoading: isLoadingSubThematicAreas } =
    useSubThematicAreas({
      thematic_area: thematicAreaId ? Number(thematicAreaId) : undefined,
      limit: 1000,
    });

  // Wrapper hook for sub thematic areas options (filtered by thematic area)
  const useSubThematicAreasOptions = useCallback(
    (params?: { search?: string }) => {
      const allData = subThematicAreasData?.data || [];

      // Apply frontend search filter
      const filteredData =
        params?.search && params.search.trim()
          ? allData.filter((subTheme) =>
              subTheme.name
                .toLowerCase()
                .includes(params.search!.toLowerCase()),
            )
          : allData;

      return {
        data: filteredData,
        isLoading: isLoadingSubThematicAreas,
        isError: false,
      };
    },
    [subThematicAreasData, isLoadingSubThematicAreas],
  );

  // Handle thematic area change - clear sub thematic area
  const handleThematicAreaChange = useCallback(
    (value: string) => {
      form.setValue("thematicArea", value);
      form.setValue("subThematicArea", undefined);
    },
    [form],
  );

  // Wrapper hook with frontend filtering for SearchableSelect
  // If API fails (403), create a fallback option from proposal data
  const useThematicAreasOptions = useCallback(
    (params?: { search?: string }) => {
      const allData = thematicAreasData?.data || [];

      // If API failed but we have a value from proposal, create a fallback option
      let dataToUse = allData;
      if (isThematicAreasError && thematicAreaId) {
        // In edit mode with 403, use the name from proposal response
        const fallbackName = thematicAreaNameFromProposal || "Thematic Area";
        dataToUse = [
          {
            id: Number(thematicAreaId),
            name: fallbackName,
          },
        ];
      }

      // Apply frontend search filter
      const filteredData =
        params?.search && params.search.trim()
          ? dataToUse.filter((theme) =>
              theme.name.toLowerCase().includes(params.search!.toLowerCase()),
            )
          : dataToUse;

      return {
        data: filteredData,
        isLoading: isLoadingThematicAreas && !isThematicAreasError,
        isError: isThematicAreasError,
      };
    },
    [
      thematicAreasData,
      isLoadingThematicAreas,
      isThematicAreasError,
      thematicAreaId,
      thematicAreaNameFromProposal,
    ],
  );

  // FIX: Explicitly set value AFTER options load (for edit mode)
  // Use refs to track if we've already processed values to prevent infinite loops
  const hasProcessedThematicAreaRef = React.useRef(false);
  const thematicAreasLengthRef = React.useRef(0);

  useEffect(() => {
    const thematicAreas = thematicAreasData?.data || [];
    const currentLength = thematicAreas.length;
    const lengthChanged = currentLength !== thematicAreasLengthRef.current;

    // Only process if we have thematic areas and length changed (meaning new data loaded)
    if (
      currentLength > 0 &&
      lengthChanged &&
      !hasProcessedThematicAreaRef.current
    ) {
      const currentValue = form.getValues("thematicArea");
      if (currentValue) {
        // Check if value exists in options
        const option = thematicAreas.find(
          (theme) => String(theme.id) === currentValue,
        );
        if (option) {
          // Mark as processed first to prevent loops
          hasProcessedThematicAreaRef.current = true;
          thematicAreasLengthRef.current = currentLength;

          // Use requestAnimationFrame to avoid state update during render
          requestAnimationFrame(() => {
            form.setValue("thematicArea", currentValue, {
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
      thematicAreasLengthRef.current = currentLength;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thematicAreasData?.data?.length]);

  return (
    <Card className="border-2 transition-all duration-300 hover:shadow-lg hover:border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/10 text-primary shadow-sm">
            <Target className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl font-semibold">
              Project Information
            </CardTitle>
            <CardDescription className="mt-1">
              Select the thematic area for your project
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="thematicArea"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Thematic Area *</FormLabel>
                <FormControl>
                  <SearchableSelect<Theme>
                    key={`thematic-area-${thematicAreasData?.data?.length || 0}-${thematicAreaId || ""}`}
                    value={field.value || ""}
                    onValueChange={handleThematicAreaChange}
                    useQueryHook={useThematicAreasOptions}
                    getOptionValue={(theme) => String(theme.id)}
                    getOptionLabel={(theme) => theme.name}
                    placeholder="Please select Thematic area"
                    searchPlaceholder="Search thematic areas..."
                    emptyMessage={
                      isThematicAreasError
                        ? "Using value from proposal"
                        : "No thematic areas available"
                    }
                    noResultsMessage="No thematic areas found"
                    loadingMessage="Loading thematic areas..."
                    limit={5}
                    error={!!fieldState.error}
                    triggerClassName={cn(
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
            name="subThematicArea"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Sub Thematic Area</FormLabel>
                <FormControl>
                  <SearchableSelect<SubThematicArea>
                    key={`sub-thematic-area-${thematicAreaId || ""}-${subThematicAreasData?.data?.length || 0}-${subThematicAreaId || ""}`}
                    value={field.value ?? ""}
                    onValueChange={(value) => {
                      field.onChange(value === "" ? undefined : value);
                    }}
                    useQueryHook={useSubThematicAreasOptions}
                    getOptionValue={(subTheme) => String(subTheme.id)}
                    getOptionLabel={(subTheme) => subTheme.name}
                    placeholder={
                      thematicAreaId
                        ? "Select a sub thematic area (optional)"
                        : "Select thematic area first"
                    }
                    searchPlaceholder="Search sub thematic areas..."
                    emptyMessage={
                      thematicAreaId
                        ? "No sub thematic areas available"
                        : "Select thematic area first"
                    }
                    noResultsMessage="No sub thematic areas found"
                    loadingMessage="Loading sub thematic areas..."
                    limit={5}
                    disabled={!thematicAreaId}
                    error={!!fieldState.error}
                    triggerClassName={cn(
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
