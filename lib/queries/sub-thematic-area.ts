import { useQuery } from "@tanstack/react-query";
import { getSubThematicAreas } from "@/api/services/reference.service";

export function useSubThematicAreas(params?: {
  thematic_area?: number;
  limit?: number;
  search?: string;
  page?: number;
}) {
  return useQuery({
    queryKey: ["sub-thematic-areas", params],
    queryFn: () => getSubThematicAreas(params),
    enabled: !params || !("thematic_area" in params) || Boolean(params.thematic_area),
  });
}

