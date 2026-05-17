"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { CalendarClock } from "lucide-react";
import type { ProposalFormInput } from "@/lib/validators/proposal.schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StyledDatePicker } from "@/components/ui/date-picker";
import { useDateConstraints } from "./hooks";
import { cn } from "@/lib/utils";

export function ProjectDurationSection() {
  const form = useFormContext<ProposalFormInput>();
  const startDate = form.watch("startDate");
  const { minEndDate } = useDateConstraints();

  return (
    <Card className="border-2 transition-all duration-300 hover:shadow-lg hover:border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/10 text-primary shadow-sm">
            <CalendarClock className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl font-semibold">
              Project Duration
            </CardTitle>
            <CardDescription className="mt-1">
              Specify the start and end dates for your project
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field, fieldState }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date *</FormLabel>
                <FormControl>
                  <StyledDatePicker
                    selected={field.value}
                    onChange={(date) => field.onChange(date)}
                    placeholder="Select start date"
                    minDate={new Date()}
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
            name="endDate"
            render={({ field, fieldState }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date *</FormLabel>
                <FormControl>
                  <StyledDatePicker
                    selected={field.value}
                    onChange={(date) => field.onChange(date)}
                    placeholder="Select end date"
                    disabled={!startDate}
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
