import { describe, it, expect, vi } from "vitest";

import {
  getNotificationRoute,
  NOTIFICATIONS_ROUTE,
} from "@/lib/notification-route";
import type { Notification } from "@/lib/types";

function makeNotification(
  overrides: Partial<Notification> = {},
): Notification {
  return {
    id: "1",
    userId: "1",
    title: "Test notification",
    message: "Test message",
    type: "system_update",
    read: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("getNotificationRoute", () => {
  it("routes concept_note notifications to the concept note detail page", () => {
    const route = getNotificationRoute(
      makeNotification({ resourceType: "concept_note", resourceId: 46 }),
    );
    expect(route).toBe("/policies/concept-notes/my-concept-note/46");
  });

  it("routes concept note reviewer assignments to the review workflow", () => {
    const route = getNotificationRoute(
      makeNotification({
        resourceType: "concept_note",
        resourceId: 46,
        eventType: "CONCEPT_NOTE_REVIEW_ASSIGNED",
      }),
    );
    expect(route).toBe(
      "/policies/concept-notes/review-concept-note/46/review",
    );
  });

  it("routes policy notifications to the draft detail page", () => {
    const route = getNotificationRoute(
      makeNotification({ resourceType: "policy", resourceId: 7 }),
    );
    expect(route).toBe("/policies/drafts/my-drafts/7");
  });

  it("routes policy reviewer assignments to the draft review workflow", () => {
    const route = getNotificationRoute(
      makeNotification({
        resourceType: "policy",
        resourceId: 7,
        eventType: "POLICY_REVIEW_ASSIGNED",
      }),
    );
    expect(route).toBe("/policies/drafts/review-draft/7/review");
  });

  it("routes research notifications to the proposal detail page", () => {
    const route = getNotificationRoute(
      makeNotification({ resourceType: "research", resourceId: 12 }),
    );
    expect(route).toBe("/research/proposals/my-proposals/12");
  });

  it("routes screening reviewer assignments to the technical review page", () => {
    const route = getNotificationRoute(
      makeNotification({
        resourceType: "review",
        resourceId: 5,
        eventType: "SCREENING_REVIEW_ASSIGNED",
      }),
    );
    expect(route).toBe("/research/proposals/technical-reviews/5/review");
  });

  it("routes ready-for-funding events to the funding decision page", () => {
    const route = getNotificationRoute(
      makeNotification({
        resourceType: "review",
        resourceId: 9,
        eventType: "SCREENING_READY_FOR_FUNDING",
      }),
    );
    expect(route).toBe("/research/ready-for-funding/9");
  });

  it("warns and falls back for unsupported resource types", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const route = getNotificationRoute(
      makeNotification({ resourceType: "spaceship", resourceId: 5 }),
    );
    expect(route).toBe(NOTIFICATIONS_ROUTE);
    expect(warn).toHaveBeenCalledWith(
      "Unsupported notification resource type: spaceship",
    );
    warn.mockRestore();
  });

  it("falls back to the notifications center when metadata is missing", () => {
    expect(getNotificationRoute(makeNotification())).toBe(NOTIFICATIONS_ROUTE);
    expect(
      getNotificationRoute(
        makeNotification({ resourceType: "concept_note", resourceId: null }),
      ),
    ).toBe(NOTIFICATIONS_ROUTE);
  });
});
