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
  date_of_birth?: string;
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
  assigned_to?: string;
  assignedTo?: string;
  includeMultiAssigned?: boolean;
  assignedToMe?: boolean;
  category?: string;
  dateFrom?: string;
  updatedFrom?: string; // 🆕 NEW: updated_from
  updatedTo?: string; // 🆕 NEW: updated_to
  lastContactedFrom?: string; // 🆕 NEW: last_contacted_from
  lastContactedTo?: string; // 🆕 NEW: last_contacted_to
  dateTo?: string;
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
  date_of_birth?: string;
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
  primary_assignee?: string;
  primary_assignee_name?: string;
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
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  id?: string;
  username?: string;
  role?: string;
  created_at?: string;
  last_login?: string;
  phone?: string;
  current_lead_count?: number;
  departments?: string[];
  login_count?: number;
  permissions?: {
    granted_by?: string;
    granted_at?: string;
    last_modified_by?: string;
    last_modified_at?: string;
    can_create_single_lead?: boolean;
    can_create_bulk_leads?: boolean;
  };
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
  date_of_birth?: string;
  current_location?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  assignment_method?: string;
}

// =============== HOOK INTERFACES ===============
export interface UseLeadsWithAuthProps {
  page?: number;
  limit?: number;
  lead_status?: string;
  assigned_to?: string;
  search?: string;
  include_multi_assigned?: boolean;
  assigned_to_me?: boolean;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface UseLeadsWithAuthResult {
  leads: Lead[];
  allLeads: Lead[];
  isLoading: boolean;
  error: unknown;
  isAdmin: boolean;
  paginationMeta?: PaginationMeta;
}

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

// =============== API RESPONSE TYPES ===============
export interface ApiLead {
  lead_id?: string;
  id?: string;
  name: string;
  stage?: string;
  status?: string;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  lead_score?: number;
  contact_number?: string;
  phone_number?: string;
  email?: string;
  source?: string;
  last_contacted?: string;
  notes?: string;
  category?: string;

  // Enhanced assignment fields
  assigned_to?: string;
  assigned_to_name?: string;
  co_assignees?: string[];
  co_assignees_names?: string[];
  is_multi_assigned?: boolean;
  assignment_method?: string;

  // New fields
  age?: number;
  experience?: string;
  nationality?: string;
  current_location?: string;
  date_of_birth?: string;
  course_level?: string;
  country_of_interest?: string;
}

export interface RawLeadDetails {
  system_info: {
    id: string;
    lead_id: string;
    created_at: string;
    created_by: string;
    updated_at: string;
    last_contacted: string | null;
    status: string;
  };
  basic_info: {
    name: string;
    email: string;
    contact_number: string;
    country_of_interest?: string;
    course_level?: string;
    source: string;
    category: string;
    age?: number;
    experience?: string;
    nationality?: string;
    date_of_birth?: string;
    current_location?: string;
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
    co_assignees: string[];
    co_assignees_names: string[];
    is_multi_assigned: boolean;
    assignment_method: string;
    assignment_history: AssignmentHistory[];
  };
  additional_info: {
    notes: string;
  };
}

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
  coAssignees: string[];
  coAssigneesNames: string[];
  isMultiAssigned: boolean;
  assignmentMethod: string;

  age?: number;
  experience?: string;
  nationality?: string;
  current_location?: string;
  date_of_birth?: string;

  notes: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  lastContacted: string | null;
  status: string;
  assignmentHistory: AssignmentHistory[];
  leadCategory: string;
}

// =============== BULK LEAD TYPES ===============
export interface FlatBulkLeadData {
  name: string;
  email: string;
  contact_number: string;
  source: string;
  category: string;
  age?: number;
  experience?: string;
  nationality?: string;
  date_of_birth?: string;
  current_location?: string;
  country_of_interest?: string;
  course_level?: string;
  stage: string;
  status: string;
  lead_score?: number;
  tags?: string[];
  notes?: string;
}

