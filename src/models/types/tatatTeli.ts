// src/models/types/tataTeli.ts

// =============== API TYPES ===============

// Validate call request & response
export interface ValidateCallRequest {
  lead_id: string;
}

export interface ValidateCallResponse {
  can_call: boolean;
  validation_errors: string[];
  lead_found: boolean;
  lead_phone: string;
  user_can_call: boolean;
  user_agent_id: string;
  estimated_setup_time: number;
  recommendations: string[];
}

// Click to call request & response
export interface ClickToCallRequest {
  lead_id: string;
  notes?: string;
  call_purpose?: string;
  priority?: string;
}

export interface ClickToCallResponse {
  success: boolean;
  message: string;
  call_id?: string;
}

// User mappings (admin only)
export interface CreateMappingRequest {
  crm_user_id: string;
  tata_email: string;
  auto_create_agent: boolean;
}

export interface UserMappingResponse {
  id: string;
  crm_user_id: string;
  crm_user_name: string;
  crm_user_email: string;
  tata_agent_id: string;
  tata_email: string;
  can_make_calls: boolean;
  sync_status: string;
  is_active: boolean;
}

// =============== UI STATE TYPES ===============

export type TataTeliTabType = "validate" | "call" | "history";

// Validation state interface
export interface CallValidation {
  isValidating: boolean;
  canCall: boolean | null;
  leadPhone: string | null;
  userCanCall: boolean | null;
  leadFound: boolean | null;
  userAgentId: string | null;
  recommendations: string[];
  error: string | null;
}

export interface TataTeliState {
  isModalOpen: boolean;
  activeTab: TataTeliTabType;
  currentLeadId: string | null;

  // Validation cache
  validation: CallValidation;

  // Call form
  callNotes: string;
  callPurpose: string;
  callPriority: string;
  isCallInProgress: boolean;
  callError: string | null;
}

// =============== COMPONENT PROPS ===============

export interface OpenCallModalPayload {
  leadId: string;
}
