import { Navbar } from "@/components/layout/Navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { API_ENDPOINTS } from "@/lib/api/api-config";
import type { GrantCallDetail } from "@/types";
import { Calendar, Download, FileText } from "lucide-react";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/nextauth.config";

async function getCall(id: string): Promise<GrantCallDetail | null> {
  try {
    // Use absolute URL for server-side fetch
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const url = `${appUrl}${API_ENDPOINTS.GRANT_CALLS.DETAIL(id)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store", // For fresh data on each request
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const data = await response.json();
    return data?.data || data?.result || null;
  } catch (error) {
    console.error("Failed to fetch call:", error);
    return null;
  }
}

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const call = await getCall(id);
  const session = await getServerSession(authOptions);
  const user = session?.user || null;

  if (!call) {
    notFound();
  }

  const isOpen = new Date(call.close_date) > new Date();
  const canApply = user && isOpen;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={user} />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">
                {call.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>{call.proposal_type?.name || "N/A"}</span>
                  {call.sub_call_type && (
                    <>
                      <span>•</span>
                      <span>{call.sub_call_type.name}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Opens: {new Date(call.open_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Closes: {new Date(call.close_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: call.description }}
                />
              </CardContent>
            </Card>

            {call.attachments && call.attachments.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Attachments</CardTitle>
                  <CardDescription>
                    Download guidelines and templates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {call.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-md border p-3 hover:bg-accent"
                      >
                        <Download className="h-4 w-4" />
                        <span className="flex-1 text-sm">
                          {attachment.name}
                        </span>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-4">
              {canApply ? (
                <Link href={`/internal/proposals/create?callId=${call.id}`}>
                  <Button size="lg">Apply Now</Button>
                </Link>
              ) : !user ? (
                <Link href={`/login?redirect=/calls/${call.id}`}>
                  <Button size="lg">Login to Apply</Button>
                </Link>
              ) : !isOpen ? (
                <Button size="lg" disabled>
                  Call Closed
                </Button>
              ) : null}
              <Link href="/calls">
                <Button size="lg" variant="outline">
                  Back to Calls
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
