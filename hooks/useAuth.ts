"use client";

// ============================================================================
// RPDMS — useAuth Hook (NextAuth v5)
// ============================================================================
// Single hook for all auth needs in client components.
//
// Usage:
//   const { user, isLoading, signOut } = useAuth();
//
// For permission checks, use useCurrentUser() or usePermission() instead.

import { useSession, signOut as nextSignOut } from "next-auth/react";
import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { tokenStorage } from "@/api/client";
import { queryClient } from "@/lib/query-client";
import type { UserRole } from "@/lib/types";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated" && !!session?.user;
  const user = session?.user ?? null;
  const role: UserRole | null = (user?.role as UserRole) ?? null;
  const rawBackendToken = session?.backendToken ?? tokenStorage.get();
  const backendToken =
    typeof rawBackendToken === "string" &&
    rawBackendToken.trim().length > 0 &&
    rawBackendToken !== "undefined"
      ? rawBackendToken
      : null;

  useEffect(() => {
    if (backendToken) {
      tokenStorage.set(backendToken);
    } else {
      tokenStorage.remove();
    }

    if (session?.backendRefreshToken) {
      tokenStorage.setRefresh(session.backendRefreshToken);
    }
  }, [backendToken, session?.backendRefreshToken]);

  const signOut = useCallback(async () => {
    tokenStorage.clear();
    queryClient.clear();
    await nextSignOut({ redirect: false });
    router.push("/login");
    router.refresh();
  }, [router]);

  const hasTokenError = session?.error === "RefreshTokenError";

  return {
    user,
    role,
    isLoading,
    isAuthenticated,
    backendToken,
    hasTokenError,
    signOut,
  };
}
