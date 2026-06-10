"use client";

import { PageContainer } from "@/components/layout";
import { ProfileSettingsCard } from "@/components/profile/profile-settings-card";

export default function ProfilePage() {
  return (
    <PageContainer
      title="Profile Settings"
      description="View and update your personal information."
    >
      <ProfileSettingsCard />
    </PageContainer>
  );
}
