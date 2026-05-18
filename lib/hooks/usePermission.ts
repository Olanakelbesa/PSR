"use client";

// ============================================================================
// PSR Platform — usePermission Hook
// ============================================================================
// Provides RBAC capabilities to any client component.
// Usage:
//   const { can, canAny, role } = usePermission();
//   if (can("APPROVE_PROPOSAL")) { ... }

import { useSession } from "next-auth/react";
import {
  can as checkCan,
  canAny as checkCanAny,
  canAll as checkCanAll,
  hasMinRole as checkMinRole,
  type Permission,
} from "@/lib/rbac";
import type { UserRole } from "@/lib/types";

export function usePermission() {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const role = (user?.role as UserRole) ?? null;

  return {
    /** Current user role */
    role,

    /** True if user has permission for the given action */
    can: (action: Permission) => checkCan(role, action),

    /** True if user has permission for ANY of the given actions */
    canAny: (actions: Permission[]) => checkCanAny(role, actions),

    /** True if user has permission for ALL of the given actions */
    canAll: (actions: Permission[]) => checkCanAll(role, actions),

    /** True if user role is at least as privileged as `minRole` */
    hasMinRole: (minRole: UserRole) => checkMinRole(role, minRole),

    /** True if user is authenticated */
    isAuthenticated: !!user,
  };
}
