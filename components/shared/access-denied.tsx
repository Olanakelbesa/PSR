"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AccessDenied() {
  const router = useRouter();

  return (
    <div className="flex flex-1 items-center justify-center p-6 min-h-[60vh]">
      <Card className="w-full max-w-md text-center shadow-lg border-destructive/20">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Access Restricted
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            You do not have permission to view or access this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          If you believe you should have access to this resource, please contact
          your system administrator to update your permissions.
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="w-full sm:w-auto gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button asChild className="w-full sm:w-auto gap-2">
            <Link href="/dashboard">
              <LayoutDashboard className="h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
