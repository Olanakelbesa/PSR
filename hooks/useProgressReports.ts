import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  progressReportsService,
  progressReportApprovalsService,
  terminalReportApprovalsService,
  terminalReportsService,
  type ProgressReportFormValues,
  type ProjectTrackingFormValues,
  type TerminalReportFormValues,
  type ProgressReportApprovalCreateValues,
  type ProgressReportApprovalUpdateValues,
  type TerminalReportApprovalUpdateValues,
} from "@/api/services/progress-reports.service";

export const progressReportKeys = {
  all: ["progress-reports"] as const,
  list: (params: Record<string, unknown>) =>
    ["progress-reports", "list", params] as const,
  detail: (id: string | number) =>
    ["progress-reports", "detail", String(id)] as const,
};

export const projectTrackingKeys = {
  all: ["project-tracking"] as const,
  list: (params: Record<string, unknown>) =>
    ["project-tracking", "list", params] as const,
  detail: (id: string | number) =>
    ["project-tracking", "detail", String(id)] as const,
};

export const progressReportApprovalKeys = {
  all: ["progress-report-approvals"] as const,
  list: (params: Record<string, unknown>) =>
    ["progress-report-approvals", "list", params] as const,
  detail: (id: string | number) =>
    ["progress-report-approvals", "detail", String(id)] as const,
};

export const terminalReportApprovalKeys = {
  all: ["terminal-report-approvals"] as const,
  list: (params: Record<string, unknown>) =>
    ["terminal-report-approvals", "list", params] as const,
  detail: (id: string | number) =>
    ["terminal-report-approvals", "detail", String(id)] as const,
};

export const terminalReportKeys = {
  all: ["terminal-reports"] as const,
  list: (params: Record<string, unknown>) =>
    ["terminal-reports", "list", params] as const,
  detail: (id: string | number) =>
    ["terminal-reports", "detail", String(id)] as const,
};

export function useProgressReports(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: progressReportKeys.list(params),
    queryFn: () => progressReportsService.getProgressReports(params),
  });
}

export function useProgressReport(id: string | number | undefined) {
  return useQuery({
    queryKey: progressReportKeys.detail(id ?? ""),
    queryFn: () =>
      progressReportsService.getProgressReportById(id as string | number),
    enabled: !!id,
  });
}

export function useProjectTracking(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: projectTrackingKeys.list(params),
    queryFn: () => progressReportsService.getProjectTracking(params),
  });
}

export function useProjectTrackingById(id: string | number | undefined) {
  return useQuery({
    queryKey: projectTrackingKeys.detail(id ?? ""),
    queryFn: () =>
      progressReportsService.getProjectTrackingById(id as string | number),
    enabled: !!id,
  });
}

export function useCreateProgressReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: ProgressReportFormValues) =>
      progressReportsService.createProgressReport(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressReportKeys.all });
    },
  });
}

export function useCreateProgressReportApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: ProgressReportApprovalCreateValues) =>
      progressReportApprovalsService.createProgressReportApproval(values),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: progressReportApprovalKeys.all,
      });
    },
  });
}


export function useCreateProjectTracking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: ProjectTrackingFormValues) =>
      progressReportsService.createProjectTracking(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectTrackingKeys.all });
      queryClient.invalidateQueries({ queryKey: ["ready-project-tracking"] });
    },
  });
}

export function useCreateTerminalReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: TerminalReportFormValues) =>
      progressReportsService.createTerminalReport(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressReportKeys.all });
    },
  });
}

export function useProgressReportApprovals(
  params: Record<string, unknown> = {},
) {
  return useQuery({
    queryKey: progressReportApprovalKeys.list(params),
    queryFn: () =>
      progressReportApprovalsService.getProgressReportApprovals(params),
  });
}

export function useProgressReportApproval(id: string | number | undefined) {
  return useQuery({
    queryKey: progressReportApprovalKeys.detail(id ?? ""),
    queryFn: () =>
      progressReportApprovalsService.getProgressReportApprovalById(
        id as string | number,
      ),
    enabled: !!id,
  });
}

export function useUpdateProgressReportApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string | number;
      values: ProgressReportApprovalUpdateValues;
    }) =>
      progressReportApprovalsService.updateProgressReportApproval(id, values),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({
        queryKey: progressReportApprovalKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: progressReportApprovalKeys.detail(id),
      });
    },
  });
}

export function useTerminalReportApprovals(
  params: Record<string, unknown> = {},
) {
  return useQuery({
    queryKey: terminalReportApprovalKeys.list(params),
    queryFn: () =>
      terminalReportApprovalsService.getTerminalReportApprovals(params),
  });
}

export function useTerminalReportApproval(id: string | number | undefined) {
  return useQuery({
    queryKey: terminalReportApprovalKeys.detail(id ?? ""),
    queryFn: () =>
      terminalReportApprovalsService.getTerminalReportApprovalById(
        id as string | number,
      ),
    enabled: !!id,
  });
}

export function useUpdateTerminalReportApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string | number;
      values: TerminalReportApprovalUpdateValues;
    }) =>
      terminalReportApprovalsService.updateTerminalReportApproval(id, values),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({
        queryKey: terminalReportApprovalKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: terminalReportApprovalKeys.detail(id),
      });
    },
  });
}

export function useReadyForTracking() {
  return useQuery({
    queryKey: ["ready-project-tracking"],
    queryFn: () => progressReportsService.getReadyForTracking(),
  });
}

export function useTerminalReports(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: terminalReportKeys.list(params),
    queryFn: () => terminalReportsService.getTerminalReports(params),
  });
}

export function useTerminalReport(id: string | number | undefined) {
  return useQuery({
    queryKey: terminalReportKeys.detail(id ?? ""),
    queryFn: () =>
      terminalReportsService.getTerminalReportById(id as string | number),
    enabled: !!id,
  });
}

export function useCreateTerminalReportApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: {
      decision: "pending" | "approved" | "rejected";
      ROC_Comments?: string;
      terminal_report: number;
    }) => terminalReportApprovalsService.createTerminalReportApproval(values),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: terminalReportApprovalKeys.all,
      });
    },
  });
}
