// src/config/whatsappConfig.ts - Updated with REAL templates from your vendor

export interface WhatsAppApiConfig {
  licenseNumber: string;
  apiKey: string;
  baseUrl: string;
  enabled: boolean;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  language: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  preview: string;
  parameters?: string[];
  description?: string;
}

// Environment-specific configuration
export const getWhatsAppConfig = (): WhatsAppApiConfig => {
  const licenseNumber = process.env.WHATSAPP_LICENSE_NUMBER || "39140472940";
  const apiKey = process.env.WHATSAPP_API_KEY || "1SpBexJj5i6GbZ7dIc4PmND0V";
  const baseUrl =
    process.env.WHATSAPP_BASE_URL || "https://wa.mydreamstechnology.in/api";
  const enabled = process.env.NEXT_PUBLIC_WHATSAPP_ENABLED === "true" || true;

  return {
    licenseNumber,
    apiKey,
    baseUrl,
    enabled,
  };
};

// Client-side configuration (only non-sensitive data)
export const getClientWhatsAppConfig = (): Partial<WhatsAppApiConfig> => {
  return {
    enabled: process.env.NEXT_PUBLIC_WHATSAPP_ENABLED === "true" || true,
  };
};

// REAL Templates from your WhatsApp API vendor
export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "lead_new",
    name: "lead_new",
    category: "MARKETING",
    language: "English",
    status: "APPROVED",
    preview: "Hi {{1}}, This is Susila from Skillang Careers. ....",
    parameters: ["name"], // First parameter is typically name
    description: "Welcome message for new leads",
  },
  {
    id: "trial",
    name: "trial",
    category: "MARKETING",
    language: "English",
    status: "APPROVED",
    preview: "Hi, Welcome to Skillang, we are here to help you, ....",
    parameters: [], // No parameters needed for this template
    description: "Trial welcome message",
  },
];

// Helper functions for template management
export const getTemplateById = (
  templateId: string
): WhatsAppTemplate | undefined => {
  return WHATSAPP_TEMPLATES.find((template) => template.id === templateId);
};

export const getTemplatesByCategory = (
  category: string
): WhatsAppTemplate[] => {
  return WHATSAPP_TEMPLATES.filter(
    (template) => template.category === category
  );
};

export const getApprovedTemplates = (): WhatsAppTemplate[] => {
  return WHATSAPP_TEMPLATES.filter(
    (template) => template.status === "APPROVED"
  );
};

// Configuration validation
export const validateWhatsAppConfig = (): {
  isValid: boolean;
  errors: string[];
} => {
  const config = getWhatsAppConfig();
  const errors: string[] = [];

  if (!config.licenseNumber) {
    errors.push("License number is required");
  }

  if (!config.apiKey) {
    errors.push("API key is required");
  }

  if (!config.baseUrl) {
    errors.push("Base URL is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// API endpoint to get available templates (if your vendor provides this)
export const fetchAvailableTemplates = async (): Promise<
  WhatsAppTemplate[]
> => {
  try {
    // If your vendor has an endpoint to fetch templates, use it here
    // const response = await fetch('/api/whatsapp/get-templates');
    // const templates = await response.json();
    // return templates;

    // For now, return the static templates
    return WHATSAPP_TEMPLATES;
  } catch (error) {
    console.error("Failed to fetch templates:", error);
    return WHATSAPP_TEMPLATES; // Fallback to static templates
  }
};
