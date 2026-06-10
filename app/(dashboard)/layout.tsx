// ============================================================================
// RPDMS — Dashboard Layout (static shell — auth runs in middleware + client)
// ============================================================================

import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
