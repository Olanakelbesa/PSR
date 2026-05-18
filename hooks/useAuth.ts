"use client";

// ============================================================================
// PSR Platform — useAuth Hook (NextAuth v5)
// ============================================================================
// Single hook for all auth needs in client components.
//
// Usage:
//   const { user, role, isLoading, signOut } = useAuth();

import { useSession, signOut as nextSignOut } from "next-auth/react";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/lib/types";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated" && !!session?.user;
  const user = session?.user ?? null;
  const role: UserRole | null = (user?.role as UserRole) ?? null;

  const signOut = useCallback(async () => {
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
    backendToken: session?.backendToken ?? null,
    hasTokenError,
    signOut,
  };
}