export interface BulkLeadData {
  basic_info: {
    name: string;
    email: string;
    contact_number: string;
    source: string;
    category: string;
    age?: number;
    experience?: string;
    nationality?: string;
    date_of_birth?: string;
    current_location?: string;
    date_of_borth?: string;
  };
  status_and_tags: {
    stage: string;
    lead_score: number;
    tags: string[];
  };
  additional_info: {
    notes: string;
  };
}

// =============== API REQUEST TYPES ===============
export interface CreateLeadApiRequest {
  basic_info: {
    name: string;
    email: string;
    contact_number: string;
    source: string;
    category: string;
    age?: number;
    experience?: string;
    nationality?: string;
    current_location?: string;
    date_of_birth?: string;
    country_of_interest?: string;
    course_level?: string;
  };
  status_and_tags: {
    stage: string;
    status: string;
    lead_score: number;
    tags: string[];
  };
  assignment: {
    assigned_to: string | null;
  };
  additional_info: {
    notes: string;
  };
  selected_user_emails?: string;
}

export interface UpdateLeadRequest {
  lead_id: string;
  name?: string;
  lead_score?: number;
  stage?: string;
  status?: string;
  email?: string;
  contact_number?: string;
  source?: string;
  notes?: string;
  tags?: string[];
  assigned_to?: string;
  assigned_to_name?: string;
  assignment_method?: string;
  age?: number;
  experience?: string;
  nationality?: string;
  current_location?: string;
  country_of_interest?: string;
  course_level?: string;
  date_of_birth?: string;
  [key: string]: unknown;
}

// =============== ASSIGNMENT TYPES ===============
export interface BulkAssignSelectiveRequest {
  assignment_method: "selected_users" | "all_users";
  lead_ids: string[];
  selected_user_emails?: string[];
}

export interface SelectiveRoundRobinTestRequest {
  selected_user_emails: string[];
}

// =============== RESPONSE TYPES ===============
export interface LeadStatsResponse {
  total_leads: number;
  my_leads: number;
  unassigned_leads: number;

  // Core metrics for dashboard cards
  dnp_count: number;
  counseled_count: number;
  conversion_rate: number;

  // Dynamic breakdowns for charts
  status_breakdown?: Record<string, number>;
  stage_breakdown?: Record<string, number>;

  // Assignment efficiency (admin only)
  assignment_stats?: {
    multi_assigned_leads: number;
    workload_distribution: UserWorkloadItem[];
    average_leads_per_user: number;
    assignment_balance_score: number;
  };
}

interface UserWorkloadItem {
  name: string;
  email: string;
  total_leads: number;
  dnp_count: number;
  counselled_count: number;
}

export interface PaginatedResponse<T> {
  leads?: T[];
  total?: number;
  page?: number;
  limit?: number;
  has_next?: boolean;
  has_prev?: boolean;
}

export interface CreateLeadResponse {
  success: boolean;
  message: string;
  lead: ApiLead;
}

export interface BulkCreateResponse {
  success: boolean;
  message: string;
  created_count: number;
  failed_count: number;
  failed_leads?: unknown[];
  successful_creates: number;
  duplicates_skipped: number;
  failed_creates: number;
  total_attempted: number;
}

export interface MultiAssignResponse {
  success: boolean;
  message: string;
  assignment_details: {
    lead_id: string;
    newly_assigned_users: string[];
    previously_assigned: string[];
  };
}

export interface RemoveUserResponse {
  success: boolean;
  message: string;
  remaining_assignees: string[];
}

export interface BulkAssignResponse {
  success: boolean;
  message: string;
  assignments_created: number;
  failed_assignments: number;
}

export interface RoundRobinTestResponse {
  success: boolean;
  message: string;
  next_user: string;
  user_load_distribution: Record<string, number>;
}

export interface RoundRobinPreviewResponse {
  success: boolean;
  available_users: UserWithDetails[];
  next_user_in_rotation: string;
  user_load_distribution: Record<string, number>;
  next_assignee?: UserWithDetails;
}

