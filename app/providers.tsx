"use client";

// ============================================================================
// PSR Platform — Global Providers
// ============================================================================
// Wraps the entire app with:
//   ✔ NextAuth SessionProvider (session available everywhere via useSession)
//   ✔ TanStack Query (server-state caching + devtools)
//   ✔ Sonner Toaster (global toast notifications)
//   ✔ Error Boundary (catches runtime crashes with a graceful fallback UI)

import { SessionProvider } from "next-auth/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import { queryClient } from "@/lib/query-client";
import type { Session } from "next-auth";

interface ProvidersProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>{children}</ErrorBoundary>

        {/* Global Toast Notifications */}
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            classNames: {
              toast:
                "font-sans text-sm rounded-xl shadow-xl border border-slate-100",
              title: "font-bold",
              description: "text-slate-500",
            },
          }}
        />

        {/* TanStack Query DevTools — only visible in development */}
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      </QueryClientProvider>
    </SessionProvider>
  );
}
