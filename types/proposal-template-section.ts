export interface ProposalTemplateSection {
  id: string | number;
  title: string;
  description?: string;
  content?: string;
  section_order?: number;
  is_required?: boolean;
  required?: boolean;
  section_type?: string;
}
