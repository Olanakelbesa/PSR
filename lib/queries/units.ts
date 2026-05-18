import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { API_CONFIG } from "@/lib/config/api";

export interface Unit {
  id: number;
  name: string;
  organization: number;
  description: string;
}

export function useUnits() {
  return useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      try {
        const { data } = await api.get(API_CONFIG.endpoints.reference.units);
        return data.data as Unit[];
      } catch (err) {
        console.warn("[API] Failed to fetch units dynamically.", err);
        return [] as Unit[];
      }
    },
  });
}
