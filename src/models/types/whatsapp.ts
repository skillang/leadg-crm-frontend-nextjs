// src/models/types/whatsapp.ts

// WhatsApp Message Types
export const MESSAGE_TYPES = {
  TEXT: "text",
  TEMPLATE: "template",
  DOCUMENT: "document",
} as const;

export type MessageType = (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES];

// Contact Validation Status
export const VALIDATION_STATUS = {
  PENDING: "pending",
  VALID: "valid",
  INVALID: "invalid",
  ERROR: "error",
} as const;

export type ValidationStatus =
  (typeof VALIDATION_STATUS)[keyof typeof VALIDATION_STATUS];

// Template Interface - Updated to match backend API response
export interface WhatsAppTemplate {
  id?: number;
  name?: string; // For backward compatibility
  template_name?: string; // From backend API
  display_name: string;
  description?: string;
  parameters?: string[];
  template?: string;
  category?: string;
  is_active?: boolean;
  Is_Active?: boolean; // From backend (CMS format)
}

// API Response Types - Match your backend exactly
export interface TemplatesApiResponse {
  success: boolean;
  templates?: WhatsAppTemplate[];
  data?: WhatsAppTemplate[]; // Alternative structure
  total?: number;
  message?: string;
  error?: string;
}

// Union type for different response formats your API might return
export type TemplatesResponse =
  | TemplatesApiResponse
  | WhatsAppTemplate[]
  | string; // For JSON string responses

// Message Request Interfaces
export interface TextMessageRequest {
  contact: string;
  message: string;
}

export interface TemplateMessageRequest {
  template_name: string;
  contact: string;
  lead_name: string;
  [key: string]: string; // For additional parameters
}

// Contact Validation Request
export interface ContactValidationRequest {
  contact: string;
}

// Define specific data types for API responses
interface SendTemplateData {
  message_id?: string;
  status?: string;
  timestamp?: string;
  [key: string]: unknown;
}

interface SendTextData {
  message_id?: string;
  status?: string;
  timestamp?: string;
  [key: string]: unknown;
}

interface ContactValidationData {
  is_valid?: boolean;
  exists_on_whatsapp?: boolean;
  phone_number?: string;
  [key: string]: unknown;
}

interface AccountStatusData {
  status?: string;
  phone_number?: string;
  display_name?: string;
  business_name?: string;
  [key: string]: unknown;
}

// Response Types with specific data types
export interface SendTemplateResponse {
  success: boolean;
  data?: SendTemplateData;
  template_name?: string;
  contact?: string;
  lead_name?: string;
  message?: string;
  error?: string;
}

export interface SendTextResponse {
  success: boolean;
  data?: SendTextData;
  contact?: string;
  message?: string;
  error?: string;
}

export interface ContactValidationResponse {
  success: boolean;
  data?: ContactValidationData;
  contact?: string;
  message?: string;
  error?: string;
}

export interface AccountStatusResponse {
  success: boolean;
  data?: AccountStatusData;
  message?: string;
  error?: string;
}

// WhatsApp State Interface
export interface ContactValidation {
  isValid: boolean | null;
  isValidating: boolean;
  error: string | null;
}

export interface LeadData {
  id: string;
  leadId: string;
  name: string;
  phoneNumber: string;
  email?: string;
}

export interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface TemplateParameters {
  [key: string]: string;
}

export interface WhatsAppState {
  isModalOpen: boolean;
  messageType: MessageType;
  contactValidation: ContactValidation;
  selectedTemplate: string | null;
  templateParameters: TemplateParameters;
  isPreviewMode: boolean;
  isSending: boolean;
  currentLead: LeadData | null;
  currentUser: UserData | null;

  // Bulk WhatsApp states (NEW)
  bulkWhatsappFilters: BulkWhatsAppFilters;
  selectedLeadsForBulk: string[];
  bulkJobName: string;
  bulkMessageType: "template" | "text";
  bulkSelectedTemplate: string | null;
  bulkMessageContent: string;
  bulkIsScheduled: boolean;
  bulkScheduledDateTime: string;
  bulkBatchSize: number;
  bulkDelayBetweenMessages: number;

  // Bulk UI states (NEW)
  bulkIsLoading: boolean;
  bulkError: string | null;
}

// Generic API Response Interface with specific type parameter
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Error Details Interface
interface ErrorDetails {
  code?: string | number;
  field?: string;
  validation_errors?: string[];
  [key: string]: unknown;
}

// Error Handling
export interface WhatsAppError {
  message: string;
  code?: string | number;
  details?: ErrorDetails;
  timestamp: string;
}

export interface WhatsAppState {
  // Modal states
  isModalOpen: boolean;
  messageType: MessageType;

  // Contact validation
  contactValidation: ContactValidation;

