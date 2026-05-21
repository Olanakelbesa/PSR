import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

type TeamMemberType = "internal" | "external";

export type UpsertTeamMemberResult = {
  id: string | number;
  action: "created" | "patched";
};

type UpsertTeamMemberInput = {
  proposalId?: string | number;
  backendId?: string | number | null;
  memberType: TeamMemberType;
  payload: Record<string, unknown>;
};

function toApiValue(
  value: string | number | null | undefined,
): string | number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : String(value);
}

export async function upsertProposalTeamMember({
  proposalId,
  backendId,
  memberType,
  payload,
}: UpsertTeamMemberInput): Promise<UpsertTeamMemberResult | null> {
  if (!proposalId) return null;

  const proposalValue = toApiValue(proposalId);
  const existingId = backendId ?? null;

  const requestBody = {
    proposal: proposalValue,
    member_type: memberType,
    ...payload,
  };

  if (existingId) {
    await apiClient.patch(
      API_ENDPOINTS.PROPOSAL_TEAM_MEMBERS.UPDATE(existingId),
      requestBody,
    );
    return { id: existingId, action: "patched" };
  }

  const { data } = await apiClient.post(
    API_ENDPOINTS.PROPOSAL_TEAM_MEMBERS.CREATE,
    requestBody,
  );

  return {
    id: data?.id,
    action: "created",
  };
}

export async function deleteProposalTeamMember(memberId: string | number) {
  await apiClient.delete(API_ENDPOINTS.PROPOSAL_TEAM_MEMBERS.DELETE(memberId));
}
