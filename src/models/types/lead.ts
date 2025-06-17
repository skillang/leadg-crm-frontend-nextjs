// src/models/types/lead.ts

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

export interface LeadFilters {
  name: string;
  stage: string;
  department: string;
  source: string;
}

export interface StageOption {
  value: string;
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  className?: string;
}

// API Request/Response types
export interface UpdateLeadStageRequest {
  leadId: string;
  newStage: string;
}

export interface CreateLeadRequest
  extends Omit<Lead, "id" | "createdOn" | "lastActivity"> {}

export interface LeadStats {
  total: number;
  byStage: Record<string, number>;
  byDepartment: Record<string, number>;
  averageScore: number;
  conversionRate: number;
}
