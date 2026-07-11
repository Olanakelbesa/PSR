import { useEffect, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { ConceptNoteFormData } from "@/lib/validations";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type NamedEntity = {
  id: number | string;
  name: string;
};

export function withProfileOrganization<T extends NamedEntity>(
  organizations: T[],
  profileOrganization?: NamedEntity | null,
): T[] {
  if (!profileOrganization?.id) return organizations;

  const profileOrgId = String(profileOrganization.id);
  if (organizations.some((organization) => String(organization.id) === profileOrgId)) {
    return organizations;
  }

  return [{ ...profileOrganization, id: profileOrganization.id } as T, ...organizations];
}

export function withProfileUnit<T extends NamedEntity>(
  units: T[],
  profileUnit?: NamedEntity | null,
): T[] {
  if (!profileUnit?.id) return units;

  const profileUnitId = String(profileUnit.id);
  if (units.some((unit) => String(unit.id) === profileUnitId)) {
    return units;
  }

  return [{ ...profileUnit, id: profileUnit.id } as T, ...units];
}

interface UseConceptNoteProfileDefaultsOptions {
  form: UseFormReturn<ConceptNoteFormData>;
  organizations: NamedEntity[];
  units: NamedEntity[];
  isLoadingOrganizations?: boolean;
  isLoadingUnits?: boolean;
  /** When true, only fill fields that are still empty (edit page). */
  onlyWhenEmpty?: boolean;
  /** Wait until prerequisite data (e.g. concept note) has loaded. */
  enabled?: boolean;
  /** Reset autofill guards when this changes (e.g. concept note id). */
  resetKey?: string | number | null;
}

export function useConceptNoteProfileDefaults({
  form,
  organizations,
  units,
  isLoadingOrganizations = false,
  isLoadingUnits = false,
  onlyWhenEmpty = true,
  enabled = true,
  resetKey = "new",
}: UseConceptNoteProfileDefaultsOptions) {
  const { user: currentUser, isLoading: isLoadingCurrentUser } = useCurrentUser();
  const hasAppliedOrganizationRef = useRef(false);
  const hasAppliedUnitRef = useRef(false);
  const selectedOrganization = form.watch("organization");

  useEffect(() => {
    hasAppliedOrganizationRef.current = false;
    hasAppliedUnitRef.current = false;
  }, [resetKey]);

  useEffect(() => {
    hasAppliedUnitRef.current = false;
  }, [selectedOrganization]);

  useEffect(() => {
    if (!enabled) return;
    if (hasAppliedOrganizationRef.current) return;
    if (isLoadingCurrentUser || isLoadingOrganizations) return;
    if (organizations.length === 0) return;

    const currentOrganization = form.getValues("organization");
    if (onlyWhenEmpty && currentOrganization) {
      hasAppliedOrganizationRef.current = true;
      return;
    }

    if (!currentUser?.organization?.id) {
      hasAppliedOrganizationRef.current = true;
      return;
    }

    const organizationId = String(currentUser.organization.id);
    if (!organizations.some((organization) => String(organization.id) === organizationId)) {
      return;
    }

    if (!currentOrganization) {
      form.setValue("organization", organizationId, {
        shouldDirty: false,
        shouldValidate: false,
      });
    }

    hasAppliedOrganizationRef.current = true;
  }, [
    enabled,
    onlyWhenEmpty,
    currentUser,
    isLoadingCurrentUser,
    isLoadingOrganizations,
    organizations,
    form,
  ]);

  useEffect(() => {
    if (!enabled) return;
    if (hasAppliedUnitRef.current) return;
    if (isLoadingCurrentUser) return;

    const currentUnit = form.getValues("unit");
    if (onlyWhenEmpty && currentUnit) {
      hasAppliedUnitRef.current = true;
      return;
    }

    if (!currentUser?.unit?.id) {
      hasAppliedUnitRef.current = true;
      return;
    }

    const organizationId = form.getValues("organization") || selectedOrganization;
    if (!organizationId) {
      // Wait until organization autofill completes before applying unit.
      return;
    }

    if (isLoadingUnits) return;

    const unitId = String(currentUser.unit.id);
    const unitExistsInOptions = units.some((unit) => String(unit.id) === unitId);

    if (unitExistsInOptions && !form.getValues("unit")) {
      form.setValue("unit", unitId, {
        shouldDirty: false,
        shouldValidate: false,
      });
      hasAppliedUnitRef.current = true;
      return;
    }

    // Units finished loading but profile unit is not valid for this organization.
    if (!isLoadingUnits) {
      hasAppliedUnitRef.current = true;
    }
  }, [
    enabled,
    onlyWhenEmpty,
    currentUser,
    isLoadingCurrentUser,
    selectedOrganization,
    units,
    isLoadingUnits,
    form,
  ]);

  return {
    profileOrganization: currentUser?.organization ?? null,
    profileUnit: currentUser?.unit ?? null,
    isLoadingProfile: isLoadingCurrentUser,
  };
}
