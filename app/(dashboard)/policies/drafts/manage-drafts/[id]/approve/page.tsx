"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageContainer } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, MessageSquare, ArrowLeft } from "lucide-react";

const getMock = (id: string) => ({
  id,
  title: "Digital Health Strategy 2025-2030 Draft",
  reviewers: [
    {
      id: "rev1",
      firstName: "Abebe",
      lastName: "Kebede",
      status: "completed",
      score: 85,
    },
    {
      id: "rev2",
      firstName: "Tigist",
      lastName: "Haile",
      status: "pending",
      score: null,
    },
  ],
});

export default function ApprovePage() {
  const params = useParams();
  const router = useRouter();
  const draftId = (params as any)?.id || "d-001";
  const [data] = useState(() => getMock(draftId));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [decision, setDecision] = useState<"approve" | "changes" | null>(null);
  const [comments, setComments] = useState("");
  const [saving, setSaving] = useState(false);

  function openFor(dec: "approve" | "changes") {
    setDecision(dec);
    setDialogOpen(true);
  }

  async function handleConfirm() {
    if (!decision) return;
    setSaving(true);
    // Mock API call
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    setDialogOpen(false);
    toast.success(
      decision === "approve" ? "Draft approved" : "Requested changes",
    );
    // navigate back to draft or refresh
    router.push(`/policies/drafts/${draftId}`);
  }

  return (
    <PageContainer
      title="Approve Draft"
      description={`Approve or request changes for draft ${data.id}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/policies/drafts/${draftId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg font-semibold">{data.title}</span>
                <Badge variant="outline">Draft {data.id}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Reviewers assigned to this draft:
              </p>
              <div className="space-y-3">
                {data.reviewers.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {r.firstName[0]}
                          {r.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {r.firstName} {r.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {r.status === "completed" ? "Completed" : "Pending"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.score !== null && (
                        <Badge className="font-mono">{r.score}%</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button variant="default" onClick={() => openFor("approve")}>
                  <Check className="mr-2 h-4 w-4" /> Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => openFor("changes")}
                >
                  <X className="mr-2 h-4 w-4" /> Request Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/policies/drafts/${draftId}`)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Use the buttons to record a decision. Adding comments is
                recommended for transparency.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision === "approve" ? "Confirm approval" : "Request changes"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              placeholder={
                decision === "approve"
                  ? "Optional comments"
                  : "Describe required changes (required)"
              }
              value={comments}
              onChange={(e) =>
                setComments((e.target as HTMLTextAreaElement).value)
              }
              className="min-h-24"
            />
          </div>
          <DialogFooter className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={
                saving || (decision === "changes" && comments.trim() === "")
              }
            >
              <MessageSquare className="mr-2 h-4 w-4" />{" "}
              {saving
                ? "Saving..."
                : decision === "approve"
                  ? "Confirm Approve"
                  : "Request Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
