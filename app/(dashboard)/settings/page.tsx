"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  User,
  ShieldCheck,
  ChevronRight,
  History,
  Tags,
  Bell,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettingsCard, NotificationSettingsCard } from "@/components/profile";
import {
  PERMISSIONS,
  PERMISSION_GROUPS,
} from "@/lib/permissions";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function SettingsHubPage() {
  const { hasAny, hasPermission } = useCurrentUser();

  const canManageUsers = hasAny([...PERMISSION_GROUPS.USER_MANAGEMENT]);
  const canManageRoles = hasAny([...PERMISSION_GROUPS.ROLE_MANAGEMENT]);
  const canViewAuditLogs = hasAny([...PERMISSION_GROUPS.AUDIT_LOGS]);
  const canViewTaxonomy = hasAny([...PERMISSION_GROUPS.SETTINGS_ACCESS]);

  const showAccessControl = canManageUsers || canManageRoles;
  const showAdminLinks = showAccessControl || canViewAuditLogs || canViewTaxonomy;

  const tabsList = useMemo(() => {
    const tabs = [
      { id: "profile", label: "My Profile", icon: User },
      { id: "notifications", label: "Notifications", icon: Bell },
    ];
    if (showAdminLinks) {
      tabs.push({ id: "admin", label: "Administration", icon: ShieldCheck });
    }
    return tabs;
  }, [showAdminLinks]);

  return (
    <PageContainer
      title="Settings"
      description="Manage your profile and administrative tools."
    >
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/50 p-1">
          {tabsList.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile" className="mt-0 space-y-6">
          <ProfileSettingsCard />
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-0 space-y-6">
          <NotificationSettingsCard />
        </TabsContent>

        {/* Administration */}
        {showAdminLinks && (
          <TabsContent value="admin" className="mt-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Administration</CardTitle>
                <CardDescription>
                  Shortcuts to system management pages you have access to.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {canManageUsers && (
                  <AdminLink
                    href="/settings/access-control/users"
                    title="User management"
                    description="Create accounts, assign roles, and control access."
                    icon={User}
                  />
                )}
                {canManageRoles && (
                  <AdminLink
                    href="/settings/access-control/roles"
                    title="Roles & permissions"
                    description="Define roles and assign permissions."
                    icon={ShieldCheck}
                  />
                )}
                {canViewAuditLogs && (
                  <AdminLink
                    href="/settings/audit-logs"
                    title="Audit logs"
                    description="Review system activity and document events."
                    icon={History}
                  />
                )}
                {canViewTaxonomy && hasPermission(PERMISSIONS.SETTING_VIEW_GRANTSETTING) && (
                  <AdminLink
                    href="/settings/taxonomy"
                    title="Reference taxonomy"
                    description="Manage lookup values used across the system."
                    icon={Tags}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </PageContainer>
  );
}

function AdminLink({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </Link>
  );
}