export interface AssignmentDetailsResponse {
  success: boolean;
  assignment_details: {
    current_assignees: string[];
    assignment_history: AssignmentHistory[];
    is_multi_assigned: boolean;
  };
}

// =============== USER STATS TYPES ===============
export interface UserStats {
  user_id: string;
  name: string;
  email: string;
  role: string;
  assigned_leads_count: number;
}

export interface UserLeadStatsResponse {
  success: boolean;
  user_stats: UserStats[];
  summary: {
    total_users: number;
    total_leads: number;
    assigned_leads: number;
    unassigned_leads: number;
  };
  performance: string;
}

// =============== UI STATE TYPES ===============
export interface LeadsState {
  filters: LeadFilters;
  selectedLeads: string[];
  bulkUpdateModalOpen: boolean;
  editModalOpen: boolean;
  currentEditLeadId: string | null;
}

// =============== TRANSFORMATION FUNCTIONS ===============
export const transformApiLead = (apiLead: ApiLead): Lead => ({
  id: apiLead.lead_id || apiLead.id || "",
  leadId: apiLead.lead_id || apiLead.id || "",
  name: apiLead.name || "",
  email: apiLead.email || "",
  contact: apiLead.contact_number || apiLead.phone_number || "",
  phoneNumber: apiLead.contact_number || apiLead.phone_number || "",
  source: apiLead.source || "",
  stage: apiLead.stage || "",
  leadScore: apiLead.lead_score || 0,
  status: apiLead.status || "",

  assignedTo: apiLead.assigned_to || "",
  assignedToName: apiLead.assigned_to_name || "",
  coAssignees: apiLead.co_assignees || [],
  coAssigneesNames: apiLead.co_assignees_names || [],
  isMultiAssigned: apiLead.is_multi_assigned || false,
  assignmentMethod: apiLead.assignment_method || "",

  age: apiLead.age,
  experience: apiLead.experience,
  nationality: apiLead.nationality,
  date_of_birth: apiLead.date_of_birth,
  current_location: apiLead.current_location || "",

  courseLevel: apiLead.course_level || "",
  countryOfInterest: apiLead.country_of_interest || "",
  notes: apiLead.notes || "",
  createdAt: apiLead.created_at || "",
  createdBy: apiLead.created_by || "",
  updatedAt: apiLead.updated_at || "",
  lastContacted: apiLead.last_contacted || null,
  leadCategory: apiLead.category || "",
  tags: [],
  priority: "medium",
});

export const transformLeadDetailsResponse = (
  data: RawLeadDetails
): LeadDetailsResponse => ({
  id: data.system_info.id,
  leadId: data.system_info.lead_id,
  name: data.basic_info.name,
  email: data.basic_info.email,
  phoneNumber: data.basic_info.contact_number,
  contact: data.basic_info.contact_number,
  countryOfInterest: data.basic_info.country_of_interest || "",
  courseLevel: data.basic_info.course_level || "",
  source: data.basic_info.source,
  stage: data.status_and_tags.stage,
  leadScore: data.status_and_tags.lead_score,
  priority: data.status_and_tags.priority,
  tags: data.status_and_tags.tags,

  assignedTo: data.assignment.assigned_to,
  assignedToName: data.assignment.assigned_to_name,
  coAssignees: data.assignment.co_assignees,
  coAssigneesNames: data.assignment.co_assignees_names,
  isMultiAssigned: data.assignment.is_multi_assigned,
  assignmentMethod: data.assignment.assignment_method,

  age: data.basic_info.age,
  experience: data.basic_info.experience,
  nationality: data.basic_info.nationality,
  date_of_birth: data.basic_info.date_of_birth,
  current_location: data.basic_info.current_location,

  notes: data.additional_info.notes,
  createdAt: data.system_info.created_at,
  createdBy: data.system_info.created_by,
  updatedAt: data.system_info.updated_at,
  lastContacted: data.system_info.last_contacted,
  status: data.system_info.status,
  assignmentHistory: data.assignment.assignment_history,
  leadCategory: data.basic_info.category,
});
