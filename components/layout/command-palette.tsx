"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Loader2,
  Dot,
} from "lucide-react";

import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";
import apiClient from "@/api/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { navigationGroups } from "@/components/layout/app-sidebar";
import { getRequiredPermissionsForRoute, type PermissionValue } from "@/lib/permissions";

interface SearchResultItem {
  id: string | number;
  title: string;
  category: "proposal" | "policy" | "user" | "setting";
  url: string;
  subtitle?: string;
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { user: currentUser, hasAny, isLoading: permissionsLoading } = useCurrentUser();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Global Keyboard Listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  // Permission Checker matching app-sidebar.tsx
  const hasAccess = useCallback(
    (requiredPermissions?: PermissionValue[]) => {
      if (!requiredPermissions || requiredPermissions.length === 0) {
        return true;
      }
      if (permissionsLoading) return false;
      return !!currentUser?.is_superuser || hasAny(requiredPermissions);
    },
    [currentUser?.is_superuser, permissionsLoading, hasAny]
  );

  // Dynamically extract allowed sidebar navigation items matching active user permissions
  const allowedGroups = useMemo(() => {
    return navigationGroups
      .map((group) => {
        const allowedItems: Array<{
          label: string;
          href: string;
          icon?: React.ComponentType<{ className?: string }>;
        }> = [];

        group.items.forEach((item) => {
          if (item.subItems && item.subItems.length > 0) {
            item.subItems.forEach((sub) => {
              if (hasAccess(sub.permissions)) {
                allowedItems.push({
                  label: `${item.label} → ${sub.label}`,
                  href: sub.href,
                  icon: sub.icon && sub.icon !== Dot ? sub.icon : item.icon,
                });
              }
            });
          } else if (item.href) {
            if (hasAccess(item.permissions)) {
              allowedItems.push({
                label: item.label,
                href: item.href,
                icon: item.icon,
              });
            }
          }
        });

        return {
          heading: group.label || "Quick Navigation",
          items: allowedItems,
        };
      })
      .filter((group) => group.items.length > 0);
  }, [hasAccess]);

  // Filter Navigation Items locally based on user query
  const filteredGroups = useMemo(() => {
    if (!query.trim()) return allowedGroups;

    const q = query.toLowerCase().trim();
    return allowedGroups
      .map((group) => {
        const matchingItems = group.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            group.heading.toLowerCase().includes(q)
        );
        return {
          heading: group.heading,
          items: matchingItems,
        };
      })
      .filter((group) => group.items.length > 0);
  }, [allowedGroups, query]);

  // Route Permission Checker
  const canAccessRoute = useCallback(
    (url: string) => {
      if (currentUser?.is_superuser) return true;
      const required = getRequiredPermissionsForRoute(url);
      if (!required || required.length === 0) return true;
      return hasAny(required);
    },
    [currentUser?.is_superuser, hasAny]
  );

  // Perform Live Backend Hybrid Search when typing query
  const performSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Backend search endpoint /api/v1/search/?search=query
      const res = await apiClient.get("/v1/search/", {
        params: { search: searchTerm, source: "all" },
      });
      const rawResults = res.data?.results ?? res.data?.data ?? res.data ?? [];

      if (Array.isArray(rawResults)) {
        const mapped: SearchResultItem[] = rawResults
          .map((item: any) => ({
            id: item.id || Math.random(),
            title: item.title || item.name || item.text || "Untitled Document",
            category: item.source || item.category || "proposal",
            url: item.url || item.file_url || item.link || "/dashboard",
            subtitle: item.subtitle || item.snippet || item.document_type || item.description || "Database Document",
          }))
          .filter((item) => canAccessRoute(item.url));

        setSearchResults(mapped);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [canAccessRoute]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) performSearch(query);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleSelect = (url: string) => {
    onOpenChange(false);
    setQuery("");
    router.push(url);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false}>
      <CommandInput
        placeholder="Type a command or search proposals, policies, settings..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[380px] p-2">
        {isLoading && (
          <div className="py-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Searching backend repository...
          </div>
        )}

        {!isLoading && query && searchResults.length === 0 && filteredGroups.length === 0 && (
          <CommandEmpty className="py-6 text-center text-xs text-muted-foreground font-semibold">
            No matching navigation commands or documents found for &quot;{query}&quot;.
          </CommandEmpty>
        )}

        {/* 1. Sidebar Navigation Commands (First Priority) */}
        {filteredGroups.map((group) => (
          <CommandGroup key={group.heading} heading={group.heading}>
            {group.items.map((item) => {
              const IconComponent = item.icon || FileText;
              return (
                <CommandItem
                  key={item.href}
                  onSelect={() => handleSelect(item.href)}
                  className="cursor-pointer py-1.5"
                >
                  <IconComponent className="mr-2 h-4 w-4 text-primary shrink-0" />
                  <span className="text-xs font-semibold">{item.label}</span>
                  {item.href === "/dashboard" && <CommandShortcut>⌘H</CommandShortcut>}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}

        {/* 2. Backend Document & Record Search Results (Second Priority) */}
        {!isLoading && searchResults.length > 0 && (
          <CommandGroup heading="Database Documents & Records">
            {searchResults.map((item) => (
              <CommandItem
                key={`${item.category}-${item.id}`}
                onSelect={() => handleSelect(item.url)}
                className="cursor-pointer py-2"
              >
                <FileText className="mr-2 h-4 w-4 text-primary shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-xs truncate">{item.title}</span>
                  {item.subtitle && (
                    <span className="text-[11px] text-muted-foreground truncate">{item.subtitle}</span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
