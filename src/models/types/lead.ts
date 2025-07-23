// src/models/types/lead.ts
export interface Lead {
  id: string;
  leadId: string;
  name: string;
  email: string;
  contact: string;
  phoneNumber: string;
  source: string;
  stage: string;
  leadScore: number;
  status: string;

  // Enhanced assignment fields for multi-assignment support
  assignedTo: string; // Primary assignee email
  assignedToName: string; // Primary assignee name
  coAssignees: string[]; // Co-assignee emails
  coAssigneesNames: string[]; // Co-assignee names
  isMultiAssigned: boolean; // Flag indicating multi-assignment
  assignmentMethod: string; // How the lead was assigned (manual, round_robin, selective, etc.)

  // New demographic fields
  age?: number;
  experience?: string; // fresher, 1-2_years, 3-5_years, 5-10_years, 10+_years
  nationality?: string;
  current_location?: string;

  // Existing fields
  courseLevel: string;
  countryOfInterest: string;
  notes: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  lastContacted: string | null;
  leadCategory: string;
  tags: string[];
  priority?: string;
}

export interface LeadFilters {
  name: string;
  stage: string;
  department: string;
  source: string;
  assignedTo?: string;
  includeMultiAssigned?: boolean;
  assignedToMe?: boolean;
}

// Enhanced lead creation interface
export interface CreateLeadData {
  name: string;
  email: string;
  contact_number: string;
  source: string;
  category: string;
  stage: string;
  lead_score: number;
  tags: string[];
  notes: string;
  country_of_interest?: string;
  course_level?: string;
  age?: number;
  experience?: string;
  nationality?: string;
  current_location?: string;
}

// Multi-assignment specific interfaces
export interface AssignmentHistory {
  assigned_to: string;
  assigned_to_name: string;
  assigned_by: string;
  assigned_by_name: string;
  assigned_at: string;
  assignment_method: string;
  notes: string;
  reason?: string;
}

export interface MultiAssignmentInfo {
  primary_assignee: string;
  primary_assignee_name: string;
  co_assignees: string[];
  co_assignees_names: string[];
  assignment_method: string;
  assigned_at: string;
  assigned_by: string;
  reason?: string;
}

export interface BulkAssignmentRequest {
  assignment_method: "selected_users" | "all_users";
  lead_ids: string[];
  selected_user_emails?: string[];
  reason?: string;
}

export interface BulkAssignmentResult {
  success: boolean;
  message: string;
  assignment_method: string;
  total_leads: number;
  successfully_assigned: number;
  failed_assignments: Array<{
    lead_id: string;
    error: string;
  }>;
  assignment_summary: Array<{
    lead_id: string;
    assigned_to: string;
    status: "success" | "failed";
  }>;
  selected_users?: string[];
}

// User interfaces for assignment
export interface UserWithDetails {
  email: string;
  name: string;
  is_active: boolean;
  current_lead_count: number;
  departments: string[];
}

export interface AssignableUsersResponse {
  total_users: number;
  users: UserWithDetails[];
}

// Assignment preview interfaces
export interface RoundRobinPreview {
  available_users: string[];
  selected_user: string;
  message: string;
  success: boolean;
}

// Lead statistics with multi-assignment support
export interface LeadStats {
  total_leads: number;
  open_leads: number;
  in_progress_leads: number;
  closed_won_leads: number;
  closed_lost_leads: number;
  my_leads: number;
  multi_assigned_leads?: number;
  unassigned_leads?: number;
}

// Enhanced lead update interface
export interface UpdateLeadData {
  lead_id: string;
  name: string;
  email?: string;
  contact_number?: string;
  source?: string;
  stage: string;
  lead_score: number;
  notes?: string;
  tags?: string[];
  country_of_interest?: string;
  course_level?: string;
  age?: number;
  experience?: string;
  nationality?: string;
  current_location?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  assignment_method?: string;
}

// Constants for dropdown options
export const LEAD_SOURCES = [
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "social_media", label: "Social Media" },
  { value: "email_campaign", label: "Email Campaign" },
  { value: "cold_call", label: "Cold Call" },
  { value: "trade_show", label: "Trade Show" },
  { value: "naukri", label: "Naukri" },
  { value: "webinar", label: "Webinar" },
  { value: "content_marketing", label: "Content Marketing" },
  { value: "paid_ads", label: "Paid Ads" },
  { value: "organic_search", label: "Organic Search" },
];

