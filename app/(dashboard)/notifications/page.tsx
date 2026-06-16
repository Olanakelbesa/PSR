"use client";

import { Bell, CheckCheck, Trash2 } from "lucide-react";

import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  useClearAllNotifications,
  useMarkAllNotificationsRead,
  useNotifications,
} from "@/lib/queries/notifications";
import { useNotificationNavigation } from "@/hooks/useNotificationNavigation";

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

export default function NotificationsPage() {
  const { user } = useAuth();
  const { data: notifications = [], isLoading } = useNotifications(
    user?.id ?? undefined,
  );
  const markAllNotificationsRead = useMarkAllNotificationsRead();
  const clearAllNotifications = useClearAllNotifications();
  const { handleNotificationClick } = useNotificationNavigation();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasNotifications = notifications.length > 0;

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
            </div>
          ) : (
            <ul className="divide-y">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => void handleNotificationClick(notification)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/50",
                      !notification.read && "bg-primary/5",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        notification.read ? "bg-transparent" : "bg-primary",
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-sm">
                        {notification.title}
                      </span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {notification.message}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {getRelativeTime(notification.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
