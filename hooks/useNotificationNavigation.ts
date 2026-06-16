"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import {
  getNotificationRoute,
  NOTIFICATIONS_ROUTE,
} from "@/lib/notification-route";
import { useMarkNotificationRead } from "@/lib/queries/notifications";
import type { Notification } from "@/lib/types";

/**
 * Shared click handler for notification list items and dropdown entries.
 * Marks unread notifications as read, then navigates via structured metadata.
 */
export function useNotificationNavigation() {
  const router = useRouter();
  const markNotificationRead = useMarkNotificationRead();

  const handleNotificationClick = useCallback(
    async (notification: Notification) => {
      try {
        if (!notification.read) {
          await markNotificationRead.mutateAsync(notification.id);
        }

        const route = getNotificationRoute(notification);
        router.push(route);
      } catch (error) {
        console.error("Failed to handle notification click", error);
        router.push(NOTIFICATIONS_ROUTE);
      }
    },
    [markNotificationRead, router],
  );

  return {
    handleNotificationClick,
    isMarkingRead: markNotificationRead.isPending,
  };
}
