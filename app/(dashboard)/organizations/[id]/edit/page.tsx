"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ApiError } from "@/api/client";
import { OrganizationForm } from "@/components/organizations/organization-form";
import {
  useOrganization,
  useOrganizationTypesList,
  useUpdateOrganization,
} from "@/hooks/useOrganizations";

export default function EditOrganizationPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const { data: org, isLoading, error } = useOrganization(id);
  const { data: typesResponse } = useOrganizationTypesList({ limit: 100 });
  const updateMutation = useUpdateOrganization(id);

  const defaultValues = useMemo(
    () =>
      org
        ? {
            name: org.name,
            orgType: String(org.orgType),
            description: org.description || "",
            organizationEmail: org.organizationEmail || "",
            organizationWebsite: org.organizationWebsite || "",
            address: org.address || "",
          }
        : null,
    [org],
  );

  const handleClose = () => {
    router.push(`/organizations/${id}`);
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
          ) : error || !org || !defaultValues ? (
            <div className="space-y-6">
              <SheetHeader className="text-left">
                <SheetTitle>Edit Organization</SheetTitle>
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
              <Button variant="outline" onClick={handleClose}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <SheetHeader className="text-left">
                <SheetTitle className="text-2xl">Edit Organization</SheetTitle>
                <SheetDescription>{`Update details for ${org.name}`}</SheetDescription>
              </SheetHeader>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleClose}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </div>

              <OrganizationForm
                key={org.id}
                defaultValues={defaultValues}
                organizationTypes={typesResponse?.data ?? []}
                submitLabel="Save Changes"
                isPending={updateMutation.isPending}
                onSubmit={async (values) => {
                  try {
                    await updateMutation.mutateAsync({
                      name: values.name,
                      orgType: Number(values.orgType),
                      description: values.description,
                      organizationEmail: values.organizationEmail || undefined,
                      organizationWebsite:
                        values.organizationWebsite || undefined,
                      address: values.address,
                    });
                    toast.success("Organization updated successfully.");
                    router.push(`/organizations/${id}`);
                  } catch (err) {
                    const apiError = err as ApiError;
                    toast.error(
                      apiError?.message ?? "Failed to update organization.",
                    );
                  }
                }}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
