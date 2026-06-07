import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNotificationSettings,
  updateNotificationSettings,
  type UpdateNotificationSettingsPayload,
} from "@/api/services/notification-settings.service";

export const notificationSettingsKeys = {
  me: ["notification-settings", "me"] as const,
};

export function useNotificationSettings() {
  return useQuery({
    queryKey: notificationSettingsKeys.me,
    queryFn: getNotificationSettings,
    staleTime: 1_000 * 60 * 5,
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateNotificationSettingsPayload) =>
      updateNotificationSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationSettingsKeys.me });
    },
  });
}
