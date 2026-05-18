import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";
import { API_ENDPOINTS } from "@/api/endpoints";

export interface ThematicArea {
  id: number;
  name: string;
  description: string;
}

export interface ThematicAreasResponse {
  success: boolean;
  data: ThematicArea[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useThematicAreas() {
  return useQuery({
    queryKey: ["thematic-areas"],
    queryFn: async () => {
      try {
        const { data } = await api.get(API_ENDPOINTS.THEMATIC_AREAS.LIST);
        return data as ThematicAreasResponse;
      } catch (err) {
        console.warn("[API] Failed to fetch thematic areas dynamically.", err);
        return {
          success: false,
          data: [],
          meta: undefined,
        } as ThematicAreasResponse;
      }
    },
  });
}

export function useThematicArea(id: string) {
  const query = useThematicAreas();
  return {
    ...query,
    data: query.data?.data.find((area) => String(area.id) === String(id)),
  };
}
