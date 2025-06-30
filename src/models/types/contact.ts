// src/models/types/contact.ts

export interface Contact {
  id: string;
  lead_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  relationship: string;
  is_primary: boolean;
  address: string;
  notes: string;
  linked_leads: string[];
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateContactRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  relationship: string;
  is_primary?: boolean;
  address?: string;
  notes?: string;
  linked_leads?: string[];
}

export interface UpdateContactRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  relationship?: string;
  is_primary?: boolean;
  address?: string;
  notes?: string;
  linked_leads?: string[];
}

export interface ContactsResponse {
  success: boolean;
  data: {
    lead_id: string;
    lead_info: {
      lead_id: string;
      name: string;
      email: string;
      status: string;
    };
    contacts: Contact[];
    total_count: number;
    primary_contact: Contact | null;
    contact_summary: {
      total: number;
      by_role: Record<string, number>;
      by_relationship: Record<string, number>;
    };
  };
  timestamp: string;
}

// Common role options
export const CONTACT_ROLES = [
  { value: "Decision Maker", label: "Decision Maker" },
  { value: "Influencer", label: "Influencer" },
  { value: "User", label: "User" },
  { value: "Gatekeeper", label: "Gatekeeper" },
  { value: "Champion", label: "Champion" },
];

// Common relationship options
export const CONTACT_RELATIONSHIPS = [
  { value: "Parent", label: "Parent" },
  { value: "Student", label: "Student" },
  { value: "Guardian", label: "Guardian" },
  { value: "Agent", label: "Agent" },
  { value: "Counselor", label: "Counselor" },
  { value: "Advisor", label: "Advisor" },
  { value: "Representative", label: "Representative" },
];
