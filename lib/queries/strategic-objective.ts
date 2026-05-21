import { useQuery } from "@tanstack/react-query";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

export type StrategicObjectiveOption = {
  id: string | number;
  name: string;
  description?: string | null;
};

function extractList(response: any): any[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.results)) return response.results;
  return [];
}

export function useStrategicObjectives(params?: {
  search?: string;
  limit?: number;
  page?: number;
  ordering?: string;
  id?: string | number;
  name?: string;
}) {
  return useQuery({
    queryKey: ["strategic-objectives", params ?? {}],
    queryFn: async () => {
      const { data } = await apiClient.get(
        API_ENDPOINTS.REFERENCE.STRATEGIC_OBJECTIVES,
        { params },
      );
      return extractList(data) as StrategicObjectiveOption[];
    },
    staleTime: 30 * 60 * 1000,
  });
}