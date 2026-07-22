"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PageContainer } from "@/components/layout";

export default function EthicalClearanceDetailRedirect() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  useEffect(() => {
    router.replace(`/research/irb-clearance/my-submissions/${id}`);
  }, [router, id]);

  return (
    <PageContainer title="IRB Clearance Details">
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Redirecting to IRB Clearance details...
        </p>
      </div>
    </PageContainer>
  );
}
