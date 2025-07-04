// src/models/types/documents.ts

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

// Request interfaces
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

// Response interfaces
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

// API Response interfaces
export interface ApiDocumentResponse {
  id: string;
  lead_id: string;
  filename: string;
  document_type: string;
  file_size: number;
  mime_type: string;
  status: "Pending" | "Approved" | "Rejected";
  uploaded_by_name: string;
  uploaded_at: string;
  notes?: string;
  expiry_date?: string | null;
  approved_by_name?: string | null;
  approved_at?: string | null;
  approval_notes?: string;
  lead_context?: Record<string, unknown>;
}

export interface ApiDocumentsListResponse {
  documents?: ApiDocumentResponse[];
  total_count?: number;
  page?: number;
  limit?: number;
  total_pages?: number;
}

export interface ApiDocumentTypesResponse {
  document_types?: Array<{ value: string; label: string }>;
}

export interface ApiDocumentStatusesResponse {
  statuses?: Array<{ value: string; label: string }>;
}

export interface DocumentUploadResponse {
  success: boolean;
  message: string;
  document: ApiDocumentResponse;
}

export interface DocumentUpdateResponse {
  success: boolean;
  message: string;
  document: ApiDocumentResponse;
}

export interface DocumentDeleteResponse {
  success: boolean;
  message: string;
}

export interface DocumentApprovalResponse {
  success: boolean;
  message: string;
  document: ApiDocumentResponse;
}

export interface AdminDashboardResponse {
  total_documents: number;
  pending_approvals: number;
  approved_documents: number;
  rejected_documents: number;
  documents_by_type: Record<string, number>;
  recent_uploads: ApiDocumentResponse[];
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
