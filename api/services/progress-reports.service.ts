import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

export type ReportDecision = "pending" | "approved" | "rejected";

export interface ProgressReportSummary {
  id: number;
  project_tracking: number;
  report_name: string;
  main_activities_achieved: string;
  attachment: string | null;
  amount_used: string;
  start_date: string | null;
  end_date: string | null;
  status: ReportDecision;
  submitted_at: string;
  general_status?: string;
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

export interface TerminalReportApproval {
  id: number;
  reviewer_name: string;
  decision: ReportDecision;
  comment: string | null;
  reviewed_at: string;
  terminal_report: number;
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
        Number(item.project_tracking ?? item.projectTracking?.projectTrackingId ?? item.projectTracking?.id ?? item.projectTracking?.proposalId ?? null) || null,
      project_tracking_title:
        item.projectTracking?.title ?? item.project_tracking_title ?? item.projectTrackingTitle ?? null,
      report_name: item.report_name ?? item.reportName ?? null,
      main_activities_achieved:
        item.main_activities_achieved ?? item.mainActivitiesAchieved ?? item.main_activities ?? "",
      attachment: item.attachment ?? item.file ?? null,
      amount_used: item.amount_used ?? item.amountUsed ?? String(item.amount ?? "0"),
      start_date: item.start_date ?? item.startDate ?? null,
      end_date: item.end_date ?? item.endDate ?? null,
      status: item.status ?? item.general_status ?? item.generalStatus ?? "pending",
      submitted_at: item.submitted_at ?? item.submittedAt ?? null,
      general_status: item.general_status ?? item.generalStatus ?? item.generalStatus ?? undefined,
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
        Number(payload.project_tracking ?? payload.projectTracking?.projectTrackingId ?? payload.projectTracking?.id ?? null) || null,
      project_tracking_title:
        payload.projectTracking?.title ?? payload.project_tracking_title ?? payload.projectTrackingTitle ?? null,
      report_name: payload.report_name ?? payload.reportName ?? null,
      main_activities_achieved:
        payload.main_activities_achieved ?? payload.mainActivitiesAchieved ?? payload.main_activities ?? "",
      attachment: payload.attachment ?? payload.file ?? null,
      amount_used: payload.amount_used ?? payload.amountUsed ?? String(payload.amount ?? "0"),
      start_date: payload.start_date ?? payload.startDate ?? null,
      end_date: payload.end_date ?? payload.endDate ?? null,
      status: payload.status ?? payload.general_status ?? payload.generalStatus ?? "pending",
      submitted_at: payload.submitted_at ?? payload.submittedAt ?? null,
      general_status: payload.general_status ?? payload.generalStatus ?? payload.generalStatus ?? undefined,
    } as any;
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
        item.progressReport?.reportName ?? item.progressReport?.report_name ?? item.progress_report ?? (item.progressReport?.progressReportId ?? null),
      progress_report_id:
        item.progressReport?.progressReportId ?? item.progressReport?.id ?? item.progressReport ?? null,
      project_tracking_id: item.projectTrackingId ?? item.project_tracking_id ?? null,
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
      comment: payload.comment ?? payload.ROCComments ?? payload.roc_comments ?? null,
      reviewed_at: payload.reviewedAt ?? payload.reviewed_at ?? null,
      reviewer: payload.reviewer ?? null,
      progress_report:
        payload.progressReport?.reportName ?? payload.progressReport?.report_name ?? payload.progress_report ?? (payload.progressReport?.progressReportId ?? null),
      progress_report_id:
        payload.progressReport?.progressReportId ?? payload.progressReport?.id ?? payload.progressReport ?? null,
      project_tracking_id: payload.projectTrackingId ?? payload.project_tracking_id ?? null,
    } as any;
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
      terminal_report_id: item.terminalReport?.terminalReportId ?? item.terminalReport?.id ?? null,
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
      terminal_report_id: payload.terminalReport?.terminalReportId ?? payload.terminalReport?.id ?? null,
      terminal_report_status: payload.terminalReport?.status ?? null,
    } as any;
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
