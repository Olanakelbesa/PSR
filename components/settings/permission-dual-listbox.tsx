"use client";

import { useCallback, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { PermissionCatalogItem } from "@/api/services/roles.service";

export type PermissionListItem = PermissionCatalogItem & {
  categoryName: string;
};

function formatPermissionLabel(permission: PermissionListItem) {
  const modelLabel = permission.codename.split(".").pop()?.replace(/_/g, " ") ?? "";
  return `${permission.categoryName} | ${modelLabel} | ${permission.name}`;
}

function matchesFilter(permission: PermissionListItem, query: string) {
  if (!query) return true;
  const haystack = `${formatPermissionLabel(permission)} ${permission.codename}`.toLowerCase();
  return haystack.includes(query);
}

type PermissionDualListboxProps = {
  items: PermissionListItem[];
  value: number[];
  onChange: (next: number[]) => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
};

export function PermissionDualListbox({
  items,
  value,
  onChange,
  disabled = false,
  isLoading = false,
  className,
}: PermissionDualListboxProps) {
  const [availableFilter, setAvailableFilter] = useState("");
  const [chosenFilter, setChosenFilter] = useState("");
  const [selectedAvailable, setSelectedAvailable] = useState<number[]>([]);
  const [selectedChosen, setSelectedChosen] = useState<number[]>([]);
  const [lastAvailableIndex, setLastAvailableIndex] = useState<number | null>(null);
  const [lastChosenIndex, setLastChosenIndex] = useState<number | null>(null);

  const chosenSet = useMemo(() => new Set(value), [value]);

  const availableItems = useMemo(
    () => items.filter((item) => !chosenSet.has(item.id)),
    [items, chosenSet],
  );

  const chosenItems = useMemo(
    () => items.filter((item) => chosenSet.has(item.id)),
    [items, chosenSet],
  );

  const filteredAvailable = useMemo(() => {
    const query = availableFilter.trim().toLowerCase();
    return availableItems.filter((item) => matchesFilter(item, query));
  }, [availableItems, availableFilter]);

  const filteredChosen = useMemo(() => {
    const query = chosenFilter.trim().toLowerCase();
    return chosenItems.filter((item) => matchesFilter(item, query));
  }, [chosenItems, chosenFilter]);

  const toggleSelection = useCallback(
    (
      id: number,
      index: number,
      current: number[],
      list: PermissionListItem[],
      lastIndex: number | null,
      event: React.MouseEvent,
    ) => {
      if (event.shiftKey && lastIndex !== null) {
        const start = Math.min(lastIndex, index);
        const end = Math.max(lastIndex, index);
        const rangeIds = list.slice(start, end + 1).map((item) => item.id);
        const merged = new Set([...current, ...rangeIds]);
        return { next: Array.from(merged), lastIndex: index };
      }

      const next = current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : [...current, id];
      return { next, lastIndex: index };
    },
    [],
  );

  const handleAvailableClick = (item: PermissionListItem, index: number, event: React.MouseEvent) => {
    const result = toggleSelection(
      item.id,
      index,
      selectedAvailable,
      filteredAvailable,
      lastAvailableIndex,
      event,
    );
    setSelectedAvailable(result.next);
    setLastAvailableIndex(result.lastIndex);
  };

  const handleChosenClick = (item: PermissionListItem, index: number, event: React.MouseEvent) => {
    const result = toggleSelection(
      item.id,
      index,
      selectedChosen,
      filteredChosen,
      lastChosenIndex,
      event,
    );
    setSelectedChosen(result.next);
    setLastChosenIndex(result.lastIndex);
  };

  const moveToChosen = (ids: number[]) => {
    if (ids.length === 0) return;
    const next = new Set(value);
    ids.forEach((id) => next.add(id));
    onChange(Array.from(next));
    setSelectedAvailable([]);
    setLastAvailableIndex(null);
  };

  const moveToAvailable = (ids: number[]) => {
    if (ids.length === 0) return;
    const remove = new Set(ids);
    onChange(value.filter((id) => !remove.has(id)));
    setSelectedChosen([]);
    setLastChosenIndex(null);
  };

  const chooseSelected = () => moveToChosen(selectedAvailable);
  const removeSelected = () => moveToAvailable(selectedChosen);
  const chooseAllFiltered = () => moveToChosen(filteredAvailable.map((item) => item.id));
  const removeAllFiltered = () => moveToAvailable(filteredChosen.map((item) => item.id));

  const handleAvailableDoubleClick = (item: PermissionListItem) => moveToChosen([item.id]);
  const handleChosenDoubleClick = (item: PermissionListItem) => moveToAvailable([item.id]);

  const renderList = (
    list: PermissionListItem[],
    selected: number[],
    onItemClick: (item: PermissionListItem, index: number, event: React.MouseEvent) => void,
    onItemDoubleClick: (item: PermissionListItem) => void,
    onClearSelection: () => void,
    emptyMessage: string,
  ) => (
    <ScrollArea className="h-56 rounded-md border border-border bg-background">
      <div
        className="min-h-52 p-1"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            onClearSelection();
          }
        }}
      >
        {list.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          list.map((item, index) => {
            const isSelected = selected.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={(event) => onItemClick(item, index, event)}
                onDoubleClick={() => onItemDoubleClick(item)}
                className={cn(
                  "w-full rounded-sm px-2 py-1.5 text-left text-sm transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted",
                )}
              >
                {formatPermissionLabel(item)}
              </button>
            );
          })
        )}
      </div>
    </ScrollArea>
  );

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Loading permission catalog...</p>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Available user permissions</Label>
          <p className="text-xs text-muted-foreground">
            Choose permissions by selecting them, then click the arrow to assign.
          </p>
          <Input
            placeholder="Filter"
            value={availableFilter}
            onChange={(event) => setAvailableFilter(event.target.value)}
            disabled={disabled}
            className="h-9"
          />
          {renderList(
            filteredAvailable,
            selectedAvailable,
            handleAvailableClick,
            handleAvailableDoubleClick,
            () => {
              setSelectedAvailable([]);
              setLastAvailableIndex(null);
            },
            "No available permissions.",
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            disabled={disabled || filteredAvailable.length === 0}
            onClick={chooseAllFiltered}
          >
            Choose all user permissions
          </Button>
        </div>

        <div className="flex flex-row items-center justify-center gap-2 lg:flex-col lg:justify-center lg:pt-16">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled={disabled || selectedAvailable.length === 0}
            onClick={chooseSelected}
            title="Choose selected user permissions"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled={disabled || selectedChosen.length === 0}
            onClick={removeSelected}
            title="Remove selected user permissions"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Chosen user permissions</Label>
          <p className="text-xs text-muted-foreground">
            Remove permissions by selecting them, then click the arrow to unassign.
          </p>
          <Input
            placeholder="Filter"
            value={chosenFilter}
            onChange={(event) => setChosenFilter(event.target.value)}
            disabled={disabled}
            className="h-9"
          />
          {renderList(
            filteredChosen,
            selectedChosen,
            handleChosenClick,
            handleChosenDoubleClick,
            () => {
              setSelectedChosen([]);
              setLastChosenIndex(null);
            },
            "No permissions assigned.",
          )}
          <p className="text-xs text-muted-foreground">(click empty area to clear selection)</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            disabled={disabled || filteredChosen.length === 0}
            onClick={removeAllFiltered}
          >
            Remove all user permissions
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Specific permissions for this user. Click to select multiple items, hold Shift to select a
        range, or double-click an item to move it to the other side.
      </p>
    </div>
  );
}

export function flattenPermissionCatalog(
  catalog:
    | {
        categories: { slug: string; name: string; order?: number }[];
        permissionsByCategory: Record<string, PermissionCatalogItem[]>;
      }
    | undefined,
): PermissionListItem[] {
  if (!catalog) return [];

  const categories = [...catalog.categories].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );

  return categories.flatMap((category) =>
    (catalog.permissionsByCategory[category.slug] ?? []).map((permission) => ({
      ...permission,
      categoryName: category.name,
    })),
  );
}
