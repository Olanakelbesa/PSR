"use client";

import React, { useState, useMemo, useCallback } from "react";
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
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption<T = any> {
  value: string | number;
  label: string;
  data?: T;
}

export interface SortOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SearchableSelectProps<T = any> {
  // Value and change handlers
  value?: string;
  onValueChange?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;

  // Data fetching
  useQueryHook?: (params?: {
    search?: string;
    limit?: number;
    ordering?: string;
    [key: string]: any;
  }) => {
    data: any;
    isLoading: boolean;
    isError: boolean;
    [key: string]: any;
  };

  // Data extraction functions
  extractData?: (response: any) => T[];
  extractCount?: (response: any) => number;
  getOptionValue?: (item: T) => string | number;
  getOptionLabel?: (item: T) => string;

  // Display
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  noResultsMessage?: string;
  loadingMessage?: string;
  /** When set, shows this text in the trigger for the current value (so selected user shows even when not in current page) */
  selectedLabel?: string;

  // Configuration
  limit?: number;
  debounceMs?: number;
  disabled?: boolean;
  error?: boolean;

  // Sorting
  sortOptions?: SortOption[];
  defaultSort?: string;
  onSortChange?: (sortValue: string) => void;

  // Additional options to always include (e.g. for edit mode)
  additionalOptions?: T[];

  // Styling
  className?: string;
  triggerClassName?: string;
}

/**
 * Reusable searchable select component with backend filtering
 * Supports debounced search, result limiting, and scrollable dropdown
 */
export function SearchableSelect<T = any>({
  value,
  onValueChange,
  onOpenChange,
  useQueryHook,
  extractData,
  getOptionValue,
  getOptionLabel,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  emptyMessage = "No options available",
  noResultsMessage = "No results found",
  loadingMessage = "Loading...",
  selectedLabel,
  limit = 100,
  debounceMs = 300,
  disabled = false,
  error = false,
  additionalOptions,
  className,
  triggerClassName,
}: SearchableSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const debouncedSearch = useDebounce(searchQuery, debounceMs);

  const queryResult = useQueryHook?.({
    search: debouncedSearch.trim() || undefined,
    limit,
  });

  const isLoading = queryResult?.isLoading ?? false;
  const isError = queryResult?.isError ?? false;
  const rawData = queryResult?.data;

  const getValue = useCallback(
    (item: T): string => {
      if (getOptionValue) {
        return String(getOptionValue(item));
      }
      return String((item as any)?.id ?? "");
    },
    [getOptionValue],
  );

  const getLabel = useCallback(
    (item: T): string => {
      if (getOptionLabel) {
        return getOptionLabel(item);
      }
      return (
        (item as any)?.title ??
        (item as any)?.name ??
        (item as any)?.label ??
        String(item)
      );
    },
    [getOptionLabel],
  );

  const allOptions = useMemo(() => {
    let result: T[] = [];

    if (rawData) {
      if (extractData) {
        result = extractData(rawData);
      } else if (Array.isArray(rawData.results)) {
        result = rawData.results;
      } else if (Array.isArray(rawData.data)) {
        result = rawData.data;
      } else if (Array.isArray(rawData)) {
        result = rawData;
      }
    }

    if (additionalOptions && additionalOptions.length > 0) {
      const existingValues = new Set(result.map((item) => getValue(item)));
      const uniqueAdditional = additionalOptions.filter(
        (item) => !existingValues.has(getValue(item)),
      );
      result = [...uniqueAdditional, ...result];
    }

    return result;
  }, [rawData, extractData, additionalOptions, getValue]);

  const filteredOptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return allOptions;

    return allOptions.filter((item) => {
      const label = getLabel(item).toLowerCase();
      const val = getValue(item).toLowerCase();
      return label.includes(query) || val.includes(query);
    });
  }, [allOptions, searchQuery, getLabel, getValue]);

  const selectedItem = useMemo(() => {
    if (!value) return null;
    return allOptions.find((item) => getValue(item) === value) ?? null;
  }, [allOptions, value, getValue]);

  const currentDisplayLabel = useMemo(() => {
    if (selectedLabel) return selectedLabel;
    if (selectedItem) return getLabel(selectedItem);
    return null;
  }, [selectedLabel, selectedItem, getLabel]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    onOpenChange?.(nextOpen);
    if (!nextOpen) {
      setSearchQuery("");
    }
  };

  const handleSelect = (itemValue: string) => {
    onValueChange?.(itemValue);
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
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-between font-normal text-left shadow-sm transition-colors",
            error && "border-rose-500 focus-visible:ring-rose-500",
            !value && !currentDisplayLabel && "text-muted-foreground",
            triggerClassName,
          )}
        >
          <span className="truncate">
            {currentDisplayLabel || placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn("w-(--radix-popover-trigger-width) p-0 shadow-md", className)}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                {loadingMessage}
              </div>
            ) : isError ? (
              <div className="p-4 text-center text-xs text-rose-500">
                Error loading options
              </div>
            ) : allOptions.length === 0 ? (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            ) : filteredOptions.length === 0 ? (
              <CommandEmpty>{noResultsMessage}</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredOptions.map((item, index) => {
                  const itemVal = getValue(item);
                  const itemLabel = getLabel(item);
                  const isSelected = value === itemVal;

                  return (
                    <CommandItem
                      key={itemVal || index}
                      value={itemVal}
                      onSelect={() => handleSelect(itemVal)}
                      className="flex items-center justify-between cursor-pointer px-3 py-2 text-sm"
                    >
                      <span className="truncate">{itemLabel}</span>
                      <Check
                        className={cn(
                          "ml-2 h-4 w-4 shrink-0 text-primary transition-opacity",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                      />
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
