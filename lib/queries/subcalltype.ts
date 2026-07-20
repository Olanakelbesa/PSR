import { useQuery } from "@tanstack/react-query";
import apiClient from "@/api/client";

export function useSubCallType(id: string | number | null) {
  return useQuery({
    queryKey: ["proposal-sub-type", id],
    queryFn: async () => {
      if (!id) return undefined;
      const { data } = await apiClient.get("/v1/proposalsubtypes/", {
        params: { id },
      });
      const list = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data)
            ? data
            : [];
      if (list.length === 0) return undefined;
      const item = list[0];
      return { id: item.id, name: item.name };
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}
