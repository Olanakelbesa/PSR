"use client";

import React from "react";
import { GrantCallInformationSection } from "./GrantCallInformationSection";
import type { InitialGrantCallInfo } from "./GrantCallInformationSection";
import { ProposalDetailsSection } from "./ProposalDetailsSection";
import { ProjectDurationSection } from "./ProjectDurationSection";
import { SubmissionInformationSection } from "./SubmissionInformationSection";
import { ProjectInformationSection } from "./ProjectInformationSection";

export interface ProposalBasicInfoStepProps {
  /** When editing, pass grant_call from GET /api/proposal/{id}/ so Proposal Type and Sub Type populate */
  initialGrantCallInfo?: InitialGrantCallInfo | null;
}

export function ProposalBasicInfoStep({
  initialGrantCallInfo,
}: ProposalBasicInfoStepProps = {}) {
  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      <GrantCallInformationSection initialGrantCallInfo={initialGrantCallInfo} />
      <ProposalDetailsSection />
      <ProjectDurationSection />
      <SubmissionInformationSection />
      <ProjectInformationSection />
    </div>
  );
}
