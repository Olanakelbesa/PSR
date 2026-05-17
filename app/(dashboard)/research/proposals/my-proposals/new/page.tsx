import { ProposalWizard } from "@/components/proposal/ProposalWizard";

export default async function CreateProposalPage({
  searchParams,
}: {
  searchParams: Promise<{ callId?: string; edit?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="space-y-8 p-6 shadow-sm backdrop-blur sm:p-8">
      <div className="space-y-2 border-b border-border/60 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {params.edit ? "Edit Proposal" : "New Proposal"}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {params.edit
            ? "Update your research proposal"
            : "Submit a new research proposal for funding"}
        </p>
      </div>

      <ProposalWizard grantCallId={params.callId} proposalId={params.edit} />
    </div>
  );
}
