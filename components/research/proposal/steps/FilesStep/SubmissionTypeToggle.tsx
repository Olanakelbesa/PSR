"use client";

import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import type { ProposalFormInput } from "@/lib/validators/proposal.schema";

export function SubmissionTypeToggle() {
  const { setValue } = useFormContext<ProposalFormInput>();

  useEffect(() => {
    setValue("submissionType", "document_upload");
  }, [setValue]);

  return null;
}
