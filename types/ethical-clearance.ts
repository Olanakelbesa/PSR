export interface EthicalClearance {
  id: number;
  proposal: number;
  proposalId?: number;
  proposal_id?: number;

  proposalReadyForFundingId?: number;
  proposal_ready_for_funding_id?: number;

  screeningId?: number | null;
  screening_id?: number | null;

  referenceNumber?: string | null;
  reference_number?: string | null;

  proposalTitle?: string | null;
  proposal_title?: string | null;

  proposalShortAbstract?: string | null;
  proposal_short_abstract?: string | null;

  proposalInstitution?: string | null;
  proposal_institution?: string | null;

  pi?: any;

  needIrbEthicalClearance?: boolean;
  need_irb_ethical_clearance: boolean;

  requestFile?: string;
  request_file?: string;

  clearanceType?: string | null;
  clearance_type?: string | null;

  clearanceFile?: string | null;
  clearance_file?: string | null;

  status:
    | "pending"
    | "approved"
    | "rejected"
    | "additional_info_required";

  applicationDate?: string;
  application_date: string;

  approvalDate?: string | null;
  approval_date?: string | null;
}

export interface EthicalClearanceResponse {
  success: boolean;
  data: EthicalClearance[];
}

export interface EthicalClearanceDetailResponse {
  success: boolean;
  data: EthicalClearance;
}

export interface EthicalClearanceCreateInput {
  proposal: number;
  request_file?: File;
  clearance_type: string;
  application_date: string;
  clearance_file?: File;
  status?: EthicalClearance["status"];
  approval_date?: string;
}
