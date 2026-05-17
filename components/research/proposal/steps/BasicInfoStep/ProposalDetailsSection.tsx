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
import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";
import type { ProposalFormInput } from "@/lib/validators/proposal.schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TITLE_MAX_LENGTH = 300;

export function ProposalDetailsSection() {
  const form = useFormContext<ProposalFormInput>();
  const title = form.watch("title");
  const titleRemaining = TITLE_MAX_LENGTH - (title?.length || 0);

  return (
    <Card className="border-2 transition-all duration-300 hover:shadow-lg hover:border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/10 text-primary shadow-sm">
            <FileText className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl font-semibold">
              Proposal Details
            </CardTitle>
            <CardDescription className="mt-1">
              Provide a clear and descriptive title for your proposal
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-foreground">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Proposal Title *
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter proposal title"
                  className={cn(
                    "min-h-[80px] resize-none",
                    fieldState.error &&
                      "border-destructive focus:border-destructive focus:ring-destructive",
                  )}
                  maxLength={TITLE_MAX_LENGTH}
                  {...field}
                />
              </FormControl>
              <div className="flex items-center justify-between">
                <p
                  className={cn(
                    "text-sm",
                    titleRemaining < 50
                      ? "text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  {titleRemaining} characters remaining
                </p>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