export const LEAD_STAGES = [
  { value: "open", label: "Open", color: "blue" },
  { value: "contacted", label: "Contacted", color: "orange" },
  { value: "qualified", label: "Qualified", color: "purple" },
  { value: "proposal", label: "Proposal", color: "cyan" },
  { value: "negotiation", label: "Negotiation", color: "gold" },
  { value: "closed_won", label: "Closed Won", color: "green" },
  { value: "closed_lost", label: "Closed Lost", color: "red" },
];

export const COURSE_LEVELS = [
  { value: "certificate", label: "Certificate" },
  { value: "diploma", label: "Diploma" },
  { value: "bachelor", label: "Bachelor's Degree" },
  { value: "master", label: "Master's Degree" },
  { value: "phd", label: "PhD" },
  { value: "professional", label: "Professional Course" },
];

export const EXPERIENCE_LEVELS = [
  { value: "fresher", label: "Fresher" },
  { value: "less_than_1_year", label: "Less than 1 year" },
  { value: "1_to_3_years", label: "1-3 Years" },
  { value: "3_to_5_years", label: "3-5 Years" },
  { value: "5_to_10_years", label: "5-10 Years" },
  { value: "more_than_10_years", label: "10+ Years" },
];

export const COUNTRIES = [
  "USA",
  "Canada",
  "UK",
  "Australia",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Netherlands",
  "Sweden",
  "Norway",
  "Denmark",
  "Switzerland",
  "Austria",
  "Belgium",
  "Ireland",
  "New Zealand",
  "Singapore",
  "Japan",
  "South Korea",
  "India",
  "China",
  "Brazil",
  "Mexico",
  "Argentina",
  "Chile",
  "South Africa",
  "UAE",
  "Saudi Arabia",
  "Qatar",
  "Kuwait",
  "Oman",
  "Bahrain",
  "Jordan",
  "Egypt",
  "Morocco",
  "Turkey",
  "Russia",
  "Poland",
  "Czech Republic",
  "Hungary",
  "Romania",
  "Bulgaria",
  "Croatia",
  "Serbia",
  "Slovenia",
  "Slovakia",
  "Estonia",
  "Latvia",
  "Lithuania",
  "Finland",
  "Iceland",
];

export const ASSIGNMENT_METHODS = [
  { value: "manual", label: "Manual Assignment" },
  { value: "round_robin", label: "Round Robin (All Users)" },
  { value: "selective_round_robin", label: "Selective Round Robin" },
  { value: "bulk_manual", label: "Bulk Manual Assignment" },
  { value: "multi_user_manual", label: "Multi-User Assignment" },
];

// Helper functions
export const getStageColor = (stage: string): string => {
  const stageObj = LEAD_STAGES.find((s) => s.value === stage);
  return stageObj?.color || "default";
};

export const getStageLabel = (stage: string): string => {
  const stageObj = LEAD_STAGES.find((s) => s.value === stage);
  return stageObj?.label || stage;
};

export const getSourceLabel = (source: string): string => {
  const sourceObj = LEAD_SOURCES.find((s) => s.value === source);
  return sourceObj?.label || source;
};

export const getExperienceLabel = (experience: string): string => {
  const expObj = EXPERIENCE_LEVELS.find((e) => e.value === experience);
  return expObj?.label || experience;
};

export const getCourseLevelLabel = (courseLevel: string): string => {
  const levelObj = COURSE_LEVELS.find((l) => l.value === courseLevel);
  return levelObj?.label || courseLevel;
};

// Multi-assignment helper functions
export const getAllAssignees = (lead: Lead): string[] => {
  const assignees = [];
  if (lead.assignedTo) assignees.push(lead.assignedTo);
  if (lead.coAssignees) assignees.push(...lead.coAssignees);
  return assignees;
};

export const getAllAssigneeNames = (lead: Lead): string[] => {
  const names = [];
  if (lead.assignedToName) names.push(lead.assignedToName);
  if (lead.coAssigneesNames) names.push(...lead.coAssigneesNames);
  return names;
};

export const isUserAssignedToLead = (
  lead: Lead,
  userEmail: string
): boolean => {
  return getAllAssignees(lead).includes(userEmail);
};

export const getAssignmentMethodLabel = (method: string): string => {
  const methodObj = ASSIGNMENT_METHODS.find((m) => m.value === method);
  return methodObj?.label || method;
};

// Validation helpers
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[+]?[\d\s\-\(\)]{7,15}$/;
  return phoneRegex.test(phone);
};

export const parseCountriesString = (countriesString: string): string[] => {
  if (!countriesString || typeof countriesString !== "string") return [];
  return countriesString
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
};

export const formatCountriesString = (countries: string[]): string => {
  return countries.join(", ");
};
