"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getCurrentUser,
  type CurrentUser,
} from "@/api/services/profile.service";
import type { PermissionValue } from "@/lib/permissions";

export const currentUserKeys = {
  all: ["currentUser"] as const,
};

const EMPTY_PERMISSIONS: readonly string[] = [];

export function useCurrentUser() {
  const query = useQuery({
    queryKey: currentUserKeys.all,
    queryFn: getCurrentUser,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const user = query.data ?? null;
  const permissions = user?.permissions ?? EMPTY_PERMISSIONS;

  const permissionSet = useMemo(() => {
    return new Set(permissions);
  }, [permissions]);

  const hasPermission = useCallback(
    (permission: PermissionValue | string) => permissionSet.has(permission),
    [permissionSet],
  );

  const hasAny = useCallback(
    (required: readonly (PermissionValue | string)[]) => {
      if (!required.length) return true;
      return required.some((permission) => permissionSet.has(permission));
    },
    [permissionSet],
  );

  const hasAll = useCallback(
    (required: readonly (PermissionValue | string)[]) => {
      if (!required.length) return true;
      return required.every((permission) => permissionSet.has(permission));
    },
    [permissionSet],
  );

  return {
    user,
    permissions,
    permissionSet,
    hasPermission,
    hasAny,
    hasAll,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export type { CurrentUser };
