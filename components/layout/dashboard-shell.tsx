"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar, AppHeader } from "@/components/layout";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getRequiredPermissionsForRoute } from "@/lib/permissions";
import { AccessDenied } from "@/components/shared/access-denied";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { hasAny, isLoading: permissionsLoading } = useCurrentUser();

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

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, [isAuthenticated, isLoading]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const requiredPermissions = getRequiredPermissionsForRoute(pathname);
  const isForbidden =
    !!requiredPermissions &&
    !permissionsLoading &&
    !hasAny(requiredPermissions);

  return (
    <SidebarProvider className="h-dvh max-h-dvh overflow-hidden">
      <AppSidebar />
      <SidebarInset className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto pb-10">
          {requiredPermissions && permissionsLoading ? (
            <div className="flex flex-1 items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isForbidden ? (
            <AccessDenied />
          ) : (
            children
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}