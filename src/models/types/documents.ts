// src/models/types/document.ts

export interface Document {
  id: string;
  lead_id: string;
  filename: string;
  document_type: string;
  file_size: number;
  mime_type: string;
  status: "Pending" | "Approved" | "Rejected";
  uploaded_by_name: string;
  uploaded_at: string;
  notes: string;
  expiry_date: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  approval_notes: string;
  lead_context: Record<string, unknown>;
}

// export interface LeadContext {
//   lead_name: string;
//   email: string;
//   phone: string;
// }

export interface UploadDocumentRequest {
  file: File;
  document_type: string;
  notes?: string;
}

export interface UpdateDocumentRequest {
  document_type?: string;
  notes?: string;
  expiry_date?: string;
}

export interface ApproveDocumentRequest {
  approval_notes: string;
}

export interface RejectDocumentRequest {
  approval_notes: string;
}

export interface DocumentsResponse {
  documents: Document[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface DocumentType {
  value: string;
  label: string;
}

export interface DocumentStatus {
  value: string;
  label: string;
}

// Document type options (commonly used ones)
export const DOCUMENT_TYPES: DocumentType[] = [
  { value: "Passport", label: "Passport" },
  { value: "Resume", label: "Resume/CV" },
  { value: "Certificate", label: "Certificate" },
  { value: "Transcript", label: "Transcript" },
  { value: "IELTS", label: "IELTS Certificate" },
  { value: "TOEFL", label: "TOEFL Certificate" },
  { value: "Visa", label: "Visa Document" },
  { value: "Financial", label: "Financial Document" },
  { value: "Other", label: "Other" },
];

// Document status options
export const DOCUMENT_STATUSES: DocumentStatus[] = [
  { value: "Pending", label: "Pending" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
];
