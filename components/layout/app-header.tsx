"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Search, Menu, Moon, Sun, PanelLeft } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useMarkAllNotificationsRead, useClearAllNotifications, useNotifications } from "@/lib/queries/notifications";
import { useNotificationNavigation } from "@/hooks/useNotificationNavigation";
import { getCategoryIcon, getPriorityStyles } from "@/lib/notification-helpers";
import { cn } from "@/lib/utils";

function getRelativeTime(createdAt: string) {
  const diffInMs = Date.now() - new Date(createdAt).getTime();
  if (Number.isNaN(diffInMs)) {
    return "Just now";
  }

  const minutes = Math.round(diffInMs / 1000 / 60);
  if (minutes < 1) {
    return "Just now";
  }
  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function AppHeader() {
  const { user } = useAuth();
  const { toggleSidebar, isMobile } = useSidebar();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const {
    data: notifications = [],
    isLoading: notificationsLoading,
  } = useNotifications(user?.id ?? undefined);
  const markAllNotificationsRead = useMarkAllNotificationsRead();
  const clearAllNotifications = useClearAllNotifications();
  const { handleNotificationClick } = useNotificationNavigation();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasNotifications = notifications.length > 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-card px-6 w-full max-w-full">
      <Button
        variant="ghost"
        size="icon"
        className="-ml-2 size-7"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        {isMobile ? (
          <Menu className="h-5 w-5" />
        ) : (
          <PanelLeft className="h-5 w-5" />
        )}
        <span className="sr-only">Toggle Sidebar</span>
      </Button>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search policies, proposals, documents..."
          className="w-full pl-9 h-10 bg-muted/50 border-0 focus-visible:ring-1"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={() =>
            setTheme((theme ?? resolvedTheme) === "dark" ? "light" : "dark")
          }
          aria-label="Toggle dark mode"
        >
          {mounted && (theme === "dark" || resolvedTheme === "dark") ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {/* Notifications */}
        <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-10 w-10">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 h-5 min-w-5 rounded-full p-0 text-[10px] flex items-center justify-center bg-orange-500 text-white border-2 border-card">
                  {unreadCount}
                </Badge>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="flex max-h-[50vh] min-w-[22rem] w-96 max-w-[26rem] flex-col overflow-hidden p-0"
          >
            <DropdownMenuLabel className="flex shrink-0 items-center justify-between gap-2 px-3 py-2">
              <span>Notifications</span>
              {hasNotifications && (
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-primary"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        markAllNotificationsRead.mutate(
                          notifications
                            .filter((notification) => !notification.read)
                            .map((notification) => notification.id),
                        );
                      }}
                      disabled={markAllNotificationsRead.isPending}
                    >
                      Mark all as read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-destructive"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      clearAllNotifications.mutate();
                    }}
                    disabled={clearAllNotifications.isPending}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="shrink-0" />
            {notificationsLoading ? (
              <div className="shrink-0 p-4 text-center text-muted-foreground text-sm">
                Loading notifications...
              </div>
            ) : notifications.length > 0 ? (
              <>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  {notifications.map((notification) => {
                    const catIcon = getCategoryIcon(notification.category);
                    const IconComponent = catIcon.icon;
                    const priorityStyle = getPriorityStyles(notification.priority);

                    return (
                      <DropdownMenuItem
                        key={notification.id}
                        className="flex cursor-pointer flex-col items-start gap-1 rounded-none p-3"
                        onSelect={(event) => {
                          event.preventDefault();
                          void handleNotificationClick(notification);
                          setNotificationsOpen(false);
                        }}
                      >
                        <div className="flex w-full items-start gap-2">
                          <div className={cn("mt-0.5 shrink-0", catIcon.color)}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium truncate">
                                {notification.title}
                              </p>
                              {notification.actionRequired && (
                                <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                  Action
                                </span>
                              )}
                              {priorityStyle && (
                                <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium", priorityStyle)}>
                                  {notification.priority}
                                </span>
                              )}
                            </div>
                            <p className="line-clamp-2 text-xs text-muted-foreground">
                              {notification.message}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {getRelativeTime(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </div>
                <DropdownMenuSeparator className="shrink-0" />
                <DropdownMenuItem asChild className="shrink-0 justify-center rounded-none">
                  <Link href="/notifications" className="text-sm text-primary">
                    View all notifications
                  </Link>
                </DropdownMenuItem>
              </>
            ) : (
              <div className="shrink-0 p-4 text-center text-muted-foreground text-sm">
                No notifications
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
