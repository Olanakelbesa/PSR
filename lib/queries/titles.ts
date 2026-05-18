import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { API_CONFIG } from "@/lib/config/api";

export interface Title {
  id: number;
  name: string;
}

const FALLBACK_TITLES = ['Dr.', 'Prof.', 'Ato', 'W/ro', 'W/rt', 'Mr.', 'Ms.'];

export function useTitles() {
  return useQuery({
    queryKey: ["titles"],
    queryFn: async () => {
      try {
        const { data } = await api.get(API_CONFIG.endpoints.reference.titles);
        return data.data as Title[];
      } catch (err) {
        console.warn("[API] Failed to fetch titles dynamically, using fallback.", err);
        return FALLBACK_TITLES.map((name, i) => ({ id: i + 1, name }));
      }
    },
  });
}
