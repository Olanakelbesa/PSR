"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar, AppHeader } from "@/components/layout";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, status } = useSession();

  const isLoading = status === "loading";
  const isAuthenticated =
    status === "authenticated" &&
    !!session?.backendToken &&
    session.error !== "RefreshTokenError";

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <AppSidebar />
      <SidebarInset className="flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
