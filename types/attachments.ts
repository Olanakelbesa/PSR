export type AttachmentDocumentType = "pdf" | "doc" | string;

export interface AttachmentRecord {
  id: number;
  title: string;
  attachment: string;
  documentType: AttachmentDocumentType | null;
  dateOfUpload: string;
}

export interface AttachmentCreateInput {
  title: string;
  attachment: File;
}

export interface AttachmentUpdateInput {
  title?: string;
  attachment?: File;
}

export interface AttachmentListResponse {
  success?: boolean;
  data: AttachmentRecord[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
