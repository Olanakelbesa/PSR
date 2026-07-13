"use client";

import { useState } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  MoreHorizontal,
  MailOpen,
  Mail,
  X,
} from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  useClearAllNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMarkNotificationUnread,
  useDeleteNotification,
  useNotifications,
} from "@/lib/queries/notifications";
import { useNotificationNavigation } from "@/hooks/useNotificationNavigation";
import {
  getCategoryIcon,
  getPriorityStyles,
  groupNotificationsByDate,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CATEGORY_LABELS,
} from "@/lib/notification-helpers";
import type { Notification } from "@/lib/types";

function getRelativeTime(createdAt: string) {
  const diffInMs = Date.now() - new Date(createdAt).getTime();
  if (Number.isNaN(diffInMs)) return "Just now";

  const minutes = Math.round(diffInMs / 1000 / 60);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function NotificationItem({
  notification,
  onClick,
  onMarkUnread,
  onDelete,
}: {
  notification: Notification;
  onClick: () => void;
  onMarkUnread: () => void;
  onDelete: () => void;
}) {
  const catIcon = getCategoryIcon(notification.category);
  const IconComponent = catIcon.icon;
  const priorityStyle = getPriorityStyles(notification.priority);

  return (
    <li>
      <div
        className={cn(
          "flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/50",
          !notification.read && "bg-primary/5",
        )}
      >
        <button
          type="button"
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
          onClick={onClick}
        >
          <div className={cn("mt-0.5 shrink-0", catIcon.color)}>
            <IconComponent className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-sm">{notification.title}</span>
              {notification.actionRequired && (
                <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Action Required
                </span>
              )}
              {priorityStyle && (
                <span
                  className={cn(
                    "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize",
                    priorityStyle,
                  )}
                >
                  {notification.priority}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {notification.message}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {getRelativeTime(notification.createdAt)}
            </p>
          </div>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="mt-0.5 h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onMarkUnread();
              }}
            >
              {notification.read ? (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Mark as unread
                </>
              ) : (
                <>
                  <MailOpen className="mr-2 h-4 w-4" />
                  Mark as read
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const { data: notifications = [], isLoading } = useNotifications(
    user?.id ?? undefined,
  );
  const markAllNotificationsRead = useMarkAllNotificationsRead();
  const clearAllNotifications = useClearAllNotifications();
  const markNotificationRead = useMarkNotificationRead();
  const markNotificationUnread = useMarkNotificationUnread();
  const deleteNotification = useDeleteNotification();
  const { handleNotificationClick } = useNotificationNavigation();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasNotifications = notifications.length > 0;

  const filtered =
    activeFilter === "all"
      ? notifications
      : notifications.filter((n) => n.category === activeFilter);

  const grouped = groupNotificationsByDate(filtered);
  const hasActiveFilters = activeFilter !== "all";

  return (
    <PageContainer
      title="Notifications"
      description="Your alerts, assignments, and status updates."
      actions={
        hasNotifications ? (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  markAllNotificationsRead.mutate(
                    notifications.filter((n) => !n.read).map((n) => n.id),
                  )
                }
                disabled={markAllNotificationsRead.isPending}
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark all as read
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearAllNotifications.mutate()}
              disabled={clearAllNotifications.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear all
            </Button>
          </div>
        ) : undefined
      }
    >
      <Tabs
        value={activeFilter}
        onValueChange={setActiveFilter}
        className="mb-4"
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {NOTIFICATION_CATEGORIES.map((cat) => {
            const count = notifications.filter((n) => n.category === cat).length;
            if (count === 0) return null;
            return (
              <TabsTrigger key={cat} value={cat}>
                {NOTIFICATION_CATEGORY_LABELS[cat] ?? cat}
                <span className="ml-1.5 text-[10px] text-muted-foreground">
                  {count}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
              <Bell className="h-8 w-8" />
              <p className="text-sm">You have no notifications yet.</p>
              <p className="text-xs text-muted-foreground">
                You&apos;ll see alerts, assignments, and status updates here.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
              <Bell className="h-8 w-8" />
              <p className="text-sm">No notifications in this category.</p>
              {hasActiveFilters && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0"
                  onClick={() => setActiveFilter("all")}
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear filter
                </Button>
              )}
            </div>
          ) : (
            <div className="group">
              {Array.from(grouped.entries()).map(([label, items]) => (
                <div key={label}>
                  <div className="px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/30 border-b">
                    {label}
                  </div>
                  <ul className="divide-y">
                    {items.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onClick={() =>
                          void handleNotificationClick(notification)
                        }
                        onMarkUnread={() => {
                          if (notification.read) {
                            markNotificationUnread.mutate(notification.id);
                          } else {
                            markNotificationRead.mutate(notification.id);
                          }
                        }}
                        onDelete={() =>
                          deleteNotification.mutate(notification.id)
                        }
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
