"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/layout";
import type {
  GrantCall,
  GrantCallInstallmentPlanInput,
  GrantCallWriteInput,
} from "@/types/grant-call";

type InstallmentRow = {
  installmentNumber: string;
  percentage: string;
};

type GrantCallFormState = {
  title: string;
  budget: string;
  proposalTypes: string;
  currentYear: string;
  thumbnailImage: File | null;
  bannerImage: File | null;
  description: string;
  eligibilityCriteria: string;
  openDate: string;
  closeDate: string;
  status: string;
  allowedSubmissionOffices: string;
  revieweeStartDate: string;
  revieweeClosingDate: string;
  requirePeerReview: boolean;
  requireCommitteeReview: boolean;
  firstLevelScreeningResultCheck: boolean;
  reviewResultCheck: boolean;
  installmentPlans: InstallmentRow[];
};

interface GrantCallFormProps {
  title: string;
  description: string;
  submitLabel: string;
  initialCall?: GrantCall | null;
  onSubmit: (payload: GrantCallWriteInput) => Promise<void>;
  onCancel: () => void;
}

function splitIds(value?: Array<number | string>) {
  return (value ?? []).map((item) => String(item)).join(", ");
}

function parseIds(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (Number.isNaN(Number(item)) ? item : Number(item)));
}

function buildInitialState(call?: GrantCall | null): GrantCallFormState {
  return {
    title: call?.title ?? "",
    budget:
      call?.budget === null || call?.budget === undefined
        ? ""
        : String(call.budget),
    proposalTypes: splitIds(
      call?.proposalTypes?.map((proposalType) => proposalType.id),
    ),
    currentYear: call?.currentYear ?? "",
    thumbnailImage: null,
    bannerImage: null,
    description: call?.description ?? "",
    eligibilityCriteria: call?.eligibilityCriteria ?? "",
    openDate: call?.openDate ?? "",
    closeDate: call?.closeDate ?? "",
    status: call?.status ?? "draft",
    allowedSubmissionOffices: splitIds(
      call?.settings?.allowedSubmissionOffices,
    ),
    revieweeStartDate: call?.settings?.revieweeStartDate ?? "",
    revieweeClosingDate: call?.settings?.revieweeClosingDate ?? "",
    requirePeerReview: Boolean(call?.settings?.requirePeerReview),
    requireCommitteeReview: Boolean(call?.settings?.requireCommitteeReview),
    firstLevelScreeningResultCheck: Boolean(
      call?.settings?.firstLevelScreeningResultCheck,
    ),
    reviewResultCheck: Boolean(call?.settings?.reviewResultCheck),
    installmentPlans: call?.installmentPlans?.length
      ? call.installmentPlans.map((plan) => ({
          installmentNumber: String(plan.installmentNumber),
          percentage: String(plan.percentage),
        }))
      : [{ installmentNumber: "1", percentage: "100" }],
  };
}

function normalizePayload(state: GrantCallFormState): GrantCallWriteInput {
  const installmentPlans: GrantCallInstallmentPlanInput[] =
    state.installmentPlans
      .map((plan) => ({
        installment_number: Number(plan.installmentNumber) || 0,
        percentage: plan.percentage.trim(),
      }))
      .filter((plan) => plan.installment_number > 0 && plan.percentage !== "");

  return {
    title: state.title.trim(),
    budget: state.budget.trim() || null,
    proposal_types: parseIds(state.proposalTypes),
    current_year: state.currentYear.trim() || null,
    thumbnail_image: state.thumbnailImage,
    banner_image: state.bannerImage,
    description: state.description.trim(),
    eligibility_criteria: state.eligibilityCriteria.trim(),
    open_date: state.openDate || null,
    close_date: state.closeDate || null,
    status: state.status,
    settings: {
      allowed_submission_offices: parseIds(state.allowedSubmissionOffices),
      reviewee_start_date: state.revieweeStartDate || null,
      reviewee_closing_date: state.revieweeClosingDate || null,
      require_peer_review: state.requirePeerReview,
      require_committee_review: state.requireCommitteeReview,
      first_level_screening_result_check: state.firstLevelScreeningResultCheck,
      review_result_check: state.reviewResultCheck,
    },
    installment_plans: installmentPlans,
  };
}

