'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
} from 'lucide-react'

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
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuthStore } from '@/stores/auth-store'
import { ROLES } from '@/lib/constants'
import type { UserRole } from '@/lib/types'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: UserRole[]
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navigationGroups: NavGroup[] = [
  {
    label: '',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'POLICY MANAGEMENT',
    items: [
      // { title: 'Policies', href: '/policies/repository', icon: FileText },
      { title: 'Concept Notes', href: '/policies/concept-notes', icon: FileEdit },
      { title: 'Drafts', href: '/policies/drafts', icon: FileClock },
      { title: 'Reviews', href: '/policies/reviews', icon: FileCheck },
      { title: 'Repository', href: '/policies/library', icon: Library },
    ],
  },
  {
    label: 'RESEARCH MANAGEMENT',
    items: [
      { title: 'Calls for Proposals', href: '/research/calls', icon: Megaphone },
      { title: 'Proposals', href: '/research/proposals', icon: FileStack },
      { title: 'Evaluations', href: '/research/evaluations', icon: ClipboardCheck, roles: ['roc_reviewer', 'psr_officer', 'system_admin'] },
      { title: 'Monitoring', href: '/research/monitoring', icon: Activity },
      { title: 'Reports', href: '/research/reports', icon: BarChart3 },
    ],
  },
  {
    label: 'ADMINISTRATION',
    items: [
      { title: 'Users', href: '/users', icon: Users, roles: ['system_admin', 'psr_officer'] },
      { title: 'Organizations', href: '/organizations', icon: Building2, roles: ['system_admin', 'psr_officer'] },
      { title: 'Settings', href: '/settings', icon: Settings, roles: ['system_admin'] },
      { title: 'Audit Logs', href: '/settings/audit-logs', icon: History, roles: ['system_admin'] },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  const hasAccess = (roles?: UserRole[]) => {
    if (!roles || roles.length === 0) return true
    if (!user) return false
    return roles.includes(user.role)
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U'
  }

  return (
    <Sidebar collapsible="icon" className="border-r-0 ">
      <SidebarHeader className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-sidebar-accent">
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
                  <span className="truncate font-bold text-base">PSR Platform</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">Policy & Research Platform</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {navigationGroups.map((group, groupIndex) => {
          const filteredItems = group.items.filter((item) => hasAccess(item.roles))
          if (filteredItems.length === 0) return null

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
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                          className={`
                            h-10 px-3 rounded-lg transition-all duration-200
                            ${isActive 
                              ? 'bg-primary text-primary-foreground font-medium shadow-md' 
                              : 'hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground'
                            }
                          `}
                        >
                          <Link href={item.href} className="flex items-center gap-3">
                            <Icon className="size-[18px]" />
                            <span className="text-sm">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
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
                      {user?.role ? ROLES[user.role]?.label : 'User'}
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
                  <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
