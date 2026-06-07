// ============================================================================
// RPDMS — Service Layer: Notification Settings
// ============================================================================

import { z } from "zod";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

export const NotificationSettingsSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(Number),
  enableSystemNotifications: z.boolean().default(true),
  enableEmailNotifications: z.boolean().default(true),
  emailProposals: z.boolean().default(true),
  emailScreening: z.boolean().default(true),
  emailReviews: z.boolean().default(true),
  emailSystemUpdates: z.boolean().default(true),
  emailSecurityAlerts: z.boolean().default(true),
  systemProposals: z.boolean().default(true),
  systemScreening: z.boolean().default(true),
  systemReviews: z.boolean().default(true),
  systemSystemUpdates: z.boolean().default(true),
  systemSecurityAlerts: z.boolean().default(true),
});

export type NotificationSettings = z.infer<typeof NotificationSettingsSchema>;

export type UpdateNotificationSettingsPayload = Partial<NotificationSettings>;

function toBackendPayload(payload: UpdateNotificationSettingsPayload) {
  const map: Record<string, boolean | undefined> = {};

  if (payload.enableSystemNotifications !== undefined) {
    map.enable_system_notifications = payload.enableSystemNotifications;
  }
  if (payload.enableEmailNotifications !== undefined) {
    map.enable_email_notifications = payload.enableEmailNotifications;
  }
  if (payload.emailProposals !== undefined) map.email_proposals = payload.emailProposals;
  if (payload.emailScreening !== undefined) map.email_screening = payload.emailScreening;
  if (payload.emailReviews !== undefined) map.email_reviews = payload.emailReviews;
  if (payload.emailSystemUpdates !== undefined) {
    map.email_system_updates = payload.emailSystemUpdates;
  }
  if (payload.emailSecurityAlerts !== undefined) {
    map.email_security_alerts = payload.emailSecurityAlerts;
  }
  if (payload.systemProposals !== undefined) map.system_proposals = payload.systemProposals;
  if (payload.systemScreening !== undefined) map.system_screening = payload.systemScreening;
  if (payload.systemReviews !== undefined) map.system_reviews = payload.systemReviews;
  if (payload.systemSystemUpdates !== undefined) {
    map.system_system_updates = payload.systemSystemUpdates;
  }
  if (payload.systemSecurityAlerts !== undefined) {
    map.system_security_alerts = payload.systemSecurityAlerts;
  }

  return map;
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const res = await apiClient.get(API_ENDPOINTS.NOTIFICATION_SETTINGS.ME);
  return NotificationSettingsSchema.parse(res.data?.data ?? res.data);
}

export async function updateNotificationSettings(
  payload: UpdateNotificationSettingsPayload,
): Promise<NotificationSettings> {
  const res = await apiClient.patch(
    API_ENDPOINTS.NOTIFICATION_SETTINGS.ME,
    toBackendPayload(payload),
  );
  return NotificationSettingsSchema.parse(res.data?.data ?? res.data);
}
