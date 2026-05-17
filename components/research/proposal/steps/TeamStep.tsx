"use client";

import { InternalMembersSection } from "./TeamStep/InternalMembersSection";
import { ExternalStakeholdersSection } from "./TeamStep/ExternalStakeholdersSection";

export function ProposalTeamStep() {
  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      <InternalMembersSection />
      <ExternalStakeholdersSection />
    </div>
  );
}
