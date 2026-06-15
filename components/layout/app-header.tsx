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
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "@/lib/queries/notifications";

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
  const {
    data: notifications = [],
    isLoading: notificationsLoading,
  } = useNotifications(user?.id ?? undefined);
  const markNotificationRead = useMarkNotificationRead();
  const markAllNotificationsRead = useMarkAllNotificationsRead();
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    setMounted(true);
  }, []);

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  const handleMarkAsRead = (notificationId: string, alreadyRead: boolean) => {
    if (alreadyRead) {
      return;
    }

    markNotificationRead.mutate(notificationId);
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
        <DropdownMenu>
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
          <DropdownMenuContent align="end" className="min-w-[22rem] w-96 max-w-[26rem]">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-primary"
                  onClick={() =>
                    markAllNotificationsRead.mutate(
                      notifications
                        .filter((notification) => !notification.read)
                        .map((notification) => notification.id),
                    )
                  }
                  disabled={markAllNotificationsRead.status === "pending"}
                >
                  Mark all as read
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notificationsLoading ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Loading notifications...
              </div>
            ) : notifications.length > 0 ? (
              <>
                {notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                    onClick={() =>
                      handleMarkAsRead(notification.id, notification.read)
                    }
                  >
                    <div className="flex items-start gap-2 w-full">
                      {!notification.read && (
                        <div className="h-2 w-2 mt-1.5 rounded-full bg-primary shrink-0" />
                      )}
                      <div className={!notification.read ? "" : "ml-4"}>
                        <p className="font-medium text-sm">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {getRelativeTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="justify-center">
                  <Link href="/notifications" className="text-primary text-sm">
                    View all notifications
                  </Link>
                </DropdownMenuItem>
              </>
            ) : (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No notifications
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
