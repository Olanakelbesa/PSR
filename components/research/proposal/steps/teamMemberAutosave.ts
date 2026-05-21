import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

interface UpsertOptions {
  proposalId: string;
  backendId?: string | number;
  memberType: "internal" | "external";
  uniqueKey: {
    memberId?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
  };
  payload: {
    member?: number | null;
    role?: number | null;
    organization_name?: string;
    stakeholder_name?: string;
    position?: string;
    phone_number?: string;
    email?: string;
  };
}

/**
 * Upsert a proposal team member (internal or external)
 *
 * For internal members: uniqueness is determined by (proposal + member)
 * For external members: uniqueness is determined by (proposal + email)
 *   (fallback to phone if email not available)
 */
export async function upsertProposalTeamMember(options: UpsertOptions) {
  const { proposalId, backendId, memberType, uniqueKey, payload } = options;

  // Validate required fields
  if (!proposalId) {
    throw new Error("proposalId is required for upsert operation");
  }

  // Prepare base data
  const baseData = {
    proposal: Number(proposalId),
    member_type: memberType,
    ...payload,
  };

  try {
    if (backendId) {
      // UPDATE existing record
      const response = await apiClient.patch(
        API_ENDPOINTS.PROPOSAL_TEAM_MEMBERS.UPDATE(backendId),
        baseData
      );
      return response.data;
    } else {
      // CREATE new record
      const response = await apiClient.post(
        API_ENDPOINTS.PROPOSAL_TEAM_MEMBERS.CREATE,
        baseData
      );
      return response.data;
    }
  } catch (error) {
    console.error(`Failed to upsert ${memberType} team member:`, error);
    throw error;
  }
}