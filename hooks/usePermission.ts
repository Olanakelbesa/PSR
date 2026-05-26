"use client";

// ============================================================================
// RPDMS — usePermission Hook
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
    role,
    can: (action: Permission) => checkCan(role, action),
    canAny: (actions: Permission[]) => checkCanAny(role, actions),
    canAll: (actions: Permission[]) => checkCanAll(role, actions),
    hasMinRole: (minRole: UserRole) => checkMinRole(role, minRole),
    isAuthenticated: !!user,
  };
}
