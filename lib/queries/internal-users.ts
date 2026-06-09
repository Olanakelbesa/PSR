import { useQuery } from "@tanstack/react-query";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

export type InternalUserOption = {
  id: string | number;
  email?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  fullName?: string;
  name?: string;
};

function normalizeInternalUser(user: any): InternalUserOption {
  const fullName =
    user?.full_name ??
    user?.fullName ??
    user?.name ??
    [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();

  return {
    id: user?.id,
    email: user?.email,
    first_name: user?.first_name,
    last_name: user?.last_name,
    full_name: fullName,
    fullName: fullName,
    name: fullName,
  };
}

function extractList(response: any): any[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.results)) return response.results;
  return [];
}

export function useInternalUsers(params?: {
  search?: string;
  limit?: number;
  ordering?: string;
  organization?: string | number;
  unit?: string | number;
}) {
  return useQuery({
    queryKey: ["internal-users", params ?? {}],
    queryFn: async () => {
      const { data } = await apiClient.get(API_ENDPOINTS.USERS.SELECTOR, {
        params,
      });
      return extractList(data).map(normalizeInternalUser);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useInternalUserById(id: string | number | null) {
  return useQuery({
    queryKey: ["internal-user", id],
    queryFn: async () => {
      if (!id) return undefined;
      // Fetch by ID directly from selector API — avoids admin permission restrictions
      const { data } = await apiClient.get(API_ENDPOINTS.USERS.SELECTOR, {
        params: { id },
      });
      const list = extractList(data);
      if (list.length === 0) return undefined;
      return normalizeInternalUser(list[0]);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}
