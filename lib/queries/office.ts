import { useQuery } from "@tanstack/react-query";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

export type OfficeOption = {
  id: string | number;
  name?: string;
  amharicName?: string | null;
  officeType?: string | number;
  officeLevel?: string | number;
  parent?: string | number | null;
  isResearchOffice?: boolean;
  code?: string | null;
  officeHead?: string | number | null;
  isActive?: boolean;
};

function extractList(response: any): any[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.results)) return response.results;
  return [];
}

export function useOffice(id: string) {
  return useQuery({
    queryKey: ["office", id],
    queryFn: async () => {
      if (!id) return undefined;
      const { data } = await apiClient.get(API_ENDPOINTS.REFERENCE.OFFICES, {
        params: { id },
      });
      return extractList(data).find(
        (office) => String(office.id) === String(id),
      );
    },
    enabled: !!id,
    staleTime: 30 * 60 * 1000,
  });
}

export function useOfficesForSelect(params?: {
  search?: string;
  limit?: number;
  page?: number;
  ordering?: string;
  id?: string | number;
  is_active?: boolean;
  is_research_office?: boolean;
  office_level?: string | number;
  office_type?: string | number;
  parent?: string | number;
}) {
  return useQuery({
    queryKey: ["offices", "select", params ?? {}],
    queryFn: async () => {
      const { data } = await apiClient.get(API_ENDPOINTS.REFERENCE.OFFICES, {
        params,
      });
      return extractList(data) as OfficeOption[];
    },
    staleTime: 30 * 60 * 1000,
  });
}
