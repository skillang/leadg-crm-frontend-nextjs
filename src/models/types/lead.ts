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
  tags?: string[];
  assignedTo?: string;
  assignedToName?: string;
}

export interface BulkLeadData {
  basic_info: {
    name: string;
    email: string;
    contact_number: string;
    source: string;
    category: string; // ADDED: category field
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

// Extended lead details interface
export interface LeadDetails extends Lead {
  leadId: string; // Formatted ID like LD-1029
  phoneNumber: string;
  countryOfInterest: string[];
  courseLevel: string;
  tags: string[];
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  socialMedia?: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
  };
  preferences?: {
    communicationMethod: "email" | "phone" | "whatsapp" | "any";
    bestTimeToContact: string;
    timezone: string;
  };
  leadHistory: LeadActivity[];
  documents: LeadDocument[];
}

export interface LeadActivity {
  id: string;
  type:
    | "call"
    | "email"
    | "meeting"
    | "note"
    | "stage_change"
    | "document_upload";
  title: string;
  description: string;
  timestamp: string;
  performedBy: string;
  metadata?: Record<string, unknown>; // Fixed: was 'any'
}

export interface LeadDocument {
  id: string;
  name: string;
  type: "pdf" | "doc" | "image" | "other";
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  url?: string;
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

export interface LeadStats {
  total: number;
  byStage: Record<string, number>;
  byDepartment: Record<string, number>;
  averageScore: number;
  conversionRate: number;
}
