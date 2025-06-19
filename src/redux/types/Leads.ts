// src/redux/types/Leads.ts (Fixed User interface)

export interface Lead {
  id: string;
  stage: string;
  name: string;
  createdOn: string;
  leadScore: number;
  contact: string;
  email?: string;
  source: string;
  media: string;
  lastActivity: string;
  department: string;
  notes: string;
}

export interface LeadsState {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  filters: LeadFilters;
  selectedLeads: string[];
}

export interface LeadFilters {
  name: string;
  stage: string;
  department: string;
  source: string;
  dateRange: {
    from: string;
    to: string;
  };
}

export interface StageOption {
  value: string;
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  className?: string;
}

// API related types
export interface UpdateLeadStageRequest {
  leadId: string;
  newStage: string;
}

export interface UpdateLeadNotesRequest {
  leadId: string;
  notes: string;
}

export interface CreateLeadRequest {
  stage: string;
  name: string;
  leadScore: number;
  contact: string;
  email?: string;
  source: string;
  media: string;
  department: string;
  notes: string;
}

export interface BulkUpdateRequest {
  leadIds: string[];
  updates: Partial<Lead>;
}

// Stats types
export interface LeadStats {
  total: number;
  byStage: Record<string, number>;
  byDepartment: Record<string, number>;
  bySource: Record<string, number>;
  averageScore: number;
  conversionRate: number;
}

// UPDATED: Authentication types to match FastAPI response
export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: "admin" | "user"; // lowercase to match FastAPI
  is_active: boolean;
  phone: string;
  department: string;
  created_at: string;
  last_login: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterData {
  department: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  phone: string;
  role: "admin" | "user";
  username: string;
}
