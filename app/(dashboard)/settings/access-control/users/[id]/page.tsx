"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Trash2,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser, useDeleteUser } from "@/hooks/useUsers";
import { resolveFileUrl } from "@/lib/utils/resolve-file-url";
import { UserDetailOverview, UserDetailRoles, UserDetailActivity } from "@/components/settings/user-detail";
import { useState } from "react";

function userLabel(user: {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  email: string;
}) {
  if (user.fullName && user.fullName.trim().length > 0) return user.fullName;
  return (
    [user.firstName, user.middleName, user.lastName]
      .filter(Boolean)
      .join(" ") || user.email
  );
}

function userInitials(user: {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  email: string;
}) {
  const parts = [user.firstName, user.middleName, user.lastName]
    .filter(Boolean)
    .map((p) => String(p).trim())
    .filter((p) => p.length > 0);
  if (parts.length > 0) {
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("");
  }
  return user.email.slice(0, 2).toUpperCase();
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = (params as { id?: string })?.id ?? "";
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: user, isLoading, isError } = useUser(userId);
  const deleteUser = useDeleteUser();

  const handleDelete = async () => {
    if (!user) return;
    try {
      await deleteUser.mutateAsync(user.id);
      toast.success("User deleted successfully.");
      router.push("/settings/access-control/users");
    } catch {
      toast.error("Failed to delete user.");
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Loading user…">
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-4">
              <div className="h-48 animate-pulse rounded-xl bg-muted" />
              <div className="h-32 animate-pulse rounded-xl bg-muted" />
            </div>
            <div className="h-48 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (isError || !user) {
    return (
      <PageContainer title="User not found">
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            This user does not exist or you do not have permission to view them.
          </p>
          <Button variant="outline" size="sm" asChild className="mt-4">
            <Link href="/settings/access-control/users">Back to Users</Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={userLabel(user)}
      description={user.email}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="shadow-sm">
            <Link href="/settings/access-control/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-destructive/30 text-destructive hover:bg-destructive/5"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* Main content */}
        <div className="space-y-6">
          <Tabs defaultValue="overview">
            <TabsList className="h-10 bg-muted/60 rounded-lg p-1 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="roles">Roles</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <UserDetailOverview user={user} />
            </TabsContent>

            <TabsContent value="roles" className="mt-4">
              <UserDetailRoles user={user} />
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <UserDetailActivity user={user} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 text-sm lg:sticky lg:top-20">
          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="border-b bg-primary/5 pb-3 text-left">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={resolveFileUrl(user.photoUrl) || undefined}
                    alt={userLabel(user)}
                  />
                  <AvatarFallback className="text-lg">
                    {userInitials(user)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="mt-3 font-semibold">{userLabel(user)}</h3>
                <p className="text-xs text-muted-foreground">{user.title?.name || "No title"}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-1">
                  <Badge
                    variant={user.enabled ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    {user.enabled ? "Active" : "Disabled"}
                  </Badge>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Email:</span>{" "}
                  {user.email}
                </p>
                {user.phone && (
                  <p>
                    <span className="font-medium text-foreground">Phone:</span>{" "}
                    {user.phone}
                  </p>
                )}
                {user.organization?.name && (
                  <p>
                    <span className="font-medium text-foreground">Org:</span>{" "}
                    {user.organization.name}
                  </p>
                )}
              </div>
              <Separator />
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Roles
                </p>
                <div className="flex flex-wrap gap-1">
                  {(user.roles ?? []).length > 0 ? (
                    user.roles?.map((role) => (
                      <Badge
                        key={role.id}
                        variant="secondary"
                        className="text-[10px]"
                      >
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        {role.name}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No roles assigned</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {userLabel(user)} from the system. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
