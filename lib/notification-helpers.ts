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

export function parseUtcDate(createdAt: string): Date {
  if (!createdAt) return new Date();
  let str = String(createdAt).trim();
  if (!str.endsWith("Z") && !/[+-]\d{2}:\d{2}$/.test(str) && !/[+-]\d{4}$/.test(str)) {
    str = `${str}Z`;
  }
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? new Date(createdAt) : d;
}

export function formatRelativeTime(createdAt: string): string {
  const date = parseUtcDate(createdAt);
  const time = date.getTime();
  if (Number.isNaN(time)) return "Just now";

  const diffInMs = Date.now() - time;
  if (diffInMs <= 0) return "Just now";

  const minutes = Math.floor(diffInMs / 1000 / 60);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
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
  const date = parseUtcDate(createdAt);
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
