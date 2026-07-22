import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

export type ReportDecision = "pending" | "approved" | "rejected";

export interface ProgressReportSummary {
  id: number;
  project_tracking: number;
  project_tracking_title?: string | null;
  report_name: string;
  main_activities_achieved: string;
  attachment: string | null;
  amount_used: string;
  start_date: string | null;
  end_date: string | null;
  status: ReportDecision;
  submitted_at: string;
  general_status?: string;
  projectTracking?: {
    projectTrackingId: number;
    proposalId: number;
    title: string;
    status: string;
  } | null;
}

export interface ProjectTrackingProposal {
  fundingRecommendationId?: number;
  proposalId?: number;
  referenceNumber?: string;
  title?: string;
  totalAwardAmount?: string;
  hasEthicalClearanceApproval?: boolean;
  pi?: {
    id: number;
    fullName: string;
    email: string;
  } | null;
}

export interface ProjectTrackingSummary {
  id: number;
  proposal: ProjectTrackingProposal | null;
  proposalTitle: string | null;
  referenceNumber: string | null;
  totalAwardAmount: string | null;
  pi: {
    id: number;
    fullName: string;
    email: string;
  } | null;
  status: string;
  generalStatus: string;
}

export interface ReadyForTrackingProject {
  id: number;
  proposal: number;
  readyForFundingId: number;
  fundingDecisionStatus: string;
  screeningStatus: string;
  screeningId: number;
  referenceNumber: string;
  proposalTitle: string;
  pi: {
    id: number;
    fullName: string;
    email: string;
  } | null;
  totalAwardAmount: string;
  amountEnglishInWords: string;
  hasEthicalClearanceApproval: boolean;
  comments: string | null;
  recommendedAt: string;
  terminalReportStatus: string | null;
}

export interface ProgressReportApproval {
  id: number;
  reviewer_name: string;
  decision: ReportDecision;
  comment: string | null;
  reviewed_at: string;
  progress_report: number;
  reviewer: number;
}

export interface ListResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    statistics?: Record<string, number>;
  };
}

export interface ProgressReportFormValues {
  project_tracking: number;
  report_name: string;
  main_activities_achieved: string;
  attachment?: File | null;
  amount_used?: string;
  start_date?: string;
  end_date?: string;
  status?: ReportDecision;
}

export interface ProjectTrackingFormValues {
  proposal: number;
}

export interface TerminalReportFormValues {
  project_tracking: number;
  report_name?: string;
  main_deliverables: string;
  attachment?: File | null;
  is_published?: boolean;
  publication_link?: string;
  status?: ReportDecision;
  terminal_type?: number[];
}

export interface ProgressReportApprovalUpdateValues {
  decision?: ReportDecision;
  comment?: string;
  progress_report?: number;
}

export interface ProgressReportApprovalCreateValues {
  decision: ReportDecision;
  comment?: string;
  progress_report: number;
}

export interface TerminalReportSummary {
  id: number;
  project_tracking_id: number | null;
  project_tracking_title: string | null;
  project_tracking_status: string | null;
  general_status: string;
  submitted_by_name: string | null;
  report_name: string | null;
  main_deliverables: string;
  attachment: string | null;
  is_published: boolean;
  publication_link: string | null;
  status: ReportDecision;
  submitted_at: string;
  submitted_by: number | null;
  terminal_type: number[];
}

export interface TerminalReportApproval {
  id: number;
  reviewer_name: string;
  decision: ReportDecision;
  comment: string | null;
  reviewed_at: string;
  terminal_report?: number;
  terminal_report_id?: number | null;
  terminal_report_status?: string | null;
  reviewer: number;
}

export interface TerminalReportApprovalUpdateValues {
  decision?: ReportDecision;
  comment?: string;
  terminal_report?: number;
}

function unwrapListResponse<T>(payload: any): ListResponse<T> {
  const data: T[] = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.results)
      ? payload.results
      : [];

  const metaSource = payload?.meta ?? payload;

  return {
    data,
    meta: {
      page: Number(metaSource?.page ?? 1),
      limit: Number(metaSource?.limit ?? 10),
      total: Number(metaSource?.total ?? payload?.count ?? data.length),
      totalPages: Number(metaSource?.totalPages ?? 0),
      statistics: metaSource?.statistics ?? undefined,
    },
  };
}

