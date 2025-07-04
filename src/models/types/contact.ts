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

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

export const validateContactData = (data: CreateContactRequest): string[] => {
  const errors: string[] = [];

  if (!data.first_name?.trim()) errors.push("First name is required");
  if (!data.last_name?.trim()) errors.push("Last name is required");

  if (!data.email?.trim()) {
    errors.push("Email is required");
  } else if (!validateEmail(data.email)) {
    errors.push("Invalid email format");
  }

  if (!data.phone?.trim()) {
    errors.push("Phone number is required");
  } else if (!validatePhone(data.phone)) {
    errors.push("Invalid phone number format");
  }

  if (!data.role) errors.push("Role is required");
  if (!data.relationship) errors.push("Relationship is required");

  return errors;
};

// Add below your interfaces
export const CONTACT_ROLES = [
  { value: "Decision Maker", label: "Decision Maker" },
  { value: "Influencer", label: "Influencer" },
  { value: "End User", label: "End User" },
  { value: "Counselor", label: "Counselor" },
  { value: "Parent", label: "Parent" },
  { value: "Guardian", label: "Guardian" },
];

export const CONTACT_RELATIONSHIPS = [
  { value: "Parent", label: "Parent" },
  { value: "Student", label: "Student" },
  { value: "Guardian", label: "Guardian" },
  { value: "Agent", label: "Agent" },
  { value: "Counselor", label: "Counselor" },
  { value: "Advisor", label: "Advisor" },
  { value: "Representative", label: "Representative" },
];
