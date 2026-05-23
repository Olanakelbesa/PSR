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

    return unwrapListResponse<ProgressReportSummary>(data);
  },

  async getProgressReportById(
    id: string | number,
  ): Promise<ProgressReportSummary> {
    const { data } = await apiClient.get(
      API_ENDPOINTS.PROGRESS_REPORTS.DETAIL(id),
    );

    return unwrapDetailResponse<ProgressReportSummary>(data);
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

    return unwrapListResponse<ProgressReportApproval>(data);
  },

  async getProgressReportApprovalById(
    id: string | number,
  ): Promise<ProgressReportApproval> {
    const { data } = await apiClient.get(
      API_ENDPOINTS.PROGRESS_REPORT_APPROVALS.DETAIL(id),
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

    return unwrapListResponse<TerminalReportApproval>(data);
  },

  async getTerminalReportApprovalById(
    id: string | number,
  ): Promise<TerminalReportApproval> {
    const { data } = await apiClient.get(
      API_ENDPOINTS.TERMINAL_REPORT_APPROVALS.DETAIL(id),
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
