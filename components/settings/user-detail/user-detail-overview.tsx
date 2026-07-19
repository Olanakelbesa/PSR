"use client";

import { useState } from "react";
import {
  Building2,
  Mail,
  Phone,
  User as UserIcon,
  Calendar,
  Clock,
  Pencil,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useUpdateUser } from "@/hooks/useUsers";
import {
  useTitles,
  useOrganizationTypes,
  useOrganizations,
  useUnitsWithParams,
} from "@/hooks/useReference";
import type { User } from "@/api/services/users.service";

interface UserDetailOverviewProps {
  user: User;
}

export function UserDetailOverview({ user }: UserDetailOverviewProps) {
  const updateUser = useUpdateUser();
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingOrg, setEditingOrg] = useState(false);

  const { data: titles = [] } = useTitles();
  const { data: organizationTypes = [] } = useOrganizationTypes();
  const { data: organizationsResponse } = useOrganizations({ limit: 200 });
  const { data: unitsResponse } = useUnitsWithParams({ limit: 200 });

  const organizations = organizationsResponse?.data ?? [];
  const units = unitsResponse?.data ?? [];

  const [personalForm, setPersonalForm] = useState({
    firstName: user.firstName ?? "",
    middleName: user.middleName ?? "",
    lastName: user.lastName ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    sex: user.sex ?? "",
    titleId: user.title?.id ? String(user.title.id) : "",
  });

  const [orgForm, setOrgForm] = useState({
    organizationTypeId: user.organizationType?.id
      ? String(user.organizationType.id)
      : "",
    organizationId: user.organization?.id
      ? String(user.organization.id)
      : "",
    unitId: user.unit?.id ? String(user.unit.id) : "",
  });

  const handleSavePersonal = async () => {
    try {
      await updateUser.mutateAsync({
        id: user.id,
        data: {
          firstName: personalForm.firstName || null,
          middleName: personalForm.middleName || null,
          lastName: personalForm.lastName || null,
          email: personalForm.email,
          phone: personalForm.phone || null,
          sex: personalForm.sex || null,
          title: personalForm.titleId ? Number(personalForm.titleId) : null,
        },
      });
      toast.success("Personal information updated.");
      setEditingPersonal(false);
    } catch {
      toast.error("Failed to update personal information.");
    }
  };

  const handleSaveOrg = async () => {
    try {
      await updateUser.mutateAsync({
        id: user.id,
        data: {
          organization: orgForm.organizationId
            ? Number(orgForm.organizationId)
            : null,
          unit: orgForm.unitId ? Number(orgForm.unitId) : null,
        },
      });
      toast.success("Organization information updated.");
      setEditingOrg(false);
    } catch {
      toast.error("Failed to update organization information.");
    }
  };

  const handleToggleStatus = async (enabled: boolean) => {
    try {
      await updateUser.mutateAsync({
        id: user.id,
        data: {
          enabled,
          status: enabled ? "Active" : "Inactive",
        },
      });
      toast.success(`Account ${enabled ? "enabled" : "disabled"}.`);
    } catch {
      toast.error("Failed to update account status.");
    }
  };

  const formatDisplayDate = (value?: string | null) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* Personal Information */}
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-muted/20 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">
              Personal Information
            </CardTitle>
            {!editingPersonal ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingPersonal(true)}
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingPersonal(false)}
                >
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSavePersonal}
                  disabled={updateUser.isPending}
                >
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Save
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {editingPersonal ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={personalForm.firstName}
                  onChange={(e) =>
                    setPersonalForm((p) => ({
                      ...p,
                      firstName: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Middle Name</Label>
                <Input
                  value={personalForm.middleName}
                  onChange={(e) =>
                    setPersonalForm((p) => ({
                      ...p,
                      middleName: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={personalForm.lastName}
                  onChange={(e) =>
                    setPersonalForm((p) => ({
                      ...p,
                      lastName: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={personalForm.email}
                  onChange={(e) =>
                    setPersonalForm((p) => ({
                      ...p,
                      email: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={personalForm.phone}
                  onChange={(e) =>
                    setPersonalForm((p) => ({
                      ...p,
                      phone: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Sex</Label>
                <Select
                  value={personalForm.sex || "none"}
                  onValueChange={(v) =>
                    setPersonalForm((p) => ({
                      ...p,
                      sex: v === "none" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Title</Label>
                <Select
                  value={personalForm.titleId || "none"}
                  onValueChange={(v) =>
                    setPersonalForm((p) => ({
                      ...p,
                      titleId: v === "none" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {titles.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <UserIcon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Full Name</p>
                  <p className="font-medium">
                    {[user.firstName, user.middleName, user.lastName]
                      .filter(Boolean)
                      .join(" ") || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{user.phone || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <UserIcon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Sex</p>
                  <p className="font-medium">{user.sex || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 md:col-span-2">
                <UserIcon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Title</p>
                  <p className="font-medium">{user.title?.name || "—"}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Organization */}
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-muted/20 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">
              Organization
            </CardTitle>
            {!editingOrg ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingOrg(true)}
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingOrg(false)}
                >
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveOrg}
                  disabled={updateUser.isPending}
                >
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Save
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {editingOrg ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Organization Type</Label>
                <Select
                  value={orgForm.organizationTypeId || "none"}
                  onValueChange={(v) =>
                    setOrgForm((p) => ({
                      ...p,
                      organizationTypeId: v === "none" ? "" : v,
                      organizationId: "",
                      unitId: "",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {organizationTypes.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Organization</Label>
                <Select
                  value={orgForm.organizationId || "none"}
                  onValueChange={(v) =>
                    setOrgForm((p) => ({
                      ...p,
                      organizationId: v === "none" ? "" : v,
                      unitId: "",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {organizations.map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Unit</Label>
                <Select
                  value={orgForm.unitId || "none"}
                  onValueChange={(v) =>
                    setOrgForm((p) => ({
                      ...p,
                      unitId: v === "none" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Organization Type
                  </p>
                  <p className="font-medium">
                    {user.organizationType?.name || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Organization</p>
                  <p className="font-medium">
                    {user.organization?.name || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Unit</p>
                  <p className="font-medium">{user.unit?.name || "—"}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account */}
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-muted/20 pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-xs text-muted-foreground">
                  {user.enabled ? "Account is active" : "Account is disabled"}
                </p>
              </div>
              <Badge
                variant={user.enabled ? "default" : "secondary"}
                className="text-xs"
              >
                {user.enabled ? "Active" : "Disabled"}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Access Enabled</p>
                <p className="text-xs text-muted-foreground">
                  Disabled users cannot sign in
                </p>
              </div>
              <Switch
                checked={user.enabled}
                onCheckedChange={handleToggleStatus}
                disabled={updateUser.isPending}
              />
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="font-medium">
                  {formatDisplayDate(user.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Last Login</p>
                <p className="font-medium">
                  {formatDisplayDate(user.lastLogin) || "Never"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
