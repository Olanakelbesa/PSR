import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { API_ENDPOINTS } from "@/api/endpoints";

export function useServerPermissions() {
  const { data, isLoading, isError } = useQuery<any | null>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.USERS.ME);
      return res.data?.data ?? null;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const permissions: string[] = (data as any)?.permissions ?? [];

  function hasPermission(name: string) {
    return permissions.includes(name);
  }

  return {
    user: data,
    permissions,
    hasPermission,
    isLoading,
    isError,
  };
}
