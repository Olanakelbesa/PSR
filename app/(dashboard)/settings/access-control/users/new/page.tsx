"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserPlus,
  Building2,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PageContainer } from "@/components/layout";
import { useCreateUser } from "@/hooks/useUsers";
import {
  useTitles,
  useOrganizationTypes,
  useOrganizations,
  useUnitsWithParams,
} from "@/hooks/useReference";
import { useRoles } from "@/hooks/useRoles";
import type { AdminCreateUserPayload } from "@/api/services/users.service";

function generatePassword(length = 16): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const symbols = "!@#$%^&*()-_=+[]{}|;:,.<>?";
  const all = upper + lower + digits + symbols;

  // Guarantee at least one from each category
  const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)];
  const required = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  const rest = Array.from({ length: length - 4 }, () => pick(all));

  // Shuffle
  const combined = [...required, ...rest];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }
  return combined.join("");
}

export default function CreateUserPage() {
  const router = useRouter();
  const createUser = useCreateUser();

  // Reference data
  const { data: titles = [] } = useTitles();
  const { data: orgTypes = [] } = useOrganizationTypes();
  const { data: orgsResponse } = useOrganizations({ limit: 200 });
  const { data: unitsResponse } = useUnitsWithParams({
    limit: 200,
  });
  const { data: rolesResponse } = useRoles({ limit: 100, is_active: true });

  const organizations = orgsResponse?.data ?? [];
  const units = unitsResponse?.data ?? [];
  const roles = rolesResponse?.data ?? [];

  // Form state
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    sex: "",
    titleId: "",
    organizationTypeId: "",
    organizationId: "",
    unitId: "",
    password: "",
  });

  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-generate password on mount
  useEffect(() => {
    setForm((prev) => ({ ...prev, password: generatePassword() }));
  }, []);

  const handleCopy = useCallback(async () => {
    if (!form.password) return;
    try {
      await navigator.clipboard.writeText(form.password);
      setCopied(true);
      toast.success("Password copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy password.");
    }
  }, [form.password]);

  const handleRegenerate = useCallback(() => {
    setForm((prev) => ({ ...prev, password: generatePassword() }));
    setShowPassword(false);
    setCopied(false);
  }, []);

  // Filtered organizations by selected org type
  const filteredOrgs = form.organizationTypeId
    ? organizations.filter(
        (o: any) => String(o.orgType) === form.organizationTypeId,
      )
    : organizations;

  // Filtered units by selected organization
  const filteredUnits = form.organizationId
    ? units.filter((u: any) => String(u.organization) === form.organizationId)
    : units;

  const updateField = (field: string, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Cascade: clear org when type changes, clear unit when org changes
      if (field === "organizationTypeId") {
        next.organizationId = "";
        next.unitId = "";
      }
      if (field === "organizationId") {
        next.unitId = "";
      }
      return next;
    });
  };

  const toggleRole = (roleId: number) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId],
    );
  };

  const handleSubmit = async () => {
    if (!form.firstName.trim()) {
      toast.error("First name is required.");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Email is required.");
      return;
    }
    if (!form.password.trim()) {
      toast.error("Password is required.");
      return;
    }

    const payload: AdminCreateUserPayload = {
      email: form.email.trim(),
      firstName: form.firstName.trim() || null,
      middleName: form.middleName.trim() || null,
      lastName: form.lastName.trim() || null,
      phone: form.phone.trim() || null,
      sex: form.sex || null,
      title: form.titleId ? Number(form.titleId) : null,
      organization_type: form.organizationTypeId
        ? Number(form.organizationTypeId)
        : null,
      organization: form.organizationId ? Number(form.organizationId) : null,
      unit: form.unitId ? Number(form.unitId) : null,
      password: form.password,
      roles: selectedRoleIds.length > 0 ? selectedRoleIds : undefined,
    };

    try {
      await createUser.mutateAsync(payload);
      toast.success("User created successfully.");
      router.push("/settings/access-control/users");
    } catch (error: any) {
      const msg =
        error?.response?.data?.error?.message ??
        error?.message ??
        "Failed to create user.";
      toast.error(msg);
    }
  };

  return (
    <PageContainer
      title="Create User"
      description="Register a new user account."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="shadow-sm">
            <Link href="/settings/access-control/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Users
            </Link>
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createUser.isPending}
            className="shadow-sm"
          >
            {createUser.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            {createUser.isPending ? "Creating..." : "Create User"}
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* ── Form columns ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </div>
              <CardDescription>
                Basic personal details for the new user account.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Row: Title, Sex */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Select
                    value={form.titleId}
                    onValueChange={(v) => updateField("titleId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select title" />
                    </SelectTrigger>
                    <SelectContent>
                      {titles.map((t: any) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sex</Label>
                  <Select
                    value={form.sex}
                    onValueChange={(v) => updateField("sex", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sex" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row: First Name, Middle Name */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    placeholder="e.g. John"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Middle Name</Label>
                  <Input
                    value={form.middleName}
                    onChange={(e) => updateField("middleName", e.target.value)}
                    placeholder="e.g. Michael"
                  />
                </div>
              </div>

              {/* Row: Last Name */}
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  placeholder="e.g. Doe"
                />
              </div>

              {/* Row: Email */}
              <div className="space-y-2">
                <Label>
                  Email <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="user@example.com"
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Row: Phone */}
              <div className="space-y-2">
                <Label>Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="+256 700 000000"
                    className="pl-9"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Organization */}
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">Organization</CardTitle>
              </div>
              <CardDescription>
                Affiliation details for the user.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Organization Type</Label>
                  <Select
                    value={form.organizationTypeId}
                    onValueChange={(v) => updateField("organizationTypeId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {orgTypes.map((ot: any) => (
                        <SelectItem key={ot.id} value={String(ot.id)}>
                          {ot.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Organization</Label>
                  <Select
                    value={form.organizationId}
                    onValueChange={(v) => updateField("organizationId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredOrgs.map((o: any) => (
                        <SelectItem key={o.id} value={String(o.id)}>
                          {o.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Unit / Department</Label>
                  <Select
                    value={form.unitId}
                    onValueChange={(v) => updateField("unitId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredUnits.map((u: any) => (
                        <SelectItem key={u.id} value={String(u.id)}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          {/* Security */}
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b bg-muted/30 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Security</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label>
                  Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    readOnly
                    className="pr-24 font-mono text-sm"
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setShowPassword((p) => !p)}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleCopy}
                      title="Copy password"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleRegenerate}
                >
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Regenerate
                </Button>
                <p className="text-[10px] text-muted-foreground">
                  Auto-generated 16-character password. Share it with the user
                  securely. They can change it after logging in.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Roles */}
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="border-b bg-muted/30 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Roles</CardTitle>
              </div>
              <CardDescription>
                Assign roles to grant permissions. A default &quot;user&quot; role
                is assigned automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 max-h-[300px] overflow-y-auto">
              {roles.length === 0 ? (
                <p className="text-xs text-muted-foreground">No roles available.</p>
              ) : (
                roles.map((role: any) => {
                  const isSelected = selectedRoleIds.includes(role.id);
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => toggleRole(role.id)}
                      className={`flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/30"
                      }`}
                    >
                      <div>
                        <p className="font-medium">{role.name}</p>
                        {role.description && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {role.description}
                          </p>
                        )}
                      </div>
                      <div
                        className={`h-4 w-4 rounded border-2 flex items-center justify-center ${
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="h-3 w-3 text-primary-foreground"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="shadow-sm border-muted">
            <CardContent className="pt-4 text-xs text-muted-foreground space-y-1.5">
              <p className="font-medium text-foreground text-sm">
                How it works
              </p>
              <p>
                A strong password is auto-generated. Copy and share it with the
                user securely.
              </p>
              <p>
                The user should change their password after first login from
                their profile settings.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
