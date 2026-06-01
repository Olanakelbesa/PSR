export interface CoInvestigator {
  id?: string | number;
  index?: number;
  name: string;
}

export interface ContractData {
  organization_name: string;
  logoPath?: string;
  organization_amharic?: string;
  document_no?: string;
  issue_no?: string;
  principal_investigator?: string;
  co_investigators: CoInvestigator[];
  proposal_title?: string;
  project_duration_years?: string | number;
  college?: string;
  department?: string;
  center_of_excellence?: string;
  email?: string;
  phone?: string;
  approved_budget?: string;
  approved_budget_words?: string;
  day?: string;
  month?: string;
}
