"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Calendar, FileText, ChevronLeft, Edit } from "lucide-react";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGrantCall } from "@/lib/queries/grant-calls";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import type { GrantCall } from "@/types/grant-call";
import { HtmlContentRenderer } from "@/components/research/proposal/steps/HtmlContentRenderer";

function isCallOpen(call: GrantCall) {
  const status = (call.status ?? "").toLowerCase();
  if (status && status !== "published" && status !== "open") return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (call.openDate) {
    const openDate = new Date(call.openDate);
    openDate.setHours(0, 0, 0, 0);
    if (today < openDate) return false;
  }

  if (call.closeDate) {
    const closeDate = new Date(call.closeDate);
    closeDate.setHours(23, 59, 59, 999);
    if (today > closeDate) return false;
  }

  return true;
}

export default function CallDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data: call, isLoading, isError } = useGrantCall(id);

  if (isLoading) {
    return (
      <div className="p-6 text-muted-foreground">
        Loading grant call details...
      </div>
    );
  }

  if (isError || !call) {
    return (
      <div className="space-y-6">
        <Link href="/research/manage-grants">
          <Button variant="ghost" className="mb-4">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Grant Calls
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Grant call not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOpen = isCallOpen(call);
  const installmentPlans = call.installmentPlans ?? [];

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link
                href="/research/manage-grants"
                className="text-foreground hover:text-foreground/50 active:bg-accent/15 focus-visible:ring-accent/30 p-2 rounded-sm shrink-0"
              >
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight wrap-break-word">
                {call.title}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 ml-0 sm:ml-10">
              <Badge variant={isOpen ? "default" : "secondary"}>
                {(call.status ?? "Unknown").charAt(0).toUpperCase() +
                  (call.status ?? "Unknown").slice(1)}
              </Badge>
              {call.currentYear && (
                <span className="text-sm text-muted-foreground">
                  • {call.currentYear}
                </span>
              )}
              {(call.proposalTypes ?? []).length > 0 && (
                <span className="text-sm text-muted-foreground">
                  • {(call.proposalTypes ?? []).length} proposal types
                </span>
              )}
            </div>
          </div>
          <Button
            size="lg"
            className="self-start"
            onClick={() => {
              router.push(`/research/manage-grants/${call.id}/edit`);
            }}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
        <div className="relative w-full h-48 sm:h-56 lg:h-64 rounded-lg overflow-hidden my-4 bg-muted">
          <Image
            src={resolveFileUrl(call.bannerImage || call.thumbnailImage) ?? "/grant-banner.png"}
            alt={call.title}
            fill
            className="object-fill"
            sizes="100vw"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm leading-relaxed text-muted-foreground">
                <HtmlContentRenderer
                  content={
                    call.description ||
                    call.shortDescription ||
                    "No description provided."
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Eligibility & Proposal Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3 text-lg">
                  Eligibility Criteria
                </h4>
                <div className="text-sm leading-relaxed text-muted-foreground">
                  <HtmlContentRenderer
                    content={call.eligibilityCriteria || "Not specified."}
                  />
                </div>
              </div>
              <div className="border-t pt-6">
                <h4 className="font-semibold mb-3 text-lg">Proposal Types</h4>
                <div className="flex flex-wrap gap-2">
                  {(call.proposalTypes ?? []).length > 0 ? (
                    call.proposalTypes!.map((proposalType) => (
                      <Badge key={proposalType.id} variant="outline">
                        {proposalType.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No proposal types linked to this call.
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Important Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Open Date</p>
                  <p className="text-xs text-muted-foreground">
                    {call.openDate
                      ? format(new Date(call.openDate), "MMMM d, yyyy")
                      : "Not specified"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Close Date</p>
                  <p className="text-xs text-muted-foreground">
                    {call.closeDate
                      ? format(new Date(call.closeDate), "MMMM d, yyyy")
                      : "Not specified"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Current Status</p>
                  <p className="text-xs text-muted-foreground">
                    {isOpen
                      ? "Accepting submissions"
                      : "Not currently accepting submissions"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Installment Plans</CardTitle>
            </CardHeader>
            <CardContent>
              {installmentPlans.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow >
                      <TableHead>Plan</TableHead>
                      <TableHead>Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installmentPlans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell>{plan.installmentNumber}</TableCell>
                        <TableCell>{plan.percentage}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No installment plans configured.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
