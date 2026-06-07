"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

  if (isLoading) {
    return (
      <PageContainer title="Edit Organization" description="Loading organization...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  if (error || !org || !defaultValues) {
    return (
      <PageContainer
        title="Edit Organization"
        description="Could not load organization"
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      >
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-6 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error instanceof Error ? error.message : "Organization not found."}</p>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Edit Organization"
      description={`Update details for ${org.name}`}
      actions={
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      }
    >
      <div className="mx-auto max-w-3xl">
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
                organizationWebsite: values.organizationWebsite || undefined,
                address: values.address,
              });
              toast.success("Organization updated successfully.");
              router.push(`/organizations/${id}`);
            } catch (err) {
              const apiError = err as ApiError;
              toast.error(apiError?.message ?? "Failed to update organization.");
            }
          }}
        />
      </div>
    </PageContainer>
  );
}
