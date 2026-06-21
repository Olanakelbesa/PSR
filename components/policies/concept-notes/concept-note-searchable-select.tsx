"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ConceptNoteSelectOption = {
  id: number | string;
  title: string;
  docType?: { id: number; name: string } | null;
  organization?: { id: number; name: string } | null;
};

interface ConceptNoteSearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: ConceptNoteSelectOption[];
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  noResultsMessage?: string;
  className?: string;
  triggerClassName?: string;
}

function matchesSearch(option: ConceptNoteSelectOption, query: string) {
  const haystack = [
    option.title,
    String(option.id),
    option.docType?.name,
    option.organization?.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export function ConceptNoteSearchableSelect({
  value,
  onValueChange,
  options,
  disabled = false,
  isLoading = false,
  placeholder = "Choose an approved concept note...",
  searchPlaceholder = "Search by title, ID, or type...",
  emptyMessage = "No approved concept notes found.",
  noResultsMessage = "No concept notes match your search.",
  className,
  triggerClassName,
}: ConceptNoteSearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedOption = useMemo(
    () => options.find((item) => String(item.id) === value) ?? null,
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => matchesSearch(option, query));
  }, [options, searchQuery]);

  const scrollThreshold = 5;
  const shouldScrollList = filteredOptions.length > scrollThreshold;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearchQuery("");
    }
  };

  const handleSelect = (conceptId: string) => {
    onValueChange(conceptId);
    setSearchQuery("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className={cn(
            "h-auto min-h-11 w-full min-w-0 items-start justify-between whitespace-normal px-3 py-2.5 text-left font-normal shadow-sm focus-visible:ring-primary/20",
            triggerClassName,
          )}
        >
          <span
            className={cn(
              "min-w-0 flex-1 leading-snug wrap-break-word",
              selectedOption ? "font-medium" : "text-muted-foreground",
            )}
          >
            {selectedOption
              ? selectedOption.title
              : isLoading
                ? "Loading approved concept notes..."
                : placeholder}
          </span>
          <ChevronDown className="ml-2 mt-1 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn("w-(--radix-popover-trigger-width) p-0", className)}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList
            className={cn(
              !shouldScrollList && "max-h-none overflow-visible",
              shouldScrollList && "max-h-70 sm:max-h-72",
            )}
          >
            {isLoading ? (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                Loading approved concept notes...
              </div>
            ) : options.length === 0 ? (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            ) : filteredOptions.length === 0 ? (
              <CommandEmpty>{noResultsMessage}</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredOptions.map((concept) => {
                  const conceptId = String(concept.id);
                  const isSelected = value === conceptId;

                  return (
                    <CommandItem
                      key={concept.id}
                      value={conceptId}
                      onSelect={() => handleSelect(conceptId)}
                      className="h-auto items-start py-2.5 whitespace-normal"
                    >
                      <Check
                        className={cn(
                          "mt-0.5 size-4 shrink-0",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div className="flex min-w-0 flex-col gap-1 text-left">
                        <span className="font-semibold leading-snug wrap-break-word">
                          {concept.title}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground wrap-break-word">
                          ID: {concept.id}
                          {concept.docType?.name
                            ? ` · ${concept.docType.name}`
                            : ""}
                        </span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
