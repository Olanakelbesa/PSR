"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  createContext,
  useContext,
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
import { useColleges, useDepartments } from "@/lib/queries/reference-data";
import { useTeamMemberRoles } from "@/lib/queries/team-member-role";
import type { InternalUser } from "@/types/internal-user";
import type { TeamMemberRole } from "@/types/team-member-role";
import type { College, Department } from "@/types/reference-data";
import { cn } from "@/lib/utils";

/** Context so the team-member SearchableSelect hook can use college/department filters for server-side requests */
const MemberFilterContext = createContext<{
  selectedCollege: string;
  selectedDepartment: string;
}>({ selectedCollege: "all", selectedDepartment: "all" });

/**
 * Hook used by SearchableSelect for team members. Sends search, limit, ordering,
 * college and department to the API (server-side search and filtering).
 */
function useInternalUsersForSelect(params?: {
  search?: string;
  limit?: number;
  ordering?: string;
}) {
  const { selectedCollege, selectedDepartment } =
    useContext(MemberFilterContext);
  return useInternalUsers({
    search: params?.search,
    limit: params?.limit,
    ordering: params?.ordering,
    college: selectedCollege !== "all" ? Number(selectedCollege) : undefined,
    department:
      selectedDepartment !== "all" ? Number(selectedDepartment) : undefined,
  });
}

/** Fetches selected user by ID (GET /users/internal/{id}/) and passes label + option so input always shows the name */
function TeamMemberUserIdField({
  index,
  selectedOrdering,
  setSelectedOrdering,
}: {
  index: number;
  selectedOrdering: string;
  setSelectedOrdering: (v: string) => void;
}) {
  const form = useFormContext<ProposalFormInput>();
  const watchedUserId = useWatch({
    control: form.control,
    name: `teamMembers.${index}.userId`,
    defaultValue: "",
  });
  const { data: selectedUser, isLoading: isLoadingSelected } =
    useInternalUserById(watchedUserId ? String(watchedUserId) : null);
  const additionalOptions = useMemo<InternalUser[]>(
    () => (selectedUser ? [selectedUser] : []),
    [selectedUser],
  );
  const selectedLabel = useMemo(() => {
    if (selectedUser)
      return `${selectedUser.full_name ?? ""} (${selectedUser.email ?? ""})`.trim();
    if (watchedUserId && isLoadingSelected) return "Loading...";
    if (watchedUserId) return `User #${watchedUserId}`;
    return undefined;
  }, [selectedUser, watchedUserId, isLoadingSelected]);

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
              limit={100}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function InternalMembersSection() {
  const form = useFormContext<ProposalFormInput>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "teamMembers",
  });

  // Shared filter state for all members (sent to server with user search)
  const [selectedCollege, setSelectedCollege] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedOrdering, setSelectedOrdering] =
    useState<string>("first_name");

  const filterContextValue = useMemo(
    () => ({ selectedCollege, selectedDepartment }),
    [selectedCollege, selectedDepartment],
  );

  // Fetch reference data for College/Department filter dropdowns (client-side filter in Select)
  const { data: collegesData = [] } = useColleges();
  const { data: departmentsData = [] } = useDepartments();

  const useCollegesWithFilter = useMemo(
    () => (params?: { search?: string; limit?: number }) => {
      let result = collegesData || [];
      if (params?.search) {
        const searchLower = params.search.toLowerCase();
        result = result.filter(
          (college) =>
            college.name.toLowerCase().includes(searchLower) ||
            college.Amharic_name?.toLowerCase().includes(searchLower),
        );
      }
      if (params?.limit) result = result.slice(0, params.limit);
      return { data: result, isLoading: false, isError: false };
    },
    [collegesData],
  );

  const useDepartmentsWithFilter = useMemo(
    () => (params?: { search?: string; limit?: number }) => {
      let result = departmentsData || [];
      if (params?.search) {
        const searchLower = params.search.toLowerCase();
        result = result.filter(
          (dept) =>
            dept.name.toLowerCase().includes(searchLower) ||
            dept.Amharic_name?.toLowerCase().includes(searchLower),
        );
      }
      if (params?.limit) result = result.slice(0, params.limit);
      return { data: result, isLoading: false, isError: false };
    },
    [departmentsData],
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
                  Internal Members
                </CardTitle>
                <CardDescription className="mt-1 text-sm">
                  Add internal team members to your proposal
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
                  Filter Members
                </FormLabel>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FormLabel className="text-xs text-muted-foreground">
                    College
                  </FormLabel>
                  <SearchableSelect<College>
                    value={selectedCollege}
                    onValueChange={(value) => {
                      setSelectedCollege(value);
                    }}
                    useQueryHook={useCollegesWithFilter}
                    extractData={(data) => {
                      // Add "all" option at the beginning
                      const allOption = {
                        id: "all",
                        name: "All Colleges",
                      } as any;
                      return Array.isArray(data)
                        ? [allOption, ...data]
                        : [allOption];
                    }}
                    getOptionValue={(college) => String(college.id)}
                    getOptionLabel={(college) => college.name}
                    placeholder="All Colleges"
                    searchPlaceholder="Search colleges..."
                    emptyMessage="No colleges available"
                    noResultsMessage="No colleges found"
                    loadingMessage="Loading colleges..."
                  />
                </div>

                <div className="space-y-2">
                  <FormLabel className="text-xs text-muted-foreground">
                    Department
                  </FormLabel>
                  <SearchableSelect<Department>
                    value={selectedDepartment}
                    onValueChange={(value) => {
                      setSelectedDepartment(value);
                    }}
                    useQueryHook={useDepartmentsWithFilter}
                    extractData={(data) => {
                      // Add "all" option at the beginning
                      const allOption = {
                        id: "all",
                        name: "All Departments",
                      } as any;
                      return Array.isArray(data)
                        ? [allOption, ...data]
                        : [allOption];
                    }}
                    getOptionValue={(dept) => String(dept.id)}
                    getOptionLabel={(dept) => dept.name}
                    placeholder="All Departments"
                    searchPlaceholder="Search departments..."
                    emptyMessage="No departments available"
                    noResultsMessage="No departments found"
                    loadingMessage="Loading departments..."
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
                            extractData={(response) => response?.data ?? []}
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
                      onClick={() => remove(index)}
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
