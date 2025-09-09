// src/models/types/cvExtraction.ts

export interface CVExtraction {
  processing_id: string;
  status: "pending_review" | "reviewed" | "rejected";
  extracted_data: {
    name: string;
    email: string;
    phone: string;
    age: number | null;
    skills: string;
    education: string;
    experience: string;
    // extraction_confidence: Record<string, any>;
    raw_text_length: number | null;
  };
  file_metadata: {
    original_filename: string;
    file_size: number;
    mime_type: string;
    processing_time_ms: number;
    extractor_version: string;
  };
  uploaded_by: string;
  uploaded_by_email: string;
  created_at: string;
  updated_at: string;
  reviewed: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  converted_to_lead: boolean;
  lead_id: string | null;
  converted_by: string | null;
  converted_at: string | null;
  error_message: string | null;
  extraction_errors: string[];
  processing_notes: string;
}

export interface CVExtractionsResponse {
  extractions: CVExtraction[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
  filters_applied: {
    status: string | null;
    user_filter: string;
  };
}

export interface CVUploadResponse {
  success: boolean;
  message: string;
  processing_id: string;
  status: string;
  estimated_processing_time: number;
}

export interface UpdateCVExtractionRequest {
  name?: string;
  email?: string;
  phone?: string;
  skills?: string;
  education?: string;
  experience?: string;
  processing_notes?: string;
}

export interface ConvertToLeadRequest {
  processing_id: string;
  category: string;
  source: string;
  course_level?: string;
  stage?: string;
  lead_score?: number;
  tags?: string[];
  notes?: string;
  assignment_method?: string;
}

export interface ConvertToLeadResponse {
  success: boolean;
  message: string;
  lead_id: string;
  processing_id: string;
}
