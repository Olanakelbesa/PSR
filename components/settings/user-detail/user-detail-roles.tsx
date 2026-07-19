"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useUpdateUser } from "@/hooks/useUsers";
import { useRoles } from "@/hooks/useRoles";
import type { User } from "@/api/services/users.service";

interface UserDetailRolesProps {
  user: User;
}

export function UserDetailRoles({ user }: UserDetailRolesProps) {
  const updateUser = useUpdateUser();
  const { data: rolesData, isLoading: rolesLoading } = useRoles({ limit: 200 });
  const roles = rolesData?.data ?? [];

  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>(
    (user.roles ?? []).map((r) => r.id)
  );
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setSelectedRoleIds((user.roles ?? []).map((r) => r.id));
  }, [user.roles]);

  const toggleRole = (roleId: number, checked: boolean) => {
    setSelectedRoleIds((prev) => {
      const next = checked
        ? [...prev, roleId]
        : prev.filter((id) => id !== roleId);
      return next;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateUser.mutateAsync({
        id: user.id,
        data: { roles: selectedRoleIds },
      });
      toast.success("Roles updated successfully.");
      setHasChanges(false);
    } catch {
      toast.error("Failed to update roles.");
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b bg-muted/20 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">
            Assigned Roles
          </CardTitle>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || updateUser.isPending}
          >
            {updateUser.isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : null}
            Save Changes
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {rolesLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-4 w-4 animate-pulse rounded bg-muted" />
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : roles.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No roles available. Roles are managed in Django admin.
          </p>
        ) : (
          <div className="max-h-[400px] space-y-1 overflow-y-auto rounded-lg border border-border p-3">
            {roles.map((role) => (
              <label
                key={role.id}
                className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50"
              >
                <Checkbox
                  checked={selectedRoleIds.includes(role.id)}
                  onCheckedChange={(checked) =>
                    toggleRole(role.id, checked === true)
                  }
                  disabled={updateUser.isPending}
                />
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{role.name}</p>
                    {role.description && (
                      <p className="text-xs text-muted-foreground">
                        {role.description}
                      </p>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
