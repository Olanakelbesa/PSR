import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { API_ENDPOINTS } from "@/api/endpoints";
import { getUnits } from "@/api/services/reference.service";

export interface Unit {
  id: number;
  name: string;
  organization: number;
  description: string;
}

export function useUnits(organizationIds?: Array<number | string> | null) {
  const normalizedOrganizationIds = (organizationIds ?? [])
    .map(Number)
    .filter(
      (organizationId) =>
        Number.isInteger(organizationId) && organizationId > 0,
    );

  return useQuery({
    queryKey: [
      "units",
      normalizedOrganizationIds.length > 0
        ? normalizedOrganizationIds
            .slice()
            .sort((a, b) => a - b)
            .join(",")
        : "all",
    ],
    queryFn: async () => {
      try {
        if (normalizedOrganizationIds.length === 0) {
          const { data } = await api.get(API_ENDPOINTS.REFERENCE.UNITS);
          return data.data as Unit[];
        }

        const responses = await Promise.all(
          normalizedOrganizationIds.map(async (organizationId) => {
            const { data } = await api.get(API_ENDPOINTS.REFERENCE.UNITS, {
              params: { organization: organizationId },
            });
            return (data.data as Unit[]) ?? [];
          }),
        );

        const uniqueUnits = new Map<number, Unit>();
        responses.flat().forEach((unit) => {
          uniqueUnits.set(unit.id, unit);
        });

        return Array.from(uniqueUnits.values());
      } catch (err) {
        console.warn("[API] Failed to fetch units dynamically.", err);
        return [] as Unit[];
      }
    },
    enabled:
      normalizedOrganizationIds.length === 0 ||
      normalizedOrganizationIds.length > 0,
  });
}

export function useUnitsForSelect(params?: {
  search?: string;
  limit?: number;
  organization?: string;
}) {
  return useQuery({
    queryKey: ["units", "select", params],
    queryFn: () => getUnits(params),
    enabled: !params || !("organization" in params) || Boolean(params.organization),
  });
}
