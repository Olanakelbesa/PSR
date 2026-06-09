"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useStrategicObjectives } from "@/lib/queries/strategic-objective";
import type { ConceptNoteFormData } from "@/lib/validations";

type StrategicObjectiveOption = {
  id: string;
  name: string;
};

export function StrategicObjectivesField() {
  const form = useFormContext<ConceptNoteFormData>();
  const selectedStrategicObjectives =
    (useWatch({
      control: form.control,
      name: "strategicObjectives",
      defaultValue: [],
    }) as string[]) ?? [];

  const { data: strategicObjectivesData = [] } = useStrategicObjectives({
    // Strategic objectives are reference data with a naturally small count.
    // 200 is a safe cap; the SearchableSelect filters client-side from this list.
    limit: 200,
  });

  const strategicOptions: StrategicObjectiveOption[] = strategicObjectivesData.map(
    (objective) => ({
      id: String(objective.id),
      name: objective.name,
    }),
  );

  return (
    <FormField
      control={form.control}
      name="strategicObjectives"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Strategic Objectives</FormLabel>
          <p className="text-sm text-muted-foreground">
            Select one or more strategic objectives that best align with this
            concept note.
          </p>
          <FormControl>
            <SearchableSelect<StrategicObjectiveOption>
              value=""
              onValueChange={(value) => {
                if (!value) return;
                if (selectedStrategicObjectives.includes(value)) return;
                field.onChange([...selectedStrategicObjectives, value]);
              }}
              additionalOptions={strategicOptions}
              getOptionValue={(option) => option.id}
              getOptionLabel={(option) => option.name}
              placeholder="Select strategic objectives"
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
  );
}