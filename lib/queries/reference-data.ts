import { useQuery } from "@tanstack/react-query";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

export type OrganizationOption = {
  id: string | number;
  name: string;
  orgType?: string | number;
};

export type UnitOption = {
  id: string | number;
  name: string;
  organization?: string | number;
};

function extractList(response: any): any[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.results)) return response.results;
  return [];
}

export function useOrganizations(params?: {
  search?: string;
  limit?: number;
  page?: number;
  ordering?: string;
  org_type?: string | number;
  id?: string | number;
  name?: string;
}) {
  return useQuery({
    queryKey: ["organizations", params ?? {}],
    queryFn: async () => {
      const { data } = await apiClient.get(
        API_ENDPOINTS.REFERENCE.ORGANIZATIONS,
        {
          params,
        },
      );
      return extractList(data) as OrganizationOption[];
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function useUnits(params?: {
  search?: string;
  limit?: number;
  page?: number;
  ordering?: string;
  organization?: string | number;
  id?: string | number;
  name?: string;
}) {
  return useQuery({
    queryKey: ["units", params ?? {}],
    queryFn: async () => {
      const { data } = await apiClient.get(API_ENDPOINTS.REFERENCE.UNITS, {
        params,
      });
      return extractList(data) as UnitOption[];
    },
    staleTime: 30 * 60 * 1000,
  });
}

// Backward-compatible aliases used elsewhere in the proposal UI.
export const useColleges = useOrganizations;
export const useDepartments = useUnits;
