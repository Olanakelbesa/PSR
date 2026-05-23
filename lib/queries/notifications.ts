import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { Notification } from "@/lib/types";

type NotificationApiResponse = {
  id: number;
  user: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  type: string;
  priority?: string;
  action_required?: boolean;
  category?: string;
  object_id?: number;
};

function normalizeNotification(notification: NotificationApiResponse): Notification {
  return {
    id: String(notification.id),
    userId: String(notification.user),
    title: notification.title,
    message: notification.message,
    type: notification.type,
    read: notification.is_read,
    createdAt: notification.created_at,
  };
}

export function useNotifications(userId?: string) {
  return useQuery<Notification[]>({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      const { data } = await api.get(API_ENDPOINTS.NOTIFICATIONS.LIST);
      const list =
        Array.isArray(data?.data?.results) && data?.data?.results.length
          ? data.data.results
          : Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data?.data)
          ? data.data
          : [];
      return (list as NotificationApiResponse[]).map(normalizeNotification);
    },
    enabled: !!userId,
    staleTime: 1000 * 60,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation<Notification, Error, string>({
    mutationFn: async (id: string) => {
      const { data } = await api.post(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
      return (data.data ?? data) as Notification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string[]>({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map((id) => api.post(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id))),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
