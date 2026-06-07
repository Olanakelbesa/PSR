import { useQuery } from "@tanstack/react-query";
import {
  getOrganizations,
  type Organization,
} from "@/api/services/organizations.service";

export type { Organization };

export function useOrganizations() {
  return useQuery({
    queryKey: ["organizations", "lookup"],
    queryFn: async () => {
      const { data } = await getOrganizations({ limit: 200 });
      return data;
    },
    staleTime: 1000 * 60 * 30,
  });
}

export function useOrganizationsForSelect(params?: {
  search?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["organizations", "select", params ?? {}],
    queryFn: async () => {
      const { data } = await getOrganizations({
        search: params?.search,
        limit: params?.limit ?? 50,
      });
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}
