import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { Notification } from "@/lib/types";

type NotificationApiRecord = {
  id: number;
  user?: number;
  title: string;
  message: string;
  is_read?: boolean;
  isRead?: boolean;
  created_at?: string;
  createdAt?: string;
  type: string;
  priority?: string;
  action_required?: boolean;
  actionRequired?: boolean;
  category?: string;
  object_id?: number;
  objectId?: number;
  event_type?: string;
  eventType?: string;
  resource_type?: string;
  resourceType?: string;
  resource_id?: number | null;
  resourceId?: number | null;
};

function unwrapNotificationList(payload: unknown): NotificationApiRecord[] {
  const root = (payload ?? {}) as Record<string, unknown>;

  if (Array.isArray(root)) {
    return root as NotificationApiRecord[];
  }

  const data = root.data;
  if (Array.isArray(data)) {
    return data as NotificationApiRecord[];
  }

  if (data && typeof data === "object") {
    const nested = data as Record<string, unknown>;
    if (Array.isArray(nested.results)) {
      return nested.results as NotificationApiRecord[];
    }
    if (Array.isArray(nested.data)) {
      return nested.data as NotificationApiRecord[];
    }
  }

  if (Array.isArray(root.results)) {
    return root.results as NotificationApiRecord[];
  }

  return [];
}

export function normalizeNotification(
  notification: NotificationApiRecord,
): Notification {
  return {
    id: String(notification.id),
    userId: String(notification.user ?? ""),
    title: notification.title,
    message: notification.message,
    type: notification.type,
    read: Boolean(notification.is_read ?? notification.isRead),
    createdAt:
      notification.created_at ??
      notification.createdAt ??
      new Date().toISOString(),
    eventType: notification.event_type ?? notification.eventType ?? undefined,
    resourceType:
      (notification.resource_type ?? notification.resourceType)?.trim() ||
      undefined,
    resourceId: (() => {
      const raw = notification.resource_id ?? notification.resourceId ?? null;
      if (raw === null || raw === undefined || raw === "") return null;
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : null;
    })(),
    objectId: (() => {
      const raw = notification.object_id ?? notification.objectId ?? null;
      if (raw === null || raw === undefined || raw === "") return null;
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : null;
    })(),
  };
}

export function useNotifications(userId?: string) {
  return useQuery<Notification[]>({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      const { data } = await api.get(API_ENDPOINTS.NOTIFICATIONS.LIST);
      return unwrapNotificationList(data).map(normalizeNotification);
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
      const record = (data?.data ?? data) as NotificationApiRecord;
      return normalizeNotification(record);
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

export function useClearAllNotifications() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await api.post(API_ENDPOINTS.NOTIFICATIONS.CLEAR);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
