import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { API_ENDPOINTS } from "@/api/endpoints";

export interface OrganizationType {
  id: number;
  name: string;
  code: string;
  description: string;
}

export function useOrganizationTypes() {
  return useQuery({
    queryKey: ["organizationTypes"],
    queryFn: async () => {
      try {
        const { data } = await api.get(API_ENDPOINTS.REFERENCE.ORGANIZATION_TYPES);
        return (Array.isArray(data)
          ? data
          : (data?.data ?? data?.results ?? [])) as OrganizationType[];
      } catch (err) {
        console.warn("[API] Failed to fetch organization types dynamically.", err);
        return [] as OrganizationType[];
      }
    },
  });
}
