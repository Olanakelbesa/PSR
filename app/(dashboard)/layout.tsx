// ============================================================================
// RPDMS — Dashboard Layout (Next.js Server Component)
// ============================================================================

import { redirect } from "next/navigation";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar, AppHeader } from "@/components/layout";
import { auth } from "@/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Redirect to login if session expired or refresh token failed
  if (!session?.backendToken || session?.error === "RefreshTokenError") {
    redirect("/login");
  }

  const queryClient = new QueryClient();
  const backendUrl = process.env.API_BASE_URL || process.env.BACKEND_URL || "http://127.0.0.1:8000";

  // Prefetch bootstrap data in parallel on the server
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["currentUser"],
      queryFn: async () => {
        try {
          const res = await fetch(`${backendUrl}/api/v1/users/me/`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.backendToken}`,
            },
          });
          if (!res.ok) return null;
          const data = await res.json();
          return data?.data ?? null;
        } catch (error) {
          console.error("[SSR Prefetch] currentUser error:", error);
          return null;
        }
      },
    }),
    queryClient.prefetchQuery({
      queryKey: ["notifications", session.user.id],
      queryFn: async () => {
        try {
          const res = await fetch(`${backendUrl}/api/v1/notifications/`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.backendToken}`,
            },
          });
          if (!res.ok) return [];
          const data = await res.json();
          const list =
            Array.isArray(data?.data?.results) && data?.data?.results.length
              ? data.data.results
              : Array.isArray(data?.results)
              ? data.results
              : Array.isArray(data?.data)
              ? data.data
              : [];

          return list.map((n: any) => ({
            id: String(n.id),
            userId: String(n.user),
            title: n.title,
            message: n.message,
            type: n.type,
            read: n.is_read,
            createdAt: n.created_at,
          }));
        } catch (error) {
          console.error("[SSR Prefetch] notifications error:", error);
          return [];
        }
      },
    }),
  ]);

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <SidebarProvider className="h-svh overflow-hidden">
        <AppSidebar />
        <SidebarInset className="flex flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 flex min-h-0 flex-col min-w-0 overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </HydrationBoundary>
  );
}
