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

// Fixed: Added explicit properties instead of empty extending interface
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
