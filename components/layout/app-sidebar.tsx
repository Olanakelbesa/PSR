"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  FileEdit,
  FileClock,
  FileCheck,
  Library,
  FlaskConical,
  Megaphone,
  FileStack,
  ClipboardCheck,
  Activity,
  BarChart3,
  Settings,
  Tags,
  History,
  Building2,
  LogOut,
  User,
  FileCheck2,
  Settings2Icon,
  Dot,
  DollarSign,
  Globe,
  FileUp,
  Lightbulb,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import { useAuth } from "@/hooks/useAuth";
import { ROLES } from "@/lib/constants";
import { PERMISSIONS } from "@/lib/permissions";
import type { UserRole } from "@/lib/types";

interface SubNavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
  permissions?: string[];
}

interface NavItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
  permissions?: string[];
  subItems?: SubNavItem[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    label: "",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "POLICY MANAGEMENT",
    items: [
      {
        label: "Concept Notes",
        icon: FileEdit,
        subItems: [
          {
            label: "My Concept Note",
            href: "/policies/concept-notes/my-concept-note",
            icon: Dot,
          },
          {
            label: "Manage Concept Notes",
            href: "/policies/concept-notes/manage-concept-notes",
            icon: Dot,
            permissions: [PERMISSIONS.POLICY_VIEW_CONCEPT_NOTE_WORKFLOW],
          },
          {
            label: "Review Concept Note",
            href: "/policies/concept-notes/review-concept-note",
            icon: Dot,
            permissions: [PERMISSIONS.POLICY_REVIEW_CONCEPT_NOTE],
          },
        ],
      },
      {
        label: "Drafts",
        icon: FileClock,
        subItems: [
          {
            label: "My Drafts",
            href: "/policies/drafts/my-drafts",
            icon: Dot,
          },
          {
            label: "Manage Drafts",
            href: "/policies/drafts/manage-drafts",
            icon: Dot,
            permissions: [PERMISSIONS.POLICY_VIEW_DRAFT_WORKFLOW],
          },
          {
            label: "Review Draft",
            href: "/policies/drafts/review-draft",
            icon: Dot,
            permissions: [PERMISSIONS.POLICY_REVIEW_DRAFT],
          },
        ],
      },
      {
        label: "Repository",
        href: "/policies/repository",
        icon: Library,
        permissions: [PERMISSIONS.POLICY_VIEW_REPOSITORY],
      },
    ],
  },
  {
    label: "RESEARCH MANAGEMENT",
    items: [
      {
        label: "Grant Calls",
        href: "/research/grant-calls",
        icon: Megaphone,
        permissions: [PERMISSIONS.SETTING_VIEW_GRANTCALL],
      },
      {
        label: "Manage Grants",
        href: "/research/manage-grants",
        icon: Settings2Icon,
        permissions: [PERMISSIONS.SETTING_VIEW_GRANTSETTING],
      },
      {
        label: "Proposals",
        icon: FileText,
        subItems: [
          {
            label: "My Proposals",
            href: "/research/proposals/my-proposals",
            icon: Dot,
          },
          {
            label: "Screening",
            href: "/research/proposals/screening-reviews",
            icon: Dot,
            permissions: [PERMISSIONS.RESEARCH_VIEW_SCREENING],
          },
          {
            label: "Assign Reviewers",
            href: "/research/proposals/assign-reviewers",
            icon: Dot,
            permissions: [PERMISSIONS.RESEARCH_CHANGE_PROPOSAL],
          },
          {
            label: "Technical Reviews",
            href: "/research/proposals/technical-reviews",
            icon: Dot,
            permissions: [PERMISSIONS.RESEARCH_VIEW_INDIVIDUAL_REVIEW],
          },
        ],
      },
      {
        label: "Ready for Funding",
        href: "/research/ready-for-funding",
        icon: DollarSign,
        permissions: [PERMISSIONS.RESEARCH_VIEW_READY_FOR_FUNDING],
      },
      {
        label: "IRB",
        href: "/research/ethical-clearance",
        icon: FileCheck2,
        permissions: [PERMISSIONS.RESEARCH_VIEW_ETHICAL_CLEARANCE],
      },
      {
        label: "Funding Recommendations",
        href: "/research/funding-recommendations",
        icon: Lightbulb,
        permissions: [PERMISSIONS.RESEARCH_VIEW_FUNDING_RECOMMENDATION],
      },
      {
        label: "Monitoring",
        icon: Activity,
        subItems: [
          {
            label: "Progress Report",
            href: "/research/monitoring/progress-report",
            icon: Dot,
            permissions: [PERMISSIONS.MONITORING_VIEW_PROJECT_TRACKING],
          },
          {
            label: "Progress Report Approval",
            href: "/research/monitoring/progress-report-approval",
            icon: Dot,
            permissions: [PERMISSIONS.MONITORING_VIEW_PROGRESS_REPORT_APPROVAL],
          },
          {
            label: "Terminal Report Approval",
            href: "/research/monitoring/terminal-report-approval",
            icon: Dot,
            permissions: [PERMISSIONS.MONITORING_VIEW_TERMINAL_REPORT_APPROVAL],
          },
        ],
      },
      {
        label: "Research Repository",
        href: "/research/repository",
        icon: Library,
        permissions: [PERMISSIONS.RESEARCH_VIEW_FINAL_SUBMISSION],
      },
      {
        label: "Minutes",
        href: "/research/minutes",
        icon: FileUp,
        permissions: [PERMISSIONS.RESEARCH_VIEW_MINUTES],
      },
      {
        label: "External Research ",
        href: "/research/external-research",
        icon: Globe,
        permissions: [PERMISSIONS.EXTERNAL_RESEARCH_VIEW],
      },
    ],
  },
  {
    label: "ADMINISTRATION",
    items: [
      {
        label: "Users",
        href: "/users",
        icon: Users,
        permissions: [PERMISSIONS.USER_VIEW],
      },
      {
        label: "Organizations",
        href: "/organizations",
        icon: Building2,
        permissions: [PERMISSIONS.SETTING_VIEW_ORGANIZATION],
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        permissions: [
          PERMISSIONS.SETTING_CHANGE_GRANTSETTING,
          PERMISSIONS.SETTING_CHANGE_RESEARCHSETTING,
        ],
      },
      {
        label: "Audit Logs",
        href: "/settings/audit-logs",
        icon: History,
        permissions: [PERMISSIONS.ADMIN_VIEW_LOGENTRY],
      },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, signOut, backendToken } = useAuth();
  const [serverPermissions, setServerPermissions] = useState<string[]>([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  useEffect(() => {
    if (!backendToken || !user) {
      setServerPermissions([]);
      setPermissionsLoaded(false);
      return;
    }

    let isActive = true;

    const loadPermissions = async () => {
      try {
        const response = await apiClient.get(API_ENDPOINTS.USERS.ME);
        const permissions = Array.isArray(response.data?.data?.permissions)
          ? response.data.data.permissions
          : [];

        if (!isActive) return;

        setServerPermissions(permissions);
        setPermissionsLoaded(true);
      } catch {
        if (!isActive) return;
        setServerPermissions([]);
        setPermissionsLoaded(true);
      }
    };

    loadPermissions();

    return () => {
      isActive = false;
    };
  }, [backendToken, user?.email]);

  const hasAccess = useCallback(
    (roles?: UserRole[], requiredPermissions?: string[]) => {
      if (!user) return false;

      if (roles && roles.length > 0 && !roles.includes(user.role)) {
        return false;
      }

      if (requiredPermissions && requiredPermissions.length > 0) {
        if (!permissionsLoaded) {
          return false;
        }

        const userPerms =
          serverPermissions.length > 0
            ? serverPermissions
            : (user as any).permissions || [];
        const hasPerm = requiredPermissions.some((perm) =>
          userPerms.includes(perm),
        );
        if (!hasPerm) return false;
      }

      return true;
    },
    [permissionsLoaded, serverPermissions, user],
  );

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    navigationGroups.forEach((g) =>
      g.items.forEach((i) => {
        if (i.subItems) {
          map[i.label] = i.subItems.some(
            (s) => pathname === s.href || pathname.startsWith(s.href + "/"),
          );
        }
      }),
    );
    return map;
  });

  useEffect(() => {
    if (!permissionsLoaded) return;

    const nextOpenMap: Record<string, boolean> = {};

    navigationGroups.forEach((group) => {
      group.items.forEach((item) => {
        if (!item.subItems) return;

        const visibleSubItems = item.subItems.filter((sub) =>
          hasAccess(sub.roles, sub.permissions),
        );

        if (visibleSubItems.length === 0) return;

        nextOpenMap[item.label] = visibleSubItems.some(
          (sub) => pathname === sub.href || pathname.startsWith(sub.href + "/"),
        );
      });
    });

    setOpenMap((current) => ({
      ...current,
      ...nextOpenMap,
    }));
  }, [hasAccess, pathname, permissionsLoaded]);

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="group-data-[collapsible=icon]:p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="hover:bg-sidebar-accent"
            >
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="flex aspect-square size-11 items-center justify-center overflow-hidden rounded-xl bg-background ring-1 ring-border/50 shadow-sm">
                  <Image
                    src="/moh_logo.png"
                    alt="RPDMS"
                    width={44}
                    height={44}
                    className="size-11 object-cover"
                  />
                </div>
                <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-bold text-base">
                    RPDMS
                  </span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    Research and Policy Documents Management System
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {navigationGroups.map((group, groupIndex) => {
          const filteredItems = group.items.filter((item) =>
            hasAccess(item.roles, item.permissions),
          );
          if (filteredItems.length === 0) return null;

          return (
            <SidebarGroup key={groupIndex}>
              {group.label && (
                <SidebarGroupLabel className="text-[10px] font-semibold tracking-wider text-sidebar-foreground/50 px-3 mb-1">
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const validSubItems = item.subItems
                      ? item.subItems.filter((sub) =>
                          hasAccess(sub.roles, sub.permissions),
                        )
                      : undefined;

                    // If it is a parent with sub-items, but no sub-items are accessible, hide the parent
                    if (
                      item.subItems &&
                      (!validSubItems || validSubItems.length === 0)
                    ) {
                      return null;
                    }

                    if (validSubItems && validSubItems.length > 0) {
                      const parentActive = validSubItems.some(
                        (sub) =>
                          pathname === sub.href ||
                          pathname.startsWith(sub.href + "/"),
                      );

                      return (
                        <SidebarMenuItem key={item.label}>
                          <SidebarMenuButton
                            onClick={() =>
                              setOpenMap((m) => ({
                                ...m,
                                [item.label]: !m[item.label],
                              }))
                            }
                            isActive={parentActive}
                            tooltip={item.label}
                            className={`
                              h-10 px-3 rounded-lg transition-all duration-200 flex items-center gap-3
                              ${
                                parentActive
                                  ? "bg-primary text-primary-foreground font-medium shadow-md"
                                  : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"
                              }
                            `}
                          >
                            {Icon && <Icon className="size-5" />}
                            <span className="text-sm group-data-[collapsible=icon]:hidden">
                              {item.label}
                            </span>
                            <svg
                              className={`ml-auto transition-transform group-data-[collapsible=icon]:hidden ${openMap[item.label] || parentActive ? "rotate-180" : ""}`}
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M6 9l6 6 6-6" />
                            </svg>
                          </SidebarMenuButton>

                          {(openMap[item.label] || parentActive) && (
                            <SidebarMenuSub className="pt-4 space-y-2">
                              {validSubItems.map((sub) => {
                                const SubIcon = sub.icon;
                                const isSubActive =
                                  pathname === sub.href ||
                                  pathname.startsWith(sub.href + "/");
                                return (
                                  <SidebarMenuSubItem key={sub.href}>
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={isSubActive}
                                      className="h-auto items-start px-3 py-2"
                                    >
                                      <Link
                                        href={sub.href}
                                        className="flex w-full min-w-0 items-start gap-2 text-left [&>span:last-child]:whitespace-normal [&>span:last-child]:overflow-visible [&>span:last-child]:text-clip"
                                      >
                                        {SubIcon && (
                                          <SubIcon className="mt-0.5 size-4.5 shrink-0" />
                                        )}

                                        <span className="min-w-0 flex-1 whitespace-normal text-sm leading-snug group-data-[collapsible=icon]:hidden">
                                          {sub.label}
                                        </span>
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                );
                              })}
                            </SidebarMenuSub>
                          )}
                        </SidebarMenuItem>
                      );
                    }

                    const isActive = item.href
                      ? pathname === item.href ||
                        pathname.startsWith(item.href + "/")
                      : false;

                    return (
                      <SidebarMenuItem key={item.href || item.label}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.label}
                          className={`
                            h-10 px-3 rounded-lg transition-all duration-200
                            ${
                              isActive
                                ? "bg-primary text-primary-foreground font-medium shadow-md"
                                : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"
                            }
                          `}
                        >
                          <Link
                            href={item.href || "#"}
                            className="flex items-center gap-3"
                          >
                            {Icon && <Icon className="size-5" />}
                            <span className="text-sm group-data-[collapsible=icon]:hidden">
                              {item.label}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="p-3 group-data-[collapsible=icon]:p-2 border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="h-14 px-3 rounded-lg hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent"
                >
                  <Avatar className="h-9 w-9 rounded-full ring-2 ring-sidebar-accent">
                    <AvatarFallback className="rounded-full text-white text-sm font-medium">
                      {getInitials(user?.firstName, user?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold text-sm text-sidebar-foreground">
                      {user?.firstName} {user?.lastName}
                    </span>
                    <span className="truncate text-xs text-sidebar-foreground/60">
                      {user?.role ? ROLES[user.role]?.label : "User"}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="start"
                sideOffset={8}
              >
                <div className="flex items-center gap-3 p-3">
                  <Avatar className="h-10 w-10 rounded-full">
                    <AvatarFallback className="rounded-full bg-emerald-600 text-white font-medium">
                      {getInitials(user?.firstName, user?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-semibold">
                      {user?.firstName} {user?.lastName}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <User className="h-4 w-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={signOut}
                  className="text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
