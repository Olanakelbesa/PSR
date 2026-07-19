import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { API_ENDPOINTS } from "@/api/endpoints";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface UserSelectorItem {
  id: number;
  email: string;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  fullName: string;
  photoUrl: string | null;
  sex: string | null;
  title: { id: number; name: string } | null;
  organization: { id: number; name: string } | null;
  organizationType: { id: number; name: string } | null;
  unit: { id: number; name: string } | null;
  roles: { id: number; name: string; slug: string }[];
}

export interface AssignedReviewerItem {
  id: number;
  fullName: string;
  email: string;
  avatar: string | null;
}

export interface AssignedReviewersData {
  reviewerIds: number[];
  reviewers: AssignedReviewerItem[];
}

// ── GET /v1/users/selector/ ───────────────────────────────────────────────────
export function useUserSelector(backendToken?: string | null) {
  return useQuery<UserSelectorItem[]>({
    queryKey: ["users-selector"],
    queryFn: async () => {
      const { data } = await api.get(API_ENDPOINTS.USERS.SELECTOR, {
        params: { page_size: 1000 },
      });
      return data.data as UserSelectorItem[];
    },
    staleTime: 5 * 60 * 1000, // 5 min — user list rarely changes
  });
}

// ── POST /v1/concept-notes/:id/assign-reviewer/ ───────────────────────────────
export function useAssignReviewer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conceptNoteId,
      reviewerId,
    }: {
      conceptNoteId: string | number;
      reviewerId: number;
    }) => {
      const { data } = await api.post(
        API_ENDPOINTS.CONCEPT_NOTES.ASSIGN_REVIEWER(conceptNoteId),
        { reviewer: reviewerId },
      );
      return data;
    },
    onSuccess: (_data, { conceptNoteId }) => {
      // Invalidate both the manage list and the specific note detail
      queryClient.invalidateQueries({ queryKey: ["concept-notes-manage"] });
      queryClient.invalidateQueries({
        queryKey: ["concept-note-manage-detail", String(conceptNoteId)],
      });
      queryClient.invalidateQueries({
        queryKey: ["concept-notes-assigned-reviewers", String(conceptNoteId)],
      });
    },
  });
}

// ── GET /v1/concept-notes/:id/assigned-reviewers/ ───────────────────────────
export function useAssignedReviewers(conceptNoteId?: string | number) {
  return useQuery<AssignedReviewersData>({
    queryKey: ["concept-notes-assigned-reviewers", String(conceptNoteId)],
    queryFn: async () => {
      const { data } = await api.get(
        API_ENDPOINTS.CONCEPT_NOTES.ASSIGNED_REVIEWERS(
          conceptNoteId as string | number,
        ),
      );
      return data.data as AssignedReviewersData;
    },
    enabled: !!conceptNoteId,
  });
}
