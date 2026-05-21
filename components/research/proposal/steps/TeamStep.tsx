"use client";

import { InternalMembersSection } from "./TeamStep/InternalMembersSection";
import { ExternalStakeholdersSection } from "./TeamStep/ExternalStakeholdersSection";

interface ProposalTeamStepProps {
  proposalId?: string;
}

export function ProposalTeamStep({ proposalId }: ProposalTeamStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      <InternalMembersSection proposalId={proposalId} />
      <ExternalStakeholdersSection proposalId={proposalId} />
    </div>
  );
}
