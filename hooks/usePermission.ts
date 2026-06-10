"use client";

// ============================================================================
// RPDMS — usePermission Hook
// ============================================================================
// Permission checks backed by GET /v1/users/me/ (data.permissions).
// Usage:
//   const { hasPermission, hasAny, permissionSet } = usePermission();
//   if (hasPermission(PERMISSIONS.USER_VIEW)) { ... }

import { useCurrentUser } from "@/hooks/useCurrentUser";

export function usePermission() {
  const currentUser = useCurrentUser();

  return {
    ...currentUser,
    /** @deprecated Use hasAny instead */
    canAny: currentUser.hasAny,
    /** @deprecated Use hasAll instead */
    canAll: currentUser.hasAll,
    /** @deprecated Use hasPermission instead */
    can: currentUser.hasPermission,
    isAuthenticated: !!currentUser.user,
  };
}
