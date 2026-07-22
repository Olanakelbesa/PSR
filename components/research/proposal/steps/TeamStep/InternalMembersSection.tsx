"use client";

import React, {
  useEffect,
  useState,
  useMemo,
  createContext,
  useContext,
  useRef,
} from "react";
import { useFormContext, useFieldArray, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { ProposalFormInput } from "@/lib/validators/proposal.schema";
import { Plus, Users, X, Filter, User } from "lucide-react";
import {
  useInternalUsers,
  useInternalUserById,
} from "@/lib/queries/internal-users";
import { useOrganizations, useUnitsWithParams } from "@/hooks/useReference";
import { useTeamMemberRoles } from "@/lib/queries/team-member-role";
import type { InternalUser } from "@/types/internal-user";
import type { TeamMemberRole } from "@/types/team-member-role";
import type {
  College as OrganizationOption,
  Department as UnitOption,
} from "@/types/reference-data";
import { cn } from "@/lib/utils";
import {
  deleteProposalTeamMember,
  upsertProposalTeamMember,
} from "./teamMemberAutosave";

type TeamMemberFormValue = {
  userId: string;
  role: string;
};

type ProposalTeamFormInput = {
  teamMembers: TeamMemberFormValue[];
};

/** Context so the team-member SearchableSelect hook can use organization/unit filters for server-side requests */
const MemberFilterContext = createContext<{
  selectedOrganization: string;
  selectedUnit: string;
}>({ selectedOrganization: "all", selectedUnit: "all" });

/**
 * Hook used by SearchableSelect for team members. Sends search, limit, ordering,
 * college and department to the API (server-side search and filtering).
 */
function useInternalUsersForSelect(params?: {
  search?: string;
  limit?: number;
  ordering?: string;
}) {
  const { selectedOrganization, selectedUnit } =
    useContext(MemberFilterContext);
  return useInternalUsers({
    search: params?.search,
    limit: params?.limit,
    ordering: params?.ordering,
    organization:
      selectedOrganization !== "all" ? Number(selectedOrganization) : undefined,
    unit: selectedUnit !== "all" ? Number(selectedUnit) : undefined,
  });
}

/** Fetches selected user by ID (GET /users/internal/{id}/) and passes label + option so input always shows the name */
function TeamMemberUserIdField({
  index,
  proposalId,
  selectedOrdering,
  setSelectedOrdering,
}: {
  index: number;
  proposalId?: string;
  selectedOrdering: string;
  setSelectedOrdering: (v: string) => void;
}) {
  const form = useFormContext<ProposalTeamFormInput>();
  const watchedMember = useWatch({
    control: form.control,
    name: `teamMembers.${index}` as const,
  }) as any;
  const watchedUserId = useWatch({
    control: form.control,
    name: `teamMembers.${index}.userId` as const,
    defaultValue: "",
  });
  const selectedUserResult = useInternalUserById(
    watchedUserId ? String(watchedUserId) : null,
  );
  const selectedUser = selectedUserResult.data as InternalUser | undefined;
  const isLoadingSelected = selectedUserResult.isLoading;
  const additionalOptions = useMemo<InternalUser[]>(
    () => (selectedUser ? [selectedUser] : []),
    [selectedUser],
  );
  const selectedLabel = useMemo(() => {
    if (selectedUser)
      return `${selectedUser.full_name ?? ""} (${selectedUser.email ?? ""})`.trim();
    if (watchedUserId && isLoadingSelected) return "Loading...";
    return undefined;
  }, [selectedUser, watchedUserId, isLoadingSelected]);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");
  const initializedRef = useRef(false);
  const normalizedProposalId =
    proposalId && proposalId !== "undefined" ? proposalId : "";

  const serializedMember = useMemo(
    () =>
      JSON.stringify({
        proposalId: normalizedProposalId,
        userId: watchedMember?.userId ?? "",
        role: watchedMember?.role ?? "",
      }),
    [normalizedProposalId, watchedMember?.userId, watchedMember?.role],
  );

  useEffect(() => {
    if (!initializedRef.current) {
      lastSavedRef.current = serializedMember;
      initializedRef.current = true;
      return;
    }

    const teamMemberId = watchedMember?.backendId as
      | string
      | number
      | undefined;
    const hasRequiredData =
      Boolean(normalizedProposalId) &&
      Boolean(watchedMember?.userId);

    if (!hasRequiredData) {
      lastSavedRef.current = serializedMember;
      return;
    }

    if (serializedMember === lastSavedRef.current) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (serializedMember === lastSavedRef.current || !hasRequiredData) {
        return;
      }

      try {
        const result = await upsertProposalTeamMember({
          proposalId: normalizedProposalId,
          backendId: teamMemberId,
          memberType: "internal",
          payload: {
            member: watchedMember?.userId ? Number(watchedMember.userId) : null,
            role: watchedMember?.role ? Number(watchedMember.role) : null,
          },
        });

        if (result?.id && String(result.id) !== String(teamMemberId ?? "")) {
          form.setValue(`teamMembers.${index}.backendId` as any, result.id, {
            shouldDirty: false,
            shouldTouch: false,
            shouldValidate: false,
          });
        }

        lastSavedRef.current = serializedMember;
      } catch (error) {
        console.error("Failed to auto-save internal team member", error);
      }
    }, 1200);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [normalizedProposalId, serializedMember, watchedMember, form, index]);

  return (
    <FormField
      control={form.control}
      name={`teamMembers.${index}.userId`}
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </div>
            Team Member {index + 1}
          </FormLabel>
          <FormControl>
            <SearchableSelect<InternalUser>
              value={field.value || ""}
              onValueChange={field.onChange}
              useQueryHook={useInternalUsersForSelect}
              extractData={(data) => data?.users ?? []}
              extractCount={(data) => data?.totalCount ?? 0}
              additionalOptions={additionalOptions}
              selectedLabel={selectedLabel}
              getOptionValue={(user) => String(user.id)}
              getOptionLabel={(user) =>
                `${user.full_name ?? ""} (${user.email ?? ""})`.trim()
              }
              placeholder="Select team member"
              searchPlaceholder="Search team members..."
              emptyMessage="No members found"
              noResultsMessage="No members found"
              loadingMessage="Loading members..."
              defaultSort={selectedOrdering}
              onSortChange={setSelectedOrdering}
              sortOptions={[{ value: "first_name", label: "First Name" }]}
              error={!!fieldState.error}
              triggerClassName={cn(
                fieldState.error &&
                  "border-destructive focus:border-destructive focus:ring-destructive",
              )}
              limit={500}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface InternalMembersSectionProps {
  proposalId?: string;
}

export function InternalMembersSection({
  proposalId,
}: InternalMembersSectionProps) {
  const form = useFormContext<ProposalTeamFormInput>();
  const { fields, append, remove } = useFieldArray<
    ProposalTeamFormInput,
    "teamMembers",
    "id"
  >({
    control: form.control,
    name: "teamMembers",
  });

  // Shared filter state for all members (sent to server with user search)
  const [selectedOrganization, setSelectedOrganization] =
    useState<string>("all");
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [selectedOrdering, setSelectedOrdering] =
    useState<string>("first_name");

  const filterContextValue = useMemo(
    () => ({ selectedOrganization, selectedUnit }),
    [selectedOrganization, selectedUnit],
  );

  // Fetch reference data for Organization/Unit filter dropdowns (client-side filter in Select)
  const { data: organizationsResponse } = useOrganizations();
  const { data: unitsResponse } = useUnitsWithParams({
    organization:
      selectedOrganization !== "all" ? Number(selectedOrganization) : undefined,
  });
  const organizationsData = organizationsResponse?.data ?? [];
  const unitsData = unitsResponse?.data ?? [];

  const useOrganizationsWithFilter = useMemo(
    () => (params?: { search?: string; limit?: number }) => {
      let result: OrganizationOption[] = organizationsData || [];
      if (params?.search) {
        const searchLower = params.search.toLowerCase();
        result = result.filter((organization) =>
          organization.name.toLowerCase().includes(searchLower),
        );
      }
      if (params?.limit) result = result.slice(0, params.limit);
      return { data: result, isLoading: false, isError: false };
    },
    [organizationsData],
  );

  const useUnitsWithFilter = useMemo(
    () => (params?: { search?: string; limit?: number }) => {
      let result: UnitOption[] = unitsData || [];
      if (params?.search) {
        const searchLower = params.search.toLowerCase();
        result = result.filter((unit) =>
          unit.name.toLowerCase().includes(searchLower),
        );
      }
      if (params?.limit) result = result.slice(0, params.limit);
      return { data: result, isLoading: false, isError: false };
    },
    [unitsData],
  );

  return (
    <MemberFilterContext.Provider value={filterContextValue}>
      <Card className="border-2 transition-all duration-300 hover:shadow-lg hover:border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/10 text-primary shadow-sm">
                <Users className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg sm:text-xl font-semibold">
                  Members
                </CardTitle>
                <CardDescription className="mt-1 text-sm">
                  Add team members to your proposal
                </CardDescription>
              </div>
            </div>
            {fields.length === 0 && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() =>
                  append({
                    userId: "",
                    role: "",
                  })
                }
                className="shrink-0 w-full sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Shared Filter Section */}
          {fields.length > 0 && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
              <div className="flex gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <FormLabel className="text-sm font-semibold">
                  Organization / Unit Filters
                </FormLabel>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FormLabel className="text-xs text-muted-foreground">
                    Organization
                  </FormLabel>
                  <SearchableSelect<OrganizationOption>
                    value={selectedOrganization}
                    onValueChange={(value) => {
                      setSelectedOrganization(value);
                    }}
                    useQueryHook={useOrganizationsWithFilter}
                    extractData={(data) => {
                      // Add "all" option at the beginning
                      const allOption = {
                        id: "all",
                        name: "All Organizations",
                      } as any;
                      return Array.isArray(data)
                        ? [allOption, ...data]
                        : [allOption];
                    }}
                    getOptionValue={(organization) => String(organization.id)}
                    getOptionLabel={(organization) => organization.name}
                    placeholder="All Organizations"
                    searchPlaceholder="Search organizations..."
                    emptyMessage="No organizations available"
                    noResultsMessage="No organizations found"
                    loadingMessage="Loading organizations..."
                  />
                </div>

                <div className="space-y-2">
                  <FormLabel className="text-xs text-muted-foreground">
                    Unit
                  </FormLabel>
                  <SearchableSelect<UnitOption>
                    value={selectedUnit}
                    onValueChange={(value) => {
                      setSelectedUnit(value);
                    }}
                    useQueryHook={useUnitsWithFilter}
                    extractData={(data) => {
                      // Add "all" option at the beginning
                      const allOption = {
                        id: "all",
                        name: "All Units",
                      } as any;
                      return Array.isArray(data)
                        ? [allOption, ...data]
                        : [allOption];
                    }}
                    getOptionValue={(unit) => String(unit.id)}
                    getOptionLabel={(unit) => unit.name}
                    placeholder="All Units"
                    searchPlaceholder="Search units..."
                    emptyMessage="No units available"
                    noResultsMessage="No units found"
                    loadingMessage="Loading units..."
                    limit={5}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Team Members */}
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-lg bg-card/50">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-center">
                  {/* Team Member: user by ID (GET /users/internal/{id}/) so input shows name */}
                  <TeamMemberUserIdField
                    index={index}
                    proposalId={proposalId}
                    selectedOrdering={selectedOrdering}
                    setSelectedOrdering={setSelectedOrdering}
                  />

                  {/* Role */}
                  <FormField
                    control={form.control}
                    name={`teamMembers.${index}.role`}
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <div className="flex h-8"></div>
                          Role
                        </FormLabel>
                        <FormControl>
                          <SearchableSelect<TeamMemberRole>
                            value={field.value || ""}
                            onValueChange={field.onChange}
                            useQueryHook={useTeamMemberRoles}
                            extractData={(response) => response ?? []}
                            getOptionValue={(role) => String(role.id)}
                            getOptionLabel={(role) => role.name}
                            placeholder="Select role"
                            searchPlaceholder="Search roles..."
                            emptyMessage="No roles available"
                            noResultsMessage="No roles found"
                            loadingMessage="Loading roles..."
                            limit={5}
                            error={!!fieldState.error}
                            triggerClassName={cn(
                              fieldState.error &&
                                "border-destructive focus:border-destructive focus:ring-destructive",
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Remove Button */}
                  <div className="flex items-center justify-center md:pt-7">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={async () => {
                        const teamMemberBackendId = form.getValues(
                          `teamMembers.${index}.backendId` as any,
                        ) as string | number | undefined;

                        if (teamMemberBackendId) {
                          try {
                            await deleteProposalTeamMember(teamMemberBackendId);
                          } catch (error) {
                            console.error(
                              "Failed to delete team member",
                              error,
                            );
                          }
                        }

                        remove(index);
                      }}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {fields.length > 0 && (
            <div className="flex justify-end items-end ">
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() =>
                  append({
                    userId: "",
                    role: "",
                  })
                }
                className="shrink-0 w-full sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </MemberFilterContext.Provider>
  );
}