export function GrantCallForm({
  title,
  description,
  submitLabel,
  initialCall,
  onSubmit,
  onCancel,
}: GrantCallFormProps) {
  const [state, setState] = useState<GrantCallFormState>(() =>
    buildInitialState(initialCall),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setState(buildInitialState(initialCall));
  }, [initialCall]);

  const totalPercentage = useMemo(() => {
    return state.installmentPlans.reduce(
      (sum, plan) => sum + (Number(plan.percentage) || 0),
      0,
    );
  }, [state.installmentPlans]);

  const addInstallment = () => {
    setState((current) => ({
      ...current,
      installmentPlans: [
        ...current.installmentPlans,
        {
          installmentNumber: String(current.installmentPlans.length + 1),
          percentage: "0",
        },
      ],
    }));
  };

  const updateInstallment = (
    index: number,
    field: keyof InstallmentRow,
    value: string,
  ) => {
    setState((current) => ({
      ...current,
      installmentPlans: current.installmentPlans.map((plan, planIndex) =>
        planIndex === index ? { ...plan, [field]: value } : plan,
      ),
    }));
  };

  const removeInstallment = (index: number) => {
    setState((current) => ({
      ...current,
      installmentPlans: current.installmentPlans.filter(
        (_, planIndex) => planIndex !== index,
      ),
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(normalizePayload(state));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer title={title} description={description}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Title</Label>
              <Input
                value={state.title}
                onChange={(event) =>
                  setState({ ...state, title: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Current Year</Label>
              <Input
                value={state.currentYear}
                onChange={(event) =>
                  setState({ ...state, currentYear: event.target.value })
                }
                placeholder="2026"
              />
            </div>
            <div className="space-y-2">
              <Label>Budget</Label>
              <Input
                value={state.budget}
                onChange={(event) =>
                  setState({ ...state, budget: event.target.value })
                }
                placeholder="1000000"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Proposal Type IDs</Label>
              <Input
                value={state.proposalTypes}
                onChange={(event) =>
                  setState({ ...state, proposalTypes: event.target.value })
                }
                placeholder="1, 2"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Status</Label>
              <Input
                value={state.status}
                onChange={(event) =>
                  setState({ ...state, status: event.target.value })
                }
                placeholder="draft"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={state.description}
                onChange={(event) =>
                  setState({ ...state, description: event.target.value })
                }
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label>Eligibility Criteria</Label>
              <Textarea
                value={state.eligibilityCriteria}
                onChange={(event) =>
                  setState({
                    ...state,
                    eligibilityCriteria: event.target.value,
                  })
                }
                rows={5}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Thumbnail Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setState({
                    ...state,
                    thumbnailImage: event.target.files?.[0] ?? null,
                  })
                }
              />
              {state.thumbnailImage ? (
                <p className="text-xs text-muted-foreground">
                  Selected: {state.thumbnailImage.name}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Banner Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setState({
                    ...state,
                    bannerImage: event.target.files?.[0] ?? null,
                  })
                }
              />
              {state.bannerImage ? (
                <p className="text-xs text-muted-foreground">
                  Selected: {state.bannerImage.name}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dates and Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Open Date</Label>
                <Input
                  type="date"
                  value={state.openDate}
                  onChange={(event) =>
                    setState({ ...state, openDate: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Close Date</Label>
                <Input
                  type="date"
                  value={state.closeDate}
                  onChange={(event) =>
                    setState({ ...state, closeDate: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Allowed Submission Office IDs</Label>
                <Input
                  value={state.allowedSubmissionOffices}
                  onChange={(event) =>
                    setState({
                      ...state,
                      allowedSubmissionOffices: event.target.value,
                    })
                  }
                  placeholder="1, 2"
                />
              </div>
              <div className="space-y-2">
                <Label>Reviewee Start Date</Label>
                <Input
                  type="date"
                  value={state.revieweeStartDate}
                  onChange={(event) =>
                    setState({
                      ...state,
                      revieweeStartDate: event.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Reviewee Closing Date</Label>
                <Input
                  type="date"
                  value={state.revieweeClosingDate}
                  onChange={(event) =>
                    setState({
                      ...state,
                      revieweeClosingDate: event.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["requirePeerReview", "Require peer review"],
                ["requireCommitteeReview", "Require committee review"],
                [
                  "firstLevelScreeningResultCheck",
                  "First-level screening result check",
                ],
                ["reviewResultCheck", "Review result check"],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 rounded-md border p-3 text-sm"
                >
                  <Checkbox
                    checked={state[key as keyof GrantCallFormState] as boolean}
                    onCheckedChange={(checked) =>
                      setState({
                        ...state,
                        [key]: Boolean(checked),
                      } as GrantCallFormState)
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Installment Plans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {state.installmentPlans.map((plan, index) => (
                <div
                  key={`${plan.installmentNumber}-${index}`}
                  className="grid gap-3 md:grid-cols-[120px_1fr_auto] items-end"
                >
                  <div className="space-y-2">
                    <Label>Number</Label>
                    <Input
                      value={plan.installmentNumber}
                      onChange={(event) =>
                        updateInstallment(
                          index,
                          "installmentNumber",
                          event.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Percentage</Label>
                    <Input
                      value={plan.percentage}
                      onChange={(event) =>
                        updateInstallment(
                          index,
                          "percentage",
                          event.target.value,
                        )
                      }
                      placeholder="40"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeInstallment(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">
                  Total percentage: {totalPercentage}%
                </p>
                <p className="text-xs text-muted-foreground">
                  Installments must sum to 100.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={addInstallment}>
                <Plus className="mr-2 h-4 w-4" />
                Add installment
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
