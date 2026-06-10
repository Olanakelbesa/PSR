"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Edit2,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { ApiError } from "@/api/client";
import {
  useDeleteOrganization,
  useOrganization,
  useOrganizationType,
} from "@/hooks/useOrganizations";

function DetailField({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export default function OrganizationDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const { data: org, isLoading, error } = useOrganization(id);
  const { data: orgType } = useOrganizationType(org?.orgType);
  const deleteMutation = useDeleteOrganization();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Organization deleted.");
      router.push("/organizations");
    } catch (err) {
      const apiError = err as ApiError;
      toast.error(apiError?.message ?? "Failed to delete organization.");
    }
  };

  const handleClose = () => {
    router.push("/organizations");
  };

  return (
    <Sheet open onOpenChange={(open) => !open && handleClose()}>
      <SheetContent
        side="right"
        className="w-full max-w-3xl overflow-y-auto px-0 sm:max-w-4xl"
      >
        <div className="px-6 pb-6 pt-12">
          {isLoading ? (
            <div className="flex min-h-[50vh] items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error || !org ? (
            <div className="space-y-6">
              <SheetHeader className="text-left">
                <SheetTitle>Organization</SheetTitle>
                <SheetDescription>
                  Could not load organization details.
                </SheetDescription>
              </SheetHeader>
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="flex items-center gap-3 p-6 text-destructive">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>
                    {error instanceof Error
                      ? error.message
                      : "Organization not found."}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              <SheetHeader className="text-left">
                <SheetTitle className="text-2xl">{org.name}</SheetTitle>
                <SheetDescription>
                  Organization profile and contact details.
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleClose}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={() => router.push(`/organizations/${id}/edit`)}
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete organization?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove &quot;{org.name}&quot;.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{org.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {org.description || "No description provided."}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {orgType?.name ?? "Unknown type"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <DetailField label="Email" icon={Mail}>
                        {org.organizationEmail ? (
                          <a
                            href={`mailto:${org.organizationEmail}`}
                            className="text-primary hover:underline"
                          >
                            {org.organizationEmail}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">
                            Not provided
                          </span>
                        )}
                      </DetailField>

                      <DetailField label="Website" icon={Globe}>
                        {org.organizationWebsite ? (
                          <a
                            href={org.organizationWebsite}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all text-primary hover:underline"
                          >
                            {org.organizationWebsite}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">
                            Not provided
                          </span>
                        )}
                      </DetailField>

                      <DetailField label="Address" icon={MapPin}>
                        {org.address || (
                          <span className="text-muted-foreground">
                            Not provided
                          </span>
                        )}
                      </DetailField>

                      <DetailField label="Organization Type" icon={Building2}>
                        {orgType?.name ?? "Unknown"}
                      </DetailField>
                    </div>

                    <Separator />

                    <div className="grid gap-4 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-muted-foreground">Created</p>
                        <p className="font-medium">
                          {org.createdAt
                            ? new Date(org.createdAt).toLocaleDateString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                },
                              )
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Record ID</p>
                        <p className="font-mono font-medium">{org.id}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
