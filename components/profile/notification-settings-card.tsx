"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Mail,
  Loader2,
  Save,
  FileText,
  Search,
  MessageSquare,
  RefreshCw,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from "@/hooks/useNotificationSettings";
import { type NotificationSettings } from "@/api/services/notification-settings.service";

export function NotificationSettingsCard() {
  const { data: settings, isLoading, isError, refetch } = useNotificationSettings();
  const updateMutation = useUpdateNotificationSettings();

  const [formState, setFormState] = useState<Partial<NotificationSettings>>({});

  useEffect(() => {
    if (settings) {
      setFormState(settings);
    }
  }, [settings]);

  const handleToggle = (key: keyof NotificationSettings) => {
    setFormState((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(formState);
      toast.success("Notification settings updated successfully.");
    } catch (error) {
      toast.error(
        (error as { message?: string })?.message ?? "Failed to update notification settings."
      );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-[300px] flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading notification settings...</p>
        </CardContent>
      </Card>
    );
  }

  if (isError || !settings) {
    return (
      <Card>
        <CardContent className="flex min-h-[300px] flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm text-destructive">Failed to load notification settings.</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isEmailEnabled = formState.enableEmailNotifications ?? false;
  const isSystemEnabled = formState.enableSystemNotifications ?? false;

  return (
    <Card className="border-muted/45 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold tracking-tight">Notification Settings</CardTitle>
        <CardDescription>
          Choose how you receive notifications about proposals, screenings, reviews, and security events.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* System (In-App) Notifications Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border bg-muted/20 p-4 shadow-sm">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bell className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold">In-App Notifications</h4>
                <p className="text-xs text-muted-foreground">
                  Receive real-time notifications directly within the dashboard.
                </p>
              </div>
            </div>
            <Switch
              checked={isSystemEnabled}
              onCheckedChange={() => handleToggle("enableSystemNotifications")}
            />
          </div>

          <div
            className={`grid gap-4 pl-2 transition-all duration-300 md:grid-cols-2 ${
              isSystemEnabled ? "opacity-100" : "pointer-events-none opacity-40 select-none"
            }`}
          >
            {/* System Proposals */}
            <div className="flex items-center justify-between rounded-lg border p-3.5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Proposals & Concept Notes</p>
                  <p className="text-xs text-muted-foreground">
                    Submissions, status changes, and approvals.
                  </p>
                </div>
              </div>
              <Switch
                checked={formState.systemProposals ?? false}
                disabled={!isSystemEnabled}
                onCheckedChange={() => handleToggle("systemProposals")}
              />
            </div>

            {/* System Screening */}
            <div className="flex items-center justify-between rounded-lg border p-3.5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Search className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Screening updates</p>
                  <p className="text-xs text-muted-foreground">
                    Eligibility checks and screening decisions.
                  </p>
                </div>
              </div>
              <Switch
                checked={formState.systemScreening ?? false}
                disabled={!isSystemEnabled}
                onCheckedChange={() => handleToggle("systemScreening")}
              />
            </div>

            {/* System Reviews */}
            <div className="flex items-center justify-between rounded-lg border p-3.5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Peer Reviews</p>
                  <p className="text-xs text-muted-foreground">
                    Review assignments and comments/feedback.
                  </p>
                </div>
              </div>
              <Switch
                checked={formState.systemReviews ?? false}
                disabled={!isSystemEnabled}
                onCheckedChange={() => handleToggle("systemReviews")}
              />
            </div>

            {/* System Updates */}
            <div className="flex items-center justify-between rounded-lg border p-3.5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <RefreshCw className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">System Updates</p>
                  <p className="text-xs text-muted-foreground">
                    System maintenance and new feature notices.
                  </p>
                </div>
              </div>
              <Switch
                checked={formState.systemSystemUpdates ?? false}
                disabled={!isSystemEnabled}
                onCheckedChange={() => handleToggle("systemSystemUpdates")}
              />
            </div>

            {/* System Security */}
            <div className="flex items-center justify-between rounded-lg border p-3.5 shadow-xs md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Security Alerts</p>
                  <p className="text-xs text-muted-foreground">
                    New login alerts and password change confirmations.
                  </p>
                </div>
              </div>
              <Switch
                checked={formState.systemSecurityAlerts ?? false}
                disabled={!isSystemEnabled}
                onCheckedChange={() => handleToggle("systemSecurityAlerts")}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Email Notifications Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border bg-muted/20 p-4 shadow-sm">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold">Email Notifications</h4>
                <p className="text-xs text-muted-foreground">
                  Receive notification digests and alerts directly in your inbox.
                </p>
              </div>
            </div>
            <Switch
              checked={isEmailEnabled}
              onCheckedChange={() => handleToggle("enableEmailNotifications")}
            />
          </div>

          <div
            className={`grid gap-4 pl-2 transition-all duration-300 md:grid-cols-2 ${
              isEmailEnabled ? "opacity-100" : "pointer-events-none opacity-40 select-none"
            }`}
          >
            {/* Email Proposals */}
            <div className="flex items-center justify-between rounded-lg border p-3.5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Proposals & Concept Notes</p>
                  <p className="text-xs text-muted-foreground">
                    Submissions, status changes, and approvals.
                  </p>
                </div>
              </div>
              <Switch
                checked={formState.emailProposals ?? false}
                disabled={!isEmailEnabled}
                onCheckedChange={() => handleToggle("emailProposals")}
              />
            </div>

            {/* Email Screening */}
            <div className="flex items-center justify-between rounded-lg border p-3.5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Search className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Screening updates</p>
                  <p className="text-xs text-muted-foreground">
                    Eligibility checks and screening decisions.
                  </p>
                </div>
              </div>
              <Switch
                checked={formState.emailScreening ?? false}
                disabled={!isEmailEnabled}
                onCheckedChange={() => handleToggle("emailScreening")}
              />
            </div>

            {/* Email Reviews */}
            <div className="flex items-center justify-between rounded-lg border p-3.5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Peer Reviews</p>
                  <p className="text-xs text-muted-foreground">
                    Review assignments and comments/feedback.
                  </p>
                </div>
              </div>
              <Switch
                checked={formState.emailReviews ?? false}
                disabled={!isEmailEnabled}
                onCheckedChange={() => handleToggle("emailReviews")}
              />
            </div>

            {/* Email Updates */}
            <div className="flex items-center justify-between rounded-lg border p-3.5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <RefreshCw className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">System Updates</p>
                  <p className="text-xs text-muted-foreground">
                    System maintenance and new feature notices.
                  </p>
                </div>
              </div>
              <Switch
                checked={formState.emailSystemUpdates ?? false}
                disabled={!isEmailEnabled}
                onCheckedChange={() => handleToggle("emailSystemUpdates")}
              />
            </div>

            {/* Email Security */}
            <div className="flex items-center justify-between rounded-lg border p-3.5 shadow-xs md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Security Alerts</p>
                  <p className="text-xs text-muted-foreground">
                    New login alerts and password change confirmations.
                  </p>
                </div>
              </div>
              <Switch
                checked={formState.emailSecurityAlerts ?? false}
                disabled={!isEmailEnabled}
                onCheckedChange={() => handleToggle("emailSecurityAlerts")}
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end border-t pt-6">
          <Button onClick={handleSave} disabled={updateMutation.isPending} className="px-6">
            {updateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
