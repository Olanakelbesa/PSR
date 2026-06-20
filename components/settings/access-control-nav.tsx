"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Users, Layers } from "lucide-react";

import { cn } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/permissions";
import { useServerPermissions } from "@/lib/queries/useServerPermissions";

const NAV_ITEMS = [
  {
    href: "/settings/access-control/users",
    label: "Users",
    icon: Users,
    permission: PERMISSIONS.USER_VIEW,
  },
  {
    href: "/settings/access-control/roles",
    label: "Roles & Permissions",
    icon: Shield,
    permission: PERMISSIONS.ROLE_VIEW,
  },
  {
    href: "/settings/access-control/groups",
    label: "Permission Groups",
    icon: Layers,
    permission: PERMISSIONS.ROLE_VIEW,
  },
] as const;

export function AccessControlNav() {
  const pathname = usePathname();
  const { hasPermission } = useServerPermissions();

  const visibleItems = NAV_ITEMS.filter((item) => hasPermission(item.permission));
  if (visibleItems.length <= 1) return null;

  return (
    <nav className="mb-6 flex flex-wrap gap-2 border-b pb-4">
      {visibleItems.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
