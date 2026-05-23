export interface EthicalClearance {
  id: number;
  proposal: number;

  proposal_ready_for_funding_id: number;

  screening_id: number | null;

  reference_number: string | null;

  proposal_title: string | null;

  pi: any;

  need_irb_ethical_clearance: boolean;

  request_file: string;

  clearance_type: string;

  clearance_file?: string | null;

  status:
    | "pending"
    | "approved"
    | "rejected"
    | "additional_info_required";

  application_date: string;

  approval_date: string | null;
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
  request_file: File;
  clearance_type: string;
  application_date: string;
  clearance_file?: File;
  status?: EthicalClearance["status"];
  approval_date?: string;
}
