"use client";

// ============================================================================
// PSR Platform — Dashboard Layout (NextAuth v5)
// ============================================================================

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar, AppHeader } from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, hasTokenError } = useAuth();

  // Redirect to login if session expired or refresh token failed
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || hasTokenError)) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, hasTokenError, router]);

  // Show full-screen loader while session is being resolved
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Verifying session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex h-svh flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 flex min-h-0 flex-col min-w-0 overflow-y-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
