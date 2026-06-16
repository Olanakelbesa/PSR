"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { getNotificationRoute } from "@/lib/notification-route";
import { useMarkNotificationRead } from "@/lib/queries/notifications";
import type { Notification } from "@/lib/types";

/**
 * Shared click handler for notification list items and dropdown entries.
 * Navigates to the resource page when metadata is present; marks as read in
 * the background without blocking navigation.
 */
export function useNotificationNavigation() {
  const router = useRouter();
  const markNotificationRead = useMarkNotificationRead();

  const handleNotificationClick = useCallback(
    async (notification: Notification) => {
      const route = getNotificationRoute(notification);

      if (route) {
        router.push(route);
      }

      if (!notification.read) {
        try {
          await markNotificationRead.mutateAsync(notification.id);
        } catch (error) {
          console.error("Failed to mark notification as read", error);
        }
      }
    },
    [markNotificationRead, router],
  );

  return {
    handleNotificationClick,
    isMarkingRead: markNotificationRead.isPending,
  };
}
