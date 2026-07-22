// ============================================================================
// RPDMS — Notification Route Resolver
// ============================================================================
// Resolves a concrete frontend URL from a notification's structured resource
// metadata. The backend stays routing-agnostic: it only emits a
// `resourceType` + `resourceId`; the mapping below lives entirely on the client
// so routes can evolve without backend changes.

import type { Notification } from "@/lib/types";

/** Fallback destination when a notification has no navigable resource. */
export const NOTIFICATIONS_ROUTE = "/notifications";

export const SUPPORTED_RESOURCE_TYPES = [
  "concept_note",
  "policy",
  "research",
  "review",
  "user",
  "committee",
  "document",
  "report",
  "irb_clearance",
] as const;

export type SupportedResourceType = (typeof SUPPORTED_RESOURCE_TYPES)[number];

const EVENT_ROUTES: Record<string, (resourceId: number) => string> = {
  CONCEPT_NOTE_SUBMITTED: (id) =>
    `/policies/concept-notes/manage-concept-notes/${id}`,
  POLICY_DRAFT_SUBMITTED: (id) =>
    `/policies/drafts/manage-drafts/${id}`,
  CONCEPT_NOTE_REVIEW_ASSIGNED: (id) =>
    `/policies/concept-notes/review-concept-note/${id}/review`,
  POLICY_REVIEW_ASSIGNED: (id) =>
    `/policies/drafts/review-draft/${id}/review`,
  SCREENING_REVIEW_ASSIGNED: (id) =>
    `/research/proposals/technical-reviews/${id}/review`,
  SCREENING_READY_FOR_FUNDING: (id) => `/research/ready-for-funding/${id}`,
  IRB_CLEARANCE_SUBMITTED: (id) => `/research/irb-clearance/my-submissions/${id}`,
  IRB_CLEARANCE_REVIEW_ASSIGNED: (id) => `/research/irb-clearance/reviews/${id}`,
  IRB_CLEARANCE_APPROVED: (id) => `/research/irb-clearance/reviews/${id}`,
  IRB_CLEARANCE_REJECTED: (id) => `/research/irb-clearance/my-submissions/${id}`,
  IRB_CLEARANCE_RESUBMITTED: (id) => `/research/irb-clearance/my-submissions/${id}`,
};

/** Infer resource type from eventType when legacy rows omit resourceType. */
function inferResourceType(
  resourceType: string | undefined,
  eventType: string | undefined,
): string | undefined {
  if (resourceType) return resourceType;
  if (!eventType) return undefined;

  if (eventType.includes("CONCEPT_NOTE")) return "concept_note";
  if (eventType.includes("POLICY")) return "policy";
  if (eventType.includes("SCREENING")) return "review";

  return undefined;
}

/** Resolve resource id from explicit metadata or legacy objectId. */
function resolveResourceId(notification: Notification): number | null {
  if (notification.resourceId !== null && notification.resourceId !== undefined) {
    return notification.resourceId;
  }
  if (notification.objectId !== null && notification.objectId !== undefined) {
    return notification.objectId;
  }
  return null;
}

/**
 * Resolve the destination route for a clicked notification.
 * Returns `null` when there is no navigable resource.
 */
export function getNotificationRoute(notification: Notification): string | null {
  const eventType = notification.eventType;
  const resourceType = inferResourceType(
    notification.resourceType,
    eventType,
  );
  const resourceId = resolveResourceId(notification);

  if (!resourceType || resourceId === null) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[notifications] Missing navigation metadata", {
        id: notification.id,
        eventType,
        resourceType: notification.resourceType,
        resourceId: notification.resourceId,
        objectId: notification.objectId,
      });
    }
    return null;
  }

  if (eventType && EVENT_ROUTES[eventType]) {
    return EVENT_ROUTES[eventType](resourceId);
  }

  switch (resourceType) {
    case "concept_note":
      return `/policies/concept-notes/my-concept-note/${resourceId}`;

    case "policy":
      return `/policies/drafts/my-drafts/${resourceId}`;

    case "research":
      return `/research/proposals/my-proposals/${resourceId}`;

    case "review":
      return `/research/proposals/technical-reviews/${resourceId}`;

    case "irb_clearance":
      return `/research/irb-clearance/my-submissions/${resourceId}`;

    case "user":
      return `/settings/profile`;

    case "committee":
      return `/research/committees/${resourceId}`;

    case "document":
      return `/documents/${resourceId}`;

    case "report":
      return `/research/reports/${resourceId}`;

    default:
      console.warn(
        `Unsupported notification resource type: ${resourceType}`,
      );
      return null;
  }
}
