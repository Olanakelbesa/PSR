import { useQuery } from "@tanstack/react-query";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

export type TeamMemberRoleOption = {
  id: string | number;
  name?: string;
  description?: string;
};

function extractList(response: any): any[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.results)) return response.results;
  return [];
}

export function useTeamMemberRoles(params?: {
  search?: string;
  limit?: number;
  ordering?: string;
}) {
  return useQuery({
    queryKey: ["team-member-roles", params ?? {}],
    queryFn: async () => {
      const { data } = await apiClient.get(
        API_ENDPOINTS.REFERENCE.TEAM_MEMBER_ROLES,
        { params },
      );
      return extractList(data);
    },
    staleTime: 30 * 60 * 1000,
  });
}
