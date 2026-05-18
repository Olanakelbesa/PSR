import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { API_CONFIG } from "@/lib/config/api";

export interface Organization {
  id: number;
  name: string;
  orgType: number;
  address: string | null;
  organizationEmail: string | null;
  organizationWebsite: string | null;
  description: string;
  createdAt: string;
}

export function useOrganizations() {
  return useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      try {
        const { data } = await api.get(API_CONFIG.endpoints.reference.organizations);
        return data.data as Organization[];
      } catch (err) {
        console.warn("[API] Failed to fetch organizations dynamically.", err);
        return [] as Organization[];
      }
    },
  });
}
