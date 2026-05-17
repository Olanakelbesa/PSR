"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProposalFormInput } from "@/lib/validators/proposal.schema";
import { Plus, Building2 } from "lucide-react";
import { ExternalStakeholderCard } from "./ExternalStakeholderCard";

export function ExternalStakeholdersSection() {
  const form = useFormContext<ProposalFormInput>();
  const {
    fields: stakeholderFields,
    append: appendStakeholder,
    remove: removeStakeholder,
  } = useFieldArray({
    control: form.control,
    name: "stakeholders",
  });

  return (
    <>
      <Card className="border-2 transition-all duration-300 hover:shadow-lg hover:border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/10 text-primary shadow-sm">
                <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg sm:text-xl font-semibold">
                  External Stakeholders
                </CardTitle>
                <CardDescription className="mt-1 text-sm">
                  Add external stakeholders to your proposal
                </CardDescription>
              </div>
            </div>
            {stakeholderFields.length === 0 && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() =>
                  appendStakeholder({
                    organizationName: "",
                    stakeholderName: "",
                    position: "",
                    phoneNumber: "",
                    email: "",
                    role: "",
                  })
                }
                className="shrink-0 w-full sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Stakeholder
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {stakeholderFields.map((field, index) => (
        <ExternalStakeholderCard
          key={field.id}
          index={index}
          onRemove={() => removeStakeholder(index)}
        />
      ))}

      {stakeholderFields.length > 0 && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() =>
              appendStakeholder({
                organizationName: "",
                stakeholderName: "",
                position: "",
                phoneNumber: "",
                email: "",
                role: "",
              })
            }
            className="shrink-0 w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Stakeholder
          </Button>
        </div>
      )}
    </>
  );
}
