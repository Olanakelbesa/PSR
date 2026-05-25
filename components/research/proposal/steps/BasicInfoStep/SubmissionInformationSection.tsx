"use client";

import React, { useCallback } from "react";
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
import { useOfficesForSelect } from "@/lib/queries/office";

export function SubmissionInformationSection() {
  const form = useFormContext<ProposalFormInput>();
  const submissionLevel = form.watch("submissionLevel");

  const useReceivingOfficeOptions = useCallback(
    (params?: { search?: string; limit?: number }) => {
      return useOfficesForSelect(params);
    },
    [],
  );

  const useOfficeSubmitOptions = useCallback(
    (params?: { search?: string; limit?: number }) => {
      return useUnitsForSelect({ ...params, organization: submissionLevel });
    },
    [submissionLevel],
  );

  const handleSubmissionLevelChange = useCallback(
    (value: string) => {
      form.setValue("submissionLevel", value);
      form.setValue("officeToSubmit", undefined);
      form.setValue("receivingOffice", undefined);
    },
    [form],
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
              Select the organization and receiving office for this proposal
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

          <FormField
            control={form.control}
            name="receivingOffice"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Submitting Office *</FormLabel>
                <FormControl>
                  <SearchableSelect
                    key="receiving-office"
                    value={String(field.value || "")}
                    onValueChange={field.onChange}
                    useQueryHook={useReceivingOfficeOptions}
                    getOptionValue={(office: any) => String(office.id)}
                    getOptionLabel={(office: any) => office.name}
                    placeholder="Select Receiving Office"
                    searchPlaceholder="Search offices..."
                    emptyMessage="No offices found"
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
