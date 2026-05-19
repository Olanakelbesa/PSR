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
}

// ── GET /v1/users/selector/ ───────────────────────────────────────────────────
export function useUserSelector(backendToken?: string | null) {
  return useQuery<UserSelectorItem[]>({
    queryKey: ["users-selector"],
    queryFn: async () => {
      const { data } = await api.get(API_ENDPOINTS.USERS.SELECTOR, {
        ...(backendToken && { backendToken }),
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
      queryClient.invalidateQueries({ queryKey: ["concept-note-manage-detail", String(conceptNoteId)] });
    },
  });
}
