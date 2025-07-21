// src/models/types/leadDetails.ts

export interface LeadDetailsResponse {
  id: string;
  leadId: string;
  name: string;
  email: string;
  phoneNumber: string;
  contact: string;
  countryOfInterest: string;
  courseLevel: string;
  source: string;
  stage: string;
  leadScore: number;
  priority: string;
  tags: string[];
  assignedTo: string;
  assignedToName: string;
  notes: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  lastContacted: string | null;
  status: string;
  assignmentHistory: AssignmentHistoryItem[];
  leadCategory: string;
}

export interface AssignmentHistoryItem {
  assigned_to: string;
  assigned_to_name: string;
  assigned_by: string;
  assigned_by_name: string;
  assigned_at: string;
  assignment_method: string;
  notes: string;
}

// API Response structure (matches your backend)
export interface LeadDetailsApiResponse {
  success: boolean;
  lead: {
    basic_info: {
      name: string;
      email: string;
      contact_number: string;
      source: string;
      country_of_interest: string;
      course_level: string;
    };
    status_and_tags: {
      stage: string;
      lead_score: number;
      priority: string;
      tags: string[];
    };
    assignment: {
      assigned_to: string;
      assigned_to_name: string;
      assignment_method: string;
      assignment_history: AssignmentHistoryItem[];
    };
    additional_info: {
      notes: string;
    };
    system_info: {
      id: string;
      lead_id: string;
      status: string;
      created_by: string;
      created_at: string;
      updated_at: string;
      last_contacted: string | null;
    };
  };
}
