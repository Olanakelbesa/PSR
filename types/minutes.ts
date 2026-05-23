export interface MinuteRecord {
  id: number;
  budgetYear: string;
  file: string;
}

export interface MinuteCreateInput {
  budget_year: string;
  file: File;
}

export interface MinuteListResponse {
  success?: boolean;
  data: MinuteRecord[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