function unwrapDetailResponse<T>(payload: any): T {
  return (payload?.data ?? payload) as T;
}

function buildFormData<T extends object>(values: T) {
  const formData = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => formData.append(key, String(item)));
      return;
    }

    if (value instanceof File) {
      formData.append(key, value);
      return;
    }

    formData.append(key, String(value));
  });

  return formData;
}

function normalizeProjectTracking(item: any): ProjectTrackingSummary {
  return {
    id: item.id ?? item.pk,
    proposal: item.proposal ?? null,
    proposalTitle:
      item.proposalTitle ?? item.proposal?.title ?? item.proposal_title ?? null,
    referenceNumber:
      item.proposal?.referenceNumber ??
      item.proposal?.reference_number ??
      item.referenceNumber ??
      item.reference_number ??
      null,
    totalAwardAmount:
      item.proposal?.totalAwardAmount ??
      item.proposal?.total_award_amount ??
      item.totalAwardAmount ??
      item.total_award_amount ??
      null,
    pi: item.proposal?.pi ?? item.pi ?? null,
    status: item.status ?? "on_progress",
    generalStatus: item.generalStatus ?? item.general_status ?? "pending",
  };
}

export const progressReportsService = {
  async getProgressReports(
    params: Record<string, unknown> = {},
  ): Promise<ListResponse<ProgressReportSummary>> {
    const { data } = await apiClient.get(API_ENDPOINTS.PROGRESS_REPORTS.LIST, {
      params,
    });

    const list = unwrapListResponse<any>(data);

    // Normalize possible camelCase payload keys to the UI expected shape
    const normalized = list.data.map((item: any) => ({
      id: item.id ?? item.pk,
      // Keep numeric project_tracking id for form submissions, also expose title
      project_tracking:
        Number(
          item.project_tracking ??
            item.projectTracking?.projectTrackingId ??
            item.projectTracking?.id ??
            item.projectTracking?.proposalId ??
            null,
        ) || null,
      project_tracking_title:
        item.projectTracking?.title ??
        item.project_tracking_title ??
        item.projectTrackingTitle ??
        null,
      report_name: item.report_name ?? item.reportName ?? null,
      main_activities_achieved:
        item.main_activities_achieved ??
        item.mainActivitiesAchieved ??
        item.main_activities ??
        "",
      attachment: item.attachment ?? item.file ?? null,
      amount_used:
        item.amount_used ?? item.amountUsed ?? String(item.amount ?? "0"),
      start_date: item.start_date ?? item.startDate ?? null,
      end_date: item.end_date ?? item.endDate ?? null,
      status:
        item.status ?? item.general_status ?? item.generalStatus ?? "pending",
      submitted_at: item.submitted_at ?? item.submittedAt ?? null,
      general_status:
        item.general_status ??
        item.generalStatus ??
        item.generalStatus ??
        undefined,
      projectTracking: item.projectTracking ?? null,
    }));

    return {
      data: normalized as ProgressReportSummary[],
      meta: list.meta,
    };
  },

  async getProgressReportById(
    id: string | number,
  ): Promise<ProgressReportSummary> {
    const { data } = await apiClient.get(
      API_ENDPOINTS.PROGRESS_REPORTS.DETAIL(id),
    );

    const payload = unwrapDetailResponse<any>(data);

    return {
      id: payload.id ?? payload.pk,
      project_tracking:
        Number(
          payload.project_tracking ??
            payload.projectTracking?.projectTrackingId ??
            payload.projectTracking?.id ??
            null,
        ) || null,
      project_tracking_title:
        payload.projectTracking?.title ??
        payload.project_tracking_title ??
        payload.projectTrackingTitle ??
        null,
      report_name: payload.report_name ?? payload.reportName ?? null,
      main_activities_achieved:
        payload.main_activities_achieved ??
        payload.mainActivitiesAchieved ??
        payload.main_activities ??
        "",
      attachment: payload.attachment ?? payload.file ?? null,
      amount_used:
        payload.amount_used ??
        payload.amountUsed ??
        String(payload.amount ?? "0"),
      start_date: payload.start_date ?? payload.startDate ?? null,
      end_date: payload.end_date ?? payload.endDate ?? null,
      status:
        payload.status ??
        payload.general_status ??
        payload.generalStatus ??
        "pending",
      submitted_at: payload.submitted_at ?? payload.submittedAt ?? null,
      general_status:
        payload.general_status ??
        payload.generalStatus ??
        payload.generalStatus ??
        undefined,
      projectTracking: payload.projectTracking ?? null,
    } as any;
  },

  async getProjectTracking(
    params: Record<string, unknown> = {},
  ): Promise<ListResponse<ProjectTrackingSummary>> {
    const { data } = await apiClient.get(API_ENDPOINTS.PROJECT_TRACKING.LIST, {
      params,
    });

    const list = unwrapListResponse<any>(data);

    const normalized = list.data.map((item: any) =>
      normalizeProjectTracking(item),
    );

    return {
      data: normalized as ProjectTrackingSummary[],
      meta: list.meta,
    };
  },

  async getProjectTrackingById(
    id: string | number,
  ): Promise<ProjectTrackingSummary> {
    const { data } = await apiClient.get(
      API_ENDPOINTS.PROJECT_TRACKING.DETAIL(id),
    );

    const payload = unwrapDetailResponse<any>(data);

    return normalizeProjectTracking(payload);
  },

  async createProgressReport(
    values: ProgressReportFormValues,
  ): Promise<ProgressReportSummary> {
    const formData = buildFormData(values);
    const { data } = await apiClient.post(
      API_ENDPOINTS.PROGRESS_REPORTS.CREATE,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return unwrapDetailResponse<ProgressReportSummary>(data);
  },

  async createProjectTracking(
    values: ProjectTrackingFormValues,
  ): Promise<unknown> {
    const { data } = await apiClient.post(
      API_ENDPOINTS.PROJECT_TRACKING.CREATE,
      values,
    );

    return unwrapDetailResponse<unknown>(data);
  },

  async createTerminalReport(
    values: TerminalReportFormValues,
  ): Promise<unknown> {
    const formData = buildFormData(values);
    const { data } = await apiClient.post(
      API_ENDPOINTS.TERMINAL_REPORTS.CREATE,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return unwrapDetailResponse<unknown>(data);
  },

  async getReadyForTracking(): Promise<ReadyForTrackingProject[]> {
    const { data } = await apiClient.get(
      API_ENDPOINTS.PROJECT_TRACKING.READY_FOR_TRACKING,
    );
    const results = data?.data ?? data?.results ?? [];
    return results.map((item: any) => ({
      id: item.id,
      proposal: item.proposal,
      readyForFundingId: item.readyForFundingId ?? item.ready_for_funding_id,
      fundingDecisionStatus:
        item.fundingDecisionStatus ?? item.funding_decision_status,
      screeningStatus: item.screeningStatus ?? item.screening_status,
      screeningId: item.screeningId ?? item.screening_id,
      referenceNumber: item.referenceNumber ?? item.reference_number,
      proposalTitle: item.proposalTitle ?? item.proposal_title,
      pi: item.pi,
      totalAwardAmount: item.totalAwardAmount ?? item.total_award_amount,
      amountEnglishInWords:
        item.amountEnglishInWords ?? item.amount_english_in_words,
      hasEthicalClearanceApproval:
        item.hasEthicalClearanceApproval ?? item.has_ethical_clearance_approval,
      comments: item.comments,
      recommendedAt: item.recommendedAt ?? item.recommended_at,
      terminalReportStatus:
        item.terminalReportStatus ?? item.terminal_report_status,
    }));
  },
};

export const terminalReportsService = {
  async getTerminalReports(
    params: Record<string, unknown> = {},
  ): Promise<ListResponse<TerminalReportSummary>> {
    const { data } = await apiClient.get(API_ENDPOINTS.TERMINAL_REPORTS.LIST, {
      params,
    });

    const list = unwrapListResponse<any>(data);

    const normalized = list.data.map((item: any) => ({
      id: item.id ?? item.pk,
      project_tracking_id:
        item.projectTracking?.projectTrackingId ??
        item.projectTracking?.id ??
        item.project_tracking ??
        null,
      project_tracking_title:
        item.projectTracking?.title ?? item.project_tracking_title ?? null,
      project_tracking_status:
        item.projectTracking?.status ?? item.project_tracking_status ?? null,
      general_status: item.generalStatus ?? item.general_status ?? "pending",
      submitted_by_name:
        item.submittedByName ?? item.submitted_by_name ?? null,
      report_name: item.reportName ?? item.report_name ?? null,
      main_deliverables:
        item.mainDeliverables ?? item.main_deliverables ?? "",
      attachment: item.attachment ?? null,
      is_published: item.isPublished ?? item.is_published ?? false,
      publication_link:
        item.publicationLink ?? item.publication_link ?? null,
      status: item.status ?? "pending",
      submitted_at: item.submittedAt ?? item.submitted_at ?? "",
      submitted_by: item.submittedBy ?? item.submitted_by ?? null,
      terminal_type: item.terminalType ?? item.terminal_type ?? [],
    }));

    return {
      data: normalized as TerminalReportSummary[],
      meta: list.meta,
    };
  },

  async getTerminalReportById(
    id: string | number,
  ): Promise<TerminalReportSummary> {
    const { data } = await apiClient.get(
      API_ENDPOINTS.TERMINAL_REPORTS.DETAIL(id),
    );

    const payload = unwrapDetailResponse<any>(data);

    return {
      id: payload.id ?? payload.pk,
      project_tracking_id:
        payload.projectTracking?.projectTrackingId ??
        payload.projectTracking?.id ??
        payload.project_tracking ??
        null,
      project_tracking_title:
        payload.projectTracking?.title ?? payload.project_tracking_title ?? null,
      project_tracking_status:
        payload.projectTracking?.status ??
        payload.project_tracking_status ??
        null,
      general_status:
        payload.generalStatus ?? payload.general_status ?? "pending",
      submitted_by_name:
        payload.submittedByName ?? payload.submitted_by_name ?? null,
      report_name: payload.reportName ?? payload.report_name ?? null,
      main_deliverables:
        payload.mainDeliverables ?? payload.main_deliverables ?? "",
      attachment: payload.attachment ?? null,
      is_published: payload.isPublished ?? payload.is_published ?? false,
      publication_link:
        payload.publicationLink ?? payload.publication_link ?? null,
      status: payload.status ?? "pending",
      submitted_at: payload.submittedAt ?? payload.submitted_at ?? "",
      submitted_by: payload.submittedBy ?? payload.submitted_by ?? null,
      terminal_type: payload.terminalType ?? payload.terminal_type ?? [],
    } as TerminalReportSummary;
  },
};

export const progressReportApprovalsService = {
  async getProgressReportApprovals(
    params: Record<string, unknown> = {},
  ): Promise<ListResponse<ProgressReportApproval>> {
    const { data } = await apiClient.get(
      API_ENDPOINTS.PROGRESS_REPORT_APPROVALS.LIST,
      {
        params,
      },
    );

    const list = unwrapListResponse<any>(data);

    const normalized = list.data.map((item: any) => ({
      id: item.id ?? item.pk,
      reviewer_name: item.reviewerName ?? item.reviewer_name ?? null,
      decision: item.decision ?? null,
      comment: item.comment ?? item.ROCComments ?? item.roc_comments ?? null,
      reviewed_at: item.reviewedAt ?? item.reviewed_at ?? null,
      reviewer: item.reviewer ?? null,
      // Flatten minimal progress report info
      progress_report:
        item.progressReport?.reportName ??
        item.progressReport?.report_name ??
        item.progress_report ??
        item.progressReport?.progressReportId ??
        null,
      progress_report_id:
        item.progressReport?.progressReportId ??
        item.progressReport?.id ??
        item.progressReport ??
        null,
      project_tracking_id:
        item.projectTrackingId ?? item.project_tracking_id ?? null,
    }));

    return {
      data: normalized as ProgressReportApproval[],
      meta: list.meta,
    };
  },

  async getProgressReportApprovalById(
    id: string | number,
  ): Promise<ProgressReportApproval> {
    const { data } = await apiClient.get(
      API_ENDPOINTS.PROGRESS_REPORT_APPROVALS.DETAIL(id),
    );

    const payload = unwrapDetailResponse<any>(data);

    return {
      id: payload.id ?? payload.pk,
      reviewer_name: payload.reviewerName ?? payload.reviewer_name ?? null,
      decision: payload.decision ?? null,
      comment:
        payload.comment ?? payload.ROCComments ?? payload.roc_comments ?? null,
      reviewed_at: payload.reviewedAt ?? payload.reviewed_at ?? null,
      reviewer: payload.reviewer ?? null,
      progress_report:
        payload.progressReport?.reportName ??
        payload.progressReport?.report_name ??
        payload.progress_report ??
        payload.progressReport?.progressReportId ??
        null,
      progress_report_id:
        payload.progressReport?.progressReportId ??
        payload.progressReport?.id ??
        payload.progressReport ??
        null,
      project_tracking_id:
        payload.projectTrackingId ?? payload.project_tracking_id ?? null,
    } as any;
  },

  async createProgressReportApproval(
    values: ProgressReportApprovalCreateValues,
  ): Promise<ProgressReportApproval> {
    const { data } = await apiClient.post(
      API_ENDPOINTS.PROGRESS_REPORT_APPROVALS.LIST,
      values,
    );

    return unwrapDetailResponse<ProgressReportApproval>(data);
  },

  async updateProgressReportApproval(
    id: string | number,
    values: ProgressReportApprovalUpdateValues,
  ): Promise<ProgressReportApproval> {
    const { data } = await apiClient.patch(
      API_ENDPOINTS.PROGRESS_REPORT_APPROVALS.DETAIL(id),
      values,
    );

    return unwrapDetailResponse<ProgressReportApproval>(data);
  },
};

export const terminalReportApprovalsService = {
  async getTerminalReportApprovals(
    params: Record<string, unknown> = {},
  ): Promise<ListResponse<TerminalReportApproval>> {
    const { data } = await apiClient.get(
      API_ENDPOINTS.TERMINAL_REPORT_APPROVALS.LIST,
      {
        params,
      },
    );

    const list = unwrapListResponse<any>(data);

    const normalized = list.data.map((item: any) => ({
      id: item.id ?? item.pk,
      reviewer_name: item.reviewerName ?? item.reviewer_name ?? null,
      decision: item.decision ?? null,
      comment: item.ROCComments ?? item.comment ?? null,
      reviewed_at: item.reviewedAt ?? item.reviewed_at ?? null,
      reviewer: item.reviewer ?? null,
      terminal_report:
        Number(
          item.terminalReport?.terminalReportId ??
            item.terminalReport?.id ??
            item.terminal_report ??
            null,
        ) || undefined,
      terminal_report_id:
        item.terminalReport?.terminalReportId ??
        item.terminalReport?.id ??
        null,
      terminal_report_status: item.terminalReport?.status ?? null,
    }));

    return {
      data: normalized as TerminalReportApproval[],
      meta: list.meta,
    };
  },

  async getTerminalReportApprovalById(
    id: string | number,
  ): Promise<TerminalReportApproval> {
    const { data } = await apiClient.get(
      API_ENDPOINTS.TERMINAL_REPORT_APPROVALS.DETAIL(id),
    );

    const payload = unwrapDetailResponse<any>(data);

    return {
      id: payload.id ?? payload.pk,
      reviewer_name: payload.reviewerName ?? payload.reviewer_name ?? null,
      decision: payload.decision ?? null,
      comment: payload.ROCComments ?? payload.comment ?? null,
      reviewed_at: payload.reviewedAt ?? payload.reviewed_at ?? null,
      reviewer: payload.reviewer ?? null,
      terminal_report:
        Number(
          payload.terminalReport?.terminalReportId ??
            payload.terminalReport?.id ??
            payload.terminal_report ??
            null,
        ) || undefined,
      terminal_report_id:
        payload.terminalReport?.terminalReportId ??
        payload.terminalReport?.id ??
        null,
      terminal_report_status: payload.terminalReport?.status ?? null,
    } as any;
  },

  async createTerminalReportApproval(values: {
    decision: ReportDecision;
    ROC_Comments?: string;
    terminal_report: number;
  }): Promise<TerminalReportApproval> {
    const { data } = await apiClient.post(
      API_ENDPOINTS.TERMINAL_REPORT_APPROVALS.LIST,
      values,
    );
    return unwrapDetailResponse<TerminalReportApproval>(data);
  },

  async updateTerminalReportApproval(
    id: string | number,
    values: TerminalReportApprovalUpdateValues,
  ): Promise<TerminalReportApproval> {
    const payload = {
      ...values,
      ROC_Comments: values.comment,
    } as Record<string, unknown>;

    delete payload.comment;

    const { data } = await apiClient.patch(
      API_ENDPOINTS.TERMINAL_REPORT_APPROVALS.UPDATE(id),
      payload,
    );

    return unwrapDetailResponse<TerminalReportApproval>(data);
  },
};
