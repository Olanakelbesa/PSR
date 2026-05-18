"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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
  extractCount,
  getOptionValue,
  getOptionLabel,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  emptyMessage = "No options available",
  noResultsMessage = "No results found",
  loadingMessage = "Loading...",
  selectedLabel,
  limit = 10,
  debounceMs = 300,
  disabled = false,
  error = false,
  sortOptions,
  defaultSort,
  onSortChange,
  additionalOptions,
  className,
  triggerClassName,
}: SearchableSelectProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSort, setSelectedSort] = useState<string>(
    defaultSort || sortOptions?.[0]?.value || "",
  );

  // Debounce search query to avoid too many API calls
  const debouncedSearch = useDebounce(searchQuery, debounceMs);

  // Handle sort change
  const handleSortChange = (sortValue: string) => {
    setSelectedSort(sortValue);
    onSortChange?.(sortValue);
  };

  // Toggle between ascending and descending for the current field
  const handleSortIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!sortOptions || sortOptions.length === 0) return;

    // Get the base field name (remove leading - if present)
    let baseField = selectedSort?.startsWith("-")
      ? selectedSort.slice(1)
      : selectedSort;

    // If no current sort or field not in options, use first option
    if (
      !baseField ||
      !sortOptions.some((opt) => {
        const optBase = opt.value.startsWith("-")
          ? opt.value.slice(1)
          : opt.value;
        return optBase === baseField;
      })
    ) {
      baseField = sortOptions[0]?.value;
      // Remove leading - if present
      if (baseField?.startsWith("-")) {
        baseField = baseField.slice(1);
      }
    }

    // Toggle between ascending and descending
    const isDescending = selectedSort?.startsWith("-");
    const newSort = isDescending ? baseField : `-${baseField}`;
    handleSortChange(newSort);
  };

  // Get current sort icon based on selected sort
  const getSortIcon = () => {
    if (!sortOptions || sortOptions.length === 0) return null;

    // Show ArrowDown for descending, ArrowUp for ascending
    if (selectedSort?.startsWith("-")) {
      return <ArrowDown className="h-4 w-4" />;
    }
    if (selectedSort) {
      return <ArrowUp className="h-4 w-4" />;
    }
    return <ArrowUpDown className="h-4 w-4" />;
  };

  // Get tooltip text for current sort
  const getSortTooltip = () => {
    if (!sortOptions || sortOptions.length === 0) return "Sort";

    // Get the base field name
    let baseField = selectedSort?.startsWith("-")
      ? selectedSort.slice(1)
      : selectedSort;

    // If no current sort or field not in options, use first option
    if (
      !baseField ||
      !sortOptions.some((opt) => {
        const optBase = opt.value.startsWith("-")
          ? opt.value.slice(1)
          : opt.value;
        return optBase === baseField;
      })
    ) {
      baseField = sortOptions[0]?.value;
      // Remove leading - if present
      if (baseField?.startsWith("-")) {
        baseField = baseField.slice(1);
      }
    }

    // Find the base option
    const baseOption = sortOptions.find((opt) => {
      const optBase = opt.value.startsWith("-")
        ? opt.value.slice(1)
        : opt.value;
      return optBase === baseField;
    });

    if (!baseOption) return "Sort";

    // Return label with direction indicator
    const isDescending = selectedSort?.startsWith("-");
    const direction = isDescending ? " (Descending)" : " (Ascending)";
    return `${baseOption.label}${direction}`;
  };

  // Fetch data using the provided query hook
  const queryResult = useQueryHook?.({
    search: debouncedSearch.trim() || undefined,
    limit,
    ordering: selectedSort || undefined,
  });

  const isLoading = queryResult?.isLoading ?? false;
  const isError = queryResult?.isError ?? false;
  const rawData = queryResult?.data;

  // Get option value
  const getValue = useCallback(
    (item: T): string => {
      if (getOptionValue) {
        const val = getOptionValue(item);
        return String(val);
      }
      // Default: assume item has an 'id' property
      return String((item as any)?.id ?? "");
    },
    [getOptionValue],
  );

  // Get option label
  const getLabel = useCallback(
    (item: T): string => {
      if (getOptionLabel) {
        return getOptionLabel(item);
      }
      // Default: try common label fields
      return (
        (item as any)?.title ??
        (item as any)?.name ??
        (item as any)?.label ??
        String(item)
      );
    },
    [getOptionLabel],
  );

  // Extract and transform data
  const options = useMemo(() => {
    let result: T[] = [];

    // Use custom extract function if provided
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

    // Merge with additional options if provided
    if (additionalOptions && additionalOptions.length > 0) {
      const existingValues = new Set(result.map((item) => getValue(item)));
      const uniqueAdditional = additionalOptions.filter(
        (item) => !existingValues.has(getValue(item)),
      );
      return [...uniqueAdditional, ...result];
    }

    return result;
  }, [rawData, extractData, additionalOptions, getValue]);

  // Get total count for display
  const totalCount = useMemo(() => {
    if (!rawData) return 0;

    // Use custom extract function if provided
    if (extractCount) {
      return extractCount(rawData);
    }

    // Default extraction
    if (typeof rawData.count === "number") {
      return rawData.count;
    }

    return options.length;
  }, [rawData, options.length, extractCount]);

  // Handle value change
  const handleValueChange = (newValue: string) => {
    onValueChange?.(newValue);
    setSearchQuery(""); // Reset search on selection
  };

  // Handle open change
  const handleOpenChange = (open: boolean) => {
    onOpenChange?.(open);
    if (!open) {
      setSearchQuery(""); // Reset search when dropdown closes
    }
  };

  return (
    <Select
      value={value}
      onValueChange={handleValueChange}
      onOpenChange={handleOpenChange}
      disabled={disabled}
    >
      <SelectTrigger
        className={cn(
          error &&
            "border-destructive focus:border-destructive focus:ring-destructive",
          triggerClassName,
        )}
      >
        {value && selectedLabel != null && selectedLabel !== "" ? (
          <span className="truncate">{selectedLabel}</span>
        ) : (
          <SelectValue placeholder={placeholder} />
        )}
      </SelectTrigger>
      <SelectContent className={cn("p-0 max-h-[220px]", className)}>
        <div className="sticky top-0 z-10 bg-popover border-b px-2 py-1.5">
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  // Prevent Enter from closing the select
                  if (e.key === "Enter") {
                    e.preventDefault();
                  }
                }}
                autoFocus
              />
            </div>
            {sortOptions && sortOptions.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleSortIconClick}
                title={getSortTooltip()}
              >
                {getSortIcon()}
              </Button>
            )}
          </div>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: "180px" }}>
          {isLoading ? (
            <SelectItem value="loading" disabled>
              {loadingMessage}
            </SelectItem>
          ) : isError ? (
            <SelectItem value="error" disabled>
              Error loading options
            </SelectItem>
          ) : options.length === 0 ? (
            <SelectItem value="no-options" disabled>
              {searchQuery.trim() ? noResultsMessage : emptyMessage}
            </SelectItem>
          ) : (
            <>
              {options.map((item: T, index: number) => {
                const optionValue = getValue(item);
                const optionLabel = getLabel(item);
                return (
                  <SelectItem key={optionValue || index} value={optionValue}>
                    {optionLabel}
                  </SelectItem>
                );
              })}
              {totalCount > limit && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground text-center border-t bg-muted/50">
                  Showing {options.length} of {totalCount} results
                </div>
              )}
            </>
          )}
        </div>
      </SelectContent>
    </Select>
  );
}
