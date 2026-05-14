"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
import { useAuthStore } from "@/stores/auth-store";
import { ROLES } from "@/lib/constants";
import type { UserRole } from "@/lib/types";

interface SubNavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

interface NavItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
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
          },
          {
            label: "Review Concept Note",
            href: "/policies/concept-notes/review-concept-note",
            icon: Dot,
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
          },
          {
            label: "Review Draft",
            href: "/policies/drafts/review-draft",
            icon: Dot,
          },
        ],
      },
      { label: "Repository", href: "/policies/repository", icon: Library },
    ],
  },
  {
    label: "RESEARCH MANAGEMENT",
    items: [
      {
        label: "Grant Calls",
        href: "/research/grant-calls",
        icon: Megaphone,
      },
      {
        label: "Manage Grants",
        href: "/research/manage-grants",
        icon: Settings2Icon,
      },
      { label: "Proposals", icon: FileText, subItems: [
        {
          label: "My Proposals",
          href: "/research/proposals/my-proposals",
          icon: Dot,
        },
        {
          label: "Screening Reviews",
          href: "/research/proposals/screening-reviews",
          icon: Dot,
        },
        {
          label: "Technical Reviews",
          href: "/research/proposals/technical-reviews",
          icon: Dot,
        }
      ]},
      {
        label: "Ethical Clearance",
        href: "/research/ethical-clearance",
        icon: FileCheck2,
      },
      {
        label: "Ready for Funding",
        href: "/research/ready-for-funding",
        icon: DollarSign,
      },
      { label: "Monitoring", href: "/research/monitoring", icon: Activity },
      {
        label: "Final Report",
        href: "/research/reports",
        icon: BarChart3,
      },
      {
        label: "Research Repository",
        href: "/research/repository",
        icon: Library,
      },
      {
        label: "External Research ",
        href: "/research/external-research",
        icon: Globe,
      }
    ],
  },
  {
    label: "ADMINISTRATION",
    items: [
      {
        label: "Users",
        href: "/users",
        icon: Users,
        roles: ["system_admin", "psr_officer"],
      },
      {
        label: "Organizations",
        href: "/organizations",
        icon: Building2,
        roles: ["system_admin", "psr_officer"],
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        roles: ["system_admin"],
      },
      {
        label: "Audit Logs",
        href: "/settings/audit-logs",
        icon: History,
        roles: ["system_admin"],
      },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const hasAccess = (roles?: UserRole[]) => {
    if (!roles || roles.length === 0) return true;
    if (!user) return false;
    return roles.includes(user.role);
  };

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

  return (
    <Sidebar collapsible="icon" className="border-r-0 ">
      <SidebarHeader className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="hover:bg-sidebar-accent"
            >
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="flex aspect-square size-10 items-center justify-center rounded-full bg-primary/20 ring-2 ring-primary/50">
                  <div className="flex items-center justify-center size-8 rounded-full bg-primary">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="size-5 text-sidebar"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-bold text-base">
                    PSR Platform
                  </span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    Policy & Research Platform
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
            hasAccess(item.roles),
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

                    if (item.subItems && item.subItems.length > 0) {
                      const parentActive = item.subItems.some(
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
                            {Icon && <Icon className="size-4.5" />}
                            <span className="text-sm">{item.label}</span>
                            <svg
                              className={`ml-auto transition-transform ${openMap[item.label] || parentActive ? "rotate-180" : ""}`}
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
                              {item.subItems.map((sub) => {
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
                                          <SubIcon className="mt-0.5 size-4 shrink-0" />
                                        )}

                                        <span className="min-w-0 flex-1 whitespace-normal text-sm leading-snug">
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
                            {Icon && <Icon className="size-4.5" />}
                            <span className="text-sm">{item.label}</span>
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

      <SidebarFooter className="p-3 border-t border-sidebar-border">
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
                  <div className="grid flex-1 text-left leading-tight">
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
                  onClick={logout}
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
