// ============================================================================
// PSR Platform — TanStack Query Hooks: Reference Data
// ============================================================================
// Rule ref: NEXTJS_FRONTEND_API_RULES.md §3.6, §3.7
// All lookup/dropdown data is fetched through these hooks.

import { useQuery } from "@tanstack/react-query";
import {
  getTitles,
  getOrganizationTypes,
  getUnits,
  getOrganizations,
  getPolicyDocumentTypes,
  getThematicAreas,
  getTeamMemberRoles,
  getProposalTypes,
  getSubCallTypes,
  getInternalUsers,
  getTerminalReportTypes,
} from "@/api/services/reference.service";

// Long stale time: reference data rarely changes
const REFERENCE_STALE_TIME = 1_000 * 60 * 30; // 30 minutes

export const referenceKeys = {
  titles: ["reference", "titles"] as const,
  organizationTypes: ["reference", "organization-types"] as const,
  units: ["reference", "units"] as const,
  organizations: ["reference", "organizations"] as const,
  policyDocumentTypes: ["reference", "policy-document-types"] as const,
  thematicAreas: ["reference", "thematic-areas"] as const,
  teamMemberRoles: ["reference", "team-member-roles"] as const,
  proposalTypes: ["reference", "proposal-types"] as const,
  subCallTypes: ["reference", "sub-call-types"] as const,
  internalUsers: ["reference", "internal-users"] as const,
  terminalReportTypes: ["reference", "terminal-report-types"] as const,
};

export function useTitles() {
  return useQuery({
    queryKey: referenceKeys.titles,
    queryFn: () => getTitles(),
    staleTime: REFERENCE_STALE_TIME,
  });
}

export function useOrganizationTypes() {
  return useQuery({
    queryKey: referenceKeys.organizationTypes,
    queryFn: () => getOrganizationTypes(),
    staleTime: REFERENCE_STALE_TIME,
  });
}

export function useUnits() {
  return useQuery({
    queryKey: referenceKeys.units,
    queryFn: () => getUnits(),
    staleTime: REFERENCE_STALE_TIME,
  });
}

export function useOrganizations(params?: {
  search?: string;
  limit?: number;
  page?: number;
  ordering?: string;
  org_type?: string | number;
}) {
  return useQuery({
    queryKey: ["reference", "organizations", params ?? {}] as const,
    queryFn: () =>
      getOrganizations({
        ...params,
        org_type:
          params?.org_type !== undefined && params?.org_type !== null
            ? String(params.org_type)
            : undefined,
      }),
    staleTime: REFERENCE_STALE_TIME,
  });
}

export function useUnitsWithParams(params?: {
  search?: string;
  limit?: number;
  page?: number;
  ordering?: string;
  organization?: string | number;
}) {
  return useQuery({
    queryKey: ["reference", "units", params ?? {}] as const,
    queryFn: () =>
      getUnits({
        ...params,
        organization:
          params?.organization !== undefined && params?.organization !== null
            ? String(params.organization)
            : undefined,
      }),
    staleTime: REFERENCE_STALE_TIME,
  });
}

export function usePolicyDocumentTypes() {
  return useQuery({
    queryKey: referenceKeys.policyDocumentTypes,
    queryFn: () => getPolicyDocumentTypes(),
    staleTime: REFERENCE_STALE_TIME,
  });
}

export function useThematicAreas() {
  return useQuery({
    queryKey: referenceKeys.thematicAreas,
    queryFn: () => getThematicAreas(),
    staleTime: REFERENCE_STALE_TIME,
  });
}

export function useThematicArea(id: string | number | undefined) {
  const query = useThematicAreas();
  return {
    ...query,
    data: query.data?.find((area) => String(area.id) === String(id)),
  };
}

export function useTeamMemberRoles() {
  return useQuery({
    queryKey: referenceKeys.teamMemberRoles,
    queryFn: () => getTeamMemberRoles(),
    staleTime: REFERENCE_STALE_TIME,
  });
}

export function useProposalTypes() {
  return useQuery({
    queryKey: referenceKeys.proposalTypes,
    queryFn: () => getProposalTypes(),
    staleTime: REFERENCE_STALE_TIME,
  });
}

export function useSubCallTypes() {
  return useQuery({
    queryKey: referenceKeys.subCallTypes,
    queryFn: () => getSubCallTypes(),
    staleTime: REFERENCE_STALE_TIME,
  });
}

export function useInternalUsers() {
  return useQuery({
    queryKey: referenceKeys.internalUsers,
    queryFn: () => getInternalUsers(),
    staleTime: REFERENCE_STALE_TIME,
  });
}

export function useTerminalReportTypes() {
  return useQuery({
    queryKey: referenceKeys.terminalReportTypes,
    queryFn: () => getTerminalReportTypes(),
    staleTime: REFERENCE_STALE_TIME,
  });
}
