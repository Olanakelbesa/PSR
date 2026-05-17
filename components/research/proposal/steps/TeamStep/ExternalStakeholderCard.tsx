"use client";

import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProposalFormInput } from "@/lib/validators/proposal.schema";
import { X, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface ExternalStakeholderCardProps {
  index: number;
  onRemove: () => void;
}

export function ExternalStakeholderCard({
  index,
  onRemove,
}: ExternalStakeholderCardProps) {
  const form = useFormContext<ProposalFormInput>();

  return (
    <Card className="border-2 transition-all duration-300 hover:shadow-lg hover:border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                External Stakeholder {index + 1}
              </CardTitle>
              <CardDescription className="mt-0.5">
                External stakeholder information and details
              </CardDescription>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name={`stakeholders.${index}.organizationName`}
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Organization Name
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter organization name"
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
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
            name={`stakeholders.${index}.stakeholderName`}
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Stakeholder Name
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter stakeholder name"
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
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
            name={`stakeholders.${index}.position`}
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Position
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter position"
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
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
            name={`stakeholders.${index}.phoneNumber`}
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Phone Number
                </FormLabel>
                <FormControl>
                  <PhoneInput
                    international
                    defaultCountry="ET"
                    value={field.value || undefined}
                    onChange={(value) => field.onChange(value || "")}
                    className={cn(
                      "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background transition-all duration-200 focus-within:ring-2 focus-within:ring-offset-2 phone-input-custom",
                      fieldState.error
                        ? "border-destructive focus-within:ring-destructive focus-within:border-destructive"
                        : "border-input focus-within:ring-ring focus-within:border-ring",
                    )}
                    numberInputProps={{
                      className:
                        "flex-1 border-0 bg-transparent outline-none placeholder:text-muted-foreground text-sm text-foreground",
                      placeholder: "Enter phone number",
                      autoComplete: "tel",
                    }}
                    countrySelectProps={{
                      className:
                        "border-0 bg-transparent outline-none focus:outline-none cursor-pointer text-foreground pr-2",
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`stakeholders.${index}.email`}
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
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
            name={`stakeholders.${index}.role`}
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">Role</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger
                      className={cn(
                        fieldState.error &&
                          "border-destructive focus:border-destructive focus:ring-destructive",
                      )}
                    >
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="co_pi">
                      Co-Principal Investigator
                    </SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="consultant">Consultant</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
