"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  User,
  ShieldCheck,
  Save,
  Mail,
  ChevronRight,
  Loader2,
  History,
  Tags,
  Lock,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import {
  useOrganizationTypes,
  useOrganizations,
  useTitles,
  useUnitsWithParams,
} from "@/hooks/useReference";
import {
  PERMISSIONS,
  PERMISSION_GROUPS,
  hasAnyPermission,
} from "@/lib/permissions";
import { useServerPermissions } from "@/lib/queries/useServerPermissions";

type ProfileForm = {
  firstName: string;
  middleName: string;
  lastName: string;
  phone: string;
  sex: string;
  titleId: string;
  organizationTypeId: string;
  organizationId: string;
  unitId: string;
};

const emptyProfileForm: ProfileForm = {
  firstName: "",
  middleName: "",
  lastName: "",
  phone: "",
  sex: "",
  titleId: "",
  organizationTypeId: "",
  organizationId: "",
  unitId: "",
};

function userInitials(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

export default function SettingsHubPage() {
  const { permissions, hasPermission } = useServerPermissions();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const { data: titles = [] } = useTitles();
  const { data: organizationTypes = [] } = useOrganizationTypes();

  const [profileForm, setProfileForm] = useState<ProfileForm>(emptyProfileForm);

  const { data: organizationsResponse } = useOrganizations({
    limit: 200,
    org_type: profileForm.organizationTypeId || undefined,
  });
  const { data: unitsResponse } = useUnitsWithParams({
    limit: 200,
    organization: profileForm.organizationId || undefined,
  });

  const organizations = organizationsResponse?.data ?? [];
  const units = unitsResponse?.data ?? [];

  const canManageUsers = hasAnyPermission(permissions, [
    ...PERMISSION_GROUPS.USER_MANAGEMENT,
  ]);
  const canManageRoles = hasAnyPermission(permissions, [
    ...PERMISSION_GROUPS.ROLE_MANAGEMENT,
  ]);
  const canViewAuditLogs = hasAnyPermission(permissions, [
    ...PERMISSION_GROUPS.AUDIT_LOGS,
  ]);
  const canViewTaxonomy = hasAnyPermission(permissions, [
    ...PERMISSION_GROUPS.SETTINGS_ACCESS,
  ]);

  const showAccessControl = canManageUsers || canManageRoles;
  const showAdminLinks = showAccessControl || canViewAuditLogs || canViewTaxonomy;

  const tabsList = useMemo(() => {
    const tabs = [{ id: "profile", label: "My Profile", icon: User }];
    if (showAdminLinks) {
      tabs.push({ id: "admin", label: "Administration", icon: ShieldCheck });
    }
    return tabs;
  }, [showAdminLinks]);

  useEffect(() => {
    if (!profile) return;
    setProfileForm({
      firstName: profile.firstName ?? "",
      middleName: profile.middleName ?? "",
      lastName: profile.lastName ?? "",
      phone: profile.phone ?? "",
      sex: profile.sex ?? "",
      titleId: profile.title?.id ? String(profile.title.id) : "",
      organizationTypeId: profile.organizationType?.id
        ? String(profile.organizationType.id)
        : "",
      organizationId: profile.organization?.id ? String(profile.organization.id) : "",
      unitId: profile.unit?.id ? String(profile.unit.id) : "",
    });
  }, [profile]);

  const displayName =
    profile?.fullName?.trim() ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    profile?.email ||
    "User";

  const roleLabel =
    profile?.roles && profile.roles.length > 0
      ? profile.roles.map((role) => role.name).join(", ")
      : "No role assigned";

  const saveProfile = async () => {
    try {
      await updateProfile.mutateAsync({
        firstName: profileForm.firstName.trim() || null,
        middleName: profileForm.middleName.trim() || null,
        lastName: profileForm.lastName.trim() || null,
        phone: profileForm.phone.trim() || null,
        sex: profileForm.sex || null,
        title: profileForm.titleId ? Number(profileForm.titleId) : null,
        organizationType: profileForm.organizationTypeId
          ? Number(profileForm.organizationTypeId)
          : null,
        organization: profileForm.organizationId
          ? Number(profileForm.organizationId)
          : null,
        unit: profileForm.unitId ? Number(profileForm.unitId) : null,
      });
      toast.success("Profile updated successfully.");
    } catch (error) {
      toast.error((error as { message?: string })?.message ?? "Failed to update profile.");
    }
  };

  return (
    <PageContainer
      title="Settings"
      description="Manage your profile and administrative tools."
    >
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/50 p-1">
          {tabsList.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile" className="mt-0 space-y-6">
          <Card>
            <CardHeader className="border-b">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar className="h-16 w-16">
                  {profile?.photoUrl ? (
                    <AvatarImage src={profile.photoUrl} alt={displayName} />
                  ) : null}
                  <AvatarFallback>
                    {userInitials(displayName, profile?.email ?? "U")}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <CardTitle>{displayName}</CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-2">
                    <Mail className="h-3.5 w-3.5" />
                    {profile?.email ?? "—"}
                  </CardDescription>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Badge variant={profile?.enabled ? "default" : "secondary"}>
                      {profile?.enabled ? "Active" : "Disabled"}
                    </Badge>
                    <Badge variant="outline">{roleLabel}</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {profileLoading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading profile...
                </div>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>First name</Label>
                      <Input
                        value={profileForm.firstName}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            firstName: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Middle name</Label>
                      <Input
                        value={profileForm.middleName}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            middleName: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last name</Label>
                      <Input
                        value={profileForm.lastName}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            lastName: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm((prev) => ({ ...prev, phone: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sex</Label>
                      <Select
                        value={profileForm.sex || "none"}
                        onValueChange={(value) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            sex: value === "none" ? "" : value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Not specified</SelectItem>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Select
                        value={profileForm.titleId || "none"}
                        onValueChange={(value) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            titleId: value === "none" ? "" : value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select title" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {titles.map((title) => (
                            <SelectItem key={title.id} value={String(title.id)}>
                              {title.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Organization type</Label>
                      <Select
                        value={profileForm.organizationTypeId || "none"}
                        onValueChange={(value) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            organizationTypeId: value === "none" ? "" : value,
                            organizationId: "",
                            unitId: "",
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {organizationTypes.map((type) => (
                            <SelectItem key={type.id} value={String(type.id)}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Organization</Label>
                      <Select
                        value={profileForm.organizationId || "none"}
                        onValueChange={(value) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            organizationId: value === "none" ? "" : value,
                            unitId: "",
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {organizations.map((org) => (
                            <SelectItem key={org.id} value={String(org.id)}>
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Unit</Label>
                      <Select
                        value={profileForm.unitId || "none"}
                        onValueChange={(value) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            unitId: value === "none" ? "" : value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {units.map((unit) => (
                            <SelectItem key={unit.id} value={String(unit.id)}>
                              {unit.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                      href="/forgot-password"
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <Lock className="h-4 w-4" />
                      Reset password via email verification
                    </Link>
                    <Button onClick={saveProfile} disabled={updateProfile.isPending}>
                      {updateProfile.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save profile
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Administration */}
        {showAdminLinks && (
          <TabsContent value="admin" className="mt-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Administration</CardTitle>
                <CardDescription>
                  Shortcuts to system management pages you have access to.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {canManageUsers && (
                  <AdminLink
                    href="/settings/access-control/users"
                    title="User management"
                    description="Create accounts, assign roles, and control access."
                    icon={User}
                  />
                )}
                {canManageRoles && (
                  <AdminLink
                    href="/settings/access-control/roles"
                    title="Roles & permissions"
                    description="Define roles and assign permissions."
                    icon={ShieldCheck}
                  />
                )}
                {canViewAuditLogs && (
                  <AdminLink
                    href="/settings/audit-logs"
                    title="Audit logs"
                    description="Review system activity and document events."
                    icon={History}
                  />
                )}
                {canViewTaxonomy && hasPermission(PERMISSIONS.SETTING_VIEW_GRANTSETTING) && (
                  <AdminLink
                    href="/settings/taxonomy"
                    title="Reference taxonomy"
                    description="Manage lookup values used across the system."
                    icon={Tags}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </PageContainer>
  );
}

function AdminLink({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </Link>
  );
}
