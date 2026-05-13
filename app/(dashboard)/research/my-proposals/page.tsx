"use client";

import { PageContainer } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyProposalsPage() {
  return (
    <PageContainer title="My Proposals" description="Your submitted and draft proposals">
      <Card>
        <CardHeader>
          <CardTitle>My Proposals</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            This page will list proposals you have created or are participating in.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
