"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import type { ApiError } from "@/api/client";
import { OrganizationForm } from "@/components/organizations/organization-form";
import {
  useCreateOrganization,
  useOrganizationTypesList,
} from "@/hooks/useOrganizations";

const emptyDefaults = {
  name: "",
  orgType: "",
  description: "",
  organizationEmail: "",
  organizationWebsite: "",
  address: "",
};

export default function RegisterOrganizationPage() {
  const router = useRouter();
  const { data: typesResponse } = useOrganizationTypesList({ limit: 100 });
  const createOrgMutation = useCreateOrganization();

  return (
    <PageContainer
      title="Add Organization"
      description="Create a new institutional partner record."
      actions={
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      }
    >
      <div className="mx-auto max-w-3xl">
        <OrganizationForm
          defaultValues={emptyDefaults}
          organizationTypes={typesResponse?.data ?? []}
          submitLabel="Create Organization"
          isPending={createOrgMutation.isPending}
          onSubmit={async (values) => {
            try {
              const created = await createOrgMutation.mutateAsync({
                name: values.name,
                orgType: Number(values.orgType),
                description: values.description,
                organizationEmail: values.organizationEmail || undefined,
                organizationWebsite: values.organizationWebsite || undefined,
                address: values.address,
              });
              toast.success("Organization created successfully.");
              router.push(`/organizations/${created.id}`);
            } catch (error) {
              const apiError = error as ApiError;
              toast.error(apiError?.message ?? "Failed to create organization.");
            }
          }}
        />
      </div>
    </PageContainer>
  );
}
