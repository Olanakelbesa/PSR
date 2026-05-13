import Link from "next/link";
import { PageContainer } from "@/components/layout";

export default function MyDraftsPage() {
  return (
    <PageContainer
      title="My Drafts"
      description="Your drafts for concept notes."
    >
      <div className="py-6">
        <p className="text-muted-foreground">
          Placeholder page for your drafts.
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
