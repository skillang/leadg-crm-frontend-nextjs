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

// Default Templates (for fallback) - Updated to match backend format
export const DEFAULT_TEMPLATES: WhatsAppTemplate[] = [
  createTemplate({
    id: 1,
    template_name: "new_lead_welcome",
    display_name: "New Lead Welcome",
    parameters: ["lead_name", "agent_name"],
    template:
      "Hi {{lead_name}}! This is {{agent_name}} from Skillang Careers. Welcome!",
    category: "welcome",
    description: "Welcome message for new leads",
  }),
  createTemplate({
    id: 2,
    template_name: "follow_up",
    display_name: "Follow Up",
    parameters: ["lead_name", "agent_name"],
    template:
      "Hello {{lead_name}}, this is {{agent_name}}. I wanted to follow up on your application.",
    category: "follow_up",
    description: "Follow-up message for existing leads",
  }),
  createTemplate({
    id: 3,
    template_name: "document_request",
    display_name: "Document Request",
    parameters: ["lead_name", "agent_name", "document_type"],
    template:
      "Hi {{lead_name}}, {{agent_name}} here. Could you please send your {{document_type}}?",
    category: "documents",
    description: "Request specific documents from leads",
  }),
  // Add the templates from your backend as defaults
  createTemplate({
    id: 4,
    template_name: "nursing_promo_form_wa",
    display_name: "Nursing Promo",
    parameters: ["lead_name"],
    template: "Hi {{lead_name}}, check out our nursing program promotion!",
    category: "promotion",
    description: "form for nursing",
  }),
  createTemplate({
    id: 5,
    template_name: "lead_new",
    display_name: "New Lead",
    parameters: ["lead_name"],
    template:
      "Welcome {{lead_name}}! Thank you for your interest in our programs.",
    category: "welcome",
    description: "new lead welcome message",
  }),
];

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
  DEFAULT_TEMPLATES,
} as const;

export default WhatsAppUtils;
