"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Search, Menu, Moon, Sun } from "lucide-react";
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
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

// Mock notifications
const notifications = [
  {
    id: "1",
    title: "New proposal submitted",
    message: "A new research proposal has been submitted for review.",
    time: "5 min ago",
    unread: true,
  },
  {
    id: "2",
    title: "Review reminder",
    message: "You have 2 pending reviews due this week.",
    time: "1 hour ago",
    unread: true,
  },
  {
    id: "3",
    title: "Policy approved",
    message: "The National Health Policy has been approved.",
    time: "2 days ago",
    unread: false,
  },
];

export function AppHeader() {
  const { user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    setMounted(true);
  }, []);

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-card px-6 w-full max-w-full">
      <SidebarTrigger className="-ml-2">
        <Menu className="h-5 w-5" />
      </SidebarTrigger>

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
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-primary"
                >
                  Mark all as read
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length > 0 ? (
              <>
                {notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                  >
                    <div className="flex items-start gap-2 w-full">
                      {notification.unread && (
                        <div className="h-2 w-2 mt-1.5 rounded-full bg-primary shrink-0" />
                      )}
                      <div className={notification.unread ? "" : "ml-4"}>
                        <p className="font-medium text-sm">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.time}
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
        {/* User Avatar */}
        <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-primary/20">
          <AvatarImage src="" alt={user?.firstName} />
          <AvatarFallback className="bg-emerald-600 text-white text-sm font-medium">
            {getInitials(user?.firstName, user?.lastName)}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