  // Template selection
  selectedTemplate: string | null;
  templateParameters: TemplateParameters;

  // UI states
  isPreviewMode: boolean;
  isSending: boolean;

  // Current context
  currentLead: LeadData | null;
  currentUser: UserData | null;
}

// =============== PAYLOAD TYPES FOR SLICE ACTIONS ===============
export interface OpenModalPayload {
  lead: LeadData;
  user: UserData;
}

export interface SetTemplateParameterPayload {
  key: string;
  value: string;
}

export interface TemplateApiResponse {
  data?: WhatsAppTemplate[];
  templates?: WhatsAppTemplate[];
  [key: string]: unknown;
}

// ============================================================================
// BULK WHATSAPP TYPES (ADD TO EXISTING FILE)
// ============================================================================

export type WhatsAppJobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "scheduled";

// ============================================================================
// BULK JOB REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateBulkWhatsAppJobRequest {
  job_name: string;
  message_type: "template" | "text";
  template_name?: string; // Required if message_type is "template"
  message_content?: string; // Required if message_type is "text"
  lead_ids: string[];
  scheduled_time?: string; // ISO format: "2024-07-30T18:00:00"
  batch_size?: number; // Default: 10
  delay_between_messages?: number; // Default: 2 (seconds)
}

export interface CreateBulkWhatsAppJobResponse {
  success: boolean;
  job_id: string;
  message: string;
  total_recipients: number;
  scheduled: boolean;
  scheduled_time_ist: string | null;
  scheduled_time_utc: string | null;
}

export interface BulkWhatsAppJob {
  job_id: string;
  job_name: string;
  message_type: "template" | "text";
  template_name?: string;
  status: WhatsAppJobStatus;
  total_recipients: number;
  processed_count: number;
  success_count: number;
  failed_count: number;
  skipped_count: number;
  progress_percentage: number;
  is_scheduled: boolean;
  scheduled_time: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  created_by_name: string;
  estimated_completion: string | null;
}

export interface BulkWhatsAppJobsResponse {
  success: boolean;
  jobs: BulkWhatsAppJob[];
  total_jobs: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface BulkWhatsAppJobStatusResponse {
  job_id: string;
  job_name: string;
  message_type: "template" | "text";
  template_name?: string;
  status: WhatsAppJobStatus;
  total_recipients: number;
  processed_count: number;
  success_count: number;
  failed_count: number;
  skipped_count: number;
  progress_percentage: number;
  is_scheduled: boolean;
  scheduled_time: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  created_by_name: string;
  estimated_completion: string | null;
}

export interface CancelBulkJobRequest {
  reason: string;
}

export interface BulkWhatsAppStats {
  total_jobs: number;
  active_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  total_messages_sent: number;
  total_messages_failed: number;
  success_rate: number;
  jobs_today: number;
  messages_sent_today: number;
  next_scheduled_job: Record<string, unknown> | null;
}

export interface BulkWhatsAppStatsResponse {
  success: boolean;
  stats: BulkWhatsAppStats;
}

export interface ValidatePhoneNumbersResponse {
  success: boolean;
  results: Array<{
    phone_number: string;
    is_valid: boolean;
    formatted_number?: string;
    error_message?: string;
  }>;
  total_valid: number;
  total_invalid: number;
}

// ============================================================================
// BULK STATE TYPES (ADD TO EXISTING WhatsAppState)
// ============================================================================

export interface BulkWhatsAppFilters {
  name: string;
  stage: string;
  status: string;
}

// Template Parameter Helpers
export const getParameterValue = (
  parameters: TemplateParameters,
  key: string,
  defaultValue = ""
): string => {
  return parameters[key] || defaultValue;
};

export const validateParameters = (
  template: WhatsAppTemplate,
  parameters: TemplateParameters
): boolean => {
  if (!template.parameters) return true;

  return template.parameters.every(
    (param) => parameters[param] && parameters[param].trim().length > 0
  );
};

// Phone Number Utilities
export const formatPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return "";

  // Remove all non-digit characters except +
  let cleaned = phoneNumber.replace(/[^\d+]/g, "");

  // Ensure it starts with + if it doesn't
  if (!cleaned.startsWith("+")) {
    cleaned = "+" + cleaned;
  }

  return cleaned;
};

export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  if (!phoneNumber) return false;

  const formatted = formatPhoneNumber(phoneNumber);
  // Basic validation: should start with + and have 7-15 digits
  const phoneRegex = /^\+\d{7,15}$/;

  return phoneRegex.test(formatted);
};

// Template Parsing Utilities
export const parseTemplate = (
  template: string,
  parameters: TemplateParameters
): string => {
  if (!template) return "";

  let parsed = template;

  // Replace all {{parameter}} placeholders
  Object.keys(parameters).forEach((key) => {
    const placeholder = `{{${key}}}`;
    const value = parameters[key] || `[${key.replace("_", " ")}]`;
    parsed = parsed.replace(new RegExp(placeholder, "g"), value);
  });

  return parsed;
};

