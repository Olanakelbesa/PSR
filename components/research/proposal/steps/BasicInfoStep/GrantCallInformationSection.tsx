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
import { Award } from "lucide-react";
import type { ProposalFormInput } from "@/lib/validators/proposal.schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useOpenGrantCallsForSelect,
  useGrantCall,
} from "@/lib/queries/grant-calls";
import { useProposalOptions } from "@/lib/queries/proposal-options";
import type { GrantCall } from "@/types/grant-call";
import type { ProposalOption } from "@/lib/queries/proposal-options";
import { useSearchParams } from "next/navigation";

export interface InitialGrantCallInfo {
  grant_call?: GrantCall | null;
  proposal_type?: ProposalOption | null;
  subcall?: ProposalOption | null;
}

interface GrantCallInformationSectionProps {
  initialGrantCallInfo?: InitialGrantCallInfo | null;
}

export function GrantCallInformationSection({
  initialGrantCallInfo,
}: GrantCallInformationSectionProps) {
  const form = useFormContext<ProposalFormInput>();

  const grantCallId = form.watch("grantCallId");
  const proposalTypeId = form.watch("proposalType");

  const searchParams = useSearchParams();
  const callId = searchParams.get("callId");

  const { data: proposalOptionsData, isLoading } = useProposalOptions(
    grantCallId,
    proposalTypeId,
  );

  const { data: currentGrantCall } = useGrantCall(
    grantCallId && !callId ? String(grantCallId) : "",
  );

  const grantCallAdditionalOptions = useMemo(() => {
    const options: GrantCall[] = [];
    if (currentGrantCall) options.push(currentGrantCall);
    if (initialGrantCallInfo?.grant_call) {
      const exists = options.some(
        (opt) => String(opt.id) === String(initialGrantCallInfo.grant_call?.id),
      );
      if (!exists) options.push(initialGrantCallInfo.grant_call);
    }
    return options;
  }, [currentGrantCall, initialGrantCallInfo]);

  const initialProposalTypeOptions = useMemo<ProposalOption[]>(() => {
    const proposalType = initialGrantCallInfo?.proposal_type;
    return proposalType?.id && proposalType?.name ? [proposalType] : [];
  }, [initialGrantCallInfo]);

  const initialSubcallOptions = useMemo<ProposalOption[]>(() => {
    const subcall = initialGrantCallInfo?.subcall;
    return subcall?.id && subcall?.name ? [subcall] : [];
  }, [initialGrantCallInfo]);

  /* ------------------------------------------------------------------
   * 1️⃣ Normalize options ONCE (FAST)
   * ------------------------------------------------------------------ */

  const proposalTypeOptions = useMemo(() => {
    const data = proposalOptionsData?.data?.proposal_type;
    if (!data) return [];

    if (data.options?.length) return data.options;
    if (data.id && data.name) return [{ id: data.id, name: data.name }];

    return [];
  }, [proposalOptionsData]);

  const subCallOptions = useMemo<ProposalOption[]>(() => {
    return proposalOptionsData?.data?.subcall?.options ?? [];
  }, [proposalOptionsData]);

  /* ------------------------------------------------------------------
   * 2️⃣ Fast filter callbacks (pure + memoized)
   * ------------------------------------------------------------------ */

  const getProposalTypeOptions = useCallback(
    (params?: { search?: string }) => {
      const q = params?.search?.toLowerCase().trim();

      return {
        data: q
          ? proposalTypeOptions.filter((o) => o.name.toLowerCase().includes(q))
          : proposalTypeOptions,
        isLoading,
        isError: false,
      };
    },
    [proposalTypeOptions, isLoading],
  );

  const getSubcallOptions = useCallback(
    (params?: { search?: string }) => {
      const q = params?.search?.toLowerCase().trim();

      return {
        data: q
          ? subCallOptions.filter((o) => o.name.toLowerCase().includes(q))
          : subCallOptions,
        isLoading,
        isError: false,
      };
    },
    [subCallOptions, isLoading],
  );

  /* ------------------------------------------------------------------
   * 3️⃣ Set grant call from URL (once)
   * ------------------------------------------------------------------ */

  useEffect(() => {
    if (!callId) return;

    if (!form.getValues("grantCallId")) {
      form.setValue("grantCallId", callId);
      form.setValue("proposalType", "");
      form.setValue("subProposalTypeId", "");
    }
  }, [callId, form]);

  /* ------------------------------------------------------------------
   * 4️⃣ Handlers (stable)
   * ------------------------------------------------------------------ */

  const handleGrantCallChange = useCallback(
    (value: string) => {
      form.setValue("grantCallId", value);
      form.setValue("proposalType", "");
      form.setValue("subProposalTypeId", "");
    },
    [form],
  );

  const handleProposalTypeChange = useCallback(
    (value: string) => {
      form.setValue("proposalType", value);
      form.setValue("subProposalTypeId", "");
    },
    [form],
  );

  /* ------------------------------------------------------------------
   * UI
   * ------------------------------------------------------------------ */

  return (
    <Card className="border-2 transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <CardTitle>Grant Call Information</CardTitle>
            <CardDescription>
              Select grant call and proposal type
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="grantCallId"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Grant Call *</FormLabel>
              <FormControl>
                <SearchableSelect<GrantCall>
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    handleGrantCallChange(v);
                  }}
                  useQueryHook={useOpenGrantCallsForSelect}
                  additionalOptions={grantCallAdditionalOptions}
                  getOptionValue={(c) => String(c.id)}
                  getOptionLabel={(c) => c.title}
                  placeholder="Select grant call"
                  error={!!fieldState.error}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="proposalType"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Proposal Type *</FormLabel>
                <FormControl>
                  <SearchableSelect
                    value={field.value}
                    onValueChange={handleProposalTypeChange}
                    useQueryHook={getProposalTypeOptions}
                    additionalOptions={initialProposalTypeOptions}
                    getOptionValue={(o) => String(o.id)}
                    getOptionLabel={(o) => o.name}
                    placeholder="Select proposal type"
                    disabled={!grantCallId || isLoading}
                    error={!!fieldState.error}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subProposalTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proposal Sub Type</FormLabel>
                <FormControl>
                  <SearchableSelect
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    useQueryHook={getSubcallOptions}
                    additionalOptions={initialSubcallOptions}
                    getOptionValue={(o) => String(o.id)}
                    getOptionLabel={(o) => o.name}
                    placeholder="Select sub type (optional)"
                    disabled={!proposalTypeId || isLoading}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
