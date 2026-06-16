// ============================================================================
// RPDMS — Notification Route Resolver
// ============================================================================
// Resolves a concrete frontend URL from a notification's structured resource
// metadata. The backend stays routing-agnostic: it only emits a
// `resourceType` + `resourceId`; the mapping below lives entirely on the client
// so routes can evolve without backend changes.
//
// Adding a new resource type:
//   1. Emit the matching `resource_type` slug from the backend.
//   2. Add a `case` below returning its detail route.

import type { Notification } from "@/lib/types";

/** Fallback destination when a notification has no navigable resource. */
export const NOTIFICATIONS_ROUTE = "/notifications";

/**
 * Resource types the frontend knows how to route to today. Kept as a const so
 * call sites and tests share a single source of truth.
 */
export const SUPPORTED_RESOURCE_TYPES = [
  "concept_note",
  "policy",
  "research",
  "review",
  "user",
  "committee",
  "document",
  "report",
] as const;

export type SupportedResourceType = (typeof SUPPORTED_RESOURCE_TYPES)[number];

/** Event types that route reviewers to a workflow action page. */
const REVIEWER_EVENT_ROUTES: Record<string, (resourceId: number) => string> = {
  CONCEPT_NOTE_REVIEW_ASSIGNED: (id) =>
    `/policies/concept-notes/review-concept-note/${id}/review`,
  POLICY_REVIEW_ASSIGNED: (id) =>
    `/policies/drafts/review-draft/${id}/review`,
  SCREENING_REVIEW_ASSIGNED: (id) =>
    `/research/proposals/technical-reviews/${id}/review`,
  SCREENING_READY_FOR_FUNDING: (id) =>
    `/research/ready-for-funding/${id}`,
};

/**
 * Resolve the destination route for a clicked notification.
 *
 * Falls back to the notifications center (never throws) when the resource type
 * is unknown or the resource id is missing, so an unexpected payload can never
 * crash navigation.
 */
export function getNotificationRoute(notification: Notification): string {
  const { resourceType, resourceId, eventType } = notification;

  if (!resourceType || resourceId === null || resourceId === undefined) {
    return NOTIFICATIONS_ROUTE;
  }

  if (eventType && REVIEWER_EVENT_ROUTES[eventType]) {
    return REVIEWER_EVENT_ROUTES[eventType](resourceId);
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
      return NOTIFICATIONS_ROUTE;
  }
}
