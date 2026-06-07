export interface ProtocolRecord {
  id: number;
  proposal: number;
  proposalTitle?: string | null;
  proposal_title?: string | null;
  referenceNumber?: string | null;
  reference_number?: string | null;
  protocolFile?: string | null;
  protocol_file?: string | null;
  otherDocument?: string | null;
  other_document?: string | null;
  uploadedBy?: number | null;
  uploaded_by?: number | null;
  uploadedByName?: string | null;
  uploaded_by_name?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface ProtocolListResponse {
  success: boolean;
  data: ProtocolRecord[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface ProtocolCreateInput {
  proposal: number;
  protocol_file: File;
  other_document?: File | null;
}

export interface ProtocolFilters {
  page?: number;
  limit?: number;
  search?: string;
  proposal?: number;
  ordering?: string;
}
