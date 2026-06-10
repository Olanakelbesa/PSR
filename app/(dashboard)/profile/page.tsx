"use client";

import Link from "next/link";
import { Settings } from "lucide-react";

import { PageContainer } from "@/components/layout";
import { ProfileSettingsCard } from "@/components/profile/profile-settings-card";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  return (
    <PageContainer
      title="Profile Settings"
      description="View and update your personal information from your account."
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            All settings
          </Link>
        </Button>
      }
    >
      <div className="mx-auto max-w-4xl">
        <ProfileSettingsCard />
      </div>
    </PageContainer>
  );
}
