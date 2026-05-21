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
import { useOrganizationsForSelect } from "@/lib/queries/organizations";
import { useUnitsForSelect } from "@/lib/queries/units";

export function SubmissionInformationSection() {
  const form = useFormContext<ProposalFormInput>();
  const grantCallId = form.watch("grantCallId");
  const submissionLevel = form.watch("submissionLevel");

  const useOfficeSubmitOptions = useCallback(
    (params?: { search?: string; limit?: number }) => {
      return useUnitsForSelect({ ...params, organization: submissionLevel });
    },
    [submissionLevel]
  );

  const handleSubmissionLevelChange = useCallback(
    (value: string) => {
      form.setValue("submissionLevel", value);
      form.setValue("officeToSubmit", undefined);
    },
    [form]
  );

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
                  <SearchableSelect
                    key="submission-level"
                    value={field.value}
                    onValueChange={handleSubmissionLevelChange}
                    useQueryHook={useOrganizationsForSelect}
                    getOptionValue={(org: any) => String(org.id)}
                    getOptionLabel={(org: any) => org.name}
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
                  <SearchableSelect
                    key={`office-${submissionLevel || ""}`}
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    useQueryHook={useOfficeSubmitOptions}
                    getOptionValue={(office: any) => String(office.id)}
                    getOptionLabel={(office: any) => office.name}
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
