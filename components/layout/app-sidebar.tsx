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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  PERMISSIONS,
  PERMISSION_GROUPS,
  type PermissionValue,
} from "@/lib/permissions";

interface SubNavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  permissions?: PermissionValue[];
}

interface NavItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  permissions?: PermissionValue[];
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
    label: "POLICY DOCS MANAGEMENT",
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
            permissions: [...PERMISSION_GROUPS.CONCEPT_NOTE_MANAGE],
          },
          {
            label: "Review Concept Note",
            href: "/policies/concept-notes/review-concept-note",
            icon: Dot,
            // permissions: [...PERMISSION_GROUPS.CONCEPT_NOTE_REVIEW],
            // permissions: [...PERMISSION_GROUPS.CONCEPT_NOTE_REVIEW],
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
            permissions: [...PERMISSION_GROUPS.DRAFT_MANAGE],
          },
          {
            label: "Review Draft",
            href: "/policies/drafts/review-draft",
            icon: Dot,
            // permissions: [...PERMISSION_GROUPS.DRAFT_REVIEW],
            // permissions: [...PERMISSION_GROUPS.DRAFT_REVIEW],
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
        // permissions: [PERMISSIONS.SETTING_VIEW_GRANTCALL],
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
            permissions: [...PERMISSION_GROUPS.PROPOSAL_ASSIGN_REVIEWERS],
          },
          {
            label: "Technical Reviews",
            href: "/research/proposals/technical-reviews",
            icon: Dot,
            // permissions: [PERMISSIONS.RESEARCH_VIEW_INDIVIDUAL_REVIEW],
            // permissions: [PERMISSIONS.RESEARCH_VIEW_INDIVIDUAL_REVIEW],
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
        label: "Protocol",
        href: "/research/protocol",
        icon: FileCheck2,
        // permissions: [PERMISSIONS.RESEARCH_VIEW_PROTOCOL],
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
            // permissions: [PERMISSIONS.MONITORING_VIEW_PROJECT_TRACKING],
            // permissions: [PERMISSIONS.MONITORING_VIEW_PROJECT_TRACKING],
          },
          {
            label: "Progress Report Approval",
            href: "/research/monitoring/progress-report-approval",
            icon: Dot,
            permissions: [PERMISSIONS.MONITORING_VIEW_PROGRESS_REPORT_APPROVAL],
          },
        ],
      },
      {
        label: "Final Report",
        icon: FileCheck2,
        subItems: [
          {
            label: "My Final Reports",
            href: "/research/final-report/my-final-reports",
            icon: Dot,
            // permissions: [
            //   PERMISSIONS.MONITORING_VIEW_TERMINAL_REPORT,
            //   PERMISSIONS.MONITORING_SUBMIT_TERMINAL_REPORT,
            // ],
            // permissions: [
            //   PERMISSIONS.MONITORING_VIEW_TERMINAL_REPORT,
            //   PERMISSIONS.MONITORING_SUBMIT_TERMINAL_REPORT,
            // ],
          },
          {
            label: "Final Report Approval",
            href: "/research/final-report/final-report-approval",
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
        label: "Minutes", //psr commit
        href: "/research/minutes",
        icon: FileUp,
        permissions: [PERMISSIONS.RESEARCH_VIEW_MINUTES],
      },
      {
        label: "Attachments",
        href: "/research/attachments",
        icon: FileText,
        permissions: [PERMISSIONS.RESEARCH_VIEW_ATTACHMENTS],
      },
      {
        label: "External Research ", // add psr approval menu
        subItems: [
          {
            label: "External Research",
            href: "/research/external-research/my-external-research",
            icon: Dot,
          },
          {
            label: "External Research Approval",
            href: "/research/external-research/external-research-approval",
            icon: Dot,
            permissions: [PERMISSIONS.RESEARCH_VIEW_EXTERNAL_RESEARCH_APPROVAL],
          },
        ],
      },
    ],
  },
  {
    label: "ADMINISTRATION",
    items: [
      {
        label: "Organizations",
        href: "/organizations",
        icon: Building2,
        permissions: [PERMISSIONS.SETTING_VIEW_ORGANIZATION],
      },
      {
        label: "Settings",
        icon: Settings,
        permissions: [...PERMISSION_GROUPS.SETTINGS_ACCESS],
        subItems: [
          {
            label: "General",
            href: "/settings",
            icon: Settings2Icon,
            permissions: [...PERMISSION_GROUPS.SETTINGS_ACCESS],
          },
          {
            label: "User Management",
            href: "/settings/access-control/users",
            icon: Users,
            permissions: [...PERMISSION_GROUPS.USER_MANAGEMENT],
          },
          {
            label: "Audit Logs",
            href: "/settings/audit-logs",
            icon: History,
            permissions: [...PERMISSION_GROUPS.AUDIT_LOGS],
          },
          {
            label: "Taxonomy",
            href: "/settings/taxonomy",
            icon: Tags,
            permissions: [...PERMISSION_GROUPS.SETTINGS_ACCESS],
          },
        ],
      },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile, state } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;
  const { user, signOut } = useAuth();

  const handleNavigate = useCallback(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile, setOpenMobile]);
  const {
    user: currentUser,
    hasAny,
    isLoading: permissionsLoading,
  } = useCurrentUser();
  const permissionsLoaded = !permissionsLoading;

  const roleLabel =
    currentUser?.roles && currentUser.roles.length > 0
      ? currentUser.roles.map((role) => role.name).join(", ")
      : "User";

  const hasAccess = useCallback(
    (requiredPermissions?: PermissionValue[]) => {
      if (!user) return false;

      if (requiredPermissions && requiredPermissions.length > 0) {
        if (permissionsLoading) return false;
        return hasAny(requiredPermissions);
      }

      return true;
    },
    [hasAny, permissionsLoading, user],
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
          hasAccess(sub.permissions),
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
      <SidebarHeader className="sticky top-0 z-10 shrink-0 bg-card group-data-[collapsible=icon]:p-2">
        <SidebarMenu className="group-data-[collapsible=icon]:px-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="hover:bg-sidebar-accent"
            >
              <Link
                href="/dashboard"
                onClick={handleNavigate}
                className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
              >
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
                  <span className="truncate font-bold text-base">RPDMS</span>
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
            hasAccess(item.permissions),
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
                          hasAccess(sub.permissions),
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

                      // Only the most specific (longest) matching sibling is
                      // active, so e.g. "/research/external-research" doesn't
                      // light up on "/research/external-research/approval".
                      const activeSubHref = validSubItems
                        .filter(
                          (sub) =>
                            pathname === sub.href ||
                            pathname.startsWith(sub.href + "/"),
                        )
                        .sort((a, b) => b.href.length - a.href.length)[0]?.href;

                      const parentButtonClassName = `
                              h-10 px-3 rounded-lg transition-all duration-200 flex items-center gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0
                              ${
                                parentActive
                                  ? "bg-primary text-primary-foreground font-medium shadow-md"
                                  : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"
                              }
                            `;

                      if (isCollapsed) {
                        return (
                          <SidebarMenuItem key={item.label}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                  isActive={parentActive}
                                  tooltip={item.label}
                                  className={parentButtonClassName}
                                >
                                  {Icon && <Icon className="size-5" />}
                                  <span className="text-sm group-data-[collapsible=icon]:hidden">
                                    {item.label}
                                  </span>
                                </SidebarMenuButton>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                side="right"
                                align="start"
                                sideOffset={8}
                                className="min-w-52"
                              >
                                <DropdownMenuLabel>
                                  {item.label}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {validSubItems.map((sub) => {
                                  const SubIcon = sub.icon;
                                  const isSubActive =
                                    sub.href === activeSubHref;
                                  return (
                                    <DropdownMenuItem
                                      key={sub.href}
                                      asChild
                                      className={
                                        isSubActive
                                          ? "bg-primary/10 text-primary focus:bg-primary/15 focus:text-primary"
                                          : ""
                                      }
                                    >
                                      <Link
                                        href={sub.href}
                                        onClick={handleNavigate}
                                        className="flex w-full cursor-pointer items-center gap-2"
                                      >
                                        {SubIcon && (
                                          <SubIcon className="size-4 shrink-0" />
                                        )}
                                        <span>{sub.label}</span>
                                      </Link>
                                    </DropdownMenuItem>
                                  );
                                })}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </SidebarMenuItem>
                        );
                      }

                      return (
                        <SidebarMenuItem key={item.label}>
                          <SidebarMenuButton
                            onClick={() =>
                              setOpenMap((m) => ({
                                ...m,
                                [item.label]: !(m[item.label] ?? false),
                              }))
                            }
                            isActive={parentActive}
                            tooltip={item.label}
                            className={parentButtonClassName}
                          >
                            {Icon && <Icon className="size-5" />}
                            <span className="text-sm group-data-[collapsible=icon]:hidden">
                              {item.label}
                            </span>
                            <svg
                              className={`ml-auto transition-transform group-data-[collapsible=icon]:hidden ${openMap[item.label] ? "rotate-180" : ""}`}
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

                          {openMap[item.label] && (
                            <SidebarMenuSub className="pt-4 space-y-2">
                              {validSubItems.map((sub) => {
                                const SubIcon = sub.icon;
                                const isSubActive = sub.href === activeSubHref;
                                return (
                                  <SidebarMenuSubItem key={sub.href}>
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={isSubActive}
                                      className="h-auto items-start px-3 py-2"
                                    >
                                      <Link
                                        href={sub.href}
                                        onClick={handleNavigate}
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
                            onClick={handleNavigate}
                            className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
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
                    <AvatarImage src={resolveFileUrl(user?.avatar) || undefined} alt={user?.firstName || "User"} />
                    <AvatarFallback className="rounded-full bg-primary text-white text-sm font-medium">
                      {getInitials(user?.firstName, user?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold text-sm text-sidebar-foreground">
                      {user?.firstName} {user?.lastName}
                    </span>
                    <span className="truncate text-xs text-sidebar-foreground/60">
                      {roleLabel}
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
                    <AvatarImage src={resolveFileUrl(user?.avatar) || undefined} alt={user?.firstName || "User"} />
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
                    href="/settings"
                    onClick={handleNavigate}
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
