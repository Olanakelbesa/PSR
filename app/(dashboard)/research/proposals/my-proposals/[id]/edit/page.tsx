"use client";

import { useParams, useSearchParams } from "next/navigation";
import { ProposalWizard } from "@/components/research/proposal/ProposalWizard";

export default function EditProposalPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const proposalId = searchParams.get("edit") ?? params?.id;
  const callId = searchParams.get("callId") ?? undefined;
  const isResubmitMode = searchParams.get("mode") === "resubmit";

  return (
    <div className="space-y-8 rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur sm:p-8">
      <div className="space-y-2 border-b border-border/60 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {isResubmitMode ? "Resubmit Proposal" : "Edit Proposal"}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {isResubmitMode
            ? "Update your proposal based on screening feedback, then resubmit it for review."
            : "Update your research proposal"}
        </p>
      </div>

      <ProposalWizard
        grantCallId={callId}
        proposalId={proposalId}
        isResubmitMode={isResubmitMode}
      />
    </div>
  );
}
