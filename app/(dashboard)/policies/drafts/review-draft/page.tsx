import Link from "next/link";
import { PageContainer } from "@/components/layout";

export default function ReviewDraftPage() {
  return (
    <PageContainer
      title="Review Draft"
      description="Review a submitted draft document."
    >
      <div className="py-6">
        <p className="text-muted-foreground">
          Placeholder page for reviewing drafts.
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
