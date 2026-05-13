import Link from "next/link";
import { PageContainer } from "@/components/layout";

export default function ManageDraftsPage() {
  return (
    <PageContainer
      title="Manage Drafts"
      description="View and manage all drafts."
    >
      <div className="py-6">
        <p className="text-muted-foreground">
          Placeholder page for managing drafts.
        </p>
        <div className="mt-4">
          <Link href="/policies/drafts" className="text-primary underline">
            Back to Drafts
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