export const extractTemplateParameters = (template: string): string[] => {
  if (!template) return [];

  const parameterRegex = /\{\{(\w+)\}\}/g;
  const parameters: string[] = [];
  let match;

  while ((match = parameterRegex.exec(template)) !== null) {
    if (!parameters.includes(match[1])) {
      parameters.push(match[1]);
    }
  }

  return parameters;
};

// Type Guards with better type safety
export const isTemplatesApiResponse = (
  data: unknown
): data is TemplatesApiResponse => {
  return (
    data !== null &&
    typeof data === "object" &&
    "success" in data &&
    typeof (data as TemplatesApiResponse).success === "boolean"
  );
};

export const isTemplateArray = (data: unknown): data is WhatsAppTemplate[] => {
  return (
    Array.isArray(data) && (data.length === 0 || isWhatsAppTemplate(data[0]))
  );
};

export const isWhatsAppTemplate = (data: unknown): data is WhatsAppTemplate => {
  return (
    data !== null &&
    typeof data === "object" &&
    data !== undefined &&
    ("display_name" in data || "name" in data) &&
    (typeof (data as WhatsAppTemplate).display_name === "string" ||
      typeof (data as WhatsAppTemplate).name === "string")
  );
};

// Template Processing Utilities
export const normalizeTemplate = (
  template: WhatsAppTemplate
): WhatsAppTemplate => {
  return {
    ...template,
    name: template.name || template.template_name || "",
    template_name: template.template_name || template.name || "",
    is_active: template.is_active ?? template.Is_Active ?? true,
    parameters: template.parameters || [],
    category: template.category || "general",
  };
};

export const getTemplateIdentifier = (template: WhatsAppTemplate): string => {
  return (
    template.name ||
    template.template_name ||
    template.id?.toString() ||
    "unknown"
  );
};

export const getTemplateDisplayName = (template: WhatsAppTemplate): string => {
  return (
    template.display_name ||
    template.name ||
    template.template_name ||
    "Unnamed Template"
  );
};

// Factory Functions
export const createTemplate = (
  data: Omit<WhatsAppTemplate, "category"> & { category?: string }
): WhatsAppTemplate => ({
  name: data.name || data.template_name,
  template_name: data.template_name || data.name,
  display_name: data.display_name,
  parameters: data.parameters || [],
  template: data.template,
  category: data.category || "general",
  is_active: data.is_active ?? data.Is_Active ?? true,
});

export const createTextMessageRequest = (
  contact: string,
  message: string
): TextMessageRequest => ({
  contact,
  message,
});

export const createTemplateMessageRequest = (
  template_name: string,
  contact: string,
  lead_name: string,
  parameters: Record<string, string> = {}
): TemplateMessageRequest => ({
  template_name,
  contact,
  lead_name,
  ...parameters,
});

export const createContactValidationRequest = (
  contact: string
): ContactValidationRequest => ({
  contact,
});

export const createWhatsAppError = (
  message: string,
  code?: string | number,
  details?: ErrorDetails
): WhatsAppError => ({
  message,
  code,
  details,
  timestamp: new Date().toISOString(),
});

// API Response Processing
export const processTemplatesResponse = (
  response: TemplatesResponse
): WhatsAppTemplate[] => {
  try {
    // Handle string response (JSON)
    if (typeof response === "string") {
      const parsed: unknown = JSON.parse(response);
      return processTemplatesResponse(parsed as TemplatesResponse);
    }

    // Handle array response
    if (isTemplateArray(response)) {
      return response.map(normalizeTemplate);
    }

    // Handle API response object
    if (isTemplatesApiResponse(response)) {
      const templates = response.templates || response.data || [];
      return templates.map(normalizeTemplate);
    }

    console.warn("Unknown templates response format:", response);
    return [];
  } catch (error) {
    console.error("Error processing templates response:", error);
    return [];
  }
};

// Named export object to fix the anonymous default export warning
const WhatsAppUtils = {
  MESSAGE_TYPES,
  VALIDATION_STATUS,
  getParameterValue,
  validateParameters,
  formatPhoneNumber,
  isValidPhoneNumber,
  parseTemplate,
  extractTemplateParameters,
  normalizeTemplate,
  getTemplateIdentifier,
  getTemplateDisplayName,
  processTemplatesResponse,
  isTemplatesApiResponse,
  isTemplateArray,
  isWhatsAppTemplate,
  createTemplate,
  createTextMessageRequest,
  createTemplateMessageRequest,
  createContactValidationRequest,
  createWhatsAppError,
} as const;

export default WhatsAppUtils;
