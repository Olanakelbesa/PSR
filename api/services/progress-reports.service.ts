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

export interface ProgressReportApprovalLogItem {
  id: number;
  reviewer?: number;
  reviewerName?: string | null;
  reviewer_name?: string | null;
  decision: ReportDecision;
  comment?: string | null;
  reviewedAt?: string | null;
  reviewed_at?: string | null;
}

export interface GroupedProgressReportItem {
  id: number;
  reportName: string;
  mainActivitiesAchieved: string;
  generalStatus: string;
  amountUsed: string;
  startDate: string | null;
  endDate: string | null;
  submittedAt: string | null;
  submittedBy?: any;
  status: ReportDecision;
  attachment: string | null;
  approvals: ProgressReportApprovalLogItem[];
  latestApproval: ProgressReportApprovalLogItem | null;
  projectTrackingId?: number;
}

export interface GroupedProgressReportProposal {
  proposalId: number | null;
  title: string;
  referenceNumber?: string | null;
  pi?: any;
  projectTrackingId: number;
  status: string;
  statistics: {
    totalReports: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  reports: GroupedProgressReportItem[];
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

export interface TerminalReportGrade {
  id: number;
  name: string;
  description: string;
  score_value: number;
  is_active: boolean;
}

export interface TerminalReportItem {
  id: number;
  terminal_type: number;
  terminal_type_name?: string | null;
  file?: string | null;
  external_link?: string | null;
  grade?: number | null;
  grade_name?: string | null;
  grade_comments?: string | null;
}

export interface TerminalReportItemFormValue {
  terminal_type: number;
  file?: File | null;
  external_link?: string;
}

export interface TerminalReportFormValues {
  project_tracking: number;
  report_name?: string;
  main_deliverables: string;
  attachment?: File | null;
  is_published?: boolean;
  publication_link?: string;
  data_center?: number;
  custom_data_center?: string;
  data_sharing_checklist_completed?: boolean;
  status?: ReportDecision;
  terminal_type?: number[];
  items?: TerminalReportItemFormValue[];
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

export interface TerminalReportTeamMember {
  id: number;
  member_type: "internal" | "external";
  full_name: string;
  email: string | null;
  photo_url: string | null;
  role: string | null;
  organization?: string | null;
  position?: string | null;
}

export interface TerminalReportApprovalRecord {
  id: number;
  reviewer_id: number | null;
  reviewer_name: string | null;
  decision: "approved" | "rejected" | "pending";
  ROC_Comments: string;
  reviewed_at: string | null;
}

export interface TerminalReportSummary {
  id: number;
  project_tracking_id: number | null;
  project_tracking_title: string | null;
  project_tracking_status: string | null;
  project_tracking?: {
    project_tracking_id: number | null;
    proposal_id: number | null;
    reference_number: string | null;
    title: string | null;
    status: string | null;
    pi: {
      id: number;
      full_name: string;
      email: string | null;
      photo_url: string | null;
      department?: string | null;
    } | null;
    team_members?: TerminalReportTeamMember[];
  } | null;
  proposal_id: number | null;
  reference_number: string | null;
  general_status: string;
  submitted_by_name: string | null;
  submitted_by_photo_url?: string | null;
  submitted_by_email?: string | null;
  report_name: string | null;
  main_deliverables: string;
  attachment: string | null;
  is_published: boolean;
  publication_link: string | null;
  status: ReportDecision;
  submitted_at: string;
  updated_at?: string | null;
  submitted_by: number | null;
  terminal_type: number[];
  data_center_id?: number | null;
  data_center?: { id: number; name: string } | null;
  data_center_name?: string | null;
  custom_data_center?: string | null;
  data_sharing_checklist_completed?: boolean;
  reviewer_comments?: string | null;
  approvals?: TerminalReportApprovalRecord[];
  items?: Array<{
    id: number;
    terminal_type: number;
    terminal_type_name: string | null;
    file: string | null;
    external_link: string | null;
    grade: number | null;
    grade_name: string | null;
    grade_comments: string | null;
  }>;
  pi?: {
    id: number;
    full_name: string;
    email: string | null;
    photo_url: string | null;
    department?: string | null;
  } | null;
  team_members?: TerminalReportTeamMember[];
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
  const rawPi = item.proposal?.pi ?? item.pi ?? item.principalInvestigator ?? null;
  const pi = rawPi
    ? {
      id: rawPi.id,
      fullName:
        rawPi.fullName ||
        rawPi.full_name ||
        rawPi.name ||
        rawPi.email ||
        "PI",
      email: rawPi.email || "",
      photoUrl: rawPi.photoUrl || rawPi.photo_url || rawPi.photo || null,
      photo_url: rawPi.photo_url || rawPi.photoUrl || rawPi.photo || null,
      photo: rawPi.photo || rawPi.photo_url || rawPi.photoUrl || null,
    }
    : null;

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
    pi,
    status: item.status ?? "on_progress",
    generalStatus: item.generalStatus ?? item.general_status ?? "pending",
  };
}

export const progressReportsService = {
  async getProgressReports(
    params: Record<string, unknown> = {},
  ): Promise<ListResponse<any>> {
    const { data } = await apiClient.get(API_ENDPOINTS.PROGRESS_REPORTS.LIST, {
      params,
    });

    const list = unwrapListResponse<any>(data);

    // If data contains grouped proposals schema
    if (
      Array.isArray(list.data) &&
      list.data.length > 0 &&
      ("reports" in list.data[0] || "proposalId" in list.data[0] || "projectTrackingId" in list.data[0])
    ) {
      const normalizedProposals: GroupedProgressReportProposal[] = list.data.map((proposal: any) => ({
        proposalId: proposal.proposalId ?? proposal.proposal_id ?? null,
        title: proposal.title ?? proposal.proposalTitle ?? `Project Tracking #${proposal.projectTrackingId || proposal.project_tracking_id}`,
        referenceNumber: proposal.referenceNumber ?? proposal.reference_number ?? null,
        pi: proposal.pi ?? proposal.principal_investigator ?? null,
        projectTrackingId: proposal.projectTrackingId ?? proposal.project_tracking_id ?? 0,
        status: proposal.status ?? "on_progress",
        statistics: {
          totalReports: proposal.statistics?.totalReports ?? proposal.reports?.length ?? 0,
          pending: proposal.statistics?.pending ?? 0,
          approved: proposal.statistics?.approved ?? 0,
          rejected: proposal.statistics?.rejected ?? 0,
        },
        reports: (proposal.reports || []).map((rep: any) => ({
          id: rep.id,
          reportName: rep.reportName || rep.report_name || `Progress Report #${rep.id}`,
          mainActivitiesAchieved: rep.mainActivitiesAchieved || rep.main_activities_achieved || "",
          generalStatus: rep.generalStatus || rep.general_status || rep.status || "pending",
          amountUsed: String(rep.amountUsed || rep.amount_used || "0.00"),
          startDate: rep.startDate || rep.start_date || null,
          endDate: rep.endDate || rep.end_date || null,
          submittedAt: rep.submittedAt || rep.submitted_at || null,
          submittedBy: rep.submittedBy || rep.submitted_by || proposal.pi || null,
          status: rep.status || rep.generalStatus || rep.general_status || "pending",
          attachment: rep.attachment || rep.file || null,
          approvals: rep.approvals || [],
          latestApproval: rep.latestApproval || rep.latest_approval || null,
          projectTrackingId: proposal.projectTrackingId ?? proposal.project_tracking_id,
        })),
      }));

      return {
        data: normalizedProposals,
        meta: list.meta,
      };
    }

    // Fallback for flat progress report summary list
    const normalized = list.data.map((item: any) => ({
      ...item,
      id: item.id ?? item.pk,
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
        undefined,
      projectTracking: item.projectTracking ?? null,
      latest_approval: item.latest_approval ?? item.latestApproval ?? null,
      approvals: item.approvals ?? [],
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
      ...payload,
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
        undefined,
      projectTracking: payload.projectTracking ?? null,
      latest_approval: payload.latest_approval ?? payload.latestApproval ?? null,
      approvals: payload.approvals ?? [],
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
    values: TerminalReportFormValues | FormData,
  ): Promise<unknown> {
    const formData = values instanceof FormData ? values : buildFormData(values);
    const { data } = await apiClient.post(
      API_ENDPOINTS.TERMINAL_REPORTS.CREATE,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return unwrapDetailResponse<unknown>(data);
  },

  async updateTerminalReport(
    id: string | number,
    values: TerminalReportFormValues | FormData,
  ): Promise<unknown> {
    const formData = values instanceof FormData ? values : buildFormData(values);
    const { data } = await apiClient.patch(
      API_ENDPOINTS.TERMINAL_REPORTS.DETAIL(id),
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return unwrapDetailResponse<unknown>(data);
  },

  async getEligibleForTerminalReport(
    params?: Record<string, unknown>,
  ): Promise<any[]> {
    const { data } = await apiClient.get(
      API_ENDPOINTS.PROJECT_TRACKING.ELIGIBLE_FOR_TERMINAL_REPORT,
      { params },
    );
    return data?.data ?? data?.results ?? [];
  },

  async getReadyForTracking(params?: Record<string, unknown>): Promise<ReadyForTrackingProject[]> {
    const { data } = await apiClient.get(
      API_ENDPOINTS.PROJECT_TRACKING.READY_FOR_TRACKING,
      { params },
    );
    const results = data?.data ?? data?.results ?? (Array.isArray(data) ? data : []);
    return results.map((item: any) => ({
      id: item.id ?? item.proposal ?? item.pk,
      proposal: item.proposal ?? item.id,
      readyForFundingId: item.readyForFundingId ?? item.ready_for_funding_id,
      fundingDecisionStatus:
        item.fundingDecisionStatus ?? item.funding_decision_status,
      screeningStatus: item.screeningStatus ?? item.screening_status,
      screeningId: item.screeningId ?? item.screening_id,
      referenceNumber: item.referenceNumber ?? item.reference_number,
      title: item.title ?? item.proposalTitle ?? item.proposal_title ?? "Untitled Proposal",
      proposalTitle: item.proposalTitle ?? item.proposal_title ?? item.title ?? "Untitled Proposal",
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

    const normalized = list.data.map((item: any) => {
      const pt = item.projectTracking || item.project_tracking || {};
      const ptId =
        pt.projectTrackingId ??
        pt.project_tracking_id ??
        pt.id ??
        item.project_tracking ??
        null;
      const propId =
        pt.proposalId ?? pt.proposal_id ?? pt.proposal ?? item.proposal_id ?? null;
      const refNum =
        pt.referenceNumber ??
        pt.reference_number ??
        item.referenceNumber ??
        item.reference_number ??
        (propId ? `PROP-${propId}` : `PT-${ptId}`);

      const rawPi = pt.pi ?? item.pi ?? null;
      const normalizedPi = rawPi ? {
        id: rawPi.id,
        full_name: rawPi.full_name ?? rawPi.fullName ?? rawPi.name ?? null,
        email: rawPi.email ?? null,
        photo_url: rawPi.photo_url ?? rawPi.photoUrl ?? rawPi.photo ?? null,
        department: rawPi.department ?? rawPi.departmentName ?? null,
      } : null;

      const rawTeam: any[] = pt.team_members ?? pt.teamMembers ?? item.team_members ?? item.teamMembers ?? [];
      const normalizedTeam = rawTeam.map((tm: any) => ({
        id: tm.id,
        member_type: tm.member_type ?? tm.memberType ?? "internal",
        full_name: tm.full_name ?? tm.fullName ?? tm.name ?? "Team Member",
        email: tm.email ?? null,
        photo_url: tm.photo_url ?? tm.photoUrl ?? tm.photo ?? null,
        role: tm.role ?? tm.roleName ?? null,
        organization: tm.organization ?? tm.organizationName ?? tm.organization_name ?? null,
        position: tm.position ?? null,
      }));

      const rawItems: any[] = item.items ?? [];
      const normalizedItems = rawItems.map((it: any) => ({
        id: it.id,
        terminal_type: it.terminal_type ?? it.terminalType,
        terminal_type_name: it.terminal_type_name ?? it.terminalTypeName ?? null,
        file: it.file ?? null,
        external_link: it.external_link ?? it.externalLink ?? null,
        grade: it.grade ?? null,
        grade_name: it.grade_name ?? it.gradeName ?? null,
        grade_comments: it.grade_comments ?? it.gradeComments ?? null,
      }));

      return {
        id: item.id ?? item.pk,
        project_tracking_id: ptId,
        proposal_id: propId,
        reference_number: refNum,
        project_tracking_title:
          pt.title ??
          item.project_tracking_title ??
          item.reportName ??
          item.report_name ??
          `Terminal Report #${item.id}`,
        project_tracking_status: pt.status ?? item.project_tracking_status ?? null,
        project_tracking: {
          project_tracking_id: ptId,
          proposal_id: propId,
          reference_number: refNum,
          title: pt.title ?? item.project_tracking_title ?? item.reportName ?? item.report_name,
          status: pt.status ?? item.project_tracking_status,
          pi: normalizedPi,
          team_members: normalizedTeam,
        },
        pi: normalizedPi,
        team_members: normalizedTeam,
        general_status:
          item.generalStatus ?? item.general_status ?? item.status ?? "pending",
        submitted_by_name:
          item.submittedByName ?? item.submitted_by_name ?? null,
        submitted_by_photo_url:
          item.submittedByPhotoUrl ?? item.submitted_by_photo_url ?? null,
        submitted_by_email:
          item.submittedByEmail ?? item.submitted_by_email ?? null,
        report_name: item.reportName ?? item.report_name ?? null,
        main_deliverables:
          item.mainDeliverables ?? item.main_deliverables ?? "",
        attachment: item.attachment ?? null,
        is_published: item.isPublished ?? item.is_published ?? false,
        publication_link:
          item.publicationLink ?? item.publication_link ?? null,
        data_center_name:
          item.dataCenterName ??
          item.data_center_name ??
          item.customDataCenter ??
          item.custom_data_center ??
          null,
        custom_data_center:
          item.customDataCenter ?? item.custom_data_center ?? null,
        data_sharing_checklist_completed:
          item.dataSharingChecklistCompleted ??
          item.data_sharing_checklist_completed ??
          false,
        reviewer_comments:
          item.reviewerComments ?? item.reviewer_comments ?? item.comment ?? null,
        approvals: item.approvals ?? [],
        items: normalizedItems,
        status: item.status ?? item.generalStatus ?? item.general_status ?? "pending",
        submitted_at: item.submittedAt ?? item.submitted_at ?? "",
        updated_at: item.updatedAt ?? item.updated_at ?? null,
        submitted_by: item.submittedBy ?? item.submitted_by ?? null,
        terminal_type: item.terminalType ?? item.terminal_type ?? [],
      };
    });

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
    const pt = payload.projectTracking || payload.project_tracking || {};
    const ptId =
      pt.projectTrackingId ??
      pt.project_tracking_id ??
      pt.id ??
      payload.project_tracking ??
      null;
    const propId =
      pt.proposalId ?? pt.proposal_id ?? pt.proposal ?? payload.proposal_id ?? null;
    const refNum =
      pt.referenceNumber ??
      pt.reference_number ??
      payload.referenceNumber ??
      payload.reference_number ??
      (propId ? `PROP-${propId}` : `PT-${ptId}`);

    const rawPi = pt.pi ?? payload.pi ?? null;
    const normalizedPi = rawPi ? {
      id: rawPi.id,
      full_name: rawPi.full_name ?? rawPi.fullName ?? rawPi.name ?? null,
      email: rawPi.email ?? null,
      photo_url: rawPi.photo_url ?? rawPi.photoUrl ?? rawPi.photo ?? null,
      department: rawPi.department ?? rawPi.departmentName ?? null,
    } : null;

    const rawTeam: any[] = pt.team_members ?? pt.teamMembers ?? payload.team_members ?? payload.teamMembers ?? [];
    const normalizedTeam = rawTeam.map((tm: any) => ({
      id: tm.id,
      member_type: tm.member_type ?? tm.memberType ?? "internal",
      full_name: tm.full_name ?? tm.fullName ?? tm.name ?? "Team Member",
      email: tm.email ?? null,
      photo_url: tm.photo_url ?? tm.photoUrl ?? tm.photo ?? null,
      role: tm.role ?? tm.roleName ?? null,
      organization: tm.organization ?? tm.organizationName ?? tm.organization_name ?? null,
      position: tm.position ?? null,
    }));

    const rawItems: any[] = payload.items ?? [];
    const normalizedItems = rawItems.map((it: any) => ({
      id: it.id,
      terminal_type: it.terminal_type ?? it.terminalType,
      terminal_type_name: it.terminal_type_name ?? it.terminalTypeName ?? null,
      file: it.file ?? null,
      external_link: it.external_link ?? it.externalLink ?? null,
      grade: it.grade ?? null,
      grade_name: it.grade_name ?? it.gradeName ?? null,
      grade_comments: it.grade_comments ?? it.gradeComments ?? null,
    }));

    return {
      id: payload.id ?? payload.pk,
      project_tracking_id: ptId,
      proposal_id: propId,
      reference_number: refNum,
      project_tracking_title:
        pt.title ??
        payload.project_tracking_title ??
        payload.reportName ??
        payload.report_name ??
        `Terminal Report #${payload.id}`,
      project_tracking_status: pt.status ?? payload.project_tracking_status ?? null,
      project_tracking: {
        project_tracking_id: ptId,
        proposal_id: propId,
        reference_number: refNum,
        title: pt.title ?? payload.project_tracking_title ?? payload.reportName ?? payload.report_name,
        status: pt.status ?? payload.project_tracking_status,
        pi: normalizedPi,
        team_members: normalizedTeam,
      },
      pi: normalizedPi,
      team_members: normalizedTeam,
      general_status:
        payload.generalStatus ?? payload.general_status ?? payload.status ?? "pending",
      submitted_by_name:
        payload.submittedByName ?? payload.submitted_by_name ?? null,
      submitted_by_photo_url:
        payload.submittedByPhotoUrl ?? payload.submitted_by_photo_url ?? null,
      submitted_by_email:
        payload.submittedByEmail ?? payload.submitted_by_email ?? null,
      report_name: payload.reportName ?? payload.report_name ?? null,
      main_deliverables:
        payload.mainDeliverables ?? payload.main_deliverables ?? "",
      attachment: payload.attachment ?? null,
      is_published: payload.isPublished ?? payload.is_published ?? false,
      publication_link:
        payload.publicationLink ?? payload.publication_link ?? null,
      data_center_id:
        payload.dataCenterId ??
        payload.data_center_id ??
        (typeof payload.data_center === "object"
          ? payload.data_center?.id
          : payload.data_center) ??
        null,
      data_center:
        typeof payload.data_center === "object"
          ? payload.data_center
          : payload.data_center
            ? { id: payload.data_center, name: payload.data_center_name }
            : null,
      data_center_name:
        payload.dataCenterName ??
        payload.data_center_name ??
        payload.customDataCenter ??
        payload.custom_data_center ??
        null,
      custom_data_center:
        payload.customDataCenter ?? payload.custom_data_center ?? null,
      data_sharing_checklist_completed:
        payload.dataSharingChecklistCompleted ??
        payload.data_sharing_checklist_completed ??
        false,
      reviewer_comments:
        payload.reviewerComments ?? payload.reviewer_comments ?? payload.comment ?? null,
      approvals: payload.approvals ?? [],
      items: normalizedItems,
      status: payload.status ?? payload.generalStatus ?? payload.general_status ?? "pending",
      submitted_at: payload.submittedAt ?? payload.submitted_at ?? "",
      updated_at: payload.updatedAt ?? payload.updated_at ?? null,
      submitted_by: payload.submittedBy ?? payload.submitted_by ?? null,
      terminal_type: payload.terminalType ?? payload.terminal_type ?? [],
    } as TerminalReportSummary;
  },

  async getTerminalReportGrades(): Promise<TerminalReportGrade[]> {
    const { data } = await apiClient.get(
      API_ENDPOINTS.TERMINAL_REPORT_GRADES.LIST,
    );
    const list = unwrapListResponse<TerminalReportGrade>(data);
    return list.data ?? [];
  },

  async getGradedForRepository(): Promise<any[]> {
    const { data } = await apiClient.get(
      API_ENDPOINTS.FINAL_SUBMISSIONS.ELIGIBLE_FOR_REPOSITORY,
    );
    const items: any[] = data?.data ?? data?.results ?? [];
    return items.map((item: any) => {
      const rawPi = item.pi ?? item.pi_info ?? null;
      const pi = rawPi
        ? {
            id: rawPi.id,
            full_name: rawPi.full_name ?? rawPi.fullName,
            fullName: rawPi.full_name ?? rawPi.fullName,
            email: rawPi.email,
            photo_url: rawPi.photo_url ?? rawPi.photoUrl,
            photoUrl: rawPi.photo_url ?? rawPi.photoUrl,
            name: rawPi.name ?? rawPi.full_name ?? rawPi.fullName,
          }
        : null;

      return {
        ...item,
        proposalId: item.proposalId ?? item.proposal_id,
        proposal_id: item.proposalId ?? item.proposal_id,
        projectTrackingId: item.projectTrackingId ?? item.project_tracking_id,
        project_tracking_id: item.projectTrackingId ?? item.project_tracking_id,
        title: item.title,
        referenceNumber: item.referenceNumber ?? item.reference_number ?? null,
        reference_number: item.referenceNumber ?? item.reference_number ?? null,
        dataCenterName: item.dataCenterName ?? item.data_center_name ?? null,
        data_center_name: item.dataCenterName ?? item.data_center_name ?? null,
        terminalReportId: item.terminalReportId ?? item.terminal_report_id,
        terminal_report_id: item.terminalReportId ?? item.terminal_report_id,
        itemsCount: item.itemsCount ?? item.items_count ?? 0,
        items_count: item.itemsCount ?? item.items_count ?? 0,
        pi,
        pi_info: pi,
        totalAwardAmount: item.totalAwardAmount ?? item.total_award_amount ?? null,
        total_award_amount: item.totalAwardAmount ?? item.total_award_amount ?? null,
      };
    });
  },

  async createTerminalReport(payload: FormData): Promise<any> {
    const { data } = await apiClient.post(
      API_ENDPOINTS.TERMINAL_REPORTS.CREATE,
      payload,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return data;
  },

  async updateTerminalReport(id: string | number, payload: FormData): Promise<any> {
    const { data } = await apiClient.patch(
      API_ENDPOINTS.TERMINAL_REPORTS.DETAIL(id),
      payload,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return data;
  },
};

export const progressReportApprovalsService = {
  async getProgressReportApprovals(
    params: Record<string, unknown> = {},
  ): Promise<ListResponse<GroupedProgressReportProposal>> {
    const { data } = await apiClient.get(
      API_ENDPOINTS.PROGRESS_REPORT_APPROVALS.LIST,
      {
        params,
      },
    );

    const list = unwrapListResponse<any>(data);

    // If data is array of grouped proposals
    if (Array.isArray(list.data)) {
      const normalizedProposals: GroupedProgressReportProposal[] = list.data.map((proposal: any) => ({
        proposalId: proposal.proposalId ?? proposal.proposal_id ?? null,
        title: proposal.title ?? `Project Tracking #${proposal.projectTrackingId || proposal.project_tracking_id}`,
        referenceNumber: proposal.referenceNumber ?? proposal.reference_number ?? null,
        pi: proposal.pi ?? proposal.principal_investigator ?? null,
        projectTrackingId: proposal.projectTrackingId ?? proposal.project_tracking_id ?? 0,
        status: proposal.status ?? "on_progress",
        statistics: {
          totalReports: proposal.statistics?.totalReports ?? proposal.reports?.length ?? 0,
          pending: proposal.statistics?.pending ?? 0,
          approved: proposal.statistics?.approved ?? 0,
          rejected: proposal.statistics?.rejected ?? 0,
        },
        reports: (proposal.reports || []).map((rep: any) => ({
          id: rep.id,
          reportName: rep.reportName || rep.report_name || `Progress Report #${rep.id}`,
          mainActivitiesAchieved: rep.mainActivitiesAchieved || rep.main_activities_achieved || "",
          generalStatus: rep.generalStatus || rep.general_status || rep.status || "pending",
          amountUsed: String(rep.amountUsed || rep.amount_used || "0.00"),
          startDate: rep.startDate || rep.start_date || null,
          endDate: rep.endDate || rep.end_date || null,
          submittedAt: rep.submittedAt || rep.submitted_at || null,
          submittedBy: rep.submittedBy || rep.submitted_by || proposal.pi || null,
          status: rep.status || "pending",
          attachment: rep.attachment || null,
          approvals: rep.approvals || [],
          latestApproval: rep.latestApproval || rep.latest_approval || null,
          projectTrackingId: proposal.projectTrackingId ?? proposal.project_tracking_id,
        })),
      }));

      return {
        data: normalizedProposals,
        meta: list.meta,
      };
    }

    return {
      data: [],
      meta: list.meta,
    };
  },

  async getGroupedProgressReportById(
    id: string | number,
  ): Promise<GroupedProgressReportProposal | null> {
    // Attempt 1: Fetch by project tracking or proposal filter
    try {
      const { data } = await apiClient.get(
        API_ENDPOINTS.PROGRESS_REPORT_APPROVALS.LIST,
        {
          params: { project_tracking: id, limit: 100 },
        },
      );
      const list = unwrapListResponse<any>(data);
      if (Array.isArray(list.data) && list.data.length > 0) {
        const proposal = list.data[0];
        return {
          proposalId: proposal.proposalId ?? proposal.proposal_id ?? null,
          title: proposal.title ?? `Project Tracking #${proposal.projectTrackingId || proposal.project_tracking_id}`,
          projectTrackingId: proposal.projectTrackingId ?? proposal.project_tracking_id ?? 0,
          referenceNumber: proposal.referenceNumber ?? proposal.reference_number ?? null,
          pi: proposal.pi ?? proposal.principal_investigator ?? null,
          status: proposal.status ?? "on_progress",
          statistics: {
            totalReports: proposal.statistics?.totalReports ?? proposal.reports?.length ?? 0,
            pending: proposal.statistics?.pending ?? 0,
            approved: proposal.statistics?.approved ?? 0,
            rejected: proposal.statistics?.rejected ?? 0,
          },
          reports: (proposal.reports || []).map((rep: any) => ({
            id: rep.id,
            reportName: rep.reportName || rep.report_name || `Progress Report #${rep.id}`,
            mainActivitiesAchieved: rep.mainActivitiesAchieved || rep.main_activities_achieved || "",
            generalStatus: rep.generalStatus || rep.general_status || rep.status || "pending",
            amountUsed: String(rep.amountUsed || rep.amount_used || "0.00"),
            startDate: rep.startDate || rep.start_date || null,
            endDate: rep.endDate || rep.end_date || null,
            submittedAt: rep.submittedAt || rep.submitted_at || null,
            submittedBy: rep.submittedBy || rep.submitted_by || proposal.pi || null,
            status: rep.status || "pending",
            attachment: rep.attachment || null,
            approvals: rep.approvals || [],
            latestApproval: rep.latestApproval || rep.latest_approval || null,
            projectTrackingId: proposal.projectTrackingId ?? proposal.project_tracking_id,
          })),
        };
      }
    } catch {
      // Ignore fallback
    }

    // Attempt 2: Fetch all and match proposalId or projectTrackingId or contains report id
    try {
      const { data } = await apiClient.get(
        API_ENDPOINTS.PROGRESS_REPORT_APPROVALS.LIST,
        { params: { limit: 100 } },
      );
      const list = unwrapListResponse<any>(data);
      if (Array.isArray(list.data)) {
        const idNum = Number(id);
        const match = list.data.find(
          (p: any) =>
            p.projectTrackingId === idNum ||
            p.project_tracking_id === idNum ||
            p.proposalId === idNum ||
            p.proposal_id === idNum ||
            (p.reports && p.reports.some((r: any) => r.id === idNum)),
        );
        if (match) {
          return {
            proposalId: match.proposalId ?? match.proposal_id ?? null,
            title: match.title ?? `Project Tracking #${match.projectTrackingId || match.project_tracking_id}`,
            projectTrackingId: match.projectTrackingId ?? match.project_tracking_id ?? 0,
            referenceNumber: match.referenceNumber ?? match.reference_number ?? null,
            pi: match.pi ?? match.principal_investigator ?? null,
            status: match.status ?? "on_progress",
            statistics: {
              totalReports: match.statistics?.totalReports ?? match.reports?.length ?? 0,
              pending: match.statistics?.pending ?? 0,
              approved: match.statistics?.approved ?? 0,
              rejected: match.statistics?.rejected ?? 0,
            },
            reports: (match.reports || []).map((rep: any) => ({
              id: rep.id,
              reportName: rep.reportName || rep.report_name || `Progress Report #${rep.id}`,
              mainActivitiesAchieved: rep.mainActivitiesAchieved || rep.main_activities_achieved || "",
              generalStatus: rep.generalStatus || rep.general_status || rep.status || "pending",
              amountUsed: String(rep.amountUsed || rep.amount_used || "0.00"),
              startDate: rep.startDate || rep.start_date || null,
              endDate: rep.endDate || rep.end_date || null,
              submittedAt: rep.submittedAt || rep.submitted_at || null,
              submittedBy: rep.submittedBy || rep.submitted_by || match.pi || null,
              status: rep.status || "pending",
              attachment: rep.attachment || null,
              approvals: rep.approvals || [],
              latestApproval: rep.latestApproval || rep.latest_approval || null,
              projectTrackingId: match.projectTrackingId ?? match.project_tracking_id,
            })),
          };
        }
      }
    } catch {
      // Ignore
    }

    return null;
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
