import {
  Bell,
  ClipboardCheck,
  FileText,
  Search,
  Settings,
  Shield,
  Activity,
  type LucideIcon,
} from "lucide-react";
import type { Notification } from "@/lib/types";

const CATEGORY_ICON_MAP: Record<string, { icon: LucideIcon; color: string }> = {
  proposal: { icon: FileText, color: "text-blue-500" },
  screening: { icon: Search, color: "text-purple-500" },
  review: { icon: ClipboardCheck, color: "text-emerald-500" },
  system: { icon: Settings, color: "text-gray-500" },
  security: { icon: Shield, color: "text-red-500" },
  activity: { icon: Activity, color: "text-amber-500" },
};

const DEFAULT_CATEGORY_ICON = { icon: Bell, color: "text-muted-foreground" };

export function getCategoryIcon(category?: string): {
  icon: LucideIcon;
  color: string;
} {
  if (!category) return DEFAULT_CATEGORY_ICON;
  return CATEGORY_ICON_MAP[category] ?? DEFAULT_CATEGORY_ICON;
}

export function getPriorityStyles(priority?: string): string | null {
  switch (priority) {
    case "critical":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 font-semibold";
    case "high":
      return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
    case "low":
      return "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400";
    default:
      return null;
  }
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor(
    Math.abs(startOfDay(a).getTime() - startOfDay(b).getTime()) / MS_PER_DAY,
  );
}

export function getGroupLabel(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "Older";

  const now = new Date();
  const diffDays = daysBetween(now, date);

  if (diffDays === 0 && now.getDate() === date.getDate()) return "Today";
  if (diffDays <= 1 && now.getDate() !== date.getDate()) return "Yesterday";
  if (diffDays <= 7) return "This Week";
  return "Older";
}

export function groupNotificationsByDate(
  notifications: Notification[],
): Map<string, Notification[]> {
  const groups = new Map<string, Notification[]>();

  for (const notification of notifications) {
    const label = getGroupLabel(notification.createdAt);
    const existing = groups.get(label);
    if (existing) {
      existing.push(notification);
    } else {
      groups.set(label, [notification]);
    }
  }

  return groups;
}

export const NOTIFICATION_CATEGORY_LABELS: Record<string, string> = {
  proposal: "Proposals",
  screening: "Screening",
  review: "Reviews",
  system: "System",
  security: "Security",
  activity: "Activity",
};

export const NOTIFICATION_CATEGORIES = [
  "proposal",
  "screening",
  "review",
  "system",
  "security",
  "activity",
] as const;
