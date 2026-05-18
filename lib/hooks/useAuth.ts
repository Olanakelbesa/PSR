"use client";

// ============================================================================
// PSR Platform — useAuth Hook (NextAuth v5)
// ============================================================================
// Single hook for all auth needs in client components.
// Replaces the old Zustand auth-store for session reads.
//
// Usage:
//   const { user, role, isLoading, signOut } = useAuth();
//   if (!user) return <Redirect to="/login" />;

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

  /** Sign out the user and redirect to /login */
  const signOut = useCallback(async () => {
    await nextSignOut({ redirect: false });
    router.push("/login");
    router.refresh();
  }, [router]);

  /** True if the backend token has expired and refresh failed */
  const hasTokenError = session?.error === "RefreshTokenError";

  return {
    /** Authenticated user object (null if unauthenticated) */
    user,
    /** User role */
    role,
    /** True while session is being fetched */
    isLoading,
    /** True when user is authenticated with a valid session */
    isAuthenticated,
    /** Backend JWT to pass directly to API calls if needed */
    backendToken: session?.backendToken ?? null,
    /** True when the refresh token expired — force re-login */
    hasTokenError,
    /** Sign out action */
    signOut,
  };
}
